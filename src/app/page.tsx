"use client";

import { useState, useEffect } from "react";
import { getStations, Station } from "@/services/api";
import Link from "next/link";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

// Definição do tipo para as props do MapComponent
interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
}

// Importação dinâmica do componente de mapa para evitar problemas de SSR
const MapComponent = dynamic<MapComponentProps>(
  () => import("@/components/MapComponent"), // Ajuste o caminho conforme a estrutura do seu projeto
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <p>A carregar mapa...</p>
      </div>
    ),
  }
);

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

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
      <div className="p-6 text-darkGray">
        <p>A carregar barragens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-0">
      <h1 className="text-3xl font-bold mb-6 text-primary">Barragens de Portugal</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Barragens */}
        <div className="lg:col-span-1">
          <div className="bg-backgroundColor p-4 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-primary ">Lista de Barragens</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto text-darkGray">
              {stations.map((station) => (
                <Link 
                  href={`/stations/${station.id}`} 
                  key={station.id}
                  className="block"
                >
                  <div 
                    className={`p-3 rounded-lg flex items-center ${
                      selectedStation === station.id 
                        ? "bg-blue50 border-l-4 border-blue-500" 
                        : "bg-gray50 hover:bg-blue50"
                    }`}
                    onMouseEnter={() => setSelectedStation(station.id)}
                    onMouseLeave={() => setSelectedStation(null)}
                  >
                    <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                    <span>{station.estacao.slice(7)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mapa com Mapbox */}
        <div className="lg:col-span-2">
          <div className="bg-backgroundColor p-4 rounded-xl shadow-md h-full">
            <h2 className="text-xl font-bold mb-4 text-primary">Mapa de Barragens</h2>
            <div className="rounded-lg h-96 overflow-hidden">
              <MapComponent 
                stations={stations} 
                selectedStationId={selectedStation}
                onMarkerHover={setSelectedStation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}