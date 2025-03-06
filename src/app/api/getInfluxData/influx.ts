import { NextResponse } from 'next/server';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA==';
const org = 'water-wise';
const bucket = 'dados-barragens';
  
interface QueryResult {
    _time?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export async function getInfluxData(): Promise<NextResponse> {
    // Cria uma instância do cliente InfluxDB
    const influxDB = new InfluxDB({ url, token });
    const queryApi = influxDB.getQueryApi(org);

    const timeRangeStart = new Date("2000-01-01").toISOString();
    const timeRangeStop = new Date("2025-03-03").toISOString();
    const windowPeriod = "24h";

    // Flux query com parâmetros dinâmicos
    const fluxQuery = `
        from(bucket: "${bucket}")
            |> range(start: ${timeRangeStart}, stop: ${timeRangeStop})
            |> filter(fn: (r) => r["_measurement"] == "barragem_data")
            |> aggregateWindow(every: ${windowPeriod}, fn: mean, createEmpty: false)
            |> pivot(rowKey:["_time", "barragem"], columnKey: ["_field"], valueColumn: "_value")
            |> group(columns: ["barragem", "_time"])
            |> drop(columns: ["_start", "_stop"])
            |> yield(name: "mean_joined")
    `

    // Array para armazenar os resultados da consulta
    const results: QueryResult[] = [];

    try {
        // Encapsula a consulta em uma Promise para aguardar sua finalização
        await new Promise<void>((resolve, reject) => {
            queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row) as QueryResult;
                    results.push(o);
                },
                error(error) {
                    console.error('Query error:', error);
                    reject(error);
                },
                complete() {
                    resolve();
                },
            });
        });

        // Formata os resultados se necessário
        const formattedResults = results.map((row) => {
            if (row._time) {
                row._time = new Date(row._time).toISOString().split('T')[0];
            }
            return row;
        });

        return NextResponse.json({ success: true, data: formattedResults });
    } catch (error) {
        console.error('Error fetching Influx data:', error);
        return NextResponse.json(
            {
                success: false,
                error:
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred',
            },
            { status: 500 },
        )
    }
}