import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface ConvexNotification {
  id: string;
  userId: string;
  type: 'tempAlert' | 'system' | 'warning';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// Hook to fetch user's notifications with real-time updates
export function useConvexNotifications() {
  const { user } = useUser();
  
  const notifications = useQuery(
    api.notifications.list,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: notifications || [],
    isLoading: notifications === undefined,
    error: null, // Convex handles errors automatically
  };
}

// Hook to get unread notifications count
export function useUnreadNotificationsCount() {
  const { user } = useUser();
  
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  return unreadCount || 0;
}

// Hook to mark notification as read
export function useMarkNotificationRead() {
  const { user } = useUser();
  const markAsRead = useMutation(api.notifications.markAsRead);
  
  return {
    mutateAsync: async (notificationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return markAsRead({
        notificationId: notificationId as Id<"notifications">,
        userId: user.id,
      });
    },
    isPending: false, // Convex mutations are fast
  };
}

// Hook to mark all notifications as read
export function useMarkAllNotificationsRead() {
  const { user } = useUser();
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  
  return {
    mutateAsync: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      return markAllAsRead({ userId: user.id });
    },
    isPending: false,
  };
}

// Hook to create a notification (used by alert service)
export function useCreateNotification() {
  const createNotification = useMutation(api.notifications.create);
  
  return {
    mutateAsync: async (notification: {
      userId: string;
      type: 'tempAlert' | 'system' | 'warning';
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }) => {
      return createNotification(notification);
    },
  };
} 