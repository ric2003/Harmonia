"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import StationImage from "@/components/StationImage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { useTranslation } from 'react-i18next';
import DataSourceFooter from "@/components/DataSourceFooter";
import { useStations, useStationDailyData, useStationHourlyData, useStation10MinData } from "@/hooks/useStations";
import { DataTable } from "@/components/ui/DataTable";

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
  onStationSelect: (stationId: string | null) => void;
  showMenu: boolean | null;
}

interface DailyTemperatureData {
  date: string;
  avg: number;
  min: number;
  max: number;
}

interface DailyRawData {
  air_temp_avg?: string | number;
  air_temp_min?: string | number;
  air_temp_max?: string | number;
}

// Dynamic import of map component to avoid SSR issues
const MapComponent = dynamic<MapComponentProps>(
  () => import("@/components/MapComponent"),
  { ssr: false }
);

export default function StationDetailsPage() {
  const params = useParams() as { stationID: string };
  const { t } = useTranslation();

  function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  const today = new Date();
  const defaultToDate = formatDate(today);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const defaultFromDate = formatDate(sevenDaysAgo);

  const [stationID] = useState(params.stationID);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [activeTab, setActiveTab] = useState("daily");

  // Use React Query hooks instead of direct fetching
  const { data: stations = [], isLoading: stationsLoading, error: stationsError } = useStations();
  const { data: dailyDataRaw, isLoading: dailyLoading, error: dailyError } = useStationDailyData(stationID, fromDate, toDate);
  const { data: hourlyData = {}, isLoading: hourlyLoading, error: hourlyError } = useStationHourlyData(stationID);
  const { data: min10Data = {}, isLoading: min10Loading, error: min10Error } = useStation10MinData(stationID);
  
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  
  // Calculate derived state
  const stationName = stations.find(s => s.id === stationID)?.estacao.slice(7) || t('common.unknown');
  
  // Transform daily data for the chart
  const dailyData: DailyTemperatureData[] = dailyDataRaw 
    ? Object.entries(dailyDataRaw).map(([date, data]) => ({
        date,
        max: Number((data as DailyRawData).air_temp_max ?? 0),
        avg: Number((data as DailyRawData).air_temp_avg ?? 0),
        min: Number((data as DailyRawData).air_temp_min ?? 0),
      }))
    : [];
  
  // Loading state
  const isLoading = stationsLoading || dailyLoading || hourlyLoading || min10Loading;
  
  // Error handling
  const anyError = stationsError || dailyError || hourlyError || min10Error;
  
  // Show loading state after a delay
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowLoading(true);
      }, 500);
    } else {
      setShowLoading(false);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  useTranslatedPageTitle('title.station', { station: stationName });
  const imageUrl = `/images/${stationID}.png`;

  const [dailyCurrentPage, setDailyCurrentPage] = useState(1);
  const [hourlyCurrentPage, setHourlyCurrentPage] = useState(1);
  const [min10CurrentPage, setMin10CurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Handle pagination for different tabs
  const handleDailyPageChange = useCallback((page: number) => {
    setDailyCurrentPage(page);
  }, []);
  
  const handleHourlyPageChange = useCallback((page: number) => {
    setHourlyCurrentPage(page);
  }, []);
  
  const handleMin10PageChange = useCallback((page: number) => {
    setMin10CurrentPage(page);
  }, []);
  
  // Transform daily data for DataTable
  const dailyTableData = useMemo(() => {
    if (!dailyDataRaw) return [];
    
    return Object.entries(dailyDataRaw)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => Number(b.date.slice(8)) - Number(a.date.slice(8)));
  }, [dailyDataRaw]);
  
  // Transform hourly data for DataTable
  const hourlyTableData = useMemo(() => {
    if (!hourlyData || Object.keys(hourlyData).length === 0) return [];
    
    return Object.values(hourlyData)
      .sort((a, b) => Number(b.date.slice(8)) - Number(a.date.slice(8)));
  }, [hourlyData]);
  
  // Transform 10min data for DataTable
  const min10TableData = useMemo(() => {
    if (!min10Data || Object.keys(min10Data).length === 0) return [];
    
    return Object.values(min10Data)
      .sort((a, b) => Number(b.date.slice(8)) - Number(a.date.slice(8)));
  }, [min10Data]);

  return (
    <div className="text-darkGray min-h-screen">
      {/* Hero section with image and overlay */}
      <div className="relative w-full h-48 sm:h-72 md:h-96">
        <StationImage
          src={imageUrl}
          alt={t('station.imageAlt', { station: stationName })}
          width={1200}
          height={600}
          className="w-full h-full object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl">
          <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-10">{stationName}</h1>
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 -mt-8 sm:-mt-16 relative">
        <div className="bg-backgroundColor rounded-xl shadow-lg p-4 sm:p-6">
          {/* Station info and map grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
            {/* Temperature trend graph */}
            <div className="lg:col-span-2 bg-background p-4 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold">{t('station.dailyTemperatureTrend')}</h2>
                <a className="text-blue-500 text-sm" href={`/stations/${stationID}/graphs`}>{t('station.viewMoreGraphs')}</a>
              </div>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={dailyData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const [year, month, day] = date.split('-');
                        return `${day}-${month}-${year.slice(2)}`;
                      }}
                      style={{ fontSize: '10px' }}
                    />
                    <YAxis style={{ fontSize: '10px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend style={{ fontSize: '10px' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
                    <Line type="monotone" dataKey="max" stroke="#ff7300" name={t('station.chart.maximum')} />
                    <Line type="monotone" dataKey="avg" stroke="#8884d8" name={t('station.chart.average')} />
                    <Line type="monotone" dataKey="min" stroke="#82ca9d" name={t('station.chart.minimum')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Map section */}
            <div className="bg-background p-4 rounded-xl shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('station.location')}</h2>
              <div className="h-48 sm:h-72 rounded-lg overflow-hidden shadow-md">
                {stations.length > 0 ? (
                  <MapComponent
                    key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
                    stations={stations}
                    selectedStationId={stationID}
                    onMarkerHover={() => {}}
                    onStationSelect={() => {}}
                    showMenu={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gray200 flex items-center justify-center text-darkGray">
                    <p>{t('station.loadingMap')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="border-b mb-4 sm:mb-6 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 min-w-max">
              <button
                onClick={() => setActiveTab("daily")}
                className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                  activeTab === "daily"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray600 hover:text-gray700 hover:border-gray300"
                }`}
              >
                {t('station.tabs.daily')}
              </button>
              <button
                onClick={() => setActiveTab("hourly")}
                className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                  activeTab === "hourly"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray600 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t('station.tabs.hourly')}
              </button>
              <button
                onClick={() => setActiveTab("min10")}
                className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                  activeTab === "min10"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray600 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t('station.tabs.min10')}
              </button>
            </nav>
          </div>

          {/* Error state */}
          {anyError && (
            <div className="text-red-600 mb-4 p-2 sm:p-4 bg-red-50 rounded-lg border border-red-200 text-sm">
              {anyError instanceof Error ? anyError.message : t('common.error')}
            </div>
          )}

          {/* Render tab content based on active tab */}
          <div
            className={`${
              activeTab === "daily" ? "block" : "hidden"
            } flex-1 overflow-auto`}
          >
            <div className="bg-backgroundColor p-4 rounded-xl shadow-md">
              {/* Date selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 pb-4 border-b border-lightGray">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray600">{t('station.dateRange.startDate')}</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-lightGray rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background text-darkGray"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray600">{t('station.dateRange.endDate')}</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={formatDate(new Date())}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-lightGray rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background text-darkGray"
                  />
                </div>
              </div>

              {/* Loading indicator below date selector */}
              {showLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-darkGray py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-t-primary rounded-full"></div>
                  {t('common.loading')}...
                </div>
              )}

              {dailyDataRaw && Object.keys(dailyDataRaw).length > 0 ? (
                <DataTable
                  data={dailyTableData}
                  currentPage={dailyCurrentPage}
                  onPageChange={handleDailyPageChange}
                  rowsPerPage={rowsPerPage}
                  columns={[
                    {
                      key: 'date',
                      header: t('station.table.date'),
                    },
                    {
                      key: 'air_temp_avg',
                      header: t('station.table.avgTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'air_temp_min',
                      header: t('station.table.minTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'air_temp_max',
                      header: t('station.table.maxTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'relative_humidity_avg',
                      header: t('station.table.humidity'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'wind_speed_avg',
                      header: t('station.table.wind'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'solar_radiation_avg',
                      header: t('station.table.radiation'),
                      render: (value: unknown) => String(value || "N/A")
                    }
                  ]}
                  mobileCardRenderer={(item) => (
                    <div className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
                      <h4 className="font-semibold text-sm text-darkGray mb-3">{item.date}</h4>
                      <div className="grid grid-cols-2 gap-3 text-[12px]">
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.avgTemp')}</span>
                          <span className="font-medium text-darkGray">{item.air_temp_avg || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.minTemp')}</span>
                          <span className="font-medium text-darkGray">{item.air_temp_min || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.maxTemp')}</span>
                          <span className="font-medium text-darkGray">{item.air_temp_max || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.humidity')}</span>
                          <span className="font-medium text-darkGray">{item.relative_humidity_avg || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.wind')}</span>
                          <span className="font-medium text-darkGray">{item.wind_speed_avg || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.radiation')}</span>
                          <span className="font-medium text-darkGray">{item.solar_radiation_avg || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                />
              ) : (
                !isLoading && (
                  <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                    {t('common.noData')}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Hourly Data Tab */}
          <div
            className={`${
              activeTab === "hourly" ? "block" : "hidden"
            } flex-1 overflow-auto`}
          >
            <div className="bg-backgroundColor p-4 rounded-xl shadow-md">

              {hourlyData && Object.keys(hourlyData).length > 0 ? (
                <DataTable
                  data={hourlyTableData}
                  currentPage={hourlyCurrentPage}
                  onPageChange={handleHourlyPageChange}
                  rowsPerPage={rowsPerPage}
                  columns={[
                    {
                      key: 'date',
                      header: t('station.table.date')
                    },
                    {
                      key: 'hour',
                      header: t('station.table.hour')
                    },
                    {
                      key: 'air_temp_avg',
                      header: t('station.table.avgTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'air_temp_min',
                      header: t('station.table.minTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'air_temp_max',
                      header: t('station.table.maxTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'relative_humidity_avg',
                      header: t('station.table.humidity'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'wind_speed_avg',
                      header: t('station.table.wind'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'solar_radiation_avg',
                      header: t('station.table.radiation'),
                      render: (value: unknown) => String(value || "N/A")
                    }
                  ]}
                  mobileCardRenderer={(row) => (
                    <div className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
                      <h4 className="font-semibold text-sm text-darkGray mb-3">{row.date} - {row.hour}</h4>
                      <div className="grid grid-cols-2 gap-3 text-[12px]">
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.avgTemp')}</span>
                          <span className="font-medium text-darkGray">{row.air_temp_avg}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.minTemp')}</span>
                          <span className="font-medium text-darkGray">{row.air_temp_min}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.maxTemp')}</span>
                          <span className="font-medium text-darkGray">{row.air_temp_max}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.humidity')}</span>
                          <span className="font-medium text-darkGray">{row.relative_humidity_avg}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.wind')}</span>
                          <span className="font-medium text-darkGray">{row.wind_speed_avg}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.radiation')}</span>
                          <span className="font-medium text-darkGray">{row.solar_radiation_avg}</span>
                        </div>
                      </div>
                    </div>
                  )}
                />
              ) : (
                !isLoading && (
                  <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                    {t('common.noData')}
                  </div>
                )
              )}
            </div>
          </div>

          {/* 10-Minute Data Tab */}
          <div
            className={`${
              activeTab === "min10" ? "block" : "hidden"
            } flex-1 overflow-auto`}
          >
            <div className="bg-backgroundColor p-4 rounded-xl shadow-md">
              {min10Data && Object.keys(min10Data).length > 0 ? (
                <DataTable
                  data={min10TableData}
                  currentPage={min10CurrentPage}
                  onPageChange={handleMin10PageChange}
                  rowsPerPage={rowsPerPage}
                  columns={[
                    {
                      key: 'date',
                      header: t('station.table.date')
                    },
                    {
                      key: 'hour',
                      header: t('station.table.hour')
                    },
                    {
                      key: 'air_temp_avg',
                      header: t('station.table.avgTemp'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'relative_humidity_avg',
                      header: t('station.table.humidity'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'wind_speed_avg',
                      header: t('station.table.wind'),
                      render: (value: unknown) => String(value || "N/A")
                    },
                    {
                      key: 'solar_radiation_avg',
                      header: t('station.table.radiation'),
                      render: (value: unknown) => String(value || "N/A")
                    }
                  ]}
                  mobileCardRenderer={(row) => (
                    <div className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
                      <h4 className="font-semibold text-sm text-darkGray mb-3">{row.date} - {row.hour}</h4>
                      <div className="grid grid-cols-2 gap-3 text-[12px]">
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.avgTemp')}</span>
                          <span className="font-medium text-darkGray">{row.air_temp_avg}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.humidity')}</span>
                          <span className="font-medium text-darkGray">{row.relative_humidity_avg}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.wind')}</span>
                          <span className="font-medium text-darkGray">{row.wind_speed_avg}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray600 mb-1">{t('station.table.radiation')}</span>
                          <span className="font-medium text-darkGray">{row.solar_radiation_avg}</span>
                        </div>
                    
                      </div>
                    </div>
                  )}
                />
              ) : (
                !isLoading && (
                  <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                    {t('common.noData')}
                  </div>
                )
              )}
            </div>
          </div>
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