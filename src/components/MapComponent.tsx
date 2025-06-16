'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl, { Map, GeolocateControl, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapList from './MapList';
import { usePrefetchStationData } from '@/hooks/useStations';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
  onStationSelect: (stationId: string | null) => void;
  showMenu: boolean | null;
}

const MapComponent = ({ stations, selectedStationId, onMarkerHover, onStationSelect, showMenu }: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const prefetchHook = usePrefetchStationData();
  const prefetchStationData = prefetchHook?.prefetchStationData;

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-9.1444, 38.7425],
      zoom: 8
    });

    map.current.addControl(new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    }), 'top-right');

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when stations data changes or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    stations.forEach(station => {
      const marker = new mapboxgl.Marker({
        color: selectedStationId === station.id ? '#FF0000' : '#3B82F6'
      })
      .setLngLat([station.lon, station.lat])
      .addTo(map.current!);

      // Add hover interactions
      const element = marker.getElement();
      
      // Set cursor to pointer for better UX
      element.style.cursor = 'pointer';
      
      element.addEventListener('mouseenter', () => {
        // Call the original hover callback
        if (onMarkerHover) {
          onMarkerHover(station.id);
        }
        
        // Prefetch data for this station when hovered
        if (typeof prefetchStationData === 'function') {
          prefetchStationData(station.id);
        }
      });
      
      element.addEventListener('mouseleave', () => {
        if (onMarkerHover) {
          onMarkerHover(null);
        }
      });
      
      // Use the provided callback for navigation instead of hardcoding the route
      element.addEventListener('click', () => {
        if (onStationSelect) {
          onStationSelect(station.id);
        }
      });

      markers.current.push(marker);
    });

    // Center map if station is selected
    if (selectedStationId) {
      const selectedStation = stations.find(s => s.id === selectedStationId);
      if (selectedStation) {
        map.current.flyTo({
          center: [selectedStation.lon, selectedStation.lat],
          zoom: 11
        });
      }
    }
  }, [stations, selectedStationId, mapLoaded, onMarkerHover, onStationSelect, prefetchStationData]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Station list panel - only show when explicitly requested (for station pages) */}
      {showMenu && (
        <div className='hidden lg:block absolute top-4 left-4 z-10'>
          <MapList
            stations={stations}
            selectedStationId={selectedStationId}
            onMarkerHover={(stationId) => {
              onMarkerHover(stationId);
              
              // Also prefetch data when hovering over station in the list
              if (stationId && prefetchStationData) {
                prefetchStationData(stationId);
              }
            }}
            showMenu={showMenu}
          />
        </div>
      )}
    </div>
  );
};

export default MapComponent;