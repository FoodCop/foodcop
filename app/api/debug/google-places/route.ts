import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'restaurant';
  const radius = searchParams.get('radius') || '5000';
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
      message: 'Google Places API key is configured',
      note: 'Provide lat and lng parameters for places search functionality',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Test Google Places Nearby Search API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`;
    
    const response = await fetch(placesUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      return NextResponse.json({
        success: true,
        message: 'Google Places API is working',
        results_count: data.results?.length || 0,
        status: data.status,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Places API request failed',
          message: data.error_message || `API returned status: ${data.status}`,
          status: data.status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Google Places API test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Google Places API request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}