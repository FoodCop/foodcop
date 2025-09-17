/**
 * Given a Google place_id, returns { url, attributions[] } for a hero image.
 * Uses Places API (v1) Place Details -> photos[] -> Place Photos (New).
 * Never persists the binary; returns a URL suitable for <img src>.
 * Uses in-memory cache with TTL to reduce API calls.
 */

const API = "https://places.googleapis.com/v1";
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY!;

// Simple in-memory cache for browser usage
const cache = new Map<
  string,
  { url: string; attributions: any[]; timestamp: number }
>();
const CACHE_TTL = 3 * 24 * 60 * 60 * 1000; // 3 days
export async function getPlaceHeroUrl(
  placeId: string,
  opts?: { maxWidth?: number; maxHeight?: number; forceRefresh?: boolean }
) {
  if (!placeId) throw new Error("placeId is required");
  const maxWidth = opts?.maxWidth ?? 1200;
  const maxHeight = opts?.maxHeight ?? 800;

  // 1) Check in-memory cache first
  if (!opts?.forceRefresh) {
    const cached = cache.get(placeId);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL && cached.url) {
        console.log("✅ Using cached image for", placeId);
        return {
          url: cached.url,
          attributions: cached.attributions,
        };
      }
    }
  }

  // 2) Place Details (New) with photos in the field mask
  //    X-Goog-FieldMask MUST include "photos" to get photo names
  const details = await fetch(`${API}/places/${encodeURIComponent(placeId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "photos", // keep minimal; add id,displayName if needed
    },
  });
  if (!details.ok) {
    console.error(
      `Google Place Details API failed with status: ${details.status}`
    );
    const errorBody = await details.text();
    console.error("Error Body:", errorBody);
    throw new Error(`Place Details failed: ${details.status}`);
  }
  const djson = await details.json();
  const photo = djson?.photos?.[0];
  if (!photo?.name) {
    return { url: null, attributions: [] }; // caller uses fallback (Static Map)
  }

  // 3) Place Photos (New) request (prefer JSON response with redirect skipped to get a stable URL)
  //    GET https://places.googleapis.com/v1/{photo.name}/media?maxWidthPx=...&maxHeightPx=...&key=...
  const media = await fetch(
    `${API}/${photo.name}/media?maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}&key=${KEY}&skipHttpRedirect=true`
  );
  if (!media.ok) {
    console.error(`Google Photo Media API failed with status: ${media.status}`);
    const errorBody = await media.text();
    console.error("Error Body:", errorBody);
    throw new Error(`Photo media failed: ${media.status}`);
  }
  const mjson = await media.json(); // { name, photoUri }
  const url = mjson?.photoUri ?? null;
  const attributions: any[] = photo?.authorAttributions ?? [];

  // 4) Store in in-memory cache
  if (url) {
    cache.set(placeId, {
      url,
      attributions,
      timestamp: Date.now(),
    });
    console.log("✅ Cached image for", placeId);
  }

  return { url, attributions };
}

/** Fallback Static Map (no photos available) */
export function staticMapFallback(
  lat: number,
  lng: number,
  w = 1200,
  h = 800,
  zoom = 15
) {
  const u = new URL("https://maps.googleapis.com/maps/api/staticmap");
  u.searchParams.set("center", `${lat},${lng}`);
  u.searchParams.set("zoom", `${zoom}`);
  u.searchParams.set("size", `${w}x${h}`);
  u.searchParams.set("markers", `${lat},${lng}`);
  u.searchParams.set("key", KEY);
  return u.toString();
}
