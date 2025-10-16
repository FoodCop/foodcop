import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Missing lat or lng parameters" },
        { status: 400 }
      );
    }

    const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsKey) {
      // Return a fallback response if no API key
      return NextResponse.json({
        success: true,
        address: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`,
        fallback: true
      });
    }

    // Use Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      let address = result.formatted_address;
      
      // Try to get a more specific address (restaurant, business, etc.)
      const place = data.results.find((r: any) => 
        r.types.includes('establishment') || 
        r.types.includes('restaurant') ||
        r.types.includes('food')
      );
      
      if (place) {
        address = place.formatted_address;
      }

      return NextResponse.json({
        success: true,
        address: address,
        fullResult: result
      });
    } else {
      return NextResponse.json({
        success: true,
        address: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { success: false, error: "Geocoding failed" },
      { status: 500 }
    );
  }
}