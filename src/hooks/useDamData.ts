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

async function fetchDamData(): Promise<DamDataResponse> {
  console.log("Fetching /api/influx...");
  const response = await fetch('/api/influx', {
    cache: 'default',
    next: { revalidate: 24*60*60 }
  });
  console.log(`Fetch response status: ${response.status}`);

  if (!response.ok) {
    console.error("Fetch response not OK:", response.status, response.statusText);
    
    // Try to extract more detailed error information if possible
    try {
      const errorData = await response.json();
      throw new Error(`Failed to fetch dam data: ${response.status} ${response.statusText}${errorData.error ? ' - ' + errorData.error : ''}`);
    } catch {
      // If unable to parse JSON, throw generic error with status
      throw new Error(`Failed to fetch dam data: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  console.log("Parsed JSON response:", data);

  if (!data.success) {
    console.error("API call was not successful:", data.error);
    throw new Error(data.error || 'API indicated failure');
  }
  
  console.log("API call successful, returning data array.");
  return {
    data: data.data,
    source: data.source || 'influxdb' // Default to 'influxdb' if source is not specified
  };
}

export function useDamData() {
  return useQuery({
    queryKey: ['dam-data'],
    queryFn: fetchDamData,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: false, // Prevent refetching when window regains focus
    refetchOnMount: false, // Prevent refetching when component mounts again
    refetchOnReconnect: true, // Still refetch when reconnecting after being offline
    retry: 1, // Only retry once to avoid excessive retries when InfluxDB is down
  });
}