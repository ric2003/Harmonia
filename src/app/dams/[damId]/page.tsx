"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDamData } from "@/hooks/useDamData";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { useTranslation } from 'react-i18next';
import dynamic from "next/dynamic";
import { useDamLocation, useMultipleDamLocations } from "@/hooks/useDamLocations";
import WaterWave from "@/components/WaterWave";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Brush,
} from "recharts";
import { DataTable } from "@/components/ui/DataTable";
import DataSource from "@/components/DataSource";

// Import the map component dynamically to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray100 flex items-center justify-center">
      <div className="text-sm text-gray600">Loading map...</div>
    </div>
  ),
});

function getTooltipPosition(percent: number): string {
  if (percent > 50)
    return "top-0";
  return "-top-6";
}

const getBadgeGradient = (percent: number): string => {
  if (percent > 70)
    return "bg-gradient-to-r from-green-500 to-green-400";
  if (percent > 40)
    return "bg-gradient-to-r from-yellow-500 to-yellow-400";
  if (percent > 20)
    return "bg-gradient-to-r from-orange-500 to-orange-400";
  return "bg-gradient-to-r from-red-500 to-red-400";
};


// Define station interface for MapComponent
interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

export default function DamDetailsPage() {
  const params = useParams() as { damId: string };
  const router = useRouter();
  const { t } = useTranslation();
  const { data: damDataResponse, isLoading: dataLoading, error: dataError } = useDamData();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Get the dam ID from the URL params and decode it
  const damId = decodeURIComponent(params.damId);
  
  // Filter data for the current dam
  const damData = useMemo(() => {
    if (!damDataResponse?.data) return [];
    
    return damDataResponse.data
      .filter(item => item.barragem === damId)
      .sort((a, b) => {
        if (!a._time || !b._time) return 0;
        return new Date(b._time).getTime() - new Date(a._time).getTime();
      });
  }, [damDataResponse, damId]);

  // Get all unique dam IDs
  const allDamIds = useMemo(() => {
    if (!damDataResponse?.data) return [];
    
    // Extract unique dam IDs
    const uniqueDams = new Set<string>();
    damDataResponse.data.forEach(item => {
      if (item.barragem) {
        uniqueDams.add(item.barragem);
      }
    });
    
    return Array.from(uniqueDams);
  }, [damDataResponse]);

  // Get the latest dam data for display
  const latestDamData = useMemo(() => {
    return damData.length > 0 ? damData[0] : null;
  }, [damData]);

  // Prepare data for the trend graph - grouped by year
  const trendData = useMemo(() => {
    if (damData.length === 0) return [];
    
    // Group data by year
    const yearGroups: { [year: string]: typeof damData } = {};
    
    damData.forEach(item => {
      if (item._time) {
        const year = new Date(item._time).getFullYear().toString();
        if (!yearGroups[year]) {
          yearGroups[year] = [];
        }
        yearGroups[year].push(item);
      }
    });
    
    // Calculate averages for each year
    return Object.entries(yearGroups)
      .map(([year, items]) => {
        const validEnchimento = items.filter(item => item.enchimento && item.enchimento > 0);
        const validCotaLida = items.filter(item => item.cota_lida && item.cota_lida > 0);
        const validVolumeTotal = items.filter(item => item.volume_total && item.volume_total > 0);
        const validVolumeUtil = items.filter(item => item.volume_util && item.volume_util > 0);
        
        return {
          date: year,
          enchimento: validEnchimento.length > 0 
            ? Math.round((validEnchimento.reduce((sum, item) => sum + (item.enchimento || 0), 0) / validEnchimento.length) * 100)
            : 0,
          cota_lida: validCotaLida.length > 0 
            ? validCotaLida.reduce((sum, item) => sum + (item.cota_lida || 0), 0) / validCotaLida.length
            : 0,
          volume_total: validVolumeTotal.length > 0 
            ? validVolumeTotal.reduce((sum, item) => sum + (item.volume_total || 0), 0) / validVolumeTotal.length
            : 0,
          volume_util: validVolumeUtil.length > 0 
            ? validVolumeUtil.reduce((sum, item) => sum + (item.volume_util || 0), 0) / validVolumeUtil.length
            : 0,
        };
      })
      .sort((a, b) => parseInt(a.date) - parseInt(b.date)); // Sort by year
  }, [damData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (damData.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const enchimentoValues = damData
      .map(item => item.enchimento || 0)
      .filter(val => val > 0);
    
    const min = Math.min(...enchimentoValues) * 100;
    const max = Math.max(...enchimentoValues) * 100;
    const avg = enchimentoValues.reduce((sum, val) => sum + val, 0) / enchimentoValues.length * 100;
    
    return {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      avg: parseFloat(avg.toFixed(2))
    };
  }, [damData]);

  // Use the new location hooks
  const { location: damLocation, isLoading: singleLocationLoading } = useDamLocation(damId);
  
  // Limit to 20 dams for all locations
  const damsToFetch = useMemo(() => allDamIds.slice(0, 20), [allDamIds]);
  const { locations: allLocations, isLoading: allLocationsLoading } = useMultipleDamLocations(damsToFetch);

  // Convert all dam locations to stations format for MapComponent
  const allDamStations = useMemo(() => {
    const stations: Station[] = [];
    
    // First add the current dam if we have its location
    if (damLocation) {
      stations.push({
        id: damId,
        estacao: damId,
        loc: damLocation.formatted,
        lat: damLocation.lat,
        lon: damLocation.lon
      });
    }
    
    // Then add other dams with valid locations
    Object.entries(allLocations).forEach(([id, location]) => {
      // Avoid duplicating the current dam
      if (id !== damId) {
        stations.push({
          id,
          estacao: id,
          loc: location.formatted,
          lat: location.lat,
          lon: location.lon
        });
      }
    });
    
    return stations;
  }, [allLocations, damLocation, damId]);

  // Update page title
  useTranslatedPageTitle('title.dam', { dam: damId });

  // Get fill level color class based on percentage
  const getFillColorClass = useCallback((percentage: number) => {
    if (percentage > 70) return 'bg-green-500';
    if (percentage > 40) return 'bg-yellow-500';
    if (percentage > 20) return 'bg-orange-500';
    return 'bg-red-500';
  }, []);

  // Empty marker hover handler
  const handleMarkerHover = useCallback(() => {
    // No-op function
  }, []);
  
  // Navigate to the selected dam's details page
  const handleDamSelect = useCallback((selectedDamId: string | null) => {
    if (selectedDamId) {
      router.push(`/dams/${encodeURIComponent(selectedDamId)}`);
    }
  }, [router]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to the table when page changes
    document.getElementById('historical-data')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Loading and error states
  const isLoading = dataLoading || (singleLocationLoading && allLocationsLoading);
  const locationLoading = singleLocationLoading || allLocationsLoading;

  if (isLoading) return <LoadingSpinner />;
  if (dataError) return <AlertMessage type="error" message={dataError instanceof Error ? dataError.message : "An error occurred"} />;
  if (!damData || damData.length === 0) 
    return <AlertMessage type="warning" message={`No data available for dam "${damId}". Please check connection or try again later.`} />;

  const fillPercentage = latestDamData?.enchimento ? Math.min(latestDamData.enchimento * 100, 100) : 0;

  return (
    <div className="min-h-screen">
      <DataSource 
        introTextKey="dam.damDetailIntro"
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
      {/* Hero section with water wave visualization */}
      <div className="glass-card relative w-full h-48 sm:h-72 md:h-96 rounded-xl overflow-hidden mb-8">
        {/* Using WaterWave component */}
        <WaterWave 
          fillPercentage={fillPercentage} 
          showBadge={false}
          className="h-full"
        />
        
        {/* Dam name and fill percentage overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/10 to-transparent">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            {damId}
          </h1>
          <div className="flex items-center">
            <div
              className={`
                ${getBadgeGradient(fillPercentage)}
                text-white px-3 py-1.5 rounded-lg
                text-lg font-medium
              `}
            >
              {fillPercentage.toFixed(0)}%
            </div>
            <div className="ml-4 text-white text-opacity-90 text-sm">
              {t("dam.lastUpdated")}:{" "}
              {latestDamData?._time
                ? new Date(latestDamData._time).toLocaleDateString("en-GB")
                : "N/A"}
            </div>
          </div>
        </div>

      </div>

      {/* Main content container */}
      <div className="glass-card p-4 sm:p-6 mb-8">
        {/* Dam info and data grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Left column: graph and map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Fill level trend graph */}
            <div className="glass-card-visible p-4 rounded-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray700 mb-4">{t('dam.fillLevelTrend')}</h2>
              <div className="glass-card p-4 rounded-xl">
                <div className="h-[250px] sm:h-[300px] relative z-50">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={trendData}
                      margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorEnchimento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        label={{ 
                          value: 'Year', 
                          angle: 0, 
                          position: 'insideBottom',
                          style: { textAnchor: 'middle', fontSize: '10px', fill: '#374151', transform: 'translateY(2px)' }
                        }}
                        style={{ fontSize: '12px', fill: '#374151', fontWeight: 'bold' }}
                      />
                      <YAxis 
                        style={{ fontSize: '12px', fill: '#374151', fontWeight: 'bold' }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-400)" />
                      <Area 
                        type="monotone" 
                        dataKey="enchimento" 
                        stroke="var(--primary)" 
                        fillOpacity={1} 
                        fill="url(#colorEnchimento)" 
                        name={t('dam.table.enchimento')}
                      />
                      <Tooltip />
                      <Brush 
                        dataKey="date" 
                        height={30}
                        startIndex={0}
                        stroke="var(--primary)"
                        fill="var(--background)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Map */}
            <div className="glass-card-visible p-4 rounded-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray700 mb-4">{t('dam.location')}</h2>
              {allDamStations.length > 0 ? (
                <div>
                  <div className="h-[250px] sm:h-[300px] relative rounded-lg overflow-hidden border border-gray700/20">
                    <MapComponent
                      stations={allDamStations}
                      selectedStationId={damId}
                      onMarkerHover={handleMarkerHover}
                      onStationSelect={handleDamSelect}
                      showMenu={false}
                    />
                  </div>
                  {locationLoading && (
                    <p className="text-xs text-gray700 mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse mr-1"></span>
                      {t('common.loading')}
                    </p>
                  )}
                </div>
              ) : locationLoading ? (
                <div className="flex justify-center py-12 h-[250px]">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <p className="text-gray700 text-sm py-12 text-center">
                  {t('dam.locationNotFound')}
                </p>
              )}
            </div>
          </div>

          {/* Stats summary */}
          <div className="glass-card-visible p-4 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-gray700 mb-4">{t('dam.currentStatus')}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Current values */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray700 mb-2">{t('dam.currentValues')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray700">{t('dam.table.cotaLida')}:</span>
                    <span className="font-medium text-gray700">{latestDamData?.cota_lida?.toFixed(2) + "m"|| 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray700">{t('dam.table.volumeTotal')}:</span>
                    <span className="font-medium text-gray700">{latestDamData?.volume_total?.toFixed(2) + "hm³" || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray700">{t('dam.table.volumeUtil')}:</span>
                    <span className="font-medium text-gray700">{latestDamData?.volume_util?.toFixed(2) + "hm³"|| 'N/A'}</span>
                  </div>
                
                </div>
              </div>
              
              {/* Statistics */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray700 mb-2">{t('dam.fillStatistics')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray700">{t('dam.minFill')}:</span>
                    <span className="font-medium text-gray700">{stats.min.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray700">{t('dam.avgFill')}:</span>
                    <span className="font-medium text-gray700">{stats.avg.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray700">{t('dam.maxFill')}:</span>
                    <span className="font-medium text-gray700">{stats.max.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            
              
              {/* Important levels */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray700 mb-2">{t('dam.table.enchimento')}</h3>
                
                <div className="relative h-80 mt-2 bg-gray100 rounded overflow-hidden">
                  {/* Current level indicator */}
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black z-10" 
                    style={{ 
                      bottom: `${Math.max(0.1, Math.min(99.3, latestDamData?.enchimento ? latestDamData.enchimento * 100 : 0))}%` 
                    }}>
                    <div className={`absolute ${getTooltipPosition(latestDamData?.enchimento ? latestDamData.enchimento * 100 : 0)} left-2 bg-black px-2 py-1 text-white text-xs rounded`}>
                      {latestDamData?.enchimento ? (latestDamData.enchimento * 100).toFixed(0) + '%' : '0%'}
                    </div>
                  </div>
                  
                  {/* Level bands */}
                  <div className="absolute inset-x-0 bottom-0 h-[20%] bg-red-500 bg-opacity-30"></div>
                  <div className="absolute inset-x-0 bottom-[20%] h-[20%] bg-orange-500 bg-opacity-30"></div>
                  <div className="absolute inset-x-0 bottom-[40%] h-[30%] bg-yellow-500 bg-opacity-30"></div>
                  <div className="absolute inset-x-0 bottom-[70%] h-[30%] bg-green-500 bg-opacity-30"></div>
                  
                  {/* Level labels */}
                  <div className="absolute right-1 bottom-[5%] text-xs text-gray700">{t('dam.critical')}</div>
                  <div className="absolute right-1 bottom-[25%] text-xs text-gray700">{t('dam.low')}</div>
                  <div className="absolute right-1 bottom-[55%] text-xs text-gray700">{t('dam.medium')}</div>
                  <div className="absolute right-1 bottom-[85%] text-xs text-gray700">{t('dam.high')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Data Table */}
        <div id="historical-data">
          <h3 className="text-lg font-medium text-gray700 mb-4">{t('dam.historicalData')}</h3>
          
          {damData.length > 0 ? (
            <DataTable
              data={damData}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              columns={[
                {
                  key: '_time',
                  header: t('dam.table.date'),
                  render: (value: unknown) => value ? new Date(value as string | number | Date).toLocaleDateString('en-GB') : 'N/A'
                },
                {
                  key: 'cota_lida',
                  header: t('dam.table.cotaLida'),
                  render: (value: unknown) => (value as number)?.toFixed(2) + ' m' || 'N/A'
                },
                {
                  key: 'enchimento',
                  header: t('dam.table.enchimento'),
                  render: (value: unknown) => (
                    <div className="flex items-center">
                      <span className="mr-2">{value ? ((value as number) * 100).toFixed(0) + '%' : 'N/A'}</span>
                      <div className="w-16 bg-gray200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${value ? getFillColorClass((value as number) * 100) : 'bg-gray400'}`} 
                          style={{ width: `${value ? (value as number) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  key: 'volume_total',
                  header: t('dam.table.volumeTotal'),
                  render: (value: unknown) => (value as number)?.toFixed(2) + ' hm³' || 'N/A'
                },
                {
                  key: 'volume_util',
                  header: t('dam.table.volumeUtil'),
                  render: (value: unknown) => (value as number)?.toFixed(2) + ' hm³' || 'N/A'
                }
              ]}
              mobileCardRenderer={(item) => (
                <div key={item._time} className="glass-card p-4 border border-gray700/20">
                  <h4 className="font-semibold text-sm text-gray700 mb-3">
                    {item._time ? new Date(item._time).toLocaleDateString('en-GB') : 'N/A'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div className="flex flex-col">
                      <span className="text-gray700 font-bold mb-1">{t('dam.table.cotaLida')}</span>
                      <span className="font-medium text-gray700">{item.cota_lida?.toFixed(2) + ' m'|| 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray700 font-bold mb-1">{t('dam.table.enchimento')}</span>
                      <span className="font-medium text-gray700">{item.enchimento ? (item.enchimento * 100).toFixed(2) + '%' : 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray700 font-bold mb-1">{t('dam.table.volumeTotal')}</span>
                      <span className="font-medium text-gray700">{item.volume_total?.toFixed(2) + ' hm³' || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray700 font-bold mb-1">{t('dam.table.volumeUtil')}</span>
                      <span className="font-medium text-gray700">{item.volume_util?.toFixed(2) + ' hm³' || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="glass-card-visible p-4 sm:p-8 rounded-lg text-center">
              <p className="text-gray700">{t('common.noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 