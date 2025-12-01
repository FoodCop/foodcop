import type { SavedItem } from '../services/savedItemsService';

export interface SavedRestaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  price_level?: number;
  cuisine?: string | string[];
  image?: string;
  image_url?: string;
  photos?: string[] | { photo_reference: string }[];
  distanceMeters?: number;
}

export function mapSavedItemToRestaurant(item: SavedItem): SavedRestaurant | null {
  const meta = (item.metadata || {}) as Record<string, unknown>;

  const id = (meta.place_id as string) || item.item_id;
  const name =
    (meta.name as string) ||
    (meta.title as string) ||
    'Unknown Restaurant';

  const address =
    (meta.address as string) ||
    (meta.vicinity as string) ||
    'Address not available';

  const lat = (meta.lat as number) ?? (meta.latitude as number);
  const lng = (meta.lng as number) ?? (meta.longitude as number);

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  const image =
    (meta.image as string) ||
    (meta.image_url as string) ||
    undefined;

  const distanceMeters =
    (meta.distance as number) ??
    (meta.distanceMeters as number) ??
    undefined;

  return {
    id,
    name,
    address,
    lat,
    lng,
    rating: meta.rating as number | undefined,
    price_level: meta.price_level as number | undefined,
    cuisine: (meta.cuisine as string | string[] | undefined) ?? undefined,
    image,
    image_url: (meta.image_url as string | undefined) ?? image,
    photos: (meta.photos as string[] | { photo_reference: string }[] | undefined) ?? undefined,
    distanceMeters,
  };
}

export function calculateDistanceKm(
  origin: { lat: number; lng: number },
  target: { lat: number; lng: number },
): number {
  const R = 6371; // km
  const dLat = toRadians(target.lat - origin.lat);
  const dLng = toRadians(target.lng - origin.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(target.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}




