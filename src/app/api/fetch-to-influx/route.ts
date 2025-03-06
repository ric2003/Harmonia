import axios from 'axios';
import * as XLSX from 'xlsx';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { NextResponse } from 'next/server';

// InfluxDB configurations
const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA==';
const org = 'water-wise';
const bucket = 'dados-barragens';
var counter = 0;

// Create InfluxDB client and write API
const client = new InfluxDB({ url, token});
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
    const processedKeys = new Set();
    const rowData: ProcessedData[] = [];
    for (const row of sheetData) {
      counter++;
      const cotaLida = isNaN(Number(row['Cota_Lida_m'])) ? null : Number(row['Cota_Lida_m']);
      const volumeTotal = isNaN(Number(row['Volume_Total_hm3'])) ? null : Number(row['Volume_Total_hm3']);
      const enchimento = isNaN(Number(row['Enchimento_%'])) ? null : Number(row['Enchimento_%']);
      const volumeUtil = isNaN(Number(row['Volume_Util__hm3'])) ? null : Number(row['Volume_Util__hm3']);

      /*if ([cotaLida, volumeTotal, enchimento, volumeUtil].some(val => val === null)) {
        console.log("Skipping row due to invalid numeric fields:", row);
        counter++;
        continue;
      }*/

      rowData.push({
        barragem: row['Barragem'],
        data: row['Data'],
        cotaLida: cotaLida!,
        volumeTotal: volumeTotal!,
        enchimento: enchimento!,
        volumeUtil: volumeUtil!,
      });

      const timestamp = new Date(row['Data']);

      const point = new Point('barragem_data')//TODO add Fonte,	Bacia	and DRAP
        .tag('barragem', row['Barragem'])
        /*.floatField('cota_lida', cotaLida!)
        .floatField('volume_total', volumeTotal!)
        .floatField('enchimento', enchimento!)
        .floatField('volume_util', volumeUtil!)*/
        .timestamp(timestamp);

      if (cotaLida !== null) point.floatField('cota_lida', cotaLida);
      if (volumeTotal !== null) point.floatField('volume_total', volumeTotal);
      if (enchimento !== null) point.floatField('enchimento', enchimento);
      if (volumeUtil !== null) point.floatField('volume_util', volumeUtil);

      console.log(`Line protocol: ${point.toLineProtocol()} line:${counter}`);
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