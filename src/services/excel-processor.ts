import * as XLSX from 'xlsx';
import { Point } from '@influxdata/influxdb-client';

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

/**
 * Processes Excel data and returns structured data and InfluxDB points
 * @param data The Excel file data as ArrayBuffer
 * @returns Object containing processed row data and InfluxDB points
 */
export async function processExcelData(data: ArrayBuffer) {
  // Read the workbook and the first sheet
  const workbook = XLSX.read(data, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheetData = XLSX.utils.sheet_to_json<RowType>(workbook.Sheets[sheetName], { defval: "" });

  // Process each row to create data points
  const rowData: ProcessedData[] = [];
  const points: Point[] = [];

  for (const row of sheetData) {
    const cotaLida = isNaN(Number(row['Cota_Lida_m'])) ? null : Number(row['Cota_Lida_m']);
    const volumeTotal = isNaN(Number(row['Volume_Total_hm3'])) ? null : Number(row['Volume_Total_hm3']);
    const enchimento = isNaN(Number(row['Enchimento_%'])) ? null : Number(row['Enchimento_%']);
    const volumeUtil = isNaN(Number(row['Volume_Util__hm3'])) ? null : Number(row['Volume_Util__hm3']);

    let timestamp = new Date(row['Data']);
    timestamp = new Date(timestamp.getTime() - 86400000);
    
    // Skip rows with invalid data
    if (!row['Barragem'] || !timestamp) {
      console.warn('Skipping row with missing essential data:', row);
      continue;
    }

    rowData.push({
      barragem: row['Barragem'] as string,
      data: timestamp,
      cotaLida: cotaLida!,
      volumeTotal: volumeTotal!,
      enchimento: enchimento!,
      volumeUtil: volumeUtil!,
    });

    const point = new Point('barragem_data')
      .tag('barragem', row['Barragem'] as string)
      .timestamp(timestamp);

    if (cotaLida !== null) point.floatField('cota_lida', cotaLida);
    if (volumeTotal !== null) point.floatField('volume_total', volumeTotal);
    if (enchimento !== null) point.floatField('enchimento', enchimento);
    if (volumeUtil !== null) point.floatField('volume_util', volumeUtil);

    points.push(point);
  }

  return { rowData, points };
}