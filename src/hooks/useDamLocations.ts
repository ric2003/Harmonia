import { useState, useEffect } from 'react';
import { getCoordinates, GeoapifyCoordinates } from '@/services/geoapifyLocation';

// Create a global in-memory cache that persists between navigations
const GLOBAL_LOCATION_CACHE: {
  locations: Record<string, GeoapifyCoordinates>;
  timestamp: number;
  pendingRequests: Record<string, Promise<GeoapifyCoordinates>>;
} = {
  locations: {},
  timestamp: 0,
  pendingRequests: {}
};

// Try to restore cache from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    const savedCache = localStorage.getItem('WATER_WISE_DAM_LOCATIONS');
    if (savedCache) {
      const parsedCache = JSON.parse(savedCache);
      GLOBAL_LOCATION_CACHE.locations = parsedCache.locations || {};
      GLOBAL_LOCATION_CACHE.timestamp = parsedCache.timestamp || 0;
    }
  } catch (error) {
    console.error('Error loading dam locations from localStorage:', error);
  }
}

// Save cache to localStorage periodically
const saveCache = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('WATER_WISE_DAM_LOCATIONS', JSON.stringify({
        locations: GLOBAL_LOCATION_CACHE.locations,
        timestamp: GLOBAL_LOCATION_CACHE.timestamp
      }));
    } catch (error) {
      console.error('Error saving dam locations to localStorage:', error);
    }
  }
};

// Cache duration (30 days)
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

// Function to fetch a dam location with caching
export async function fetchDamLocation(damId: string): Promise<GeoapifyCoordinates> {
  // Check if this location is already in cache and not expired
  const now = Date.now();
  if (
    GLOBAL_LOCATION_CACHE.locations[damId] && 
    (now - GLOBAL_LOCATION_CACHE.timestamp < CACHE_DURATION)
  ) {
    return GLOBAL_LOCATION_CACHE.locations[damId];
  }
  
  // If there's already a request in progress for this dam, return that promise
  if (damId in GLOBAL_LOCATION_CACHE.pendingRequests) {
    return GLOBAL_LOCATION_CACHE.pendingRequests[damId];
  }
  
  // Create a new fetch promise and store it
  const fetchPromise = getCoordinates(damId)
    .then(coordinates => {
      // Save to cache
      GLOBAL_LOCATION_CACHE.locations[damId] = coordinates;
      GLOBAL_LOCATION_CACHE.timestamp = Date.now();
      
      // Remove from pending requests
      delete GLOBAL_LOCATION_CACHE.pendingRequests[damId];
      
      // Save to localStorage
      saveCache();
      
      return coordinates;
    })
    .catch(error => {
      // Remove from pending requests on error
      delete GLOBAL_LOCATION_CACHE.pendingRequests[damId];
      throw error;
    });
  
  // Store the promise to prevent duplicate requests
  GLOBAL_LOCATION_CACHE.pendingRequests[damId] = fetchPromise;
  
  return fetchPromise;
}

// Hook to fetch and cache a dam location
export function useDamLocation(damId: string) {
  const [location, setLocation] = useState<GeoapifyCoordinates | null>(
    GLOBAL_LOCATION_CACHE.locations[damId] || null
  );
  const [isLoading, setIsLoading] = useState(!location);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    if (!damId) return;
    
    setIsLoading(true);
    
    fetchDamLocation(damId)
      .then(coordinates => {
        if (isMounted) {
          setLocation(coordinates);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(`Error fetching location for dam ${damId}:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [damId]);
  
  return { location, isLoading, error };
}

// Function to fetch multiple dam locations at once
export async function fetchMultipleDamLocations(damIds: string[]): Promise<Record<string, GeoapifyCoordinates>> {
  const results: Record<string, GeoapifyCoordinates> = {};
  
  // Use Promise.all to fetch all locations in parallel
  await Promise.all(
    damIds.map(async (damId) => {
      try {
        const location = await fetchDamLocation(damId);
        results[damId] = location;
      } catch (error) {
        console.error(`Error fetching location for dam ${damId}:`, error);
      }
    })
  );
  
  return results;
}

// Hook to fetch multiple dam locations
export function useMultipleDamLocations(damIds: string[]) {
  const [locations, setLocations] = useState<Record<string, GeoapifyCoordinates>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchedIds, setFetchedIds] = useState<string[]>([]); // Track which IDs have been fetched
  
  useEffect(() => {
    // Skip if no IDs to fetch or we've already fetched all of them
    const allIdsAlreadyFetched = damIds.length > 0 && 
      damIds.every(id => fetchedIds.includes(id));
    
    if (!damIds.length || allIdsAlreadyFetched) {
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    
    // Start with any cached locations we already have
    const cachedLocations: Record<string, GeoapifyCoordinates> = {};
    damIds.forEach(damId => {
      if (GLOBAL_LOCATION_CACHE.locations[damId]) {
        cachedLocations[damId] = GLOBAL_LOCATION_CACHE.locations[damId];
      }
    });
    
    // Update with cached results immediately
    if (Object.keys(cachedLocations).length > 0) {
      setLocations(prev => ({...prev, ...cachedLocations}));
    }
    
    // Only fetch uncached locations that we haven't attempted before
    const uncachedDamIds = damIds.filter(
      damId => !GLOBAL_LOCATION_CACHE.locations[damId] && !fetchedIds.includes(damId)
    );
    
    if (uncachedDamIds.length === 0) {
      setIsLoading(false);
      return;
    }
    
    // Track that we're attempting to fetch these IDs
    setFetchedIds(prev => [...prev, ...uncachedDamIds]);
    
    fetchMultipleDamLocations(uncachedDamIds)
      .then(newLocations => {
        if (isMounted) {
          setLocations(prevLocations => ({
            ...prevLocations,
            ...newLocations
          }));
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [damIds, fetchedIds]);
  
  return { locations, isLoading, error };
} 