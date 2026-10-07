import { NextResponse } from 'next/server';
import { COUNTRIES } from '@/lib/geo/countries';

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// In-memory cache for the "cities" lookup (one instance's memory; enough to
// stop every dashboard visit re-running ~17 Places calls for the same area).
const CITY_CACHE = new Map<string, { at: number; payload: unknown }>();
const CITY_CACHE_TTL = 12 * 60 * 60 * 1000;
// Country photo references (per ISO code) for "Explore countries" - they don't
// change, so one Places lookup per country per server instance.
const COUNTRY_PHOTO_CACHE = new Map<string, string | null>();

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key is missing on the server' }, { status: 500 });
  }

  try {
    const p = await params;
    const action = p.action;
    const body = await req.json().catch(() => ({}));

    if (action === 'nearby') {
      const { latitude, longitude, radius = 5000, type = 'restaurant', pagetoken } = body;
      // Google gives 20 per page; pagetoken fetches pages 2 and 3 (up to 60).
      const url = pagetoken
        ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${encodeURIComponent(pagetoken)}&key=${GOOGLE_API_KEY}`
        : `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'textsearch') {
      const { query, location, radius = 50000, pagetoken } = body;
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      if (pagetoken) url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(pagetoken)}&key=${GOOGLE_API_KEY}`;
      else if (location?.lat && location?.lng) {
        url += `&location=${location.lat},${location.lng}&radius=${radius}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    // "Explore <country>'s cities" on the dashboard: the user's country
    // (reverse geocode) and real towns/cities around them - Google has no
    // "cities of a country" search, so we look for prominent localities at the
    // user's spot plus two rings of points (~60 km and ~200 km out). Only
    // results Google types as `locality` are kept. Cached per ~10 km area.
    if (action === 'cities') {
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
      }
      const cacheKey = `${lat.toFixed(1)},${lng.toFixed(1)}`;
      const cached = CITY_CACHE.get(cacheKey);
      if (cached && Date.now() - cached.at < CITY_CACHE_TTL) return NextResponse.json(cached.payload);

      type GPlace = { place_id: string; name: string; types?: string[]; vicinity?: string; geometry?: { location?: { lat: number; lng: number } }; photos?: { photo_reference: string }[] };
      const nearbyLocalities = async (pLat: number, pLng: number, radius: number): Promise<GPlace[]> => {
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${pLat},${pLng}&radius=${radius}&type=locality&key=${GOOGLE_API_KEY}`);
          const data = await res.json();
          return Array.isArray(data.results) ? data.results : [];
        } catch {
          return [];
        }
      };
      const countryAt = async (pLat: number, pLng: number) => {
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pLat},${pLng}&result_type=country&key=${GOOGLE_API_KEY}`);
          const data = await res.json();
          const c = data.results?.[0]?.address_components?.[0];
          return c ? { name: String(c.long_name), code: String(c.short_name) } : null;
        } catch {
          return null;
        }
      };
      const country = countryAt(lat, lng);

      // Centre + 8 points at ~60 km + 8 points at ~200 km.
      const points: [number, number, number][] = [[lat, lng, 30000]];
      for (const [distKm, radius] of [[60, 30000], [200, 50000]] as const) {
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + (distKm === 200 ? Math.PI / 8 : 0);
          const pLat = lat + (distKm / 111) * Math.cos(a);
          const pLng = lng + (distKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))) * Math.sin(a);
          if (Math.abs(pLat) < 85) points.push([pLat, pLng, radius]);
        }
      }
      const batches = await Promise.all(points.map(([pLat, pLng, r]) => nearbyLocalities(pLat, pLng, r)));

      const toRad = (d: number) => (d * Math.PI) / 180;
      const km = (a: number, b: number) => {
        const s = Math.sin(toRad(a - lat) / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(a)) * Math.sin(toRad(b - lng) / 2) ** 2;
        return 2 * 6371 * Math.asin(Math.sqrt(s));
      };
      const seen = new Set<string>();
      const cities = batches
        .flat()
        .filter((p) => p.geometry?.location && p.name && p.types?.includes('locality'))
        .filter((p) => {
          const key = p.place_id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((p) => ({
          placeId: p.place_id,
          name: p.name,
          lat: p.geometry!.location!.lat,
          lng: p.geometry!.location!.lng,
          area: p.vicinity || '',
          photoRef: p.photos?.[0]?.photo_reference ?? null,
          distanceKm: Math.round(km(p.geometry!.location!.lat, p.geometry!.location!.lng)),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 20);

      // Keep only cities in the user's own country (the rings can cross a border).
      const home = await country;
      const inCountry = home
        ? (await Promise.all(cities.map(async (c) => (c.distanceKm < 15 || (await countryAt(c.lat, c.lng))?.code === home.code ? c : null))))
            .filter((c): c is (typeof cities)[number] => c !== null)
        : cities;

      const payload = { country: home, cities: inCountry.slice(0, 16) };
      CITY_CACHE.set(cacheKey, { at: Date.now(), payload });
      if (CITY_CACHE.size > 500) CITY_CACHE.delete(CITY_CACHE.keys().next().value as string);
      return NextResponse.json(payload);
    }

    // "Explore countries" on the dashboard: countries from the built-in list
    // (src/lib/geo/countries.ts), nearest first from the user, their own
    // country left out, each with a Google Places photo of the country.
    if (action === 'countries') {
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
      }
      const exclude = typeof body.excludeCode === 'string' ? body.excludeCode.toUpperCase() : '';
      const toRad = (d: number) => (d * Math.PI) / 180;
      const km = (a: number, b: number) => {
        const s = Math.sin(toRad(a - lat) / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(a)) * Math.sin(toRad(b - lng) / 2) ** 2;
        return 2 * 6371 * Math.asin(Math.sqrt(s));
      };
      const nearest = COUNTRIES.filter((c) => c.code !== exclude)
        .map((c) => ({ ...c, distanceKm: Math.round(km(c.lat, c.lng)) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 16);

      const photoFor = async (name: string, code: string): Promise<string | null> => {
        if (COUNTRY_PHOTO_CACHE.has(code)) return COUNTRY_PHOTO_CACHE.get(code)!;
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&key=${GOOGLE_API_KEY}`);
          const data = await res.json();
          const ref: string | null = data.results?.[0]?.photos?.[0]?.photo_reference ?? null;
          COUNTRY_PHOTO_CACHE.set(code, ref);
          return ref;
        } catch {
          return null;
        }
      };
      const countries = await Promise.all(nearest.map(async (c) => ({ ...c, photoRef: await photoFor(c.name, c.code) })));
      return NextResponse.json({ countries });
    }

    if (action === 'details') {
      const { place_id } = body;
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'search-along-route') {
      // Real along-the-route search (Places API New: searchText +
      // searchAlongRouteParameters) - places close to the whole route line,
      // not just around one end. Returned in the legacy result shape so the
      // client's toScoutPlace() reads it like any other search.
      const { polyline } = body as { polyline?: string };
      if (!polyline) return NextResponse.json({ error: 'polyline is required' }, { status: 400 });
      type NewPlace = {
        id: string;
        displayName?: { text?: string };
        location?: { latitude: number; longitude: number };
        rating?: number;
        userRatingCount?: number;
        formattedAddress?: string;
        shortFormattedAddress?: string;
        types?: string[];
        photos?: Array<{ name?: string }>;
      };
      // Google returns 20 per page (up to 3 pages per query), so several
      // food queries are merged: restaurants (3 pages) + cafes + street food.
      const search = async (textQuery: string, pages: number): Promise<NewPlace[]> => {
        const out: NewPlace[] = [];
        let pageToken: string | undefined;
        for (let page = 0; page < pages; page++) {
          const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask':
                'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.formattedAddress,places.shortFormattedAddress,places.types,places.photos.name,nextPageToken',
            },
            body: JSON.stringify({ textQuery, pageSize: 20, searchAlongRouteParameters: { polyline: { encodedPolyline: polyline } }, ...(pageToken ? { pageToken } : {}) }),
          });
          const data = (await res.json()) as { places?: NewPlace[]; nextPageToken?: string; error?: { message?: string } };
          if (!res.ok) {
            if (page === 0 && textQuery === 'restaurants') throw new Error(data.error?.message || 'Search along route failed');
            break;
          }
          out.push(...(data.places ?? []));
          if (!data.nextPageToken) break;
          pageToken = data.nextPageToken;
        }
        return out;
      };
      let found: NewPlace[][];
      try {
        found = await Promise.all([search('restaurants', 3), search('cafes', 1), search('street food', 1)]);
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Search along route failed' }, { status: 502 });
      }
      const seen = new Set<string>();
      const results = found
        .flat()
        .filter((pl) => pl.location && !seen.has(pl.id) && seen.add(pl.id))
        .map((pl) => ({
          place_id: pl.id,
          name: pl.displayName?.text || 'Place',
          geometry: { location: { lat: pl.location!.latitude, lng: pl.location!.longitude } },
          rating: pl.rating,
          user_ratings_total: pl.userRatingCount,
          vicinity: pl.shortFormattedAddress || pl.formattedAddress,
          types: pl.types,
          // Places (New) photo resource name - the client builds the media URL.
          photo_name: pl.photos?.[0]?.name,
        }));
      return NextResponse.json({ results, status: 'OK' });
    }

    return NextResponse.json({ error: `Action ${action} not supported` }, { status: 400 });

  } catch (error: any) {
    console.error('Places API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
