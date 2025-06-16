"use client";

import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { buildSentinelWMS, FilterKey } from "@/services/sentinelService";
import { FilterControls } from "./FilterControls";
import { FilterExplanation } from "./FilterExplanation";
import { MobileFilterExplanation } from "./MobileFilterExplanation";

const FILTERS = [
  { label: "True Color", value: "1_TRUE_COLOR" },
  { label: "NDVI",       value: "3_NDVI"       },
  { label: "Moisture",   value: "5-MOISTURE-INDEX1" },
  { label: "Urban",      value: "4-FALSE-COLOR-URBAN" },
] as const;

export default function SentinelMap() {
  const [filter, setFilter] = useState<FilterKey>(FILTERS[0].value);

  // Pre-build WMS params to avoid recalculations
  const { url, params } = useMemo(() => buildSentinelWMS(filter), [filter]);

  return (
    <div className="flex flex-col">
      {/* Map Container */}
      <div style={{ position: "relative", height: "75vh", width: "100%" }}>
        <MapContainer 
          className="rounded-lg overflow-hidden" 
          center={[38.7223, -9.1293]} 
          zoom={12} 
          minZoom={7}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          
          <WMSTileLayer key={filter} url={url} params={params} opacity={0.7}/>
          
          <FilterControls currentFilter={filter} onFilterChange={setFilter} />
          <FilterExplanation currentFilter={filter}/>
        </MapContainer>
      </div>
      
      {/* Mobile Filter Explanation - shown below map on mobile */}
      <div className="block lg:hidden mt-4">
        <MobileFilterExplanation currentFilter={filter} />
      </div>
    </div>
  );
}