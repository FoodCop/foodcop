// Where a place card leads (client, 2026-10-06):
//   map         - FUZO's map (Scout), centred on the place with its pop-up open.
//                 Tapping a place card goes here; a FUZO restaurant's pop-up has
//                 "View on FUZO" for its full page.
//   directions  - Scout with the route from the user's location drawn (dir=1)
// Used by the Home rails and My Plate.

type PlaceRef = {
  name?: string;
  placeId?: string;
  /** A FUZO restaurant account - lets Scout's pop-up show "View on FUZO". */
  restaurantId?: string;
  lat?: number | null;
  lng?: number | null;
};

const hasCoords = (p: PlaceRef): p is PlaceRef & { lat: number; lng: number } =>
  typeof p.lat === 'number' && typeof p.lng === 'number' && Number.isFinite(p.lat) && Number.isFinite(p.lng);

/** Google place ids look like "ChIJ..." - not our own fuzo-/link-/fallback- ids. */
export const isGooglePlaceId = (id?: string | null): id is string =>
  !!id && /^[A-Za-z0-9_-]{16,}$/.test(id) && !/^(fuzo|link|fallback|google|recipe|video|trim|post)-/.test(id);

/** Scout map centred on the place. Null when we can't place it on a map. */
export function mapUrl(p: PlaceRef): string | null {
  if (!hasCoords(p)) return null;
  const q = new URLSearchParams({ name: p.name || 'Place', lat: String(p.lat), lng: String(p.lng) });
  if (isGooglePlaceId(p.placeId)) q.set('place', p.placeId);
  if (p.restaurantId) q.set('rid', p.restaurantId);
  return `/scout?${q.toString()}`;
}

/** Scout showing the route from the user's current location to the place. */
export function directionsUrl(p: PlaceRef): string | null {
  const url = mapUrl(p);
  return url ? `${url}&dir=1` : null;
}

const GOOGLE_TRAVEL_MODE = { DRIVE: 'driving', TWO_WHEELER: 'two-wheeler', WALK: 'walking' } as const;

/** Google Maps turn-by-turn (the optional hand-off in Scout's Directions / navigation). */
export function googleDirectionsUrl(
  p: PlaceRef,
  opts: {
    /** Coordinates, or a searched place (name + Google place id). Omitted = Google uses the device's location. */
    origin?: { lat: number; lng: number } | { name: string; placeId: string };
    mode?: keyof typeof GOOGLE_TRAVEL_MODE;
    navigate?: boolean;
  } = {},
): string | null {
  if (!hasCoords(p) && !isGooglePlaceId(p.placeId)) return null;
  const q = new URLSearchParams({ api: '1' });
  if (opts.origin && 'lat' in opts.origin) q.set('origin', `${opts.origin.lat},${opts.origin.lng}`);
  else if (opts.origin) {
    q.set('origin', opts.origin.name);
    q.set('origin_place_id', opts.origin.placeId);
  }
  if (opts.mode) q.set('travelmode', GOOGLE_TRAVEL_MODE[opts.mode]);
  if (opts.navigate) q.set('dir_action', 'navigate');
  q.set('destination', hasCoords(p) ? `${p.lat},${p.lng}` : p.name || 'Place');
  if (isGooglePlaceId(p.placeId)) q.set('destination_place_id', p.placeId);
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
