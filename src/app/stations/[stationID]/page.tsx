"use client";

import { useState, useEffect, useContext, useCallback } from "react";
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

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}
// Define interfaces for the API response data
interface DailyDataRow {
  air_temp_avg?: string;
  air_temp_min?: string;
  air_temp_max?: string;
  relative_humidity_avg?: string;
  wind_speed_avg?: string;
  solar_radiation_avg?: string;
}

interface HourlyDataRow {
  date: string;
  hour: string;
  air_temp_avg: string;
  air_temp_min: string;
  air_temp_max: string;
  relative_humidity_avg: string;
  wind_speed_avg: string;
  solar_radiation_avg: string;
}

interface Min10DataRow {
  date: string;
  hour: string;
  air_temp_avg: string;
  p_em: string;
  relative_humidity_avg: string;
  wind_speed_avg: string;
  solar_radiation_avg: string;
  leaf_wetness: string;
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

  const [stations, setStations] = useState<Station[]>([]);
  const [stationName, setStationName] = useState<string>("");
  const [stationData, setStationData] = useState<Record<string, DailyDataRow>>({});
  const [hourlyData, setHourlyData] = useState<Record<string, HourlyDataRow>>({});
  const [min10Data, setMin10Data] = useState<Record<string, Min10DataRow>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyTemperatureData[]>([]);
  const { sidebarOpen } = useContext(SidebarHeaderContext);

  const fetchStationData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    // Fetch stations list from API route
    const stationsRes = await fetch('/api/stations');
    if (!stationsRes.ok) throw new Error(`Status ${stationsRes.status}`);
    const stationsData: Station[] = await stationsRes.json();
    setStations(stationsData);

    const stationFound: Station | undefined = stationsData.find(
      (station: Station) => station.id === stationID
    );

    if (stationFound) {
      setStationName(stationFound.estacao.slice(7));
    } else {
      setStationName(t('common.unknown'));
    }

    // Fetch daily data from API route
    const dailyRes = await fetch(`/api/stations/${stationID}/daily?from=${fromDate}&to=${toDate}`);
    if (!dailyRes.ok) throw new Error(`Status ${dailyRes.status}`);
    const dailyRaw = await dailyRes.json();
    
    const dailyTransformed: DailyTemperatureData[] = Object.entries(dailyRaw).map(
          ([date, data]) => ({
            date,
            max: Number((data as DailyRawData).air_temp_max ?? 0),
            avg: Number((data as DailyRawData).air_temp_avg ?? 0),
            min: Number((data as DailyRawData).air_temp_min ?? 0),
          })
        );

    setDailyData(dailyTransformed);
    setStationData(dailyRaw);

    // Fetch hourly data from API route
    const hourlyRes = await fetch(`/api/stations/${stationID}/hourly`);
    if (!hourlyRes.ok) throw new Error(`Status ${hourlyRes.status}`);
    const hourly = await hourlyRes.json();
    setHourlyData(hourly);

    // Fetch 10min data from API route
    const min10Res = await fetch(`/api/stations/${stationID}/min10`);
    if (!min10Res.ok) throw new Error(`Status ${min10Res.status}`);
    const min10 = await min10Res.json();
    setMin10Data(min10);
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(t('common.error'));
    }
  } finally {
    setLoading(false);
    setShowLoading(false);
  }
}, [stationID, fromDate, toDate, t]);


  useEffect(() => {
    if (stationID) {
      fetchStationData();
    }
  }, [stationID, fetchStationData]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
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
  }, [loading]);

  useTranslatedPageTitle('title.station', { station: stationName });
  const imageUrl = `/images/${stationID}.png`;

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

          {/* Loading and error states */}
          {showLoading && (
            <div className="flex justify-center my-4 sm:my-8 items-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>{t('common.loading')}</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 mb-4 p-2 sm:p-4 bg-red-50 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Data tables */}
          {activeTab === "daily" && (
            <div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <label className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                    <span className="mb-1 sm:mb-0 sm:mr-2 text-sm">{t('station.dateRange.startDate')}</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border rounded-md p-2 bg-background w-full sm:w-auto"
                    />
                  </label>
                  <label className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                    <span className="mb-1 sm:mb-0 sm:mr-2 text-sm">{t('station.dateRange.endDate')}</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border rounded-md p-2 bg-background w-full sm:w-auto"
                    />
                  </label>
                </div>
              </div>

              {stationData && Object.keys(stationData).length > 0 ? (
                <>
                  {/* Mobile view: Cards */}
                  <div className="block sm:hidden space-y-3 -mx-4 px-4">
                    {Object.entries(stationData)
                      .sort((a, b) => Number(b[0].slice(8)) - Number(a[0].slice(8)))
                      .map(([date, data], index) => {
                        const row: DailyDataRow = data;
                        return (
                          <div key={index} className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
                            <h4 className="font-semibold text-sm text-darkGray mb-3">{date}</h4>
                            <div className="grid grid-cols-2 gap-3 text-[12px]">
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.avgTemp')}</span>
                                <span className="font-medium text-darkGray">{row.air_temp_avg || "N/A"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.minTemp')}</span>
                                <span className="font-medium text-darkGray">{row.air_temp_min || "N/A"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.maxTemp')}</span>
                                <span className="font-medium text-darkGray">{row.air_temp_max || "N/A"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.humidity')}</span>
                                <span className="font-medium text-darkGray">{row.relative_humidity_avg || "N/A"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.wind')}</span>
                                <span className="font-medium text-darkGray">{row.wind_speed_avg || "N/A"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.radiation')}</span>
                                <span className="font-medium text-darkGray">{row.solar_radiation_avg || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Desktop view: Table */}
                  <div className="hidden sm:block overflow-x-auto bg-background rounded-lg shadow">
                    <table className="min-w-full divide-y divide-lightGray">
                      <thead className="bg-gray50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.date')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.avgTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.minTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.maxTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.humidity')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.wind')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.radiation')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-lightGray">
                        {Object.entries(stationData).sort((a, b) => Number(b[0].slice(8)) - Number(a[0].slice(8))).map(([date, data], index) => {
                          const row: DailyDataRow = data;
                          return (
                            <tr key={index} className="hover:bg-gray50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_avg || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_min || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_max || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.relative_humidity_avg || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.wind_speed_avg || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.solar_radiation_avg || "N/A"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                !loading && (
                  <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                    {t('common.noData')}
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === "hourly" && (
            <div>
              <h3 className="text-lg font-medium mb-4">{t('station.hourlyTitle')}</h3>
              {hourlyData && Object.keys(hourlyData).length > 0 ? (
                <>
                  {/* Mobile view: Cards */}
                  <div className="block sm:hidden space-y-3 -mx-4 px-4">
                    {Object.entries(hourlyData)
                      .sort((a, b) => Number(b[1].date.slice(8)) - Number(a[1].date.slice(8)))
                      .map(([, data], index) => {
                        const row: HourlyDataRow = data;
                        return (
                          <div key={index} className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
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
                        );
                      })}
                  </div>
                  
                  {/* Desktop view: Table */}
                  <div className="hidden sm:block overflow-x-auto bg-background rounded-lg shadow">
                    <table className="min-w-full divide-y divide-lightGray">
                      <thead className="bg-gray50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.date')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.hour')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.avgTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.minTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.maxTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.humidity')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.wind')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.radiation')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-lightGray">
                        {Object.entries(hourlyData).sort((a, b) => Number(b[1].date.slice(8)) - Number(a[1].date.slice(8))).map(([, data], index) => {
                          const row: HourlyDataRow = data;
                          return (
                            <tr key={index} className="hover:bg-gray50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.hour}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_min}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_max}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.relative_humidity_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.wind_speed_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.solar_radiation_avg}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                !loading && (
                  <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                    {t('common.noData')}
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === "min10" && (
            <div>
              <h3 className="text-lg font-medium mb-4">{t('station.min10Title')}</h3>
              {min10Data && Object.keys(min10Data).length > 0 ? (
                <>
                  {/* Mobile view: Cards */}
                  <div className="block sm:hidden space-y-3 -mx-4 px-4">
                    {Object.entries(min10Data)
                      .sort((a, b) => Number(b[1].date.slice(8)) - Number(a[1].date.slice(8)))
                      .map(([, data], index) => {
                        const row: Min10DataRow = data;
                        return (
                          <div key={index} className="bg-background rounded-xl shadow-sm p-4 border border-gray200">
                            <h4 className="font-semibold text-sm text-darkGray mb-3">{row.date} - {row.hour}</h4>
                            <div className="grid grid-cols-2 gap-3 text-[12px]">
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.avgTemp')}</span>
                                <span className="font-medium text-darkGray">{row.air_temp_avg}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.p_em')}</span>
                                <span className="font-medium text-darkGray">{row.p_em}</span>
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
                              <div className="flex flex-col">
                                <span className="text-gray600 mb-1">{t('station.table.leaf')}</span>
                                <span className="font-medium text-darkGray">{row.leaf_wetness}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Desktop view: Table */}
                  <div className="hidden sm:block overflow-x-auto bg-background rounded-lg shadow">
                    <table className="min-w-full divide-y divide-lightGray">
                      <thead className="bg-gray50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.date')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.hour')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.avgTemp')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.p_em')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.humidity')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.wind')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.radiation')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider">{t('station.table.leaf')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-lightGray">
                        {Object.entries(min10Data).sort((a, b) => Number(b[1].date.slice(8)) - Number(a[1].date.slice(8))).map(([, data], index) => {
                          const row: Min10DataRow = data;
                          return (
                            <tr key={index} className="hover:bg-gray50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.hour}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.air_temp_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.p_em}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.relative_humidity_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.wind_speed_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.solar_radiation_avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{row.leaf_wetness}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                !loading && (
                  <div className="bg-background p-4 sm:p-8 rounded-lg border text-center shadow text-sm">
                    {t('common.noData')}
                  </div>
                )
              )}
            </div>
          )}
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