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
    const fallbackExcelPath = path.join(process.cwd(), 'public', 'fallback.xlsx');
    
    try {
      // First try to fetch the file via HTTP
      const response = await fetch(fallbackExcelPath, { cache: 'no-store' });
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const { rowData } = await processExcelData(arrayBuffer);
        
        const formattedResults = formatExcelData(rowData);
        
        return NextResponse.json({ 
          success: true, 
          data: formattedResults,
          source: "excel_fallback_http"
        });
      } else {
        console.log("HTTP fetch failed, trying direct file access if available");
      }
    } catch (fetchError) {
      console.error("Error fetching Excel via HTTP:", fetchError);
    }
    
    // If fetch failed and we're in a Node.js environment, try direct file access
    // This serves as a backup approach for local development
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const fallbackExcelPath = path.join(process.cwd(), 'public', 'fallback.xlsx');
        console.log("Trying direct file access at:", fallbackExcelPath);
        
        if (fs.existsSync(fallbackExcelPath)) {
          const fileBuffer = fs.readFileSync(fallbackExcelPath);
          const uint8Array = new Uint8Array(fileBuffer);
          const arrayBuffer = uint8Array.buffer;
          
          const { rowData } = await processExcelData(arrayBuffer);
          
          const formattedResults = formatExcelData(rowData);
          
          return NextResponse.json({ 
            success: true, 
            data: formattedResults,
            source: "excel_fallback_fs"
          });
        }
      } catch (fsError) {
        console.error("Error accessing Excel via filesystem:", fsError);
      }
    }
    
    // If both approaches failed
    return NextResponse.json(
      { success: false, error: "InfluxDB is down and fallback Excel file could not be fetched" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error processing fallback Excel file:", error);
    return NextResponse.json(
      { success: false, error: "Both InfluxDB and Excel fallback failed" },
      { status: 500 }
    );
  }
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