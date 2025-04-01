import { NextResponse } from "next/server";
import { getSentinelImage, SentinelFilter } from "@/services/sentinelService";
import { AxiosError } from "axios";

export async function GET(request: Request) {
  try {
    // Get bbox parameters from the URL
    const url = new URL(request.url);
    const west = parseFloat(url.searchParams.get('west') || '-9.2093');
    const south = parseFloat(url.searchParams.get('south') || '38.6523');
    const east = parseFloat(url.searchParams.get('east') || '-9.0493');
    const north = parseFloat(url.searchParams.get('north') || '38.7923');
    const filter = (url.searchParams.get('filter') || 'natural') as SentinelFilter;
    
    // Create bbox array and pass to the service
    const bbox = [west, south, east, north];
    const imageData = await getSentinelImage(bbox, filter);
    
    return new NextResponse(imageData, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorData = error instanceof AxiosError ? error.response?.data : undefined;
    
    console.error("Error in API route:", errorData || errorMessage);
    return NextResponse.json(
      { error: errorData || errorMessage },
      { status: 500 }
    );
  }
}