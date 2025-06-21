"use client";

import { useState, useCallback, useContext } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import dynamic from "next/dynamic";
import {AlertMessage} from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from "@/components/ScrollIndicator";
import { useStations } from "@/hooks/useStations";
import Link from "next/link";
import {MapPin, Dam, Satellite, Building, Map, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

// Definição dos tipos das props do MapComponent
interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
  onStationSelect: (stationId: string | null) => void;
  showMenu: boolean | null;
}

const MapComponent = dynamic<MapComponentProps>(
  () => import("@/components/MapComponent"),
  { ssr: false }
);

export default function HomePage() {
  const { data: stations = [], isLoading, error: fetchError } = useStations();
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  const { t } = useTranslation();
  const router = useRouter();
  
  useTranslatedPageTitle('navigation.home');

  // Handle station hover - only set selected station
  const handleStationHover = useCallback((stationId: string | null) => {
    setSelectedStation(stationId);
  }, []);

  // Handle station selection with navigation
  const handleStationSelect = useCallback((stationId: string | null) => {
    if (stationId) {
      // Navigate to station details page
      router.push(`/stations/${stationId}`);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* First container - Map and title with glass loading */}
        <div className="glass-card p-6">
          <div className="h-8 bg-white/20 dark:bg-white/10 rounded w-1/3 animate-pulse mb-4"></div>
          <div className="h-[55vh] bg-white/20 dark:bg-white/10 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Second container - Information section with glass loading */}
        <div className="glass-panel p-8">
          <div className="h-6 bg-white/20 dark:bg-white/10 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-4 bg-white/20 dark:bg-white/10 rounded w-3/4 mb-3 animate-pulse"></div>
          <div className="h-4 bg-white/20 dark:bg-white/10 rounded w-2/3 mb-3 animate-pulse"></div>
          <div className="h-6 bg-white/20 dark:bg-white/10 rounded w-1/3 mt-6 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-white/20 dark:bg-white/10 rounded w-3/4 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (fetchError) return <AlertMessage type="error" message={(fetchError as Error).message} />;

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>
        <div className="relative z-10">
          {/* Header with enhanced styling */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                {t('home.title')}
              </h1>
            </div>
          
            <div className="lg:hidden mt-3 sm:mt-0">
              <select
                name="stations"
                id="select-stations"
                className="pl-4 pr-10 py-2 rounded-lg bg-background text-darkGray border border-gray400 focus:outline-none focus:ring-1 focus:ring-primary"
                onChange={(e) => {
                  handleStationHover(e.target.value || null);
                }}
                value={selectedStation || ""}
              >
                <option value="">{t('home.selectStation')}</option>
                {stations.map((station) => {
                  return (
                    <option key={station.id} value={station.id}>
                      {station.estacao.slice(7)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Map container with enhanced glass border */}
          <div className="relative rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-sm">
            <div className="h-[55vh] w-full">
              <MapComponent
                key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
                stations={stations}
                selectedStationId={selectedStation}
                onMarkerHover={handleStationHover}
                onStationSelect={handleStationSelect}
                showMenu={true}
              />
            </div>
            {/* Map overlay with station count */}
            <div className="absolute top-4 left-4 glass-frosted px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-darkGray dark:text-gray300">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{stations.length} stations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollIndicator targetId="intro-section" text={t('home.scrollForInfo')} />

      {/* Introduction Section with Glass Cards */}
      <div id="intro-section" className="glass-card p-8">
        <div className="max-w-4xl mx-auto">
          {/* Main intro text */}
          <div className="text-center mb-12">
            <p className="text-lg leading-relaxed text-gray600 dark:text-gray400 mb-6">
              {t('home.intro')}
            </p>
            <p className="text-lg leading-relaxed text-gray600 dark:text-gray400">
              {t('home.purpose')}
            </p>
          </div>

          {/* Data Types Grid */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-gray700 dark:text-gray300 text-center">
              {t('home.monitoredData')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Weather Data Card */}
              <div className="glass-card p-6 text-center group hover:glass-medium">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray700 dark:text-gray300 mb-2">{t('home.dataTypes.weatherData.title')}</h4>
                <p className="text-sm text-gray600 dark:text-gray400">{t('home.dataTypes.weatherData.description')}</p>
              </div>

              {/* Dam Levels Card */}
              <div className="glass-card p-6 text-center group hover:glass-medium">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Dam className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray700 dark:text-gray300 mb-2">{t('home.dataTypes.damLevels.title')}</h4>
                <p className="text-sm text-gray600 dark:text-gray400">{t('home.dataTypes.damLevels.description')}</p>
              </div>

              {/* Satellite Data Card */}
              <div className="glass-card p-6 text-center group hover:glass-medium">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Satellite className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray700 dark:text-gray300 mb-2">{t('home.dataTypes.satelliteImages.title')}</h4>
                <p className="text-sm text-gray600 dark:text-gray400">{t('home.dataTypes.satelliteImages.description')}</p>
              </div>

              {/* Predictions Card */}
              <div className="glass-card p-6 text-center group hover:glass-medium">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray700 dark:text-gray300 mb-2">{t('home.dataTypes.predictions.title')}</h4>
                <p className="text-sm text-gray600 dark:text-gray400">{t('home.dataTypes.predictions.description')}</p>
              </div>
            </div>
          </div>

          {/* Detailed Data List */}
          <div className="glass-card rounded-2xl p-6">
            <h4 className="font-semibold text-gray700 dark:text-gray300 mb-4">Complete Data Coverage:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(t('home.dataList', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-3 text-gray600 dark:text-gray400">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                  <span className="text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full flex justify-center">
        <Link 
          href="/about" 
          className="inline-flex items-center gap-3 glass-normal hover:glass-heavy text-primary px-8 py-4 mt-6 rounded-xl font-bold text-md shadow-lg hover:shadow-xl hover:scale-105 border border-primary"
        >
          <Info className="w-5 h-5" />
          {t('navigation.learnMore')}
        </Link>
        </div>
      </div>
    </div>
  );
}