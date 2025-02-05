"use client";

import { useState, useEffect } from "react";
import {
  getStations,
  getStation10MinData,
  Station,
  Station10MinRecord,
} from "@/services/api";

interface LatestStationWeather {
  station: Station;
  latestReading: Station10MinRecord | null;
}

export default function HomePage() {
  const [latestWeather, setLatestWeather] = useState<LatestStationWeather[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeatherForStations() {
      try {
        const stations = await getStations();
        //opção 4 para ir buscar info mais recent
        const weatherPromises = stations.map(async (station) => {
          try {
            const data = await getStation10MinData(station.id);
            const timestamps = Object.keys(data);
            if (timestamps.length > 0) {
              // ordenar a datas pela mais recent
              const latestTimestamp = timestamps.sort().reverse()[0];
              const latestReading = data[latestTimestamp] as Station10MinRecord;
              return { station, latestReading };
            } else {
              return { station, latestReading: null };
            }
          } catch (err) {
            return { station, latestReading: null };
          }
        });

        const weatherResults = await Promise.all(weatherPromises);
        setLatestWeather(weatherResults);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeatherForStations();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-darkGray">
        <p>Loading latest weather...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
<div className="p-6 pt-0">
      <h1 className="text-3xl font-bold mb-6 text-primary">Meteorologia Atual</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestWeather.map(({ station, latestReading }) => (
          <div
            key={station.id}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white flex items-center"
          >
            {/* Icon Section */}
            <div className="mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m8-9h1M4 12H3m15.364-6.364l.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 110 14 7 7 0 010-14z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{station.estacao.slice(7)}</h2>
              {latestReading ? (
                <div className="mt-2">
                  <p className="text-lg">
                    <span className="font-semibold">Temp:</span>{" "}
                    {latestReading.air_temp_avg}°C
                  </p>
                  <p className="text-lg">
                    <span className="font-semibold">Wind:</span>{" "}
                    {latestReading.wind_speed_avg} km/h
                  </p>
                  <p className="text-lg">
                    <span className="font-semibold">Humidity:</span>{" "}
                    {latestReading.relative_humidity_avg}%
                  </p>
                </div>
              ) : (
                <p className="mt-2">No recent data.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
