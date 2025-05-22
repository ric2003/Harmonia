const tokenAPI = process.env.IRRISTRAT_TOKEN;

export async function GET() {
  const response = await fetch("https://irristrat.com/ws/clients/meteoStations.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: tokenAPI || "",
      option: "1",
    }).toString(),
    next: { 
      revalidate: 86400 // 24 hours
    }
  });

  const data = await response.json();
  const stations = Object.values(data);

  return new Response(JSON.stringify(stations), {
    status: 200,
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200" // 24 hours cache, stale for 12 more hours
    },
  });
}
  