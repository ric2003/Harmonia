export const INSTANCE_ID = "20c65dd0-0536-4f6f-af87-588e0fa4c36c";

// Filter of Sentinel Map
export type FilterKey = 
  | "1_TRUE_COLOR"
  | "3_NDVI"
  | "5-MOISTURE-INDEX1"
  | "4-FALSE-COLOR-URBAN";

export function buildSentinelWMS(filter: FilterKey) {
  const to   = new Date().toISOString();
  const from = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const TIME = `${from}/${to}`;

  return {
    url: `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}`,
    params: {
      service:    "WMS",
      version:    "1.3.0",
      layers:     filter,
      styles:     "",
      format:     "image/png",
      transparent:true,
      time:       TIME,
      maxcc:      100,
      mosaickingOrder: "leastCC",
      showlogo:   false,
    },
  };
}