"use server";
import { NextResponse } from "next/server";
import { InfluxDB } from "@influxdata/influxdb-client";

const url = process.env.INFLUX_URL || "";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
const bucket = process.env.INFLUX_BUCKET || "";

interface CacheData {
  data: QueryResult[];
  timestamp: number;
}

const cacheStore: Record<string, CacheData> = {};

export interface QueryResult {
  _time?: string;
  barragem?: string;
  [key: string]: string | number | boolean | null | undefined;
}

function getCacheKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  if (month < 3) return `T1_${year}`;
  if (month < 6) return `T2_${year}`;
  if (month < 9) return `T3_${year}`;
  return `T4_${year}`;
}

/**
 * Returns a set of unique dam names (barragens) from the cached data
 * @returns A set of unique dam names
 */
export async function getUniqueDamNames(): Promise<Set<string>> {
  const cacheKey = getCacheKey();
  const damNames = new Set<string>();
  
  // If cache is empty, fetch data first
  if (!cacheStore[cacheKey]) {
    try {
      const response = await getInfluxData();
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          cacheStore[cacheKey] = {
            data: data.data,
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
  
  // Extract dam names from cache
  if (cacheStore[cacheKey]) {
    cacheStore[cacheKey].data.forEach(item => {
      if (item.barragem) {
        damNames.add(item.barragem);
      }
    });
  } else {
    console.log("No cache data available after fetch attempt");
  }
  
  return damNames;
}

export async function getInfluxData(): Promise<NextResponse> {
  const cacheKey = getCacheKey();

  if (cacheStore[cacheKey]) {
    const cacheSizeBytes = Buffer.byteLength(JSON.stringify(cacheStore[cacheKey]));
    const cacheSizeMB = (cacheSizeBytes / 1024 / 1024).toFixed(2);
    console.log(`Returning cached data for ${cacheKey}; total memory usage: :`,cacheSizeMB, "MB");
    return NextResponse.json({ success: true, data: cacheStore[cacheKey].data });
  }


  console.log(`Fetching new data from InfluxDB for ${cacheKey}`);
  const influxDB = new InfluxDB({ url, token });
  const queryApi = influxDB.getQueryApi(org);

  const fluxQuery = `
        from(bucket: "${bucket}")
        |> range(start: 1970-01-01T00:00:00Z, stop: now())
        |> filter(fn: (r) => r["_measurement"] == "barragem_data")
        |> aggregateWindow(every: 24h, fn: mean, createEmpty: false)
        |> pivot(rowKey:["_time", "barragem"], columnKey: ["_field"], valueColumn: "_value")
        |> group(columns: ["barragem", "_time"])
        |> group()
        |> drop(columns: ["_start", "_stop"])
        |> sort(columns: ["_time"], desc: true)
        |> yield(name: "mean_joined")
  `;

  const results: QueryResult[] = [];

  try {
    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          results.push(tableMeta.toObject(row) as QueryResult);
        },
        error(error) {
          console.error("Query error:", error);
          reject(error);
        },
        complete() {
          resolve();
        },
      });
    });

    const formattedResults = results.map((row) => {
      if (row._time) row._time = new Date(row._time).toISOString().split("T")[0];
      return row;
    });

    cacheStore[cacheKey] = { data: formattedResults, timestamp: Date.now() };

    Object.keys(cacheStore).forEach((key) => {
      if (key !== cacheKey) {
        console.log(`Deleting outdated cache: ${key}`);
        delete cacheStore[key];
      }
    });

    return NextResponse.json({ success: true, data: formattedResults });
  } catch (error) {
    console.error("Error fetching Influx data:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
