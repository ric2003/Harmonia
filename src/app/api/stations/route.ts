"use server"
import { NextResponse } from 'next/server'
import { getStations } from '@/services/irristratService'

export async function GET() {
  try {
    const stations = await getStations();
    return NextResponse.json(stations, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200' // 24 hours cache, stale for 12 more hours
      }
    });
  } catch (err: Error | unknown) {
    const error = err instanceof Error ? err.message : 'Error fetching stations';
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}
