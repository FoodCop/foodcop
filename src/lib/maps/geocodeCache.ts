// Remembers what Google's Geocoder answered for a point, on this device, so the same
// place is not looked up (and billed) again. About 110 m precision (3 decimals).
// Storage can be blocked or full, so every read and write is allowed to fail.

const PREFIX = 'fz-geo:';
const MAX_ENTRIES = 200;

const keyFor = (kind: string, lat: number, lng: number) => `${PREFIX}${kind}:${lat.toFixed(3)},${lng.toFixed(3)}`;

export function readGeocode(kind: string, lat: number, lng: number): string | null {
  try {
    return window.localStorage.getItem(keyFor(kind, lat, lng));
  } catch {
    return null;
  }
}

export function saveGeocode(kind: string, lat: number, lng: number, text: string): void {
  try {
    const ls = window.localStorage;
    const mine = Object.keys(ls).filter((k) => k.startsWith(PREFIX));
    if (mine.length >= MAX_ENTRIES) mine.slice(0, mine.length - MAX_ENTRIES + 1).forEach((k) => ls.removeItem(k));
    ls.setItem(keyFor(kind, lat, lng), text);
  } catch {
    // Storage is only a convenience.
  }
}
