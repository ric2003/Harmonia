import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user's notifications
export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return notifications.map(notification => ({
      id: notification._id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: new Date(notification.createdAt).toISOString(),
    }));
  },
});

// Create a new notification
export const create = mutation({
  args: {
    userId: v.string(),
    type: v.union(v.literal("tempAlert"), v.literal("system"), v.literal("warning")),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    
    if (!notification || notification.userId !== args.userId) {
      throw new Error("Notification not found or unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
    });

    return { success: true };
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    // Update all unread notifications to read
    await Promise.all(
      unreadNotifications.map(notification =>
        ctx.db.patch(notification._id, { read: true })
      )
    );

    return { success: true, count: unreadNotifications.length };
  },
});

// Get unread count for a user
export const getUnreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => 
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    return unreadNotifications.length;
  },
}); 