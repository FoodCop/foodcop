// Ported from legacy/fuzoapp/src/features/scout/lib/scoutLogic.ts
// Changes: updated import paths

import type { AppItem } from '@/types/appItem';
import type { ScoutPlace, ScoutFilter } from '@/types/scout';
import { MAX_PLACE_PHOTOS, placePhotoPath } from '@/lib/google/photos';

const parseOpeningHours = (weekdayText?: string[]): Record<string, string> => {
  if (!weekdayText || weekdayText.length === 0) return {};

  const daysMap: Record<string, string> = {
    'monday': 'mon', 'tuesday': 'tue', 'wednesday': 'wed',
    'thursday': 'thu', 'friday': 'fri', 'saturday': 'sat', 'sunday': 'sun'
  };

  const results: Record<string, string> = {};
  weekdayText.forEach(line => {
    const [dayPart, ...hourParts] = line.split(': ');
    const dayKey = dayPart.trim().toLowerCase();
    const hours = hourParts.join(': ').trim();
    if (daysMap[dayKey]) {
      results[daysMap[dayKey]] = hours;
    }
  });

  return results;
};

export const mergePlaceDetails = (original: ScoutPlace, details: any): ScoutPlace => {
  if (!details) return original;

  return {
    ...original,
    phone: details.formatted_phone_number || details.international_phone_number || original.phone,
    website: details.website || original.website,
    rating: details.rating || original.rating,
    reviews: details.user_ratings_total || original.reviews,
    address: details.formatted_address || original.address,
    timings: parseOpeningHours(details.opening_hours?.weekday_text) || original.timings,
    priceLevel: details.price_level,
    editorialSummary: details.editorial_summary?.overview,
    dineIn: details.dine_in,
    takeout: details.takeout,
    delivery: details.delivery,
    reservable: details.reservable,
    plusCode: details.plus_code?.global_code || details.plus_code?.compound_code,
    currentOpeningHours: details.current_opening_hours,
    userReviews: (details.reviews || []).map((r: any) => ({
      user: r.author_name || 'FUZO Scout',
      rating: r.rating || 5,
      text: r.text || '',
      time: r.relative_time_description || 'Recently'
    })),
    // Each photo costs money, so a place shows a few, and only on its Photos tab.
    photoRef: original.photoRef || details.photos?.[0]?.photo_reference,
    photos: (details.photos || [])
      .filter((p: any) => p.photo_reference)
      .slice(0, MAX_PLACE_PHOTOS)
      .map((p: any) => placePhotoPath(p.photo_reference)),
    wheelchairAccessibleEntrance: details.wheelchair_accessible_entrance,
    servesBeer: details.serves_beer,
    servesWine: details.serves_wine,
    servesBreakfast: details.serves_breakfast,
    servesBrunch: details.serves_brunch,
    servesLunch: details.serves_lunch,
    servesDinner: details.serves_dinner,
    servesVegetarianFood: details.serves_vegetarian_food,
    menuLink: details.url
  };
};

export const toScoutPlace = (result: any, index: number): ScoutPlace => {
  const getCoord = (coord: any) => {
    if (typeof coord === 'function') return coord();
    if (typeof coord === 'number') return coord;
    return 0;
  };

  const lat = getCoord(result.geometry?.location?.lat);
  const lng = getCoord(result.geometry?.location?.lng);
  const placeId = result.place_id || `google-${index}`;

  return {
    id: placeId,
    placeId: placeId,
    markerSource: 'google',
    name: result.name || 'Unnamed Place',
    cat: result.types?.[0]?.replace(/_/g, ' ') || 'Restaurant',
    rating: result.rating || 0,
    reviews: result.user_ratings_total || 0,
    address: result.vicinity || result.formatted_address || '',
    phone: result.formatted_phone_number || '',
    website: result.website || '',
    vibe: [],
    // Lists show no Google photo (the biggest cost on the bill). The pop-up loads this one.
    img: '',
    photoRef: result.photos?.[0]?.photo_reference,
    lat,
    lng,
    timings: {},
    menu: [],
    userReviews: [],
    photos: [],
    ...(typeof result.opening_hours?.open_now === 'boolean'
      ? { currentOpeningHours: { open_now: result.opening_hours.open_now } }
      : {}),
  };
};

export const toSavedScoutPlace = (item: AppItem, index: number): ScoutPlace => {
  return {
    ...item,
    id: item.id || `saved-${index}`,
    name: item.name || 'Saved Place',
    cat: item.cat || 'Restaurant',
    img: item.img || '',
    rating: item.rating || 0,
    reviews: item.reviews || 0,
    address: item.address || '',
    lat: item.lat || 0,
    lng: item.lng || 0,
    markerSource: 'saved',
    vibe: item.vibe || [],
    phone: item.phone || '',
    website: item.website || '',
    timings: item.timings || {},
    menu: item.menu || [],
    userReviews: item.userReviews || [],
    photos: item.photos || []
  };
};

export const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculateNeuralMatch = (place: ScoutPlace): number => {
  const base = place.rating * 20;
  const random = Math.floor(Math.random() * 10) - 5;
  return Math.min(100, Math.max(70, Math.round(base + random)));
};

export const getMatchPercentage = (place: ScoutPlace | null): number => {
  if (!place) return 0;
  return place.matchPercentage || calculateNeuralMatch(place);
};

export const filterPlaces = (places: ScoutPlace[], filter: ScoutFilter): ScoutPlace[] => {
  let filtered = [...places];

  if (filter.type === 'top') {
    filtered = filtered.filter(p => p.rating >= 4.5);
  } else if (filter.type === 'open') {
    // Real opening status only (Google's open_now, or a FUZO restaurant's own
    // hours) - places whose hours are unknown aren't shown as open.
    filtered = filtered.filter(p => p.currentOpeningHours?.open_now === true);
  }
  // 'distance' doesn't filter - it changes the order (see chipSort).

  if (filter.rating > 0) {
    filtered = filtered.filter(p => p.rating >= filter.rating);
  }

  return filtered;
};

/** The chip picks the order: Top Rated = best first, Distance = nearest first. */
export const chipSort = (filter: ScoutFilter): ScoutFilter['sortBy'] =>
  filter.type === 'top' ? 'rating' : filter.type === 'distance' ? 'distance' : filter.sortBy;

export const sortPlaces = (places: ScoutPlace[], sortBy: ScoutFilter['sortBy']): ScoutPlace[] => {
  const sorted = [...places];
  switch (sortBy) {
    case 'match':
      return sorted.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    case 'reviews':
      return sorted.sort((a, b) => b.reviews - a.reviews);
    case 'distance':
      return sorted.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    default:
      return sorted;
  }
};

export const shouldApplyLatestRequest = (
  mountedRef: React.MutableRefObject<boolean>,
  requestSeq: number,
  requestSeqRef: React.MutableRefObject<number>
) => {
  return mountedRef.current && requestSeq === requestSeqRef.current;
};

export const extractSuggestionText = (s: any): { text: string; placeId: string } | null => {
  if (!s) return null;
  const prediction = s.placePrediction || s.queryPrediction;
  if (!prediction) {
    let text = s.description || s.text || s.name || s.formattedAddress;
    if (typeof s === 'string') text = s;
    if (!text) return null;
    return { text, placeId: s.placeId || s.place_id || '' };
  }

  let text = '';
  if (prediction.text?.text) text = prediction.text.text;
  else if (prediction.text?.toString) text = prediction.text.toString();
  else if (prediction.description) text = prediction.description;

  const placeId = prediction.placeId || prediction.place_id || '';

  if (!text) return null;
  return { text, placeId };
};
