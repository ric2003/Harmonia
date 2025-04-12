"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getStations,
  getStationDailyData,
  getStationHourlyData,
  getStation10MinData,
  Station,
} from "@/services/api";
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
  shoeMenu: boolean | null;
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
const MapComponent = dynamic<MapComponentProps>(() => import("@/components/MapComponent"));

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
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyTemperatureData[]>([]);
  const { sidebarOpen } = useContext(SidebarHeaderContext);

  const fetchStationData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stationsData = await getStations();
      setStations(stationsData);

      const stationFound: Station | undefined = stationsData.find(
        (station: Station) => station.id === stationID
      );

      if (stationFound) {
        setStationName(stationFound.estacao.slice(7));
      } else {
        setStationName(t('common.unknown'));
      }
      const dailyRaw = await getStationDailyData(stationID, fromDate, toDate);
      const dailyTransformed: DailyTemperatureData[] = Object.entries(dailyRaw).map(
        ([date, data]: [string, DailyRawData]) => ({
          date,
          max: Number(data.air_temp_max ?? 0),
          avg: Number(data.air_temp_avg ?? 0),
          min: Number(data.air_temp_min ?? 0),
        })
      );

      setDailyData(dailyTransformed);
      setStationData(dailyRaw);

      const hourly = await getStationHourlyData(stationID);
      setHourlyData(hourly);

      const min10 = await getStation10MinData(stationID);
      setMin10Data(min10);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  }, [stationID, fromDate, toDate, t]);

  useEffect(() => {
    if (stationID) {
      fetchStationData();
    }
  }, [stationID, fetchStationData]);


  useTranslatedPageTitle('title.station', { station: stationName });
  const imageUrl = `/images/${stationID}.png`;

  return (
    <div className="text-darkGray min-h-screen">
      {/* Hero section with image and overlay */}
      <div className="relative w-full h-72 md:h-96">
        <StationImage
          src={imageUrl}
          alt={t('station.imageAlt', { station: stationName })}
          width={1200}
          height={600}
          className="w-full h-full object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl">
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-10">{stationName}</h1>
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative">
        <div className="bg-backgroundColor rounded-xl shadow-lg p-6">
          {/* Station info and map grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Temperature trend graph */}
            <div className="lg:col-span-2 bg-background p-4 rounded-lg shadow-sm">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-semibold mb-4">{t('station.dailyTemperatureTrend')}</h2>
                <a className="text-blue-500" href={`/stations/${stationID}/graphs`}>{t('station.viewMoreGraphs')}</a>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
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
                  <Legend style={{ fontSize: '12px' }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
                  <Line type="monotone" dataKey="max" stroke="#ff7300" name={t('station.chart.maximum')} />
                  <Line type="monotone" dataKey="avg" stroke="#8884d8" name={t('station.chart.average')} />
                  <Line type="monotone" dataKey="min" stroke="#82ca9d" name={t('station.chart.minimum')} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Map section */}
            <div className="bg-background p-4 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{t('station.location')}</h2>
              <div className="h-72 rounded-lg overflow-hidden shadow-md">
                {stations.length > 0 ? (
                  <MapComponent
                    key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
                    stations={stations}
                    selectedStationId={stationID}
                    onMarkerHover={() => {}}
                    onStationSelect={() => {}}
                    shoeMenu={false}
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
          <div className="border-b mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("daily")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "daily"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray600 hover:text-gray700 hover:border-gray300"
                }`}
              >
                {t('station.tabs.daily')}
              </button>
              <button
                onClick={() => setActiveTab("hourly")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "hourly"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray600 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t('station.tabs.hourly')}
              </button>
              <button
                onClick={() => setActiveTab("min10")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
          {loading && (
            <div className="flex justify-center my-8 items-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>{t('common.loading')}</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Data tables */}
          {activeTab === "daily" && (
            <div>
              <div className="flex flex-wrap items-center mb-6 gap-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <span className="mr-2">{t('station.dateRange.startDate')}</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border rounded-md p-2 bg-background"
                    />
                  </label>
                  <label className="flex items-center">
                    <span className="mr-2">{t('station.dateRange.endDate')}</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border rounded-md p-2 bg-background"
                    />
                  </label>
                </div>
                <button
                  disabled={loading}
                  onClick={fetchStationData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {t('common.getDataButton')}
                </button>
              </div>

              {stationData && Object.keys(stationData).length > 0 ? (
                <div className="overflow-x-auto bg-background rounded-lg shadow">
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
                            <td className="px-6 py-4 whitespace-nowrap">{date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_avg || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_min || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_max || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.relative_humidity_avg || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.wind_speed_avg || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.solar_radiation_avg || "N/A"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loading && (
                  <div className="bg-background p-8 rounded-lg border text-center shadow">
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
                <div className="overflow-x-auto bg-background rounded-lg shadow">
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
                            <td className="px-6 py-4 whitespace-nowrap">{row.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.hour}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_avg}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_min}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_max}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.relative_humidity_avg}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.wind_speed_avg}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.solar_radiation_avg}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loading && (
                  <div className="bg-background p-8 rounded-lg border text-center shadow">
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
                <div className="overflow-x-auto bg-background rounded-lg shadow">
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
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-lightGray">
                      {Object.entries(min10Data).sort((a, b) => Number(b[1].date.slice(8)) - Number(a[1].date.slice(8))).map(([, data], index) => {
                        const row: Min10DataRow = data;
                        return (
                          <tr key={index} className="hover:bg-gray50">
                            <td className="px-6 py-4 whitespace-nowrap">{row.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.hour}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.air_temp_avg}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.p_em}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.relative_humidity_avg}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.wind_speed_avg}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{row.solar_radiation_avg}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loading && (
                  <div className="bg-background p-8 rounded-lg border text-center shadow">
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