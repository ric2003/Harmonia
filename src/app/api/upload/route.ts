import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import { read, utils } from 'xlsx';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Ficheiro não encontrado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(new Uint8Array(arrayBuffer), { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = utils.sheet_to_json(sheet);

    const client = await db.connect();
    await client.sql`BEGIN`;

    for (const row of rows) {
      const { nome, fonte, bacia, drap, data_medicao, cota_lida_m, volume_total_hm3, enchimento_pct, volume_util_hm3 } = row as any;

      // Inserir Barragem
      const result = await client.sql`
        INSERT INTO Barragem (nome, fonte, bacia, drap)
        VALUES (${nome}, ${fonte}, ${bacia}, ${drap})
        ON CONFLICT (nome) DO UPDATE SET
          fonte = EXCLUDED.fonte,
          bacia = EXCLUDED.bacia,
          drap = EXCLUDED.drap
        RETURNING id_barragem;
      `;

      const id_barragem = result.rows[0].id_barragem;

      // Inserir Medicao
      await client.sql`
        INSERT INTO Medicao (id_barragem, data_medicao, cota_lida_m, volume_total_hm3, enchimento_pct, volume_util_hm3)
        VALUES (${id_barragem}, ${data_medicao}, ${cota_lida_m}, ${volume_total_hm3}, ${enchimento_pct}, ${volume_util_hm3})
        ON CONFLICT (id_barragem, data_medicao) DO UPDATE SET
          cota_lida_m = EXCLUDED.cota_lida_m,
          volume_total_hm3 = EXCLUDED.volume_total_hm3,
          enchimento_pct = EXCLUDED.enchimento_pct,
          volume_util_hm3 = EXCLUDED.volume_util_hm3;
      `;
    }

    await client.sql`COMMIT`;
    return NextResponse.json({ message: 'Dados inseridos com sucesso!' });

  } catch (error) {
    console.error('Erro ao processar o ficheiro:', error);
    return NextResponse.json({ error: 'Erro ao processar o ficheiro.' }, { status: 500 });
  }
}