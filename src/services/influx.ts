"use server";
import { NextResponse } from "next/server";
import { InfluxDB } from "@influxdata/influxdb-client";
import { processExcelData } from "./excel-processor";
import * as fs from 'fs';
import path from 'path';

const url = process.env.INFLUX_URL || "";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
const bucket = process.env.INFLUX_BUCKET || "";
const fallbackExcelPath = path.join(process.cwd(), 'public', 'fallback.xlsx');

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
  try {
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
      console.error("Error fetching Influx data, trying fallback:", error);
      return await getFallbackExcelData();
    }
  } catch (error) {
    console.error("Error connecting to InfluxDB, trying fallback:", error);
    return await getFallbackExcelData();
  }
}

/**
 * Fallback function to get data from Excel when InfluxDB is down
 */
async function getFallbackExcelData(): Promise<NextResponse> {
  try {   
    if (!fs.existsSync(fallbackExcelPath)) {
      return NextResponse.json(
        { success: false, error: "InfluxDB is down and fallback Excel file not found" },
        { status: 500 }
      );
    }
    
    // Read the Excel file
    const fileBuffer = fs.readFileSync(fallbackExcelPath);
    const uint8Array = new Uint8Array(fileBuffer);
    const arrayBuffer = uint8Array.buffer as ArrayBuffer;
    
    // Process the Excel data
    const { rowData } = await processExcelData(arrayBuffer);
    
    
    // Format the data to match InfluxDB structure
    const formattedResults = rowData.map(row => {
      // Add one day to the date (Excel dates are one day early)
      let adjustedDate: string;
      if (row.data instanceof Date) {
        const date = new Date(row.data);
        date.setDate(date.getDate() + 1); // Add one day
        adjustedDate = date.toISOString().split("T")[0];
      } else {
        adjustedDate = String(row.data);
      }
      
      // Make sure numeric fields are properly converted to numbers
      const cotaLida = typeof row.cotaLida === 'string' ? parseFloat(row.cotaLida) : row.cotaLida;
      const volumeTotal = typeof row.volumeTotal === 'string' ? parseFloat(row.volumeTotal) : row.volumeTotal;
      const enchimento = typeof row.enchimento === 'string' ? parseFloat(row.enchimento) : row.enchimento;
      const volumeUtil = typeof row.volumeUtil === 'string' ? parseFloat(row.volumeUtil) : row.volumeUtil;
      
      return {
        _time: adjustedDate,
        barragem: row.barragem,
        cota_lida: cotaLida,
        volume_total: volumeTotal,
        enchimento: enchimento,
        volume_util: volumeUtil
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: formattedResults,
      source: "excel_fallback"
    });
  } catch (error) {
    console.error("Error processing fallback Excel file:", error);
    return NextResponse.json(
      { success: false, error: "Both InfluxDB and Excel fallback failed" },
      { status: 500 }
    );
  }
}
