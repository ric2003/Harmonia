const tokenAPI = process.env.NEXT_PUBLIC_IRRISTRAT_TOKEN;

export async function GET() {
  const response = await fetch("https://irristrat.com/ws/clients/meteoStations.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: tokenAPI || "",
      option: 1,
    }),
  });

  const data = await response.json();
  const stations = Object.values(data);

  return new Response(JSON.stringify(stations), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
  