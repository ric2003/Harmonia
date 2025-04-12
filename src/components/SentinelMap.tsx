"use client"; // Needed for Next.js client-side components

import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FilterControls } from "./FilterControls";
import { SentinelFilter } from "@/services/sentinelService";

// Define types for our grid images
interface GridImage {
  url: string;
  bounds: [number, number][];
  bbox: number[]; // Store the bbox for caching purposes
}

// Define the grid cell type
interface GridCell {
  bounds: [number, number][];
  bbox: number[];
}

// Debounce function to limit API calls
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

function SentinelMap() {
  const [gridImages, setGridImages] = useState<GridImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<SentinelFilter>('natural');
  const [viewBounds, setViewBounds] = useState<[[number, number], [number, number]]>([
    [45.5, 13.5], // Default southwest
    [46.5, 15.0]  // Default northeast
  ]);
  const [currentZoom, setCurrentZoom] = useState(9);
  
  // Cache to store already fetched images
  const imageCache = useRef<Map<string, GridImage>>(new Map());
  // Ref to keep track of current gridImages for cleanup
  const gridImagesRef = useRef<GridImage[]>([]);
  // Flag to ensure we only load the initial view once
  const initialLoadDone = useRef(false);
  // Timeout ref for drag indicator
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update ref when gridImages changes
  useEffect(() => {
    gridImagesRef.current = gridImages;
  }, [gridImages]);
  
  // The minimum zoom level at which we'll fetch Sentinel images
  const MIN_FETCH_ZOOM = 8;
  
  // Debounce the bounds change to prevent too many API calls
  const debouncedBounds = useDebounce(viewBounds, 1500);
  
  // Create a grid of bounding boxes based on current map view
  const createGrid = useCallback((bounds: [[number, number], [number, number]], rows: number, cols: number, isInitialLoad: boolean = false): GridCell[] => {
    const grid: GridCell[] = [];
    
    // For initial load, expand the boundaries slightly to ensure full coverage
    let minLat = bounds[0][0];
    let maxLat = bounds[1][0];
    let minLng = bounds[0][1];
    let maxLng = bounds[1][1];
    
    if (isInitialLoad) {
      // Expand bounds by 20% in each direction for initial load
      const latRange = maxLat - minLat;
      const lngRange = maxLng - minLng;
      
      minLat -= latRange * 0.2;
      maxLat += latRange * 0.2;
      minLng -= lngRange * 0.2;
      maxLng += lngRange * 0.2;
    }
    
    const latStep = (maxLat - minLat) / rows;
    const lngStep = (maxLng - minLng) / cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellMinLat = minLat + (r * latStep);
        const cellMaxLat = minLat + ((r + 1) * latStep);
        const cellMinLng = minLng + (c * lngStep);
        const cellMaxLng = minLng + ((c + 1) * lngStep);

        grid.push({
          bounds: [
            [cellMinLat, cellMinLng], // Southwest corner [lat, lng]
            [cellMaxLat, cellMaxLng], // Northeast corner [lat, lng]
          ] as [number, number][],
          bbox: [cellMinLng, cellMinLat, cellMaxLng, cellMaxLat], // Format for API: [west, south, east, north]
        });
      }
    }
    return grid;
  }, []);

  // Update fetchGridImages to accept filter parameter
  const fetchGridImages = useCallback(async (
    bounds: [[number, number], [number, number]], 
    isInitialLoad: boolean = false,
    filter: SentinelFilter = currentFilter
  ) => {
    // Don't fetch if zoom level is too low
    if (currentZoom < MIN_FETCH_ZOOM) {
      return;
    }
    
    setLoading(true);
    setError(null); // Clear previous errors
    
    try {
      // Use larger grid and more cells for initial load
      const gridSize = isInitialLoad ? 5 : (currentZoom >= 12 ? 3 : 2);
      const grid = createGrid(bounds, gridSize, gridSize, isInitialLoad);
      
      // Check which cells we need to fetch and which we can reuse from cache
      const imagesToFetch: { cell: GridCell, index: number }[] = [];
      const cachedImages: GridImage[] = [];
      
      grid.forEach((cell, index) => {
        const cacheKey = `${getCacheKey(cell.bbox)}-${filter}`; // Include filter in cache key
        const cachedImage = imageCache.current.get(cacheKey);
        
        if (cachedImage) {
          cachedImages.push(cachedImage);
        } else {
          imagesToFetch.push({ cell, index });
        }
      });
      
      // Only fetch images we don't have in cache
      if (imagesToFetch.length > 0) {
        console.log(`Fetching ${imagesToFetch.length} new images, reusing ${cachedImages.length} from cache`);
        
        let failedCells = 0;
        const imagePromises = imagesToFetch.map(async ({ cell, index }) => {
          // Convert numbers to strings for URL parameters
          const queryParams = new URLSearchParams({
            west: cell.bbox[0].toString(),
            south: cell.bbox[1].toString(),
            east: cell.bbox[2].toString(),
            north: cell.bbox[3].toString(),
            filter: filter
          });
          
          try {
            const response = await fetch(`/api/sentinel?${queryParams}`);
            if (!response.ok) {
              console.warn(`Error fetching cell ${index}: HTTP ${response.status} - ${response.statusText}`);
              
              // If we're in development, provide more detailed logging
              if (process.env.NODE_ENV === 'development') {
                const errorText = await response.text().catch(() => 'No response body');
                console.warn(`Response body: ${errorText}`);
              }
              
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const image: GridImage = {
              url,
              bounds: cell.bounds,
              bbox: cell.bbox
            };
            
            // Add to cache
            const cacheKey = `${getCacheKey(cell.bbox)}-${filter}`;
            imageCache.current.set(cacheKey, image);
            
            return image;
          } catch (err) {
            failedCells++;
            console.error(`Failed to fetch image for grid cell ${index} at bounds [${cell.bbox.join(', ')}]:`, err);

            return null;
          }
        });

        const fetchedImages = await Promise.all(imagePromises);
        const validNewImages = fetchedImages.filter(img => img !== null) as GridImage[];
        const allImages = [...cachedImages, ...validNewImages];
        
        gridImagesRef.current.forEach(image => {
          if (!allImages.some(img => img.url === image.url)) {
            URL.revokeObjectURL(image.url);
          }
        });
        
        setGridImages(allImages);

        if (failedCells > 0 && validNewImages.length < imagesToFetch.length) {
          if (validNewImages.length === 0 && cachedImages.length === 0) {
            setError(`Failed to load any Sentinel imagery for this region. Try zooming or panning to a different area.`);
          } else {
            setError(`Some imagery tiles (${failedCells} of ${imagesToFetch.length}) could not be loaded.`);
          }
        }
      } else if (cachedImages.length > 0) {
        console.log(`Reusing all ${cachedImages.length} images from cache`);
        setGridImages(cachedImages);
      } else {
        // No images to fetch or load from cache
        setGridImages([]);
        setError("No Sentinel imagery available for this region.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("Error fetching Sentinel images:", err);
      // Don't clear current images on error
    } finally {
      setLoading(false);
    }
  }, [createGrid, currentZoom, MIN_FETCH_ZOOM, currentFilter]);

  // Handle map movement - this is called for both initial load and user navigation
  const handleMapMove = useCallback((newBounds: [[number, number], [number, number]], zoom: number, isInitialRequest: boolean = false) => {
    setViewBounds(newBounds);
    setCurrentZoom(zoom);
    
    // If it's an initial request, we'll manually trigger the image fetch
    if (isInitialRequest && zoom >= MIN_FETCH_ZOOM && !initialLoadDone.current) {
      initialLoadDone.current = true;
      // Use a larger grid and expanded bounds for initial load
      fetchGridImages(newBounds, true);
    }
  }, [MIN_FETCH_ZOOM, fetchGridImages]);

  // Generate a cache key for a bbox
  const getCacheKey = (bbox: number[]): string => {
    // Round to 3 decimal places to allow for minor differences
    return bbox.map(coord => Math.round(coord * 1000) / 1000).join(',');
  };

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: SentinelFilter) => {
    setCurrentFilter(newFilter);
    // Clear existing images and refetch with new filter
    setGridImages([]);
    // Clean up old URLs
    gridImagesRef.current.forEach(image => {
      URL.revokeObjectURL(image.url);
    });
    // Fetch new images with the current bounds
    fetchGridImages(viewBounds, false, newFilter);
  }, [viewBounds, fetchGridImages]);

  // Fetch images when the debounced view bounds change (for user navigation)
  useEffect(() => {
    // Skip the first render since we'll handle it with WhenReady
    if (initialLoadDone.current && currentZoom >= MIN_FETCH_ZOOM) {
      fetchGridImages(debouncedBounds, false);
    }
  }, [debouncedBounds, fetchGridImages, currentZoom, MIN_FETCH_ZOOM]);

  // Calculate the center for the map based on the view bounds
  const centerLat = (viewBounds[0][0] + viewBounds[1][0]) / 2;
  const centerLng = (viewBounds[0][1] + viewBounds[1][1]) / 2;

  // Utility function to check if map has moved significantly
  const hasMovedSignificantly = useCallback((oldBounds: [[number, number], [number, number]], newBounds: [[number, number], [number, number]]): boolean => {
    // Calculate how much the map view has changed as a percentage
    const oldWidth = Math.abs(oldBounds[1][1] - oldBounds[0][1]);
    const oldHeight = Math.abs(oldBounds[1][0] - oldBounds[0][0]);
    
    const newWidth = Math.abs(newBounds[1][1] - newBounds[0][1]);
    const newHeight = Math.abs(newBounds[1][0] - newBounds[0][0]);
    
    // Check center point movement
    const oldCenterLat = (oldBounds[0][0] + oldBounds[1][0]) / 2;
    const oldCenterLng = (oldBounds[0][1] + oldBounds[1][1]) / 2;
    
    const newCenterLat = (newBounds[0][0] + newBounds[1][0]) / 2;
    const newCenterLng = (newBounds[0][1] + newBounds[1][1]) / 2;
    
    // Calculate movement as percentage of the view size
    const latMovementPercent = Math.abs(newCenterLat - oldCenterLat) / oldHeight * 100;
    const lngMovementPercent = Math.abs(newCenterLng - oldCenterLng) / oldWidth * 100;
    
    // Also consider zoom level changes
    const sizeChangeRatio = (newWidth * newHeight) / (oldWidth * oldHeight);
    const hasZoomChanged = sizeChangeRatio < 0.8 || sizeChangeRatio > 1.2;
    
    // Consider it significant if moved by more than 15% in either direction or zoomed
    return latMovementPercent > 15 || lngMovementPercent > 15 || hasZoomChanged;
  }, []);

  // Component to handle when map is ready
  const WhenReady = () => {
    const map = useMapEvents({
      load: () => {
        console.log("Map load event");
      },
      movestart: () => {
        // Set dragging state when user starts moving the map
        setIsDragging(true);
        

        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
      },
      moveend: () => {
        // Set a timeout to clear the dragging state
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        
        dragTimeoutRef.current = setTimeout(() => {
          setIsDragging(false);
        }, 500);
        
        if (!initialLoadDone.current) {
          const zoom = map.getZoom();
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          handleMapMove([
            [sw.lat, sw.lng],
            [ne.lat, ne.lng]
          ], zoom, true);
        } else {
          const zoom = map.getZoom();
          if (zoom >= MIN_FETCH_ZOOM) {
            const bounds = map.getBounds();
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            const newBounds: [[number, number], [number, number]] = [
              [sw.lat, sw.lng],
              [ne.lat, ne.lng]
            ];
            
            // Only update if the movement is significant
            if (hasMovedSignificantly(viewBounds, newBounds)) {
              handleMapMove(newBounds, zoom);
            } else {
              console.log("Map movement too small, ignoring");
            }
          }
        }
      },
      zoomstart: () => {
        setIsDragging(true);
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
      },
      zoomend: () => {
        // Set a timeout to clear the dragging state
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        
        dragTimeoutRef.current = setTimeout(() => {
          setIsDragging(false);
        }, 500);
        
        const zoom = map.getZoom();
        if (zoom >= MIN_FETCH_ZOOM) {
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const newBounds: [[number, number], [number, number]] = [
            [sw.lat, sw.lng],
            [ne.lat, ne.lng]
          ];
          handleMapMove(newBounds, zoom);
        }
      }
    });

    // Force an immediate bounds check once the map is ready
    useEffect(() => {
      // Short timeout to ensure the map is fully rendered
      const timer = setTimeout(() => {
        if (!initialLoadDone.current) {
          const zoom = map.getZoom();
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          handleMapMove([
            [sw.lat, sw.lng],
            [ne.lat, ne.lng]
          ], zoom, true);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }, [map]);

    return null;
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      
      
      <MapContainer
        center={[centerLat, centerLng]} 
        zoom={9}
        style={{ height: "100%", width: "100%" }}
      >
        <WhenReady />

        {error ? (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            // Use CSS variables for theme adaptation
            background: 'var(--backgroundColor)', // Slightly distinct background, adjust if needed
            border: '1px solid var(--primary)', // Use primary color for error border emphasis
            color: 'var(--primary)', // Use primary color for error text emphasis
            padding: '8px 16px',
            zIndex: 1000,
            borderRadius: '4px', // Ensure it's a string '4px'
            maxWidth: '300px',
            textAlign: 'center',
            transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease', // Smooth transitions
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'inherit' // Inherit color from parent div
            }}>
              {error}
            </p>
          </div>
        ) : loading ? (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            // Use CSS variables for theme adaptation
            background: 'var(--backgroundColor)', // Use secondary background (or --background if preferred)
            border: '1px solid var(--gray-300)', // Use a subtle border color variable
            color: 'var(--gray-700)', // Use default text color variable
            padding: '8px 16px',
            zIndex: 1000,
            borderRadius: '4px',
            maxWidth: '300px',
            textAlign: 'center',
            transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease', // Smooth transitions
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'inherit' // Inherit color from parent div
            }}>
              Loading imagery...
            </p>
          </div>
        ) : isDragging ? (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            // Use CSS variables for theme adaptation
            background: 'var(--backgroundColor)', // Use secondary background
            border: '1px solid var(--gray-300)', // Use subtle border color variable
            color: 'var(--gray-700)', // Use default text color variable
            padding: '8px 16px',
            zIndex: 1000,
            borderRadius: '4px',
            maxWidth: '300px',
            textAlign: 'center',
            transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease', // Smooth transitions
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'inherit' // Inherit color from parent div
            }}>
              Release to update imagery
            </p>
          </div>
        ) : null /* Or render a default "Ready" state if needed */ }
        
        {/* Base layer from OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render all grid cell images */}
        {gridImages.map((image, index) => (
          <ImageOverlay 
            key={index} 
            url={image.url} 
            bounds={image.bounds} 
            opacity={0.7}
          />
        ))}

        {/* Filter Controls */}
        <FilterControls 
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
        />
      </MapContainer>
      
      {currentZoom < MIN_FETCH_ZOOM && (
        <p style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '5px 10px', zIndex: 1000, borderRadius: 4 }}>
          Zoom in to view Sentinel imagery
        </p>
      )}
    </div>
  );
}

export default SentinelMap;