import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const mode = searchParams.get('mode') || 'driving';
  const waypoints = searchParams.get('waypoints');
  const avoid = searchParams.get('avoid');
  const alternatives = searchParams.get('alternatives');
  
  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination are required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      origin,
      destination,
      mode,
      key: apiKey,
    });

    if (waypoints) {
      params.append('waypoints', waypoints);
    }

    if (avoid) {
      params.append('avoid', avoid);
    }

    if (alternatives) {
      params.append('alternatives', alternatives);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || 'Failed to fetch directions');
    }

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: data.error_message || `Directions API error: ${data.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Directions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}