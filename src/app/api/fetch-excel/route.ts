/*import { db } from '@vercel/postgres';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

interface Medicao {
    id_barragem: number;
    data_medicao: string;
    cota_lida_m: number;
    volume_total_hm3: number;
    enchimento_pct: number;
    volume_util_hm3: number;
  }
  

// Função para gerar a URL do arquivo Excel (ajuste conforme seu padrão)
function getExcelFileUrl() {
  return 'https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx';
}

export async function GET() {
  try {
    const fileUrl = getExcelFileUrl();
    console.log('Downloading Excel file from:', fileUrl);

    // Baixa o arquivo Excel
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    // Lê e processa o arquivo Excel
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    // Converte a primeira planilha para JSON, definindo o tipo para Medicao
    const sheet: Medicao[] = XLSX.utils.sheet_to_json<Medicao>(workbook.Sheets[sheetName]);

    // Atualiza (ou insere) cada registro na tabela Medicao
    for (const row of sheet) {
      await db.sql`
        INSERT INTO Medicao (id_barragem, data_medicao, cota_lida_m, volume_total_hm3, enchimento_pct, volume_util_hm3)
        VALUES (${row.id_barragem}, ${row.data_medicao}, ${row.cota_lida_m}, ${row.volume_total_hm3}, ${row.enchimento_pct}, ${row.volume_util_hm3})
        ON CONFLICT (id_barragem, data_medicao) DO UPDATE SET
          cota_lida_m = EXCLUDED.cota_lida_m,
          volume_total_hm3 = EXCLUDED.volume_total_hm3,
          enchimento_pct = EXCLUDED.enchimento_pct,
          volume_util_hm3 = EXCLUDED.volume_util_hm3
      `;
    }

    return NextResponse.json({ success: true, message: 'Database updated successfully.' });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
import axios from 'axios';
import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Replace this URL with the actual URL of your Excel file.
    const fileUrl = 'https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx';

    // Download the Excel file as an arraybuffer.
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    
    // Read the Excel file.
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    // Convert the first sheet to JSON.
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Return the JSON data so you can inspect it.
    return NextResponse.json({ data: sheetData });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}*/

import { db } from '@vercel/postgres';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

// Define the interface for your Excel rows
interface ExcelRow {
  Barragem: string;
  Data: number; // Excel serial date
  Cota_Lida_m: number | string;
  Volume_Total_hm3: number | string;
  "Enchimento_%": number | string;
  Volume_Util__hm3: number | string;
  Fonte: string;
  Bacia: string;
  DRAP: string;
}

function excelSerialToDate(serial: number): string {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0]; // Extracts only the "YYYY-MM-DD" part
}
  
function parseNumeric(value: any): number | null {
  if (typeof value === 'string' && value.trim() === '-') {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function getExcelFileUrl(): string {
    return'https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx';
}

export async function GET() {
  try {
    const fileUrl = getExcelFileUrl();
    console.log('Downloading Excel from:', fileUrl);
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    // Now we specify the type so each row is of type ExcelRow
    const sheetData = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName]);

    await db.sql`BEGIN`;

    for (const row of sheetData) {
      //console.log('Row from Excel:', row);

      // Convert Excel serial date to ISO date string
      const dataMedicao = typeof row.Data === 'number' ? excelSerialToDate(row.Data) : row.Data;
      console.log(dataMedicao);
      // Parse numeric values, converting "-" to null if needed.
      const cotaLida = parseNumeric(row.Cota_Lida_m);
      const volumeTotal = parseNumeric(row.Volume_Total_hm3);
      const enchimento = parseNumeric(row["Enchimento_%"]);
      const volumeUtil = parseNumeric(row.Volume_Util__hm3);

      // Upsert the Barragem data using the "Barragem" column as unique identifier
      await db.sql`
        INSERT INTO Barragem (nome, fonte, bacia, drap)
        VALUES (${row.Barragem}, ${row.Fonte}, ${row.Bacia}, ${row.DRAP})
        ON CONFLICT (nome) DO UPDATE SET
          fonte = EXCLUDED.fonte,
          bacia = EXCLUDED.bacia,
          drap = EXCLUDED.drap
      `;

      // Retrieve the id_barragem based on the dam name.
      const { rows } = await db.sql`
        SELECT id_barragem FROM Barragem WHERE nome = ${row.Barragem}
      `;
      if (!rows || rows.length === 0) {
        throw new Error(`No Barragem found for name: ${row.Barragem}`);
      }
      const id_barragem = rows[0].id_barragem;

      // Upsert the Medicao data using the composite key (id_barragem, data_medicao)
      await db.sql`
        INSERT INTO Medicao (
          id_barragem, 
          data_medicao, 
          cota_lida_m, 
          volume_total_hm3, 
          enchimento_pct, 
          volume_util_hm3
        )
        VALUES (
          ${id_barragem}, 
          ${dataMedicao}, 
          ${cotaLida}, 
          ${volumeTotal}, 
          ${enchimento}, 
          ${volumeUtil}
        )
        ON CONFLICT (id_barragem, data_medicao) DO UPDATE SET
          cota_lida_m = EXCLUDED.cota_lida_m,
          volume_total_hm3 = EXCLUDED.volume_total_hm3,
          enchimento_pct = EXCLUDED.enchimento_pct,
          volume_util_hm3 = EXCLUDED.volume_util_hm3
      `;
    }

    await db.sql`COMMIT`;

    return NextResponse.json({ success: true, message: 'Database updated successfully.' });
  } catch (error) {
    await db.sql`ROLLBACK`;
    console.error('Error processing Excel data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

