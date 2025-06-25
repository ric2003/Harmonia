import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStations, getStationDailyData, getStationHourlyData, getStation10MinData } from '@/services/irristratService';
import { runConvexAlertChecks } from '@/services/convexAlertService';

// Configure cache time constants for consistency
const ONE_MINUTE = 1000 * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const SEVEN_DAYS = ONE_DAY * 7;

export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: getStations,
    staleTime: ONE_DAY, // Station list rarely changes, consider it fresh for a full day
    gcTime: SEVEN_DAYS, // Keep in cache for 7 days
  });
}

export function useStationDailyData(stationId: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['station-daily', stationId, fromDate, toDate],
    queryFn: () => getStationDailyData(stationId, fromDate, toDate),
    staleTime: 6 * ONE_HOUR, // Daily data is updated less frequently
    gcTime: 3 * ONE_DAY, // Keep in cache for 3 days
  });
}

export function useStationHourlyData(stationId: string) {
  return useQuery({
    queryKey: ['station-hourly', stationId],
    queryFn: () => getStationHourlyData(stationId),
    staleTime: ONE_HOUR, // Hourly data can be considered fresh for 1 hour
    gcTime: ONE_DAY, // Keep in cache for 1 day
  });
}

export function useStation10MinData(stationId: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['station-10min', stationId],
    queryFn: async () => {
      const data = await getStation10MinData(stationId);
      
      // After fetching new data, trigger alert checks for this specific station
      // This runs async so it doesn't block the UI and includes notification refresh
      setTimeout(async () => {
        try {
          const results = await runConvexAlertChecks(stationId);
          
          // If any alerts were triggered, refresh notifications to show new ones
          if (results.some((r: any) => r.triggered)) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch (error) {
          console.error(`Error running alert checks for station ${stationId}:`, error);
        }
      }, 100); // Small delay to ensure data is available
      
      return data;
    },
    staleTime: 10 * ONE_MINUTE, // 10-min data is fresh for only 10 minutes
    gcTime:  ONE_HOUR, // Keep in cache for 6 hours
    refetchInterval: 10 * ONE_MINUTE, // Auto-refetch every 10 minutes to check for new data
    refetchIntervalInBackground: false, // Only refetch when tab is active
  });
}

/**
 * Hook to prefetch station data for faster navigation
 */
export function usePrefetchStationData() {
  const queryClient = useQueryClient();
  
  // Create stable function references that won't change between renders
  const prefetchAllStationData = async (stations: { id: string }[]) => {
    if (!stations?.length) return;
    
    // Get current date and dates for the last 7 days (common default range)
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 7);
    const fromDateString = fromDate.toISOString().split('T')[0];
    
    // Reduce batch size and increase delay to minimize impact on the main thread
    const BATCH_SIZE = 1; // Process just one station at a time
    const BATCH_DELAY = 1000; // 1 second between batches
    
    // Track if the prefetch has been aborted (e.g., due to navigation)
    let isAborted = false;
    const abortController = new AbortController();
    
    // Listen for page navigation events
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        isAborted = true;
        abortController.abort();
      }
    }, { once: true });
    
    // First prioritize prefetching only daily data for all stations
    // This is the most important data that users are likely to want first
    try {
      for (let i = 0; i < stations.length && !isAborted; i += BATCH_SIZE) {
        const batch = stations.slice(i, i + BATCH_SIZE);
        
        // Process one station at a time with generous delays
        for (const station of batch) {
          if (isAborted) break;
          
          // Prefetch daily data only initially
          try {
            await queryClient.prefetchQuery({
              queryKey: ['station-daily', station.id, fromDateString, toDate],
              queryFn: async () => {
                const signal = abortController.signal;
                const res = await fetch(`/api/stations/${station.id}/daily?from=${fromDateString}&to=${toDate}`, { signal });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                return res.json();
              },
            });
          } catch (error: unknown) {
            if ((error as { name?: string })?.name === 'AbortError') {
              console.log('Prefetching aborted due to navigation');
              isAborted = true;
              break;
            }
            // Silently continue on other errors
            console.error(`Error prefetching data for station ${station.id}:`, error);
          }
          
          // Add a good delay between stations to minimize impact
          if (i + BATCH_SIZE < stations.length && !isAborted) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        }
      }
      
      // Only if we've successfully loaded all daily data and the user is still on the page,
      // start loading hourly data
      if (!isAborted) {
        // We'll only prefetch hourly data for the first few stations to minimize load
        const limitedStations = stations.slice(0, 5); // Only load hourly data for 5 stations max
        
        for (let i = 0; i < limitedStations.length && !isAborted; i++) {
          const station = limitedStations[i];
          
          try {
            await queryClient.prefetchQuery({
              queryKey: ['station-hourly', station.id],
              queryFn: async () => {
                const signal = abortController.signal;
                const res = await fetch(`/api/stations/${station.id}/hourly`, { signal });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                return res.json();
              },
            });
          } catch (error: unknown) {
            if ((error as { name?: string })?.name === 'AbortError') {
              console.log('Prefetching aborted due to navigation');
              isAborted = true;
              break;
            }
            console.error(`Error prefetching hourly data for station ${station.id}:`, error);
          }
          
          if (i + 1 < limitedStations.length && !isAborted) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        }
      }
      
      // Skip 10-minute data prefetching entirely, as it's rarely needed immediately
      // Users can wait for this data to load when they specifically view a station
    } catch (error) {
      console.error('Error during prefetching:', error);
    }
  };
  
  // Helper to prefetch a specific station's data
  const prefetchStationData = async (stationId: string, fromDate?: string, toDate?: string) => {
    if (!stationId) return;
    
    // Calculate default dates if not provided
    if (!fromDate || !toDate) {
      const today = new Date();
      toDate = toDate || today.toISOString().split('T')[0];
      
      if (!fromDate) {
        const fromDateObj = new Date(today);
        fromDateObj.setDate(fromDateObj.getDate() - 7);
        fromDate = fromDateObj.toISOString().split('T')[0];
      }
    }
    
    // Prefetch daily data
    await queryClient.prefetchQuery({
      queryKey: ['station-daily', stationId, fromDate, toDate],
      queryFn: () => getStationDailyData(stationId, fromDate, toDate),
    });
    
    // Prefetch hourly data
    await queryClient.prefetchQuery({
      queryKey: ['station-hourly', stationId],
      queryFn: () => getStationHourlyData(stationId),
    });
    
    // Prefetch 10-minute data
    await queryClient.prefetchQuery({
      queryKey: ['station-10min', stationId],
      queryFn: () => getStation10MinData(stationId),
    });
  };
  
  return {
    prefetchAllStationData,
    prefetchStationData
  };
} 