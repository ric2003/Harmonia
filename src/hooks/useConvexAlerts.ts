import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface ConvexAlert {
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
export function useConvexAlerts() {
  const { user } = useUser();
  
  const alerts = useQuery(
    api.alerts.list,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: alerts || [],
    isLoading: alerts === undefined,
    error: null,
  };
}

// Hook to get alerts for a specific station
export function useConvexStationAlerts(stationId: string) {
  const { user } = useUser();
  
  const alerts = useQuery(
    api.alerts.getByStation,
    user?.id ? { userId: user.id, stationId } : "skip"
  );

  const stationAlerts = alerts || [];
  
  return {
    alerts: stationAlerts,
    isLoading: alerts === undefined,
    error: null,
    hasAlerts: stationAlerts.length > 0,
  };
}

// Hook to create or update an alert
export function useCreateConvexAlert() {
  const { user } = useUser();
  const createOrUpdate = useMutation(api.alerts.createOrUpdate);
  
  return {
    mutateAsync: async (alertData: {
      stationId: string;
      type: 'avgTemp';
      threshold: number;
      channels: string[];
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return createOrUpdate({
        userId: user.id,
        ...alertData,
      });
    },
  };
}

// Hook to delete an alert
export function useDeleteConvexAlert() {
  const { user } = useUser();
  const removeAlert = useMutation(api.alerts.remove);
  
  return {
    mutateAsync: async (alertId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return removeAlert({
        alertId: alertId as Id<"alerts">,
        userId: user.id,
      });
    },
  };
}

// Hook to update alert last triggered time
export function useUpdateAlertLastTriggered() {
  const { user } = useUser();
  const updateLastTriggered = useMutation(api.alerts.updateLastTriggered);
  
  return {
    mutateAsync: async (alertId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return updateLastTriggered({
        alertId: alertId as Id<"alerts">,
        userId: user.id,
      });
    },
  };
}

// Hook to get all alerts (for background processing)
export function useGetAllAlerts() {
  const alerts = useQuery(api.alerts.getAllAlerts);

  return {
    data: alerts || [],
    isLoading: alerts === undefined,
    error: null,
  };
} 