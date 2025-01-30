"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
const tokenAPI = process.env.NEXT_PUBLIC_IRRISTRAT_TOKEN;

export default function StationsPage() {
  // TODO: Set useStates types
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true); 

  async function getResponse() {
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
    const data = await response.json();
    
    setStations(Object.values(data)); // Convert object to array
    setLoading(false); // Set loading to false after fetching data
  }

  useEffect(() => {
    getResponse();
  }, []);

  return (
    <div className="text-darkGray">
      {loading ? (
        <p>Loading stations...</p>
      ) : (
        <ul className="grid grid-cols-3 gap-4">
          {stations.map((station: any) => (
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
  