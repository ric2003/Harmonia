import { NextRequest, NextResponse } from "next/server";
import { db } from '@vercel/postgres';

interface BarragemInfos {
    nome: string;
    fonte: string;
    bacia: string;
    drap: string;
    data_medicao: string;
    cota_lida_m: number;
    volume_total_hm3: number;
    enchimento_pct: number;
    volume_util_hm3: number;
}

export async function POST(request: NextRequest) {
    const rows = await request.json();

    const client = await db.connect();
    await client.sql`BEGIN`;

    for (const row of rows) {
        const { nome, fonte, bacia, drap, data_medicao, cota_lida_m, volume_total_hm3, enchimento_pct, volume_util_hm3 } = row as BarragemInfos;
        
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

    return NextResponse.json({
        message: "Cheguei ao POST",
        data: rows,
    }, { status: 200 });
}