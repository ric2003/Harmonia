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
  CartesianGrid,
} from "recharts";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslation } from 'react-i18next';
import DataSourceFooter from "@/components/DataSourceFooter";

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
  const { t } = useTranslation();

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
          setStationName(t('common.unknown'));
        }

        // Fetch daily data and transform it
        const dailyRaw = await getStationDailyData(stationID, fromDate, toDate);
        const dailyTransformed: DailyTemperatureData[] = Object.entries(dailyRaw).map(
          ([date, data]: [string, DailyRawData]) => ({
            date,
            max: Number(data.air_temp_max ?? 0),
            avg: Number(data.air_temp_avg ?? 0),
            min: Number(data.air_temp_min ?? 0),
          })
        );

        // Fetch hourly data and transform it
        const hourlyRaw = await getStationHourlyData(stationID);
        const hourlyTransformed: HourlyData[] = Object.entries(hourlyRaw)
          .sort(([dateA, dataA], [dateB, dataB]) => {
            // First compare by date
            const dateComparison = dateA.localeCompare(dateB);
            if (dateComparison !== 0) {
              return dateComparison;
            }
            // If dates are equal, compare by hour
            return Number(dataA.hour.slice(0, 2)) - Number(dataB.hour.slice(0, 2));
          })
          .map(([timestamp, data]: [string, HourlyRawData]) => ({
            timestamp,
            temp: Number(data.air_temp_avg ?? 0),
            windSpeed: Number(data.wind_speed_avg ?? 0),
            humidity: Number(data.relative_humidity_avg ?? 0),
          }));

        setDailyData(dailyTransformed);
        setHourlyData(hourlyTransformed);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [stationID, fromDate, toDate, t]);
  useTranslatedPageTitle('station.graphs.title', { station: stationName });

  if (loading) return <LoadingSpinner message={t('station.graphs.loading')}/>;
  if (error) return <AlertMessage type="error" message={error} />;
  if (stationName === t('common.unknown')){
    return <AlertMessage type="error" message={t('station.graphs.stationIdError')} />;
  }

  return (
    <div className="p-6 text-darkGray">

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold mb-4">{t('station.dailyTemperatureTrend')}</h2>
          <a href={`/stations/${stationID}`} className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors">
            <span className="text-lg">←</span>
            {t('station.backToStation')}
          </a>
        </div>
        <ResponsiveContainer width="100%" height={300} className="bg-background">
          <LineChart data={dailyData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
            <Line type="monotone" dataKey="max" stroke="#ff7300" name={t('station.chart.maximum')} />
            <Line type="monotone" dataKey="avg" stroke="#8884d8" name={t('station.chart.average')} />
            <Line type="monotone" dataKey="min" stroke="#82ca9d" name={t('station.chart.minimum')} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('station.graphs.hourlyTemperature')}</h2>
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
            <Line type="monotone" dataKey="temp" stroke="#8884d8" name={t('station.chart.temperature')} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('station.graphs.hourlyWindSpeed')}</h2>
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
            <Line
              type="monotone"
              dataKey="windSpeed"
              stroke="#82ca9d"
              name={t('station.chart.windSpeed')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('station.graphs.hourlyHumidity')}</h2>
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
            <Line type="monotone" dataKey="humidity" stroke="#ff7300" name={t('station.chart.humidity')} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <DataSourceFooter 
        textKey="home.dataSource"
        linkKey="home.irristrat"
        linkUrl="https://irristrat.com/new/index.php"
      />
    </div>
  );
}
