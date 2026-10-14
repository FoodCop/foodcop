import { RestaurantService } from '@/lib/services/restaurantService';
import type { PlaceDuplicate } from '@/lib/services/communityPlacesService';
import type { PostPlace } from '@/lib/services/postService';

/**
 * The existing place a new restaurant would duplicate, as the post's place.
 * A Google place is linked to the FUZO restaurant that owns it, if any.
 */
export async function placeFromDuplicate(d: PlaceDuplicate): Promise<PostPlace> {
  const base: PostPlace = { name: d.name, address: d.address ?? null, lat: d.lat, lng: d.lng, placeId: d.placeId ?? null };
  if (d.kind === 'restaurant') return { ...base, restaurantId: d.id ?? null };
  if (d.kind === 'community') return { ...base, communityPlaceId: d.id ?? null };
  if (d.placeId) {
    const res = await RestaurantService.findByPlaceIds([d.placeId]);
    const link = res.success ? res.data?.get(d.placeId) : undefined;
    if (link) return { ...base, restaurantId: link.restaurantId, name: link.name || d.name };
  }
  return base;
}
