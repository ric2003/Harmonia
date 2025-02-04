"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getStations,
  getStationDailyData,
  getStationHourlyData,
  getStation10MinData,
  Station,
} from "@/services/api";

export default function StationDetailsPage() {
  const params = useParams() as { stationID: string };

  function formatDate(date: Date) {
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

  const [stationName, setStationName] = useState<string>("");
  const [stationData, setStationData] = useState<any>({});
  const [hourlyData, setHourlyData] = useState<any>({});
  const [min10Data, setMin10Data] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStationData() {
    setLoading(true);
    setError(null);
    try {
      // Get station list and find the current station by its id.
      const stationsData = await getStations();
      const stationFound: Station | undefined = stationsData.find(
        (station: Station) => station.id === stationID
      );
      if (stationFound) {
        // Slice the station name from the 7th character onward if desired.
        setStationName(stationFound.estacao.slice(7));
      } else {
        setStationName("Desconhecida");
      }

      // Get daily data (Option 2)
      const dailyData = await getStationDailyData(stationID, fromDate, toDate);
      setStationData(dailyData);

      // Get hourly data (Option 3)
      const hourly = await getStationHourlyData(stationID);
      setHourlyData(hourly);

      // Get 10-minute data (Option 4)
      const min10 = await getStation10MinData(stationID);
      setMin10Data(min10);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (stationID) {
      fetchStationData();
    }
  }, [stationID]);

  return (
    <div className="p-6 text-darkGray">
      <h1 className="text-3xl font-bold mb-4">{stationName}</h1>

      {/* Navigation links */}
      <div className="mb-6">
        <a href="#daily-data" className="text-blue-600 underline mr-4">
          Dados Diários
        </a>
        <a href="#hourly-data" className="text-blue-600 underline mr-4">
          Dados Horários(Últimos 7 Dias)
        </a>
        <a href="#min10-data" className="text-blue-600 underline">
        Dados a Cada 10 Minutos(Últimas 24 Horas)
        </a>
      </div>

      {loading && <div>A carregar...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Daily Data Table */}
      {stationData && Object.keys(stationData).length > 0 ? (
        <div id="daily-data" className="overflow-x-auto mb-8">
          <h2 className="text-2xl font-bold mb-4">Dados Diários</h2>
          
          <div className="mb-6 flex items-baseline gap-8">
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
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Obter Dados
            </button>
          </div>

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
                const row = data as {
                  air_temp_avg?: string;
                  air_temp_min?: string;
                  air_temp_max?: string;
                  relative_humidity_avg?: string;
                  wind_speed_avg?: string;
                  solar_radiation_avg?: string;
                };
                return (
                  <tr key={index} className="border-b">
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
      ) : (
        !loading && (
          <div className="mt-4">
            Não existem dados diários para mostrar.
          </div>
        )
      )}

      {/* Hourly Data Table */}
      {hourlyData && Object.keys(hourlyData).length > 0 ? (
        <div id="hourly-data" className="overflow-x-auto mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Dados Horários (Últimos 7 dias)
          </h2>
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
                const row = data as {
                  date: string;
                  hour: string;
                  air_temp_avg: string;
                  air_temp_min: string;
                  air_temp_max: string;
                  relative_humidity_avg: string;
                  wind_speed_avg: string;
                  solar_radiation_avg: string;
                };
                return (
                  <tr key={index} className="border-b">
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
      ) : (
        !loading && (
          <div className="mt-4">
            Não existem dados horários para mostrar.
          </div>
        )
      )}

      {/* 10-Minute Data Table */}
      {min10Data && Object.keys(min10Data).length > 0 ? (
        <div id="min10-data" className="overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">
            Dados a cada 10 minutos (Últimas 48 horas)
          </h2>
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
                const row = data as {
                  date: string;
                  hour: string;
                  air_temp_avg: string;
                  p_em: string;
                  relative_humidity_avg: string;
                  wind_speed_avg: string;
                  solar_radiation_avg: string;
                  leaf_wetness: string;
                };
                return (
                  <tr key={index} className="border-b">
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
      ) : (
        !loading && (
          <div className="mt-4">
            Não existem dados de 10 minutos para mostrar.
          </div>
        )
      )}
    </div>
  );
}
