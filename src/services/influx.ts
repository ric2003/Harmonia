"use server";
import { NextResponse } from "next/server";
import { InfluxDB } from "@influxdata/influxdb-client";

const url = process.env.INFLUX_URL || "";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
const bucket = process.env.INFLUX_BUCKET || "";

export interface QueryResult {
  _time?: string;
  barragem?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Returns a set of unique dam names (barragens) from the data
 */
export async function getUniqueDamNames(): Promise<Set<string>> {
  const damNames = new Set<string>();
  try {
    const response = await getInfluxData();
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        data.data.forEach((item: QueryResult) => {
          if (item.barragem) {
            damNames.add(item.barragem);
          }
        });
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return damNames;
}

export async function getInfluxData(): Promise<NextResponse> {
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

    return NextResponse.json({ success: true, data: formattedResults });
  } catch (error) {
    console.error("Error fetching Influx data:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
