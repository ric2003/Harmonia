"use client";

import { useState, useEffect, useContext } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import dynamic from "next/dynamic";
import {AlertMessage} from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from "@/components/ScrollIndicator";
import DataSource from "@/components/DataSource";
import { useStations, usePrefetchStationData } from "@/hooks/useStations";
import Link from "next/link";
import { Users } from "lucide-react";

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

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
  () => import("@/components/MapComponent"),
  { ssr: false }
);

export default function HomePage() {
  const { data: stations = [], isLoading, error: fetchError } = useStations();
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  const { t } = useTranslation();
  const { prefetchAllStationData } = usePrefetchStationData();
  
  useTranslatedPageTitle('navigation.home');

  // Prefetch station data when stations are loaded, with navigation-friendly timing
  useEffect(() => {
    if (stations.length > 0) {
      const prefetchWithIdleCallback = () => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(
            () => {
              // Process stations in very small batches with high delays in between
              prefetchAllStationData(stations);
            },
            { timeout: 10000 } // 10-second timeout ensures it eventually runs even on busy browsers
          );
        } else {
          // Fallback for browsers without requestIdleCallback - use a longer delay
          const timeoutId = setTimeout(() => {
            prefetchAllStationData(stations);
          }, 5000); // 5 seconds delay instead of 2
          return () => clearTimeout(timeoutId);
        }
      };
      
      // Add event listener for before unload to cancel prefetching
      const cancelPrefetch = () => {
        // This isn't perfect but helps signal we're about to navigate away
        console.log('Navigation detected, aborting prefetch');
        // We can't actually abort the prefetch directly, but we can clean up
      };
      
      window.addEventListener('beforeunload', cancelPrefetch);
      
      // Delay starting the prefetch to ensure it doesn't interfere with initial navigation
      const initialDelayId = setTimeout(prefetchWithIdleCallback, 5000);
      
      return () => {
        clearTimeout(initialDelayId);
        window.removeEventListener('beforeunload', cancelPrefetch);
      };
    }
  }, [stations, prefetchAllStationData]);

  if (isLoading) {
    return (
      <div>
        {/* First container - Map and title */}
        <div className="bg-backgroundColor p-4 rounded-xl shadow-md flex flex-col gap-2">
          <div className="h-8 bg-gray200 rounded w-1/3 animate-pulse"></div>
          <div className="h-[55vh] bg-gray200 rounded-lg animate-pulse"></div>
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
  if (fetchError) return <AlertMessage type="error" message={(fetchError as Error).message} />;

  return (
    <div>
      <div className="bg-backgroundColor h-[100%] p-4 rounded-xl shadow-md flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary text-center sm:text-left">{t('home.title')}</h1>

        <div className="lg:hidden text-darkGray flex justify-center sm:justify-start ">
          <select
            name="dams"
            id="select-dams"
            className="bg-background border border-darkGray rounded-md py-1 px-2"
            
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

      <div id="intro-section" className="bg-backgroundColor rounded-lg p-8 mt-8 shadow-md">
        <div className="prose max-w-none text-gray600">
          <p className="mb-6 text-lg leading-relaxed">{t('home.intro')}</p>
          <p className="mb-6 text-lg leading-relaxed">{t('home.purpose')}</p>

          <h3 className="text-xl font-semibold mt-8 mb-4 text-gray700">{t('home.monitoredData')}</h3>
          <ul className="list-disc pl-8 space-y-2 text-gray600">
            {(t('home.dataList', { returnObjects: true }) as string[]).map((item: string, index: number) => (
              <li key={index} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div id="project-info-section" className="bg-backgroundColor rounded-lg p-8 mt-8 shadow-md">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray700 mb-4">{t('home.projectInfo.title')}</h3>
          <p className="text-lg text-gray600 mb-8 leading-relaxed max-w-2xl mx-auto">
            {t('home.projectInfo.description')}
          </p>
          <Link 
            href="/about" 
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
          >
            <Users className="w-6 h-6" />
            {t('navigation.about')}
          </Link>
          <p className="text-sm text-gray500 mt-4 leading-relaxed">
            {t('home.projectInfo.learnMore')}
          </p>
        </div>
      </div>
      
      <DataSource 
        position="footer"
        textKey="home.dataSource"
        linkKey="home.irristrat"
        linkUrl="https://irristrat.com/new/index.php"
      />
    </div>
  );
}