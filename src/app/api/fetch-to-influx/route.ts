import axios from 'axios';
import * as XLSX from 'xlsx';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { NextResponse } from 'next/server';

// InfluxDB configurations
const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA==';
const org = 'water-wise';
const bucket = 'dados-barragens';

// Create InfluxDB client and write API
const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket, 'ns'); // 'ns' for nanosecond precision

// Function to get the Excel file URL
function getExcelFileUrl(): string {
  return 'https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx';
}

// Helper function to parse Excel date strings (e.g., "9/27/24") into a valid Date
const parseExcelDate = (dateVal: string | number): Date | null => {
  console.log('Parsing date:', dateVal); // Debugging log
  if (typeof dateVal === "number") {
    // Convert Excel serial date (number) to JavaScript Date.
    const dateObj = new Date((dateVal - 25569) * 86400 * 1000);
    console.log('Parsed date (number):', dateObj); // Debugging log
    return isNaN(dateObj.getTime()) ? null : dateObj;
  } else if (typeof dateVal === "string") {
    if (dateVal.includes('/')) {
      // Assume it's in the format M/D/YY
      const parts = dateVal.split('/');
      if (parts.length !== 3) return null;
      let [month, day, year] = parts;
      if (year.length === 2) {
        year = '20' + year;
      }
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');
      const isoDate = `${year}-${month}-${day}T00:00:00Z`;
      const dateObj = new Date(isoDate);
      console.log('Parsed date (string):', dateObj); // Debugging log
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }
    // Otherwise, try to parse directly
    const dateObj = new Date(dateVal);
    console.log('Parsed date (direct):', dateObj); // Debugging log
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }
  return null;
};

// Helper function to convert numeric values (replace commas with dots if necessary)
const parseNumber = (value: any): number | null => {
  if (typeof value === "string") {
    const parsedValue = parseFloat(value.replace(",", "."));
    return isNaN(parsedValue) ? null : parsedValue;
  }
  return Number(value);
};

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
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    console.log(`Excel data read successfully. Number of rows: ${sheetData.length}`);

    // Limit processing to the first 5 rows for debugging
    console.log('Processing first 5 rows for debugging.');


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
      if (!timestamp || !row['Barragem']) {
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
        .floatField('cota_lida', cotaLida!)
        .floatField('volume_total', volumeTotal!)
        .floatField('enchimento', enchimento!)
        .floatField('volume_util', volumeUtil!)
        .timestamp(timestamp);

      // Log the line protocol for debugging
      console.log(`Line protocol: ${point.toLineProtocol()}`);

      // Write the point to InfluxDB
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