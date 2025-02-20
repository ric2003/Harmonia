// /api/deleteExcelData.ts
import { db } from '@vercel/postgres';

export async function GET() {
  try {
    // Begin transaction
    await db.sql`BEGIN`;

    // Delete data from tables
    await db.sql`DELETE FROM Medicao`;
    await db.sql`DELETE FROM Barragem`;

    // Commit the transaction
    await db.sql`COMMIT`;

    return new Response(
      JSON.stringify({ success: true, message: 'Database cleared successfully.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    await db.sql`ROLLBACK`; // Rollback if any error occurs
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
