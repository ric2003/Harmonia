import { useState, useEffect } from 'react';

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
  try {
    // Use fetch options to disable all caching
    const response = await fetch('/api/influx', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
    
    return {
      data: data.data,
      source: data.source || 'influxdb'
    };
  } catch (error) {
    throw error;
  }
}

export function useDamData() {
  const [data, setData] = useState<DamDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await fetchDamData();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return {
    data,
    isLoading,
    error
  };
}