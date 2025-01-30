"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
const tokenAPI = process.env.NEXT_PUBLIC_IRRISTRAT_TOKEN;

interface StationData {
  [date: string]: {
    air_temp_avg?: string;
    air_temp_min?: string;
    air_temp_max?: string;
    relative_humidity_avg?: string;
    wind_speed_avg?: string;
    solar_radiation_avg?: string;
  };
}

export default function StationDetailsPage() {
  const params = useParams() as { stationID: string };

  function formatDate(date: Date) {
    // Converte para YYYY-MM-DD
    return date.toISOString().split("T")[0];
  }

  const today = new Date();
  const defaultToDate = formatDate(today);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const defaultFromDate = formatDate(sevenDaysAgo);

  const [stationID, setStationID] = useState(params.stationID); 
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [stationName, setStationName] = useState<string>("");
  const [stationData, setStationData] = useState<StationData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStationData() {
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar o nome da estação
      const stationsResponse = await fetch("https://irristrat.com/ws/clients/meteoStations.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: tokenAPI || "",
          option: "1",
        }).toString(),
      });
      const stationsData = await stationsResponse.json();

      // Verifica se a estação existe no objeto retornado
      if (stationsData[stationID]) {
        setStationName(stationsData[stationID].estacao.slice(7));
      } else {
        setStationName("Desconhecida");
      }

      // 2. Buscar dados meteorológicos diários da estação
      const formData = new URLSearchParams();
      formData.append("token", tokenAPI || "");
      formData.append("option", "2");
      formData.append("id", stationID);

      // Adicionar as datas
      if (fromDate) formData.append("from_date", fromDate);
      if (toDate) formData.append("to_date", toDate);

      const response = await fetch("https://irristrat.com/ws/clients/meteoStations.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await response.json();
      setStationData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // useEffect para carregar dados logo ao abrir a página
  useEffect(() => {
    if (stationID) {
      fetchStationData();
    }
  }, [stationID]); // ou sem array de dependências se quiseres chamar só uma vez

  return (
    <div className="p-6 text-darkGray">
      <h1 className="text-3xl font-bold mb-4">{stationName}</h1>

      {/* FORMULÁRIO: Selecionar datas */}
      <div className="mb-6 flex items-baseline gap-8">
        <label className="block mb-2">
          Data Inicial:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="ml-2 border p-1 rounded-lg bg-background"
          />
        </label>
        <label className="block mb-2">
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

      {/* ESTADO DE LOADING OU ERRO */}
      {loading && <div>A carregar...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* TABELA DE DADOS */}
      {stationData && Object.keys(stationData).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border shadow-md rounded-lg">
            <thead>
              <tr className="bg-background-100 border-b">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Temp. Média (°C)</th>
                <th className="p-3 text-left">Temp. Mínima (°C)</th>
                <th className="p-3 text-left">Temp. Máxima (°C)</th>
                <th className="p-3 text-left">Humidade (%)</th>
                <th className="p-3 text-left">Velocidade do Vento (km/h)</th>
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
        !loading && <div className="mt-4">Não existem dados para mostrar.</div>
      )}
    </div>
  );
}
