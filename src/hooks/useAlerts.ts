import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';

export interface UserAlert {
  id: string;
  userId: string;
  stationId: string;
  type: 'avgTemp';
  threshold: number;
  channels: string[];
  lastTriggered?: string;
  createdAt: string;
}

// Hook to fetch user's alerts
export function useAlerts() {
  const { isSignedIn } = useUser();
  
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async (): Promise<UserAlert[]> => {
      const response = await fetch('/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
    enabled: isSignedIn,
  });
}

// Hook to get alerts for a specific station
export function useStationAlerts(stationId: string) {
  const { data: alerts = [], isLoading, error } = useAlerts();
  
  const stationAlerts = alerts.filter(alert => alert.stationId === stationId);
  
  return {
    alerts: stationAlerts,
    isLoading,
    error,
    hasAlerts: stationAlerts.length > 0,
  };
}

// Hook to create or update an alert
export function useCreateAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertData: {
      stationId: string;
      type: 'avgTemp';
      threshold: number;
      channels: string[];
    }) => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// Hook to delete an alert
export function useDeleteAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
} 