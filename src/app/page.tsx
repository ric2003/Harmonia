"use client";

import { useState, useEffect, useContext } from "react";
import { getStations, Station } from "@/services/api";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import dynamic from "next/dynamic";
import {AlertMessage} from "@/components/ui/AlertMessage";
import { useSetPageTitle } from '@/hooks/useSetPageTitle';

// Definição do tipo para as props do MapComponent
interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
  onStationSelect: (stationId: string | null) => void;
  shoeMenu: boolean | null;
}

// Importação dinâmica do componente de mapa para evitar problemas de SSR
const MapComponent = dynamic<MapComponentProps>(
  () => import("@/components/MapComponent")
);

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  useSetPageTitle('HOME');

  useEffect(() => {
    async function fetchStations() {
      try {
        const stationsData = await getStations();
        setStations(stationsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStations();
  }, []);

  if (loading) {
    return (
      <div className="">
        <div className="bg-backgroundColor p-4 rounded-xl shadow-md">
          <div className="rounded-lg h-[75vh] overflow-hidden w-full">
            <div className="h-7 bg-gray200 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="h-full bg-gray200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <AlertMessage type="error" message={error} />;

  return (  
    <div className="bg-backgroundColor h-[100%] p-4 rounded-xl shadow-md flex flex-col">
    <h1 className="pb-4 text-xl font-bold text-primary">Barragens de Portugal</h1>
    <div className="rounded-lg flex-1 overflow-hidden w-full">
      <MapComponent 
        key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
        stations={stations} 
        selectedStationId={selectedStation}
        onMarkerHover={setSelectedStation}
        onStationSelect={setSelectedStation}
        shoeMenu={true}
      />
    </div>
  </div>
  
  );
}