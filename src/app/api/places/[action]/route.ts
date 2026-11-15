import { NextResponse } from 'next/server';
import { guardGoogle, googleRefusal } from '@/lib/google/guard';
import type { GoogleBlock } from '@/lib/google/limits';

// Every paid Places call goes through here: signed-in members only, within the
// daily limits (docs/GOOGLE_COST_PLAN.md). The key never reaches the browser.

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// Only what the place pop-up shows (mergePlaceDetails). Without this Google
// sends and bills everything.
const DETAIL_FIELDS = [
  'name', 'rating', 'user_ratings_total', 'formatted_address', 'formatted_phone_number', 'international_phone_number',
  'website', 'url', 'opening_hours', 'current_opening_hours', 'price_level', 'editorial_summary', 'reviews', 'photos',
  'dine_in', 'takeout', 'delivery', 'reservable', 'plus_code', 'wheelchair_accessible_entrance', 'serves_beer',
  'serves_wine', 'serves_breakfast', 'serves_brunch', 'serves_lunch', 'serves_dinner', 'serves_vegetarian_food',
].join(',');

const MAX_RADIUS = 50000;
const TOKEN = /^[A-Za-z0-9_-]{1,2048}$/;
// A next-page token we issue wraps Google's token with the search it belongs to (see packPage).
const PAGE_TOKEN = /^[A-Za-z0-9_-]{1,6000}$/;

// Places API (New) searches. Only these fields are asked for, so Google bills the
// cheap tier and no Contact / Atmosphere add-ons (the old nearbysearch could not limit them).
const SEARCH_FIELDS = [
  'places.id', 'places.displayName', 'places.location', 'places.types',
  'places.formattedAddress', 'places.shortFormattedAddress', 'places.rating', 'places.userRatingCount',
].join(',') + ',nextPageToken';
const NEW_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PAGE_SIZE = 20;

const coord = (value: unknown, max: number) => {
  const n = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null;
};
const radiusOf = (value: unknown, fallback: number) => {
  const n = typeof value === 'number' ? value : fallback;
  return Math.min(Math.max(Math.round(n) || fallback, 1), MAX_RADIUS);
};
const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

const blockFromStatus = (status: unknown): GoogleBlock | null => {
  if (status === 'REQUEST_DENIED') return 'unavailable';
  if (status === 'OVER_QUERY_LIMIT' || status === 'OVER_DAILY_LIMIT') return 'daily_limit';
  return null;
};


type NewPlace = {
  id: string;
  displayName?: { text?: string };
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
  shortFormattedAddress?: string;
  types?: string[];
};

/** What a next-page token must remember: Google needs the same search repeated with its token. */
type PageState = { g: string; q: string; box?: [number, number, number, number]; bias?: [number, number, number] };

const packPage = (state: PageState) => Buffer.from(JSON.stringify(state)).toString('base64url');
const unpackPage = (token: string): PageState | null => {
  try {
    const s = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Partial<PageState>;
    if (typeof s.g !== 'string' || !s.g || s.g.length > 2048 || typeof s.q !== 'string' || !s.q || s.q.length > 200) return null;
    const nums = (a: unknown, n: number) => Array.isArray(a) && a.length === n && a.every((v) => typeof v === 'number' && Number.isFinite(v));
    if (s.box !== undefined && !nums(s.box, 4)) return null;
    if (s.bias !== undefined && !nums(s.bias, 3)) return null;
    return { g: s.g, q: s.q, box: s.box, bias: s.bias };
  } catch {
    return null;
  }
};

/** The square around a point that a radius covers: the new nearby search area. */
const boxAround = (lat: number, lng: number, radius: number): [number, number, number, number] => {
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const clamp = (v: number, m: number) => Math.min(Math.max(v, -m), m);
  return [clamp(lat - dLat, 90), clamp(lng - dLng, 180), clamp(lat + dLat, 90), clamp(lng + dLng, 180)];
};

/**
 * One Places API (New) text search, answered in the older result shape so the app's
 * toScoutPlace() keeps working. `nearby` and `textsearch` both end up here.
 */
async function searchNew(state: PageState, pageToken?: string) {
  const body: Record<string, unknown> = { textQuery: state.q, pageSize: PAGE_SIZE };
  if (state.box) {
    const [south, west, north, east] = state.box;
    body.locationRestriction = { rectangle: { low: { latitude: south, longitude: west }, high: { latitude: north, longitude: east } } };
    body.includedType = 'restaurant';
    body.strictTypeFiltering = true;
  } else if (state.bias) {
    body.locationBias = { circle: { center: { latitude: state.bias[0], longitude: state.bias[1] }, radius: state.bias[2] } };
  }
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(NEW_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': SEARCH_FIELDS },
    body: JSON.stringify(body),
  });
  if (res.status === 403) return googleRefusal('unavailable');
  if (res.status === 429) return googleRefusal('daily_limit');
  if (!res.ok) return NextResponse.json({ error: 'Search failed' }, { status: 502 });

  const data = (await res.json()) as { places?: NewPlace[]; nextPageToken?: string };
  const results = (data.places ?? [])
    .filter((pl) => pl.location)
    .map((pl) => ({
      place_id: pl.id,
      name: pl.displayName?.text || 'Place',
      geometry: { location: { lat: pl.location!.latitude, lng: pl.location!.longitude } },
      rating: pl.rating,
      user_ratings_total: pl.userRatingCount,
      vicinity: pl.shortFormattedAddress || pl.formattedAddress,
      formatted_address: pl.formattedAddress,
      types: pl.types,
    }));
  return NextResponse.json({
    results,
    status: results.length ? 'OK' : 'ZERO_RESULTS',
    ...(data.nextPageToken ? { next_page_token: packPage({ ...state, g: data.nextPageToken }) } : {}),
  });
}

/** The next page of a search we started: the token carries the search it belongs to. */
async function nextPageOf(token: unknown) {
  if (typeof token !== 'string' || !PAGE_TOKEN.test(token)) return badRequest('Invalid page');
  const state = unpackPage(token);
  if (!state) return badRequest('Invalid page');
  const refused = await guardGoogle('search');
  if (refused) return refused;
  return searchNew(state, state.g);
}

/** Calls an older-style Places endpoint, turning "no" answers into the app's codes. */
async function legacy(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  const block = blockFromStatus(data?.status);
  return block ? googleRefusal(block) : NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!GOOGLE_API_KEY) return googleRefusal('unavailable');

  try {
    const { action } = await params;
    const body = await req.json().catch(() => ({}));

    if (action === 'nearby') {
      const { latitude, longitude, radius, pagetoken } = body;
      if (pagetoken !== undefined) return await nextPageOf(pagetoken);
      const lat = coord(latitude, 90);
      const lng = coord(longitude, 180);
      if (lat === null || lng === null) return badRequest('Invalid location');
      const refused = await guardGoogle('search');
      if (refused) return refused;
      return await searchNew({ g: '', q: 'restaurants', box: boxAround(lat, lng, radiusOf(radius, 5000)) });
    }

    if (action === 'textsearch') {
      const { query, location, radius, pagetoken } = body;
      if (pagetoken !== undefined) return await nextPageOf(pagetoken);
      const text = typeof query === 'string' ? query.trim().slice(0, 200) : '';
      if (!text) return badRequest('Search text is required');
      const refused = await guardGoogle('search');
      if (refused) return refused;
      const lat = coord(location?.lat, 90);
      const lng = coord(location?.lng, 180);
      return await searchNew({ g: '', q: text, ...(lat !== null && lng !== null ? { bias: [lat, lng, radiusOf(radius, MAX_RADIUS)] as [number, number, number] } : {}) });
    }

    if (action === 'details') {
      const { place_id } = body;
      if (typeof place_id !== 'string' || !TOKEN.test(place_id)) return badRequest('Invalid place');
      const refused = await guardGoogle('details');
      if (refused) return refused;
      return await legacy(`${PLACES_BASE}/details/json?place_id=${encodeURIComponent(place_id)}&fields=${DETAIL_FIELDS}&key=${GOOGLE_API_KEY}`);
    }

    if (action === 'search-along-route') {
      // Food along the way: one search near the whole route line, no photos.
      // Returned in the older result shape, so toScoutPlace() reads it like any other search.
      const { polyline } = body as { polyline?: unknown };
      if (typeof polyline !== 'string' || !polyline || polyline.length > 100_000) return badRequest('polyline is required');
      const refused = await guardGoogle('search');
      if (refused) return refused;
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.formattedAddress,places.shortFormattedAddress,places.types',
        },
        body: JSON.stringify({ textQuery: 'restaurants', pageSize: 10, searchAlongRouteParameters: { polyline: { encodedPolyline: polyline } } }),
      });
      if (res.status === 403) return googleRefusal('unavailable');
      if (res.status === 429) return googleRefusal('daily_limit');
      if (!res.ok) return NextResponse.json({ error: 'Search along route failed' }, { status: 502 });
      const data = (await res.json()) as {
        places?: Array<{
          id: string;
          displayName?: { text?: string };
          location?: { latitude: number; longitude: number };
          rating?: number;
          userRatingCount?: number;
          formattedAddress?: string;
          shortFormattedAddress?: string;
          types?: string[];
        }>;
      };
      const results = (data.places ?? [])
        .filter((pl) => pl.location)
        .map((pl) => ({
          place_id: pl.id,
          name: pl.displayName?.text || 'Place',
          geometry: { location: { lat: pl.location!.latitude, lng: pl.location!.longitude } },
          rating: pl.rating,
          user_ratings_total: pl.userRatingCount,
          vicinity: pl.shortFormattedAddress || pl.formattedAddress,
          types: pl.types,
        }));
      return NextResponse.json({ results, status: 'OK' });
    }

    return badRequest('This action is not supported');
  } catch (error) {
    console.error('Places API Error:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Places request failed' }, { status: 500 });
  }
}

// GET /api/places/photo?ref=<photo reference>&w=<width>: one Google photo.
// Answers with a redirect to Google's image, so the key stays here and the
// browser can reuse the same photo for an hour without paying again.
export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action !== 'photo') return badRequest('This action is not supported');
  if (!GOOGLE_API_KEY) return googleRefusal('unavailable');

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref') ?? '';
  if (!TOKEN.test(ref)) return badRequest('Invalid photo');
  const width = Math.min(Math.max(Number(searchParams.get('w')) || 400, 100), 800);

  const refused = await guardGoogle('photo');
  if (refused) return refused;

  try {
    const res = await fetch(`${PLACES_BASE}/photo?maxwidth=${width}&photoreference=${encodeURIComponent(ref)}&key=${GOOGLE_API_KEY}`, { redirect: 'manual' });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location && new URL(location).hostname.endsWith('.googleusercontent.com')) {
      const answer = NextResponse.redirect(location, 302);
      answer.headers.set('Cache-Control', 'private, max-age=3600');
      return answer;
    }
    return googleRefusal(res.status === 429 ? 'daily_limit' : 'unavailable');
  } catch (error) {
    console.error('Places photo error:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Photo request failed' }, { status: 502 });
  }
}
