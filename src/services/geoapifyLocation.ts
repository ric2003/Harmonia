export interface GeoapifyLocation {
    formatted: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
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