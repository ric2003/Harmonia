"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { buildSentinelWMS, FilterKey } from "@/services/sentinelService";
import { FilterControls } from "./FilterControls";
import { FilterExplanation } from "./FilterExplanation";

const FILTERS = [
  { label: "True Color", value: "1_TRUE_COLOR" },
  { label: "NDVI",       value: "3_NDVI"       },
  { label: "Moisture",   value: "5-MOISTURE-INDEX1" },
  { label: "Urban",      value: "4-FALSE-COLOR-URBAN" },
] as const;

export default function SentinelMap() {
  const [filter, setFilter] = useState<FilterKey>(FILTERS[0].value);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sentinelVisible, setSentinelVisible] = useState(false);

  // Pre-build WMS params to avoid recalculations
  const { url, params } = useMemo(() => buildSentinelWMS(filter), [filter]);

  // Only show sentinel layer after the base map has loaded
  useEffect(() => {
    if (mapLoaded) {
      // Delay loading the Sentinel WMS layer to prioritize basic map interaction
      const timer = setTimeout(() => {
        setSentinelVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, filter]);

  // Reset sentinel visibility when filter changes
  useEffect(() => {
    setSentinelVisible(false);
    
    // Show with delay after filter change
    const timer = setTimeout(() => {
      setSentinelVisible(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filter]);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  return (
    <div style={{ position: "relative", height: "95%", width: "100%" }}>
      <MapContainer 
        className="rounded-lg overflow-hidden" 
        center={[38.7223, -9.1293]} 
        zoom={12} 
        minZoom={7}
        style={{ height: "100%", width: "100%" }}
        whenReady={handleMapLoad}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        
        {sentinelVisible && (
          <WMSTileLayer key={filter} url={url} params={params} opacity={0.7}/>
        )}
        
        <FilterControls currentFilter={filter} onFilterChange={setFilter} />
        <FilterExplanation currentFilter={filter}/>
      </MapContainer>
    </div>
  );
}