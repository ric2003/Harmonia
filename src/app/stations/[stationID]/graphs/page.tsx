"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getStationDailyData,
  getStationHourlyData,
  Station,
  getStations,
} from "@/services/api";
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
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import {LoadingSpinner} from "@/components/ui/LoadingSpinner";
import {AlertMessage} from "@/components/ui/AlertMessage";

interface DailyTemperatureData {
  date: string;
  avg: number;
  min: number;
  max: number;
}

interface HourlyData {
  timestamp: string;
  temp: number;
  windSpeed: number;
  humidity: number;
}

// Update the raw data interfaces to have optional properties.
interface DailyRawData {
  air_temp_avg?: string | number;
  air_temp_min?: string | number;
  air_temp_max?: string | number;
}

interface HourlyRawData {
  air_temp_avg?: string | number;
  wind_speed_avg?: string | number;
  relative_humidity_avg?: string | number;
}

export default function StationGraphsPage() {
  const params = useParams() as { stationID: string };
  const stationID = params.stationID;

  const [stationName, setStationName] = useState<string>("");
  const [dailyData, setDailyData] = useState<DailyTemperatureData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const toDate = today.toISOString().split("T")[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString().split("T")[0];

  useEffect(() => {
    async function fetchData() {
      try {
        // Get the station name
        const stationsData = await getStations();
        const stationFound: Station | undefined = stationsData.find(
          (station: Station) => station.id === stationID
        );
        if (stationFound) {
          setStationName(stationFound.estacao.slice(7));
        } else {
          setStationName("Desconhecida");
        }

        // Fetch daily data and transform it
        const dailyRaw = await getStationDailyData(stationID, fromDate, toDate);
        const dailyTransformed: DailyTemperatureData[] = Object.entries(dailyRaw).map(
          ([date, data]: [string, DailyRawData]) => ({
            date,
            avg: Number(data.air_temp_avg ?? 0),
            min: Number(data.air_temp_min ?? 0),
            max: Number(data.air_temp_max ?? 0),
          })
        );

        // Fetch hourly data and transform it
        const hourlyRaw = await getStationHourlyData(stationID);
        const hourlyTransformed: HourlyData[] = Object.entries(hourlyRaw).map(
          ([timestamp, data]: [string, HourlyRawData]) => ({
            timestamp,
            temp: Number(data.air_temp_avg ?? 0),
            windSpeed: Number(data.wind_speed_avg ?? 0),
            humidity: Number(data.relative_humidity_avg ?? 0),
          })
        );

        setDailyData(dailyTransformed);
        setHourlyData(hourlyTransformed);
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

    fetchData();
  }, [stationID, fromDate, toDate]);
  const title = stationName === "Desconhecida" ? '' : `Gráficos de ${stationName}`;
  useSetPageTitle(title);

  if (loading) return <LoadingSpinner message="A carregar os dados dos gráficos"/>;
  if (error) return <AlertMessage type="error" message={error} />;
  if (stationName === "Desconhecida"){
    return <AlertMessage type="error" message={"erro de id da estacao"} />;
  }

  return (
    <div className="p-6 text-darkGray">
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold mb-4">Tendência Diária da Temperatura</h2>
          <a href={`/stations/${stationID}`} className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors">
            <span className="text-lg">←</span>
            Voltar à estação
          </a>
        </div>
        <ResponsiveContainer width="100%" height={300} className="bg-background">
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

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Variação Horária da Temperatura</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) =>
                value.slice(11, 13) + "h (" + value.slice(0, 10) + ")"
              }
              tick={{ fontSize: 10 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="temp" stroke="#8884d8" name="Temperatura" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Variação Horária da Velocidade do Vento</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) =>
                value.slice(11, 13) + "h (" + value.slice(0, 10) + ")"
              }
              tick={{ fontSize: 10 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="windSpeed"
              stroke="#82ca9d"
              name="Velocidade do Vento"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Variação Horária da Humidade</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) =>
                value.slice(11, 13) + "h (" + value.slice(0, 10) + ")"
              }
              tick={{ fontSize: 10 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="humidity" stroke="#ff7300" name="Humidade" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
