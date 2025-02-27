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

// Daily data: a record with date keys and daily measurements
interface DailyDataRow {
  air_temp_avg?: string;
  air_temp_min?: string;
  air_temp_max?: string;
  relative_humidity_avg?: string;
  wind_speed_avg?: string;
  solar_radiation_avg?: string;
}

// Hourly data: a record with timestamp keys and hourly measurements (including separate date and hour)
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

// 10‑minute data: a record with timestamp keys and measurements
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

// Map component props
interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
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

// Importação dinâmica do componente de mapa para evitar problemas de SSR
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

  const [stations, setStations] = useState<Station[]>([]);
  const [station, setStation] = useState<Station | null>(null);
  const [stationName, setStationName] = useState<string>("");
  const [stationData, setStationData] = useState<Record<string, DailyDataRow>>({});
  const [hourlyData, setHourlyData] = useState<Record<string, HourlyDataRow>>({});
  const [min10Data, setMin10Data] = useState<Record<string, Min10DataRow>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
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
        setStation(stationFound);
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

      const dailyData = await getStationDailyData(stationID, fromDate, toDate);
      setStationData(dailyData);
      

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
  }, [stationID]);

  const handleMarkerHover = (stationId: string | null) => {
    setHoveredStationId(stationId);
  };

  // Construir URL da imagem com base no ID da estação
  const imageUrl = `/images/${stationID}.png`;

  return (
    <div className="text-darkGray">
      {/* Full-width image header */}
      <div className="w-full mb-6">
        <StationImage
          src={imageUrl}
          alt={`Imagem da estação ${stationName}`}
          width={1200}
          height={600}
          className="w-full max-h-96 object-cover shadow-md rounded-2xl"
        />
      </div>
      
      {/* Title and map section */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Title and links - takes up 2/3 on desktop */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{stationName}</h1>
          
          {/* Navigation links */}
          <div className="mt-4">
            <a href="#daily-data" className="text-blue-600 underline mr-4">
              Dados Diários
            </a>
            <a href="#hourly-data" className="text-blue-600 underline mr-4">
              Dados Horários
            </a>
            <a href="#min10-data" className="text-blue-600 underline">
              Dados a Cada 10 Minutos
            </a>
          </div>
        </div>
        
        {/* Map section - takes up 1/3 on desktop */}
        <div className="h-64 md:col-span-1">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
            {stations.length > 0 ? (
              <MapComponent
                stations={stations}
                selectedStationId={stationID}
                onMarkerHover={handleMarkerHover}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p>A carregar mapa...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content sections */}
      <div className="px-6">
        {loading && <div className="flex justify-center my-8">A carregar...</div>}
        {error && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">{error}</div>}

        {stationData && Object.keys(stationData).length > 0 ? (
          <div id="daily-data" className="overflow-x-auto mb-12">
            <h2 className="text-2xl font-bold mb-4">Dados Diários</h2>
            
            <div className="mb-6 flex flex-wrap items-baseline gap-4 md:gap-8">
              <label>
                Data Inicial:
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="ml-2 border p-1 rounded-lg bg-background"
                />
              </label>
              <label>
                Data Final:
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="ml-2 border p-1 bg-background rounded-lg"
                />
              </label>
              <button
                disabled={loading}
                onClick={fetchStationData}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Obter Dados
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-background border shadow-md rounded-lg mb-8">
                <thead>
                  <tr className="bg-background-100 border-b">
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Temp. Média (°C)</th>
                    <th className="p-3 text-left">Temp. Mínima (°C)</th>
                    <th className="p-3 text-left">Temp. Máxima (°C)</th>
                    <th className="p-3 text-left">Humidade (%)</th>
                    <th className="p-3 text-left">Vento (km/h)</th>
                    <th className="p-3 text-left">Radiação Solar</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stationData).map(([date, data], index) => {
                    const row: DailyDataRow = data;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{date}</td>
                        <td className="p-3">{row.air_temp_avg || "N/A"}</td>
                        <td className="p-3">{row.air_temp_min || "N/A"}</td>
                        <td className="p-3">{row.air_temp_max || "N/A"}</td>
                        <td className="p-3">{row.relative_humidity_avg || "N/A"}</td>
                        <td className="p-3">{row.wind_speed_avg || "N/A"}</td>
                        <td className="p-3">{row.solar_radiation_avg || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div id="daily-data" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Dados Diários</h2>
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                Não existem dados diários para mostrar.
              </div>
            </div>
          )
        )}

        {hourlyData && Object.keys(hourlyData).length > 0 ? (
          <div id="hourly-data" className="overflow-x-auto mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Dados Horários (Últimos 7 dias)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-background border shadow-md rounded-lg mb-8">
                <thead>
                  <tr className="bg-background-100 border-b">
                    <th className="p-3 text-left">Timestamp</th>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Hora</th>
                    <th className="p-3 text-left">Temp. Média (°C)</th>
                    <th className="p-3 text-left">Temp. Mínima (°C)</th>
                    <th className="p-3 text-left">Temp. Máxima (°C)</th>
                    <th className="p-3 text-left">Umidade (%)</th>
                    <th className="p-3 text-left">Vento (km/h)</th>
                    <th className="p-3 text-left">Radiação Solar</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(hourlyData).map(([timestamp, data], index) => {
                    const row: HourlyDataRow = data;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{timestamp}</td>
                        <td className="p-3">{row.date}</td>
                        <td className="p-3">{row.hour}</td>
                        <td className="p-3">{row.air_temp_avg}</td>
                        <td className="p-3">{row.air_temp_min}</td>
                        <td className="p-3">{row.air_temp_max}</td>
                        <td className="p-3">{row.relative_humidity_avg}</td>
                        <td className="p-3">{row.wind_speed_avg}</td>
                        <td className="p-3">{row.solar_radiation_avg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div id="hourly-data" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Dados Horários (Últimos 7 dias)</h2>
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                Não existem dados horários para mostrar.
              </div>
            </div>
          )
        )}

        {min10Data && Object.keys(min10Data).length > 0 ? (
          <div id="min10-data" className="overflow-x-auto mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Dados a cada 10 minutos (Últimas 48 horas)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-background border shadow-md rounded-lg">
                <thead>
                  <tr className="bg-background-100 border-b">
                    <th className="p-3 text-left">Timestamp</th>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Hora</th>
                    <th className="p-3 text-left">Temp. Média (°C)</th>
                    <th className="p-3 text-left">P_em</th>
                    <th className="p-3 text-left">Umidade (%)</th>
                    <th className="p-3 text-left">Vento (km/h)</th>
                    <th className="p-3 text-left">Radiação Solar</th>
                    <th className="p-3 text-left">Leaf Wetness</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(min10Data).map(([timestamp, data], index) => {
                    const row: Min10DataRow = data;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{timestamp}</td>
                        <td className="p-3">{row.date}</td>
                        <td className="p-3">{row.hour}</td>
                        <td className="p-3">{row.air_temp_avg}</td>
                        <td className="p-3">{row.p_em}</td>
                        <td className="p-3">{row.relative_humidity_avg}</td>
                        <td className="p-3">{row.wind_speed_avg}</td>
                        <td className="p-3">{row.solar_radiation_avg}</td>
                        <td className="p-3">{row.leaf_wetness}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div id="min10-data" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Dados a cada 10 minutos (Últimas 48 horas)</h2>
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                Não existem dados de 10 minutos para mostrar.
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}