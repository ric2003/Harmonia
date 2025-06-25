import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user's alerts
export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return alerts.map(alert => ({
      id: alert._id,
      userId: alert.userId,
      stationId: alert.stationId,
      type: alert.type,
      threshold: alert.threshold,
      channels: alert.channels,
      lastTriggered: alert.lastTriggered ? new Date(alert.lastTriggered).toISOString() : undefined,
      createdAt: new Date(alert.createdAt).toISOString(),
    }));
  },
});

// Get alerts for a specific station
export const getByStation = query({
  args: {
    userId: v.string(),
    stationId: v.string(),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_user_station", (q) => 
        q.eq("userId", args.userId).eq("stationId", args.stationId)
      )
      .collect();

    return alerts.map(alert => ({
      id: alert._id,
      userId: alert.userId,
      stationId: alert.stationId,
      type: alert.type,
      threshold: alert.threshold,
      channels: alert.channels,
      lastTriggered: alert.lastTriggered ? new Date(alert.lastTriggered).toISOString() : undefined,
      createdAt: new Date(alert.createdAt).toISOString(),
    }));
  },
});

// Create or update an alert
export const createOrUpdate = mutation({
  args: {
    userId: v.string(),
    stationId: v.string(),
    type: v.union(v.literal("avgTemp")),
    threshold: v.number(),
    channels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if alert already exists
    const existingAlert = await ctx.db
      .query("alerts")
      .withIndex("by_user_station_type", (q) => 
        q.eq("userId", args.userId)
         .eq("stationId", args.stationId)
         .eq("type", args.type)
      )
      .first();

    if (existingAlert) {
      // Update existing alert
      await ctx.db.patch(existingAlert._id, {
        threshold: args.threshold,
        channels: args.channels,
      });
      return existingAlert._id;
    } else {
      // Create new alert
      const alertId = await ctx.db.insert("alerts", {
        userId: args.userId,
        stationId: args.stationId,
        type: args.type,
        threshold: args.threshold,
        channels: args.channels,
        createdAt: Date.now(),
      });
      return alertId;
    }
  },
});

// Update alert last triggered time
export const updateLastTriggered = mutation({
  args: {
    alertId: v.id("alerts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    
    if (!alert || alert.userId !== args.userId) {
      throw new Error("Alert not found or unauthorized");
    }

    await ctx.db.patch(args.alertId, {
      lastTriggered: Date.now(),
    });

    return { success: true };
  },
});

// Delete an alert
export const remove = mutation({
  args: {
    alertId: v.id("alerts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    
    if (!alert || alert.userId !== args.userId) {
      throw new Error("Alert not found or unauthorized");
    }

    await ctx.db.delete(args.alertId);

    return { success: true };
  },
});

// Get all alerts (for background processing)
export const getAllAlerts = query({
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();

    return alerts.map(alert => ({
      id: alert._id,
      userId: alert.userId,
      stationId: alert.stationId,
      type: alert.type,
      threshold: alert.threshold,
      channels: alert.channels,
      lastTriggered: alert.lastTriggered ? new Date(alert.lastTriggered).toISOString() : undefined,
      createdAt: new Date(alert.createdAt).toISOString(),
    }));
  },
}); 