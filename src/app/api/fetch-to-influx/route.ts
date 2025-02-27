import axios from 'axios';
import * as XLSX from 'xlsx';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { NextResponse } from 'next/server';
import { parseISO, isValid } from 'date-fns';

// InfluxDB configurations
const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA==';
const org = 'water-wise';
const bucket = 'dados-barragens2';

// Create InfluxDB client and write API
const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket, 'ns');
const queryApi = client.getQueryApi(org);

// Function to get the Excel file URL
function getExcelFileUrl(): string {
  return 'https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx';
}

interface RowType {
  Data: string | number | Date;
  Barragem: string;
  Cota_Lida_m: string | number;
  Volume_Total_hm3: string | number;
  "Enchimento_%": string | number;
  Volume_Util__hm3: string | number;
  [key: string]: string | number | Date | undefined;
}

interface ProcessedData {
  barragem: string;
  data: string | number | Date;
  cotaLida: number;
  volumeTotal: number;
  enchimento: number;
  volumeUtil: number;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const fileUrl = getExcelFileUrl();
    console.log('Downloading Excel from:', fileUrl);

    // Download the Excel file
    const response = await axios.get<ArrayBuffer>(fileUrl, { responseType: 'arraybuffer' });
    if (response.status !== 200) {
      console.error('Error downloading the Excel file:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to download file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Read the workbook and the first sheet
    const workbook = XLSX.read(response.data, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json<RowType>(workbook.Sheets[sheetName], { defval: "" });

    // Process each row to create and write points to InfluxDB
    const rowData: ProcessedData[] = [];
    for (const row of sheetData) {
      const cotaLida = Number(row['Cota_Lida_m']) || null;
      const volumeTotal = Number(row['Volume_Total_hm3']) || null;
      const enchimento = Number(row['Enchimento_%']) || null;
      const volumeUtil = Number(row['Volume_Util__hm3']) || null;

      if ([cotaLida, volumeTotal, enchimento, volumeUtil].some(val => val === null)) {
        console.log("Skipping row due to invalid numeric fields:", row);
        continue;
      }

      rowData.push({
        barragem: row['Barragem'],
        data: row['Data'],
        cotaLida: cotaLida!,
        volumeTotal: volumeTotal!,
        enchimento: enchimento!,
        volumeUtil: volumeUtil!,
      });

      const timestamp = new Date(row['Data']);

      const point = new Point('barragem_data')
        .tag('barragem', row['Barragem'])
        .floatField('cota_lida', cotaLida!)
        .floatField('volume_total', volumeTotal!)
        .floatField('enchimento', enchimento!)
        .floatField('volume_util', volumeUtil!)
        .timestamp(timestamp);

      // Log the line protocol for debugging
      console.log(`Line protocol: ${point.toLineProtocol()}`);
      writeApi.writePoint(point);
    }

    return NextResponse.json(
      { message: rowData },
      { status: 200 }
    );
  }
  catch (error) {
    console.error('Error processing the Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process the Excel file', details: errorMessage },
      { status: 500 }
    );
  }
}

/*


export async function GET(request: Request) {
  try {
    const fileUrl = getExcelFileUrl();
    console.log('Downloading Excel from:', fileUrl);

    // Download the Excel file
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    if (response.status !== 200) {
      console.error('Error downloading the Excel file:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to download file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Read the workbook and the first sheet
    const workbook = XLSX.read(response.data, { type: 'buffer' ,cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    console.log(`Excel data read successfully. Number of rows: ${sheetData.length}`);


    // Define the type for the row
    type RowType = {
      Data: string | number;
      Barragem: string;
      Cota_Lida_m: string | number;
      Volume_Total_hm3: string | number;
      "Enchimento_%": string | number;
      Volume_Util__hm3: string | number;
      [key: string]: any;
    };

    // Process each row to create and write points to InfluxDB
    for (const row of sheetData as RowType[]) {
      // Parse the date
      const timestamp = parseExcelDate(row['Data']);
      /*if (!timestamp || !row['Barragem']) {
        console.warn("Skipping row due to invalid data:", row);
        continue;
      }

      // Parse numeric fields
      const cotaLida = parseNumber(row['Cota_Lida_m']);
      const volumeTotal = parseNumber(row['Volume_Total_hm3']);
      const enchimento = parseNumber(row['Enchimento_%']);
      const volumeUtil = parseNumber(row['Volume_Util__hm3']);

      // Skip rows with missing or invalid numeric fields
      if ([cotaLida, volumeTotal, enchimento, volumeUtil].some(val => val === null)) {
        console.warn("Skipping row due to invalid numeric fields:", row);
        continue;
      }

      // Create the point
      const point = new Point('barragem_data')
        .tag('barragem', row['Barragem'])
        .floatField('cota_lida', cotaLida!+"")
        .floatField('volume_total', volumeTotal!+"")
        .floatField('enchimento', enchimento!+"")
        .floatField('volume_util', volumeUtil!+"")
        .timestamp(timestamp);
      // Log the line protocol for debugging
      console.log(`Line protocol: ${point.toLineProtocol()}`);
      writeApi.writePoint(point);

    }

    // Ensure all points are sent before closing the connection
    try {
      await writeApi.flush();
      console.log('All points flushed successfully.');
    } catch (flushError) {
      console.error('Error flushing points to InfluxDB:', flushError);
    }
    
    try {
      await writeApi.close();
      console.log('Write API closed successfully.');
    } catch (closeError) {
      console.error('Error closing Write API:', closeError);
    }

    console.log('Data successfully written to InfluxDB.');
    return NextResponse.json({ message: 'Data imported successfully' });
  } catch (error: any) {
    console.error('Error processing the Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to process the Excel file' },
      { status: 500 }
    );
  }
}
  from(bucket: "dados-barragens")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "barragem_data")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> pivot(rowKey:["_time", "barragem"], columnKey: ["_field"], valueColumn: "_value")
  |> group(columns: ["barragem", "_time"])
  |> drop(columns: ["_start", "_stop"])
  |> yield(name: "mean_joined")*/