"use client";
import Link from "next/link";
import Image, { ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
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
        <p>Loading stations...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-4">
          {stations.map((station) => {
            // Monta a URL da imagem usando o ID (ou outro atributo) da estação
            const imageUrl = `/images/${station.id}.png`;
            return (
              <Link href={`/stations/${station.id}`} key={station.id}>
                <li
                  className="p-4 border rounded-lg shadow h-full w-full cursor-pointer"
                >
                  <div
                    className="mb-4 w-full flex justify-center"
                  >
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