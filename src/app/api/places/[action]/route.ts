import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key is missing on the server' }, { status: 500 });
  }

  try {
    const p = await params;
    const action = p.action;
    const body = await req.json().catch(() => ({}));

    if (action === 'nearby') {
      const { latitude, longitude, radius = 5000, type = 'restaurant' } = body;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'textsearch') {
      const { query, location, radius = 50000 } = body;
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      if (location?.lat && location?.lng) {
        url += `&location=${location.lat},${location.lng}&radius=${radius}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'details') {
      const { place_id } = body;
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'search-along-route') {
      // Basic implementation for search along route:
      // In a real scenario you might sample points along the polyline.
      // For simplicity, we just do a text search around the origin or destination
      // matching the query, or use the Routes API if advanced functionality is needed.
      const { polyline, query, origin, destination } = body;
      
      // Fallback: search around the destination if provided
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      if (destination?.lat && destination?.lng) {
        url += `&location=${destination.lat},${destination.lng}&radius=5000`;
      }
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: `Action ${action} not supported` }, { status: 400 });

  } catch (error: any) {
    console.error('Places API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
