import { InfluxDB } from '@influxdata/influxdb-client'
import { NextResponse } from 'next/server'

const url = 'http://localhost:8086'
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA=='
const org = 'water-wise'
const bucket = 'dados-barragens'

export async function GET() {
  // Create a new InfluxDB client instance
  const influxDB = new InfluxDB({ url, token })
  const queryApi = influxDB.getQueryApi(org)

  // Define your Flux query. Adjust the range and measurement as needed.
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "nivel_agua")
  `


  // Array to hold query results
  const results: any[] = []

  try {
    // Wrap the query in a Promise so we can await its completion.
    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          results.push(o)
        },
        error(error) {
          console.error('Query error:', error)
          reject(error)
        },
        complete() {
          resolve()
        },
      })
    })

    // Optionally format date fields or adjust the data structure here.
    const formattedResults = results.map((row) => {
      // If there's a timestamp field, you can format it here.
      if (row._time) {
        row._time = new Date(row._time).toISOString().split('T')[0]
      }
      return row
    })

    return NextResponse.json({ success: true, data: formattedResults })
  } catch (error) {
    console.error('Error fetching Influx data:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
