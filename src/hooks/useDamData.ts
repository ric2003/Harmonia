import { useQuery } from '@tanstack/react-query';

interface DamData {
  _time?: string;
  barragem?: string;
  cota_lida?: number;
  enchimento?: number;
  volume_total?: number;
  volume_util?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DamDataResponse {
  data: DamData[];
  source?: string;
}

// Create a global in-memory cache that persists between navigations
const GLOBAL_DAM_CACHE: {
  data: DamDataResponse | null;
  timestamp: number;
  fetchPromise: Promise<DamDataResponse> | null;
} = {
  data: null,
  timestamp: 0,
  fetchPromise: null,
};

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = ONE_DAY * 30;
const CACHE_DURATION = ONE_MONTH;

async function fetchDamData(): Promise<DamDataResponse> {
  // Check the global in-memory cache first
  const now = Date.now();
  if (GLOBAL_DAM_CACHE.data && (now - GLOBAL_DAM_CACHE.timestamp < CACHE_DURATION)) {
    return Promise.resolve(GLOBAL_DAM_CACHE.data);
  }
  
  // If there's already a fetch in progress, return that promise to avoid duplicate requests
  if (GLOBAL_DAM_CACHE.fetchPromise) {
    return GLOBAL_DAM_CACHE.fetchPromise;
  }
  
  // Create a new fetch promise and store it
  GLOBAL_DAM_CACHE.fetchPromise = (async () => {
    try {
      // Use specific fetch options to optimize for caching
      const response = await fetch('/api/influx', {
        cache: 'force-cache',
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(`Failed to fetch dam data: ${response.status} ${response.statusText}${errorData.error ? ' - ' + errorData.error : ''}`);
        } catch {
          throw new Error(`Failed to fetch dam data: ${response.status} ${response.statusText}`);
        }
      }
    
      const data = await response.json();
    
      if (!data.success) {
        throw new Error(data.error || 'API indicated failure');
      }
      
      // Save to our global cache
      const result = {
        data: data.data,
        source: data.source || 'influxdb'
      };
      
      GLOBAL_DAM_CACHE.data = result;
      GLOBAL_DAM_CACHE.timestamp = Date.now();
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      // Clear the fetchPromise so future calls will try again if this one failed
      GLOBAL_DAM_CACHE.fetchPromise = null;
    }
  })();
  
  return GLOBAL_DAM_CACHE.fetchPromise;
}

export function useDamData() {
  // Constants for time in milliseconds
  const ONE_DAY = 1000 * 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;
  const THREE_MONTHS = ONE_MONTH * 3;

  return useQuery({
    queryKey: ['dam-data'],
    queryFn: fetchDamData,
    staleTime: ONE_MONTH,
    gcTime: THREE_MONTHS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    initialData: GLOBAL_DAM_CACHE.data || undefined,
  });
}