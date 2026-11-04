import { NextResponse } from 'next/server';
import { guardGoogle, googleRefusal } from '@/lib/google/guard';

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const TRAVEL_MODES = new Set(['DRIVE', 'TWO_WHEELER', 'WALK']);

export async function POST(req: Request) {
  if (!GOOGLE_API_KEY) return googleRefusal('unavailable');

  try {
    const body = await req.json();
    if (!body?.origin || !body?.destination || !TRAVEL_MODES.has(body.travelMode)) {
      return NextResponse.json({ error: 'Invalid route request' }, { status: 400 });
    }

    const refused = await guardGoogle('route');
    if (refused) return refused;

    // Only the fields the app sends: extra ones (stops, for example) would be a pricier call.
    const motor = body.travelMode !== 'WALK';
    const request = {
      origin: body.origin,
      destination: body.destination,
      travelMode: body.travelMode,
      computeAlternativeRoutes: false,
      languageCode: typeof body.languageCode === 'string' ? body.languageCode.slice(0, 20) : 'en',
      ...(motor ? { routingPreference: 'TRAFFIC_AWARE' } : {}),
    };

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        // Steps + localized texts ("22 mins", "1.7 km") + step ends for the in-app Directions / navigation on Scout.
        'X-Goog-FieldMask': [
          'routes.duration',
          'routes.distanceMeters',
          'routes.polyline.encodedPolyline',
          'routes.localizedValues',
          'routes.legs.steps.navigationInstruction',
          'routes.legs.steps.localizedValues',
          // In-app navigation: where each step ends and how long it is.
          'routes.legs.steps.endLocation',
          'routes.legs.steps.distanceMeters',
        ].join(','),
      },
      body: JSON.stringify(request),
    });

    if (res.status === 403) return googleRefusal('unavailable');
    if (res.status === 429) return googleRefusal('daily_limit');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Directions API Error:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Directions request failed' }, { status: 500 });
  }
}
