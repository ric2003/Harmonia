"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStations, Station } from "@/services/api";
import StationImage from "@/components/StationImage";

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
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
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
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="p-4 border rounded-lg shadow h-full w-full animate-pulse">
              <div className="mb-4 w-full">
                <div className="bg-gray-200 rounded w-full aspect-video"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-4">
          {stations.map((station) => {
            const imageUrl = `/images/${station.id}.png`;
            return (
              <Link href={`/stations/${station.id}`} key={station.id}>
                <li className="p-4 border rounded-lg shadow h-full w-full cursor-pointer">
                  <div className="mb-4 w-full flex justify-center">
                    <StationImage
                      src={imageUrl}
                      width={600}
                      height={400}
                      className="rounded w-full aspect-video"
                      alt={`${station.estacao} thumbnail`}
                      fallbackSrc="/images/default.png"
                    />
                  </div>
                  <h2 className="text-xl font-semibold">{station.estacao}</h2>
                  <p className="text-greySubText">{station.loc}</p>
                  <p className="text-sm">
                    Lat: {station.lat}, Lon: {station.lon}
                  </p>
                </li>
              </Link>
            );
          })}
        </ul>
      )}
    </div>
  );
}