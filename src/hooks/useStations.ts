import { useQuery } from '@tanstack/react-query';
import { getStations, getStationDailyData, getStationHourlyData, getStation10MinData } from '@/services/api';

export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: getStations,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - stations list rarely changes
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function useStationDailyData(stationId: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['station-daily', stationId, fromDate, toDate],
    queryFn: () => getStationDailyData(stationId, fromDate, toDate),
    staleTime: 12 * 60 * 60 * 1000, // 24 hours - daily data
    gcTime: 24 * 60 * 60 * 1000, // 1 day
  });
}

export function useStationHourlyData(stationId: string) {
  return useQuery({
    queryKey: ['station-hourly', stationId],
    queryFn: () => getStationHourlyData(stationId),
    staleTime: 60 * 60 * 1000, // 1 hour - hourly data
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useStation10MinData(stationId: string) {
  return useQuery({
    queryKey: ['station-10min', stationId],
    queryFn: () => getStation10MinData(stationId),
    staleTime: 10 * 60 * 1000, // 10 minutes - 10-min data
    gcTime: 60 * 60 * 1000, // 1 hour
  });
} 