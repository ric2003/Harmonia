"use client";
import Link from "next/link";
import Image, { ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { getStations, Station } from "@/services/api";

// Componente customizado para tratar fallback de imagem
interface StationImageProps extends ImageProps {
  fallbackSrc?: string;
}

function StationImage({ fallbackSrc = "/images/default.png", ...props }: StationImageProps) {
  const [src, setSrc] = useState(props.src);

  return (
    <Image
      {...props}
      src={src as string} // assegurando que seja string
      onError={() => setSrc(fallbackSrc)}
    />
  );
}

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
              <Link href={`/stations/${station.id}`}>
                <li
                  key={station.id}
                  className="p-4 border rounded-lg shadow h-full w-full cursor-pointer"
                >
                  <div
                    className="mb-4 w-full flex justify-center"
                  >
                    <StationImage
                      src={imageUrl}
                      alt={`Miniatura da ${station.estacao}`}
                      width={200}
                      height={150}
                      className="rounded w-full aspect-video"
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