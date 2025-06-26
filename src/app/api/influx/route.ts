import { NextResponse } from 'next/server';
import { getInfluxData } from '@/services/influx';

export async function GET() {
  try {
    const response = await getInfluxData();
    return response;
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}