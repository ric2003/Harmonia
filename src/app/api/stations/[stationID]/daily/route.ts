"use server"
import { NextRequest, NextResponse } from 'next/server'
import { getStationDailyData } from '@/services/irristratService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stationID: string }> }
) {
  try {
    // Await the params (this is the key difference)
    const { stationID } = await params
    
    const from = request.nextUrl.searchParams.get('from') ?? ''
    const to = request.nextUrl.searchParams.get('to') ?? ''

    const data = await getStationDailyData(stationID, from, to)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600' // 12 hours cache, stale for 6 more hours
      }
    })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : `Erro diários` },
      { status: 500 }
    )
  }
}
