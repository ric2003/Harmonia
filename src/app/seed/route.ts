import { db } from '@vercel/postgres';

const client = await db.connect();

async function seedBarragem() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS Barragem (
      id_barragem SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      fonte VARCHAR(20),
      bacia VARCHAR(50),
      drap VARCHAR(50)
    );
  `;
}

async function seedMedicao() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS Medicao (
      id_barragem INTEGER NOT NULL,
      data_medicao DATE NOT NULL,
      cota_lida_m NUMERIC(10,2),
      volume_total_hm3 NUMERIC(12,2),
      enchimento_pct NUMERIC(5,2),
      volume_util_hm3 NUMERIC(12,2),
      PRIMARY KEY (id_barragem, data_medicao),
      FOREIGN KEY (id_barragem) REFERENCES Barragem(id_barragem)
    );
  `;
}

export async function GET() {
  try {
    await client.sql`BEGIN`;
    await seedBarragem();
    await seedMedicao();
    await client.sql`COMMIT`;

    return Response.json({ message: 'Database seeded successfully.' });
  } catch (error) {
    await client.sql`ROLLBACK`;
    if (error instanceof Error) {
        return Response.json({ error: error.message }, { status: 500 });
      } else {
        // Se não for uma instância de Error, retorne uma mensagem genérica
        return Response.json({ error: 'An unknown error occurred' }, { status: 500 });
      }
  }
}