"use client";

import { useState, useEffect, useContext } from "react";
import { getStations, Station } from "@/services/api";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import dynamic from "next/dynamic";
import {AlertMessage} from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from "@/components/ScrollIndicator";
import DataSourceFooter from "@/components/DataSourceFooter";
import MapList from "@/components/MapList";

// Definição do tipo para as props do MapComponent
interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
  onStationSelect: (stationId: string | null) => void;
  showMenu: boolean | null;
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
  const { t } = useTranslation();
  useTranslatedPageTitle('navigation.home');

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
      <div>
        {/* First container - Map and title */}
        <div className="bg-backgroundColor p-4 rounded-xl shadow-md flex flex-col gap-2">
          <div className="h-8 bg-gray200 rounded w-1/3 animate-pulse"></div>
          <div className="h-[65vh] bg-gray200 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Second container - Information section */}
        <div className="bg-backgroundColor rounded-lg p-6 mt-6 shadow-md">
          <div className="h-6 bg-gray200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray200 rounded w-3/4 mb-3 animate-pulse"></div>
          <div className="h-4 bg-gray200 rounded w-2/3 mb-3 animate-pulse"></div>
          <div className="h-6 bg-gray200 rounded w-1/3 mt-6 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray200 rounded w-3/4 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) return <AlertMessage type="error" message={error} />;

  return (
    <div>
      <div className="bg-backgroundColor h-[100%] p-4 rounded-xl shadow-md flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary text-center sm:text-left">{t('home.title')}</h1>

        <div className="lg:hidden text-md text-darkGray flex justify-center sm:justify-start">
          <select
            name="dams"
            id="select-dams"
            className="border border-primary rounded-md py-1 px-2"
            onChange={(e) => {
              setSelectedStation(e.target.value)
            }}
          >
            <option key="default">Selecione uma barragem</option>
            {stations.map((station) => {
              return (
                <option key={station.id} value={station.id}>{station.estacao.slice(7)}</option>
              );
            })}
          </select>
        </div>
        <div className="relative rounded-lg overflow-hidden w-full border border-gray200 shadow-sm map-container-fixed">
          <MapComponent
            key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
            stations={stations}
            selectedStationId={selectedStation}
            onMarkerHover={setSelectedStation}
            onStationSelect={setSelectedStation}
            showMenu={true}
          />
        </div>
      </div>

      <ScrollIndicator targetId="intro-section" text={t('home.scrollForInfo')} />

      <div id="intro-section" className="bg-backgroundColor rounded-lg p-6 mt-6 shadow-md">
        <div className="prose max-w-none text-darkGray">
          <p className="mb-4">{t('home.intro')}</p>
          <p className="mb-4">{t('home.purpose')}</p>

          <h3 className="text-lg font-semibold mt-6 mb-2">{t('home.monitoredData')}</h3>
          <ul className="list-disc pl-6 space-y-1">
            {(t('home.dataList', { returnObjects: true }) as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <DataSourceFooter 
        textKey="home.dataSource"
        linkKey="home.irristrat"
        linkUrl="https://irristrat.com/new/index.php"
      />
      </div>
  );
}