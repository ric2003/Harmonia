import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await db.sql`
      SELECT 
        M.id_barragem, 
        B.nome as barragem, 
        M.data_medicao, 
        M.cota_lida_m, 
        M.volume_total_hm3, 
        M.enchimento_pct, 
        M.volume_util_hm3,
        B.fonte,
        B.bacia,
        B.drap
      FROM Medicao M
      JOIN Barragem B ON M.id_barragem = B.id_barragem
      ORDER BY M.data_medicao DESC
    `;

    // Convert data_medicao to YYYY-MM-DD format if necessary
    const formattedRows = rows.map((row: any) => {
      const formattedDate = row.data_medicao instanceof Date 
        ? row.data_medicao.toISOString().split('T')[0]  // Format as YYYY-MM-DD
        : row.data_medicao;  // If it's not a Date, leave it as is

      return {
        ...row,
        data_medicao: formattedDate,
      };
    });

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
