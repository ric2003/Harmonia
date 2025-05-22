import { NextResponse } from 'next/server';
import { getInfluxData } from '@/services/influx';

// Use force-static with a long revalidation time
export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

// Use a Response object cache
let cachedResponse: Response | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET() {
  // Check if we have a valid cached response
  const now = Date.now();
  if (cachedResponse && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedResponse.clone(); // Return a clone of the cached response
  }

  const response = await getInfluxData();
  
  // Add Cache-Control headers to the response
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=5184000');
  headers.set('Vary', 'Accept, X-Requested-With');
  
  // Create a new response with the headers
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
  
  // Cache this response for future requests
  cachedResponse = newResponse.clone();
  cacheTimestamp = now;
  
  return newResponse;
}