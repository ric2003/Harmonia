"use client";

import { useState, useEffect } from "react";
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
} from "recharts";
import CustomTooltip from "@/components/ui/CustomTooltip";

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
  onMarkerHover: ((stationId: string | null) => void) | null;
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
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-black">
        <p>A carregar mapa...</p>
      </div>
    ),
  }
);

export default function StationDetailsPage() {
  const params = useParams() as { stationID: string };

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

  async function fetchStationData() {
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
        setStationName("Desconhecida");
      }
      const dailyRaw = await getStationDailyData(stationID, fromDate, toDate);
      const dailyTransformed: DailyTemperatureData[] = Object.entries(dailyRaw).map(
        ([date, data]: [string, DailyRawData]) => ({
          date,
          avg: Number(data.air_temp_avg ?? 0),
          min: Number(data.air_temp_min ?? 0),
          max: Number(data.air_temp_max ?? 0),
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
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (stationID) {
      fetchStationData();
    }
  }, [stationID, fetchStationData]);

  const imageUrl = `/images/${stationID}.png`;

  return (
    <div className="text-darkGray min-h-screen">
      {/* Hero section with image and overlay */}
      <div className="relative w-full h-72 md:h-96">
        <StationImage
          src={imageUrl}
          alt={`Imagem da estação ${stationName}`}
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
              <h2 className="text-xl font-semibold mb-4">Tendência Diária da Temperatura</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="avg" stroke="#8884d8" name="Média" />
                  <Line type="monotone" dataKey="min" stroke="#82ca9d" name="Mínima" />
                  <Line type="monotone" dataKey="max" stroke="#ff7300" name="Máxima" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Map section */}
            <div className="bg-background p-4 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Localização</h2>
              <div className="h-72 rounded-lg overflow-hidden shadow-md">
                {stations.length > 0 ? (
                  <MapComponent
                    stations={stations}
                    selectedStationId={stationID}
                    onMarkerHover={null}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <p>A carregar mapa...</p>
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
                    : "border-transparent text-greySubText hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dados Diários
              </button>
              <button 
                onClick={() => setActiveTab("hourly")} 
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "hourly" 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-greySubText hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dados Horários
              </button>
              <button 
                onClick={() => setActiveTab("min10")} 
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "min10" 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-greySubText hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dados a Cada 10 Minutos
              </button>
            </nav>
          </div>

          {/* Loading and error states */}
          {loading && (
            <div className="flex justify-center my-8 items-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>A carregar...</span>
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
                    <span className="mr-2">Data Inicial:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border rounded-md p-2 bg-background"
                    />
                  </label>
                  <label className="flex items-center">
                    <span className="mr-2">Data Final:</span>
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
                  Obter Dados
                </button>
              </div>

              {stationData && Object.keys(stationData).length > 0 ? (
                <div className="overflow-x-auto bg-background rounded-lg shadow">
                  <table className="min-w-full divide-y divide-lightGray">
                    <thead className="bg-gray50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Média (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Mínima (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Máxima (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Humidade (%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Vento (km/h)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Radiação Solar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-lightGray">
                      {Object.entries(stationData).map(([date, data], index) => {
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
                    Não existem dados diários para mostrar.
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === "hourly" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Dados Horários (Últimos 7 dias)</h3>
              {hourlyData && Object.keys(hourlyData).length > 0 ? (
                <div className="overflow-x-auto bg-background rounded-lg shadow">
                  <table className="min-w-full divide-y divide-lightGray">
                    <thead className="bg-gray50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Média (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Mínima (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Máxima (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Umidade (%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Vento (km/h)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Radiação Solar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-lightGray">
                      {Object.entries(hourlyData).map(([, data], index) => {
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
                    Não existem dados horários para mostrar.
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === "min10" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Dados a cada 10 minutos (Últimas 48 horas)</h3>
              {min10Data && Object.keys(min10Data).length > 0 ? (
                <div className="overflow-x-auto bg-background rounded-lg shadow">
                  <table className="min-w-full divide-y divide-lightGray">
                    <thead className="bg-gray50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Temp. Média (°C)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">P_em</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Umidade (%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Vento (km/h)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-greySubText uppercase tracking-wider">Radiação Solar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-lightGray">
                      {Object.entries(min10Data).map(([, data], index) => {
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
                    Não existem dados de 10 minutos para mostrar.
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}