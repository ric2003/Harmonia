import { RchParsedData } from '@/utils/rchParser';

// Cache for storing parsed RCH data
const rchDataCache = new Map<string, RchParsedData>();

// Example service function
export async function getParsedRchData(locationId: string): Promise<RchParsedData> {
  try {
    // Check if data is already in cache
    if (rchDataCache.has(locationId)) {
      console.log(`Cache hit for location ${locationId}`);
      return rchDataCache.get(locationId)!;
    }

    console.log(`Cache miss for location ${locationId}, fetching data...`);
    const response = await fetch(`/data/${locationId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for location ${locationId}. Status: ${response.status}`);
    }
    const data = await response.json();
    
    // Store in cache
    rchDataCache.set(locationId, data);
    return data;
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching data';
    console.error(`Error fetching data for location ${locationId}:`, errorMessage);
    throw new Error(`Failed to load simulation data for location ${locationId}: ${errorMessage}`);
  }
}

// Optional: Function to clear the cache
export function clearRchDataCache(locationId?: string): void {
  if (locationId) {
    rchDataCache.delete(locationId);
  } else {
    rchDataCache.clear();
  }
}
