import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const radius = searchParams.get('radius') || '5000'; // Default 5km radius
  const type = searchParams.get('type') || 'all';
  const query = searchParams.get('query');
  
  if (!latitude || !longitude) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Latitude and longitude are required',
        message: 'Please provide latitude and longitude parameters'
      },
      { status: 400 }
    );
  }

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

  try {
    // Build Google Places API search parameters
    const location = `${latitude},${longitude}`;
    let placeType = 'restaurant';
    
    // Map our types to Google Places types
    const typeMapping: { [key: string]: string } = {
      'all': 'restaurant',
      'fine-dining': 'restaurant',
      'casual-dining': 'restaurant',
      'fast-food': 'meal_takeaway',
      'pizza': 'meal_takeaway',
      'asian': 'restaurant',
      'mexican': 'restaurant',
      'italian': 'restaurant',
      'american': 'restaurant'
    };
    
    if (typeMapping[type]) {
      placeType = typeMapping[type];
    }

    // Build the API URL
    let placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${placeType}&key=${apiKey}`;
    
    // Add keyword search if provided
    if (query) {
      placesUrl += `&keyword=${encodeURIComponent(query)}`;
    }

    const response = await fetch(placesUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      // Transform the results to match our Restaurant interface
      const restaurants = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        rating: place.rating,
        priceLevel: place.price_level,
        photoUrl: place.photos && place.photos[0] 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : null,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        types: place.types,
        businessStatus: place.business_status,
        openNow: place.opening_hours?.open_now,
        userRatingsTotal: place.user_ratings_total,
        placeId: place.place_id
      }));

      return NextResponse.json({
        success: true,
        restaurants,
        total: restaurants.length,
        searchParams: {
          location: { latitude, longitude },
          radius,
          type,
          query
        },
        message: `Found ${restaurants.length} restaurants`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Places search failed',
          message: data.error_message || `Google Places API returned status: ${data.status}`,
          details: data
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Google Places API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Restaurant search request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}