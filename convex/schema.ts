import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notifications: defineTable({
    userId: v.string(),
    type: v.union(v.literal("tempAlert"), v.literal("system"), v.literal("warning")),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_created_at", ["createdAt"]),

  alerts: defineTable({
    userId: v.string(),
    stationId: v.string(),
    type: v.union(v.literal("avgTemp")),
    threshold: v.number(),
    channels: v.array(v.string()),
    lastTriggered: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_station", ["userId", "stationId"])
    .index("by_user_station_type", ["userId", "stationId", "type"]),
}); 