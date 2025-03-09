import axios from 'axios';
import * as XLSX from 'xlsx';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { NextResponse } from 'next/server';

const url = process.env.INFLUX_URL || "";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
const bucket = process.env.INFLUX_BUCKET || "";

// Create InfluxDB client and write API
const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket, 'ns');

/**
 * Generates the Excel file URL based on the current date
 * File format: Historico_2005_YYYY_VddMMMMYYYY.xlsx
 * Where dd = last day of trimester (31MAR, 30JUN, 30SET, 31DEZ)
 */
function getExcelFileUrl(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Determine the most recent trimester end date
  const currentMonth = now.getMonth(); // 0-11
  
  let trimesterEndDay: number;
  let trimesterEndMonth: number;
  let trimesterEndMonthName: string;
  
  if (currentMonth < 3) { // Jan-Mar, use previous year's December
    trimesterEndDay = 31;
    trimesterEndMonth = 11; // December (0-based)
    trimesterEndMonthName = 'DEZ';
    // Use previous year for both the filename year and trimester date
    return `https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/${currentYear-1}/Ficheiro_Trimestral_res_agua/Historico_2005_${currentYear-1}_V31DEZ${currentYear-1}.xlsx`;
  } else if (currentMonth < 6) { // Apr-Jun, use March
    trimesterEndDay = 31;
    trimesterEndMonth = 2; // March (0-based)
    trimesterEndMonthName = 'MAR';
  } else if (currentMonth < 9) { // Jul-Sep, use June
    trimesterEndDay = 30;
    trimesterEndMonth = 5; // June (0-based)
    trimesterEndMonthName = 'JUN';
  } else { // Oct-Dec, use September
    trimesterEndDay = 30;
    trimesterEndMonth = 8; // September (0-based)
    trimesterEndMonthName = 'SET';
  }
  
  // Format the URL
  return `https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/${currentYear}/Ficheiro_Trimestral_res_agua/Historico_2005_${currentYear}_V${trimesterEndDay}${trimesterEndMonthName}${currentYear}.xlsx`;
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

export async function GET(): Promise<NextResponse> {
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

      console.log(`Line protocol: ${point.toLineProtocol()}`);
      writeApi.writePoint(point);
    }

    // Important: Flush the writes to InfluxDB and close the API
    await writeApi.flush();
    await writeApi.close();

    return NextResponse.json(
      { message: `Successfully processed ${rowData.length} rows` },
      { status: 200 }
    );
  }
  catch (error) {
    console.error('Error processing the Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Make sure to close the writeApi even in case of error
    try {
      await writeApi.flush();
      await writeApi.close();
    } catch (closeError) {
      console.error('Error closing InfluxDB connection:', closeError);
    }
    
    return NextResponse.json(
      { error: 'Failed to process the Excel file', details: errorMessage },
      { status: 500 }
    );
  }
}