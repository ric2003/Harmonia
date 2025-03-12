import axios from 'axios';
import { InfluxDB } from '@influxdata/influxdb-client';
import { NextResponse } from 'next/server';
import { processExcelData } from '@/services/excel-processor'; // New shared utility

const url = process.env.INFLUX_URL || "";
const token = process.env.INFLUX_TOKEN || "";
const org = process.env.INFLUX_ORG || "";
const bucket = process.env.INFLUX_BUCKET || "";

// Create InfluxDB client
const client = new InfluxDB({ url, token });

/**
 * Generates the Excel file URL based on the current date
 * File format: Historico_2005_YYYY_VddMMMMYYYY.xlsx
 * Where dd = last day of trimester (31MAR, 30JUN, 30SET, 31DEZ)
 */
function getExcelFileUrl(): string {
  /*const now = new Date();
  const currentYear = now.getFullYear();
  
  // Determine the most recent trimester end date
  const currentMonth = now.getMonth(); // 0-11*/

  return `https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx`;
  
  /*let trimesterEndDay: number;
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
  return `https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/${currentYear}/Ficheiro_Trimestral_res_agua/Historico_2005_${currentYear}_V${trimesterEndDay}${trimesterEndMonthName}${currentYear}.xlsx`;*/
}

export async function GET(): Promise<NextResponse> {
  const writeApi = client.getWriteApi(org, bucket, 'ns');
  
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

    // Process the Excel data using the shared utility function
    const { rowData, points } = await processExcelData(response.data);
    
    // Write all points to InfluxDB
    for (const point of points) {
      writeApi.writePoint(point);
    }

    // Flush the writes to InfluxDB and close the API
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