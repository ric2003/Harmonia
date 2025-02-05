"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStations, Station } from "@/services/api";

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStations() {
    setLoading(true);
    setError(null);
    try {
      const stationsData = await getStations();
      setStations(stationsData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStations();
  }, []);

  return (
    <div className="text-darkGray">
      {loading ? (
        <p>Loading stations...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-4">
          {stations.map((station) => (
            <li
              key={station.id}
              className="p-4 border rounded-lg shadow h-full w-full"
            >
              <h2 className="text-xl font-semibold">{station.estacao}</h2>
              <p className="text-greySubText">{station.loc}</p>
              <p className="text-sm">
                Lat: {station.lat}, Lon: {station.lon}
              </p>
              <Link href={`/stations/${station.id}`} className="text-blue-600 underline">
                View Details
              </Link>
              <Link href={`/stations/${station.id}/graphs`} className="text-blue-600 underline m-4">
                Ver Gráficos
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
