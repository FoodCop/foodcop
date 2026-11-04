// Google photos go through /api/places/photo, so the key stays on the server
// and each one counts against the daily limit (docs/GOOGLE_COST_PLAN.md).

/** Same width everywhere: the pop-up's photo is then the Photos tab's first one, not a second charge. */
export const placePhotoPath = (photoReference: string) => `/api/places/photo?ref=${encodeURIComponent(photoReference)}&w=800`;

/** The most Google photos one place may show (the first is the pop-up's main photo). */
export const MAX_PLACE_PHOTOS = 4;

/**
 * Old saved places hold direct Google photo links, each with the API key in it
 * and charged every time it's shown. They're treated as "no photo" (the
 * 20261104 migration also removes them from the database).
 */
export function withoutGoogleLink(url: unknown): string {
  if (typeof url !== 'string') return '';
  return /^https:\/\/(maps|places)\.googleapis\.com\//i.test(url) ? '' : url;
}
