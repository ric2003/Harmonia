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

async function fetchDamData(): Promise<DamData[]> {
  const response = await fetch('/api/influx', {
    cache: 'force-cache',
    next: { revalidate: 24 * 60 * 60 }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch dam data');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch dam data');
  }
  return data.data;
}

export function useDamData() {
  return useQuery({
    queryKey: ['dam-data'],
    queryFn: fetchDamData,
    staleTime: Infinity, // Never consider the data stale
    gcTime: 90 * 24 * 60 * 60 * 1000, // 90 days
  });
} 