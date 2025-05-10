export interface GeoapifyLocation {
    formatted: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  }
  
  export interface GeoapifyCoordinates {
    lat: number;
    lon: number;
    formatted: string;
    confidence?: number;
  }
  
  export async function getLocationName(lat: number, lon: number): Promise<GeoapifyLocation> {
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
  
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        return {
          formatted: properties.formatted,
          city: properties.city,
          county: properties.county,
          state: properties.state,
          country: properties.country
        };
      }
      
      throw new Error('No location data found');
    } catch (error) {
      console.error('Error fetching location name:', error);
      throw error;
    }
  }

/**
 * Get coordinates from a place name
 * @param placeName The name of the place to find coordinates for
 * @param country Optional country code to narrow down the search (e.g., "pt" for Portugal)
 * @returns Coordinates and formatted address
 */
export async function getCoordinates(placeName: string, country: string = 'pt'): Promise<GeoapifyCoordinates> {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  
  try {
    // Sanitize the place name for URL
    const searchText = encodeURIComponent(`${placeName} barragem portugal`);
    
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${searchText}&filter=countrycode:${country}&format=json&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.lat,
        lon: result.lon,
        formatted: result.formatted,
        confidence: result.rank?.confidence
      };
    }
    
    // Return fallback coordinates centered in Portugal if no result found
    return {
      lat: 39.5, // Center of Portugal
      lon: -8.0,
      formatted: `${placeName} (approximate location)`,
      confidence: 0.1
    };
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    // Return fallback coordinates
    return {
      lat: 39.5, // Center of Portugal
      lon: -8.0,
      formatted: `${placeName} (approximate location)`,
      confidence: 0.1
    };
  }
}