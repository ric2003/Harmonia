"use server"
import { NextRequest, NextResponse } from 'next/server'
import { getStation10MinData } from '@/services/irristratService'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stationID: string }> }
) {
  try {
    // Await the params to extract stationID
    const { stationID } = await params

    const data = await getStation10MinData(stationID)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=6000, stale-while-revalidate=600' // 1 hour cache, stale for 10 more minutes
      }
    })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : `Erro 10min` },
      { status: 500 }
    )
  }
}
