import { NextRequest, NextResponse } from 'next/server';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import * as XLSX from 'xlsx';

const url = process.env.INFLUX_URL || "";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
const bucket = process.env.INFLUX_BUCKET || "";

// Create InfluxDB client and write API
const client = new InfluxDB({ url, token });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Create a new write API for each request
    const writeApi = client.getWriteApi(org, bucket, 'ns');
    
    // Get the FormData from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert the file to an ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Read the workbook and the first sheet
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    interface ExcelRow {
      'Barragem': string;
      'Data': string | Date;
      'Cota_Lida_m': string | number;
      'Volume_Total_hm3': string | number;
      'Enchimento_%': string | number;
      'Volume_Util__hm3': string | number;
    }
    const sheetData = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName], { defval: "" });

    // Process each row to create and write points to InfluxDB
    const rowData = [];
    for (const row of sheetData) {
      const cotaLida = isNaN(Number(row['Cota_Lida_m'])) ? null : Number(row['Cota_Lida_m']);
      const volumeTotal = isNaN(Number(row['Volume_Total_hm3'])) ? null : Number(row['Volume_Total_hm3']);
      const enchimento = isNaN(Number(row['Enchimento_%'])) ? null : Number(row['Enchimento_%']);
      const volumeUtil = isNaN(Number(row['Volume_Util__hm3'])) ? null : Number(row['Volume_Util__hm3']);

      let timestamp = new Date(row['Data']);
      timestamp = new Date(timestamp.getTime() - 86400000);

      rowData.push({
        barragem: row['Barragem'],
        data: timestamp,
        cotaLida: cotaLida!,
        volumeTotal: volumeTotal!,
        enchimento: enchimento!,
        volumeUtil: volumeUtil!,
      });

      const point = new Point('barragem_data')
        .tag('barragem', row['Barragem'])
        .timestamp(timestamp);

      if (cotaLida !== null) point.floatField('cota_lida', cotaLida);
      if (volumeTotal !== null) point.floatField('volume_total', volumeTotal);
      if (enchimento !== null) point.floatField('enchimento', enchimento);
      if (volumeUtil !== null) point.floatField('volume_util', volumeUtil);

      writeApi.writePoint(point);
    }

    // Flush the writes to InfluxDB and close the API
    await writeApi.flush();
    await writeApi.close();

    return NextResponse.json(
      { message: `Successfully processed ${rowData.length} rows from manual upload` },
      { status: 200 }
    );
  }
  catch (error) {
    console.error('Error processing the manually uploaded Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to process the Excel file', details: errorMessage },
      { status: 500 }
    );
  }
}