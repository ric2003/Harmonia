"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDamData } from "@/hooks/useDamData";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSourceFooter from "@/components/DataSourceFooter";
import { useTranslation } from 'react-i18next';
import dynamic from "next/dynamic";
import { useDamLocation, useMultipleDamLocations } from "@/hooks/useDamLocations";
import WaterWave from "@/components/WaterWave";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { DataTable } from "@/components/ui/DataTable";

// Import the map component dynamically to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray100 flex items-center justify-center">
      <div className="text-sm text-gray600">Loading map...</div>
    </div>
  ),
});

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

  // Prepare data for the trend graph
  const trendData = useMemo(() => {
    return damData
      .slice()
      .reverse()
      .map(item => ({
        date: item._time ? new Date(item._time).toLocaleDateString('en-GB') : '',
        enchimento: item.enchimento ? Math.round(item.enchimento * 100) : 0,
        cota_lida: item.cota_lida || 0,
        volume_total: item.volume_total || 0,
        volume_util: item.volume_util || 0,
      }))
      .filter(item => item.date); // Filter out items without a date
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
    <div className="text-darkGray min-h-screen">
      {/* Hero section with water wave visualization */}
      <div className="relative w-full h-48 sm:h-72 md:h-96 rounded-xl overflow-hidden mb-8">
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
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-backgroundColor rounded-xl shadow-lg p-4 sm:p-6">
          {/* Dam info and data grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
            {/* Left column: graph and map */}
            <div className="lg:col-span-2 space-y-4">
              {/* Fill level trend graph */}
              <div className="bg-background p-4 rounded-lg shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dam.fillLevelTrend')}</h2>
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={trendData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorEnchimento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis 
                        style={{ fontSize: '10px' }}
                        domain={[0, 100]}
                        label={{ 
                          value: '%', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fontSize: '10px' }
                        }}
                      />
                      <Tooltip />
                      <Legend style={{ fontSize: '10px' }} />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
                      <Area 
                        type="monotone" 
                        dataKey="enchimento" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorEnchimento)" 
                        name={t('dam.table.enchimento')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Map */}
              <div className="bg-background p-4 rounded-lg shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dam.location')}</h2>
                {allDamStations.length > 0 ? (
                  <div>
                    <div className="h-[250px] sm:h-[300px] relative rounded-lg overflow-hidden">
                      <MapComponent
                        stations={allDamStations}
                        selectedStationId={damId}
                        onMarkerHover={handleMarkerHover}
                        onStationSelect={handleDamSelect}
                        showMenu={false}
                      />
                    </div>
                    <p className="text-xs text-gray600 mt-2">{t('dam.clickMapToNavigate')}</p>
                    {locationLoading && (
                      <p className="text-xs text-gray600 mt-1">
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
                  <p className="text-gray600 text-sm py-12 text-center">
                    {t('dam.locationNotFound')}
                  </p>
                )}
              </div>
            </div>

            {/* Stats summary */}
            <div className="bg-background p-4 rounded-lg shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dam.currentStatus')}</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Current values */}
                <div className="bg-backgroundColor p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-gray600 mb-2">{t('dam.currentValues')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray600">{t('dam.table.cotaLida')}:</span>
                      <span className="font-medium">{latestDamData?.cota_lida?.toFixed(2) + "m"|| 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray600">{t('dam.table.volumeTotal')}:</span>
                      <span className="font-medium">{latestDamData?.volume_total?.toFixed(2) + "hm³" || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray600">{t('dam.table.volumeUtil')}:</span>
                      <span className="font-medium">{latestDamData?.volume_util?.toFixed(2) + "hm³"|| 'N/A'}</span>
                    </div>
                  
                  </div>
                </div>
                
                {/* Statistics */}
                <div className="bg-backgroundColor p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-gray600 mb-2">{t('dam.fillStatistics')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray600">{t('dam.minFill')}:</span>
                      <span className="font-medium">{stats.min.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray600">{t('dam.avgFill')}:</span>
                      <span className="font-medium">{stats.avg.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray600">{t('dam.maxFill')}:</span>
                      <span className="font-medium">{stats.max.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                
                
                {/* Important levels */}
                <div className="bg-backgroundColor p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray600 mb-2">{t('dam.table.enchimento')}</h3>
                  
                  <div className="relative h-72 mt-2 bg-gray100 rounded overflow-hidden">
                    {/* Current level indicator */}
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black z-10" 
                      style={{ bottom: `${latestDamData?.enchimento ? latestDamData.enchimento * 100 : 0}%` }}>
                      <div className="absolute -top-0 -left-0 bg-black px-1 text-white text-xs">
                        {latestDamData?.enchimento ? (latestDamData.enchimento * 100).toFixed(0) + '%' : '0%'}
                      </div>
                    </div>
                    
                    {/* Level bands */}
                    <div className="absolute inset-x-0 bottom-0 h-[20%] bg-red-500 bg-opacity-30"></div>
                    <div className="absolute inset-x-0 bottom-[20%] h-[20%] bg-orange-500 bg-opacity-30"></div>
                    <div className="absolute inset-x-0 bottom-[40%] h-[30%] bg-yellow-500 bg-opacity-30"></div>
                    <div className="absolute inset-x-0 bottom-[70%] h-[30%] bg-green-500 bg-opacity-30"></div>
                    
                    {/* Level labels */}
                    <div className="absolute right-1 bottom-[5%] text-xs text-gray600">{t('dam.critical')}</div>
                    <div className="absolute right-1 bottom-[25%] text-xs text-gray600">{t('dam.low')}</div>
                    <div className="absolute right-1 bottom-[55%] text-xs text-gray600">{t('dam.medium')}</div>
                    <div className="absolute right-1 bottom-[85%] text-xs text-gray600">{t('dam.high')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Data Table */}
          <div id="historical-data">
            <h3 className="text-lg font-medium mb-4">{t('dam.historicalData')}</h3>
            
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
                  <div key={item._time} className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
                    <h4 className="font-semibold text-sm text-darkGray mb-3">
                      {item._time ? new Date(item._time).toLocaleDateString('en-GB') : 'N/A'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                      <div className="flex flex-col">
                        <span className="text-gray600 mb-1">{t('dam.table.cotaLida')}</span>
                        <span className="font-medium text-darkGray">{item.cota_lida?.toFixed(2) + ' m'|| 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray600 mb-1">{t('dam.table.enchimento')}</span>
                        <span className="font-medium text-darkGray">{item.enchimento ? (item.enchimento * 100).toFixed(2) + '%' : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray600 mb-1">{t('dam.table.volumeTotal')}</span>
                        <span className="font-medium text-darkGray">{item.volume_total?.toFixed(2) + ' hm³' || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray600 mb-1">{t('dam.table.volumeUtil')}</span>
                        <span className="font-medium text-darkGray">{item.volume_util?.toFixed(2) + ' hm³' || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                {t('common.noData')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <DataSourceFooter 
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
    </div>
  );
} 