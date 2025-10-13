import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        city: 'your area',
        error: 'Google Maps API key not configured'
      });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Extract city name from address components
      let city = 'your area';
      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
          break;
        } else if (component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
          break;
        }
      }

      return NextResponse.json({
        success: true,
        city,
        address: result.formatted_address
      });
    } else {
      return NextResponse.json({
        success: false,
        city: 'your area',
        error: 'Could not reverse geocode location'
      });
    }

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json({
      success: false,
      city: 'your area',
      error: 'Internal server error'
    }, { status: 500 });
  }
}