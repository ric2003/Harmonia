"use server";

const API_URL = "https://irristrat.com/ws/clients/meteoStations.php";
const token = process.env.IRRISTRAT_TOKEN || "";

// ----------------------------------------------------------------
// Define types for the API responses
// ----------------------------------------------------------------

// For station listing (option 1)
export interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

// For daily station data (option 2)
export interface StationData {
  [date: string]: {
    air_temp_avg?: string;
    air_temp_min?: string;
    air_temp_max?: string;
    relative_humidity_avg?: string;
    wind_speed_avg?: string;
    solar_radiation_avg?: string;
  };
}

// For hourly station data (option 3)
export interface StationHourlyRecord {
  date: string;
  hour: string;
  invalid: number;
  forecast: number;
  air_temp_avg: string;
  p_em: string;
  air_temp_min: string;
  air_temp_max: string;
  dew_point_avg: string;
  dew_point_min: string;
  dew_point_max: string;
  relative_humidity_avg: string;
  relative_humidity_min: string;
  relative_humidity_max: string;
  wind_speed_avg: string;
  wind_speed_min: string;
  wind_speed_max: string;
  wind_dir_avg: string | null;
  vapour_pressure_avg: string;
  vapour_pressure_min: string;
  vapour_pressure_max: string;
  solar_radiation_avg: string;
  leaf_wetness: string;
}
// The response is an object where each key is a timestamp.
export type StationHourlyData = Record<string, StationHourlyRecord>;

// For 10/10 minute data (option 4)
export interface Station10MinRecord {
  date: string;
  hour: string;
  invalid: number;
  forecast: number;
  air_temp_avg: string;
  p_em: string;
  dew_point_avg: string | null;
  relative_humidity_avg: string;
  wind_speed_avg: string;
  wind_dir_avg: string | null;
  vapour_pressure_avg: string;
  solar_radiation_avg: string;
  leaf_wetness: string;
}
// The response is an object where each key is a timestamp.
export type Station10MinData = Record<string, Station10MinRecord>;


// ----------------------------------------------------------------
// Helper function for POST requests
// ----------------------------------------------------------------

// Update the postRequest function to use Next.js caching
async function postRequest<T>(params: Record<string, string>): Promise<T> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
    next: { 
      revalidate: 3600 // Revalidate every hour
    },
  });
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ----------------------------------------------------------------
// API Functions with Caching
// ----------------------------------------------------------------

/**
 * Fetches the list of stations (option 1).
 * Caches the result for 24 hours.
 * @returns An array of Station objects.
 */
export async function getStations(): Promise<Station[]> {
  const data = await postRequest<Record<string, Station>>({
    token,
    option: "1",
  });
  
  return Object.values(data) as Station[];
}

/**
 * Fetches daily meteorological data for a station (option 2).
 * Caches the result for 12 hours.
 * @param stationID - The ID of the station.
 * @param fromDate - (Optional) The start date (format: YYYY-MM-DD).
 * @param toDate - (Optional) The end date (format: YYYY-MM-DD).
 * @returns An object with dates as keys and corresponding station data.
 */
export async function getStationDailyData(
  stationID: string,
  fromDate?: string,
  toDate?: string
): Promise<StationData> {
  const params: Record<string, string> = {
    token,
    option: "2",
    id: stationID,
  };

  if (fromDate) {
    params.from_date = fromDate;
  }
  if (toDate) {
    params.to_date = toDate;
  }

  return postRequest<StationData>(params);
}

/**
 * Fetches hourly meteorological data for a station (option 3).
 * Data is updated by the hour. Cached until the beginning of the next hour.
 * @param stationID - The ID of the station.
 * @returns The hourly data for the station.
 */
export async function getStationHourlyData(
  stationID: string
): Promise<StationHourlyData> {
  const data = await postRequest<StationHourlyData>({
    token,
    option: "3",
    id: stationID,
  });
  return data;
}

/**
 * Fetches 10/10 minutes meteorological data for a station (option 4).
 * Data is updated every 10 minutes. Cached until the beginning of the next 10-minute interval.
 * @param stationID - The ID of the station.
 * @returns The 10/10 minutes data for the station.
 */
export async function getStation10MinData(
  stationID: string
): Promise<Station10MinData> {
  const data = await postRequest<Station10MinData>({
    token,
    option: "4",
    id: stationID,
  });
  return data;
}
