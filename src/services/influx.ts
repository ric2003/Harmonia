"use server";
import { NextResponse } from "next/server";
import { InfluxDB } from "@influxdata/influxdb-client";
import { processExcelData } from "./excel-processor";
import * as fs from 'fs';
import path from 'path';

interface ProcessedData {
  barragem: string;
  data: string | number | Date;
  cotaLida: number;
  volumeTotal: number;
  enchimento: number;
  volumeUtil: number;
}

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

  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        results.push(tableMeta.toObject(row) as QueryResult);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve();
      },
    });
  });

  const formattedResults = results.map((row) => {
    if (row._time) {
      row._time = new Date(row._time).toISOString().split("T")[0];
    }
    return row;
  });

  return NextResponse.json(
    { success: true, data: formattedResults },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
}

// Extract the data formatting logic to a separate function
function formatExcelData(rowData: ProcessedData[]) {
  return rowData.map(row => {
    let adjustedDate: string;
    if (row.data instanceof Date) {
      const date = new Date(row.data);
      date.setDate(date.getDate() + 1);
      adjustedDate = date.toISOString().split("T")[0];
    } else {
      adjustedDate = String(row.data);
    }
    
    return {
      _time: adjustedDate,
      barragem: row.barragem,
      cota_lida: row.cotaLida,
      volume_total: row.volumeTotal,
      enchimento: row.enchimento,
      volume_util: row.volumeUtil
    };
  });
}