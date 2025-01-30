import { format } from "date-fns"

export async function fetchStationData(stationID: string, fromDate: Date, toDate: Date) {
  try {
    const formData = new URLSearchParams()
    formData.append("token", "b1f5e1b1645373f16eb4a38e39cf4d95")
    formData.append("option", "2")
    formData.append("id", stationID)
    formData.append("from_date", format(fromDate, "yyyy-MM-dd"))
    formData.append("to_date", format(toDate, "yyyy-MM-dd"))

    const response = await fetch("https://irristrat.com/ws/clients/meteoStations.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao buscar dados`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}
