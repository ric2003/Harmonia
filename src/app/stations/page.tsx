"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const tokenAPI = process.env.NEXT_PUBLIC_IRRISTRAT_TOKEN;

// Definição do tipo para as estações meteorológicas, todo feito
interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function getResponse() {
    try {
      const response = await fetch("https://irristrat.com/ws/clients/meteoStations.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenAPI,
          option: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      setStations(Object.values(data) as Station[]); // Converte para array e define o tipo
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAPI) {
      getResponse();
    } else {
      setError("Token de API não definido.");
      setLoading(false);
    }
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
            <li key={station.id} className="p-4 border rounded-lg shadow h-full w-full">
              <h2 className="text-xl font-semibold">{station.estacao}</h2>
              <p className="text-greySubText">{station.loc}</p>
              <p className="text-sm">Lat: {station.lat}, Lon: {station.lon}</p>
              <Link href={`/station/${station.id}`} className="text-blue-600 underline">
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
