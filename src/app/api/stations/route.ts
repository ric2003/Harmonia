"use server"
import { NextResponse } from 'next/server'
import { getStations } from '@/services/irristratService'

export async function GET() {
  try {
    const stations = await getStations();
    return NextResponse.json(stations);
  } catch (err: Error | unknown) {
    const error = err instanceof Error ? err.message : 'Error fetching stations';
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}
