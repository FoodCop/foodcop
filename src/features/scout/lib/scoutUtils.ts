export const buildPhotoUrl = (mapsApiKey: string, photoReference?: string) => {
  if (!photoReference || !mapsApiKey) return '';
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${encodeURIComponent(photoReference)}&key=${mapsApiKey}`;
};

export const deriveCategory = (types?: string[]) => {
  if (!types || types.length === 0) return 'Restaurant';
  const ignored = new Set(['restaurant', 'food', 'point_of_interest', 'establishment']);
  const primary = types.find((typeName) => !ignored.has(typeName)) || types[0];
  return primary.replaceAll('_', ' ');
};

const DEFAULT_TIMINGS = {
  mon: 'Hours unavailable',
  tue: 'Hours unavailable',
  wed: 'Hours unavailable',
  thu: 'Hours unavailable',
  fri: 'Hours unavailable',
  sat: 'Hours unavailable',
  sun: 'Hours unavailable',
};

export const mapWeekdayTextToTimings = (weekdayText?: string[]) => {
  const timings: Record<string, string> = { ...DEFAULT_TIMINGS };
  weekdayText?.forEach((entry) => {
    const [day, ...hoursParts] = entry.split(':');
    const short = day.trim().slice(0, 3).toLowerCase();
    const hours = hoursParts.join(':').trim();
    if (timings[short]) timings[short] = hours || 'Hours unavailable';
  });
  return timings;
};
