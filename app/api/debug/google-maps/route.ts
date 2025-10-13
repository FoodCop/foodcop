import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Google Maps API key not configured',
        message: 'GOOGLE_MAPS_API_KEY environment variable is missing'
      },
      { status: 500 }
    );
  }

  // If no coordinates provided, just test API key validity
  if (!lat || !lng) {
    return NextResponse.json({
      success: true,
      message: 'Google Maps API key is configured',
      note: 'Provide lat and lng parameters for geocoding functionality',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Use Google Geocoding API to get location details
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components || [];
      
      // Extract useful location information
      const locationInfo = {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        address_components: addressComponents.map((component: any) => ({
          long_name: component.long_name,
          short_name: component.short_name,
          types: component.types
        })),
        types: result.types
      };

      return NextResponse.json({
        success: true,
        location: locationInfo,
        message: 'Geocoding successful',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Geocoding failed',
          message: data.error_message || `Google API returned status: ${data.status}`,
          details: data
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Google Maps API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Geocoding request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}