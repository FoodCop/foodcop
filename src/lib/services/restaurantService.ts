import { createClient } from '../supabase/client';
import type { ServiceResult } from '../types/serviceResult';
import type { FoodCardRecord } from '../types/foodCard';
import type { WeeklyHours } from '../restaurant/hours';
import { MediaUploadService } from './mediaUploadService';

// Restaurant view data: business info + hours, menu, ratings & reviews,
// restaurant posts, and customer mentions. Tables come from
// supabase/migrations/20261001000000_restaurant_features.sql. A "restaurant"
// is a users row with profile_type = 'business'; its id is the restaurant id.
// "Mentions & Tags" = other users' published food_cards at the restaurant's
// linked Google place (place_id) + written reviews - real content, nothing invented.

export interface RestaurantProfile {
  user_id: string;
  place_id: string | null;
  place_name: string | null;
  tagline: string | null;
  cuisines: string[];
  price_tier: '$' | '$$' | '$$$' | '$$$$' | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  amenities: string[];
  hours: WeeklyHours;
  timezone: string;
  /** ISO 4217 code for menu prices, e.g. INR, USD. */
  currency: string;
  /** Where the restaurant is on the map (set in the Dashboard). */
  lat?: number | null;
  lng?: number | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_veg: boolean;
  is_recommended: boolean;
  is_popular: boolean;
  is_available: boolean;
  image_url: string | null;
  position: number;
}
export type MenuItemDraft = Omit<MenuItem, 'id' | 'restaurant_id' | 'position'> & { id?: string };

export interface PersonRef {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface RestaurantReview {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
  author?: PersonRef;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}
export const EMPTY_SUMMARY: RatingSummary = { average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

export const POST_KINDS = ['announcement', 'menu_launch', 'offer', 'event', 'photo', 'video', 'update'] as const;
export type PostKind = (typeof POST_KINDS)[number];
export const POST_KIND_LABEL: Record<PostKind, string> = {
  announcement: 'Announcement',
  menu_launch: 'New on the menu',
  offer: 'Offer',
  event: 'Event',
  photo: 'Photo',
  video: 'Video',
  update: 'Update',
};

export interface RestaurantPost {
  id: string;
  restaurant_id: string;
  kind: PostKind;
  title: string | null;
  body: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  event_at: string | null;
  created_at: string;
}

/** One item in the "Mentions & Tags" feed. */
export type Mention =
  | { kind: 'card'; id: string; created_at: string; author?: PersonRef; card: FoodCardRecord }
  | { kind: 'review'; id: string; created_at: string; author?: PersonRef; review: RestaurantReview };

/** A Google place that is also a FUZO restaurant (for map pins / place popups). */
export interface FuzoRestaurantLink {
  restaurantId: string;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  average: number;
  reviewCount: number;
  hours: WeeklyHours;
  timezone: string;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  cuisines: string[];
  /** Title of the restaurant's latest Offer post (last 30 days) - the red tag on Scout pins. */
  offerTitle: string | null;
}

type ProfileRow = { user_id: string; place_id: string | null; hours: unknown; timezone: string | null; lat?: number | null; lng?: number | null; address?: string | null; cuisines?: string[] | null };

/** Attach name/photo (business accounts only) + rating to restaurant_profiles rows. */
async function toLinks(rows: ProfileRow[]): Promise<FuzoRestaurantLink[]> {
  const supabase = createClient();
  if (!supabase || rows.length === 0) return [];
  const ids = rows.map((r) => r.user_id);
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: users }, { data: ratings }, { data: offers }] = await Promise.all([
    supabase.from('users').select('id, display_name, username, avatar_url, banner_url, profile_type').in('id', ids),
    supabase.from('restaurant_rating_summary').select('restaurant_id, average_rating, review_count').in('restaurant_id', ids),
    supabase
      .from('restaurant_posts')
      .select('restaurant_id, title, body, created_at')
      .in('restaurant_id', ids)
      .eq('kind', 'offer')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
  ]);
  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const ratingById = new Map((ratings ?? []).map((r) => [r.restaurant_id, r]));
  const offerById = new Map<string, string>();
  (offers ?? []).forEach((o) => {
    const text = (o.title || o.body || '').trim();
    if (text && !offerById.has(o.restaurant_id)) offerById.set(o.restaurant_id, text.length > 22 ? `${text.slice(0, 21)}…` : text);
  });
  const out: FuzoRestaurantLink[] = [];
  rows.forEach((r) => {
    const u = userById.get(r.user_id);
    if (!u || u.profile_type !== 'business') return;
    const rating = ratingById.get(r.user_id);
    out.push({
      restaurantId: r.user_id,
      name: u.display_name || u.username || 'FUZO restaurant',
      avatarUrl: u.avatar_url ?? null,
      bannerUrl: u.banner_url ?? null,
      average: Number(rating?.average_rating) || 0,
      reviewCount: rating?.review_count ?? 0,
      hours: (r.hours ?? {}) as WeeklyHours,
      timezone: r.timezone || 'UTC',
      placeId: r.place_id ?? null,
      lat: typeof r.lat === 'number' ? r.lat : null,
      lng: typeof r.lng === 'number' ? r.lng : null,
      address: r.address ?? null,
      cuisines: r.cuisines ?? [],
      offerTitle: offerById.get(r.user_id) ?? null,
    });
  });
  return out;
}

const SCHEMA_HINT = 'Restaurant features need the database update (supabase/migrations/20261001000000_restaurant_features.sql).';

/** True when the error means the restaurant tables haven't been created yet. */
export function isMissingSchema(error?: string) {
  return !!error && /does not exist|could not find the table|schema cache|42P01|PGRST205/i.test(error);
}
const fail = <T>(error: string): ServiceResult<T> => ({ success: false, error: isMissingSchema(error) ? SCHEMA_HINT : error });

async function fetchPeople(ids: string[]): Promise<Map<string, PersonRef>> {
  const map = new Map<string, PersonRef>();
  const unique = [...new Set(ids)].filter(Boolean);
  const supabase = createClient();
  if (!supabase || unique.length === 0) return map;
  const { data } = await supabase.from('users').select('id, display_name, username, avatar_url').in('id', unique);
  (data ?? []).forEach((u) =>
    map.set(u.id, { id: u.id, name: u.display_name || u.username || 'FUZO user', username: u.username ?? null, avatarUrl: u.avatar_url ?? null }),
  );
  return map;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const RestaurantService = {
  // ── Business info + hours ──────────────────────────────────────────────
  async getProfile(restaurantId: string): Promise<ServiceResult<RestaurantProfile | null>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase.from('restaurant_profiles').select('*').eq('user_id', restaurantId).maybeSingle();
    if (error) return fail(error.message);
    if (data) return { success: true, data: data as RestaurantProfile };

    // Not set up yet: fall back to the place the owner pinned via Create Card / Scout.
    const { data: pinned } = await supabase
      .from('food_cards')
      .select('place_id, title')
      .eq('user_id', restaurantId)
      .in('card_type', ['RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD'])
      .not('place_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return {
      success: true,
      data: pinned?.place_id
        ? { user_id: restaurantId, place_id: pinned.place_id, place_name: pinned.title, tagline: null, cuisines: [], price_tier: null, address: null, phone: null, website: null, amenities: [], hours: {}, timezone: 'UTC', currency: 'USD' }
        : null,
    };
  },

  async saveProfile(restaurantId: string, patch: Partial<Omit<RestaurantProfile, 'user_id'>>): Promise<ServiceResult<RestaurantProfile>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase
      .from('restaurant_profiles')
      .upsert({ user_id: restaurantId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) return fail(error.message);
    return { success: true, data: data as RestaurantProfile };
  },

  // ── Menu ───────────────────────────────────────────────────────────────
  async listMenu(restaurantId: string): Promise<ServiceResult<MenuItem[]>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category')
      .order('position')
      .order('created_at');
    if (error) return fail(error.message);
    return { success: true, data: (data ?? []).map((r) => ({ ...r, price: Number(r.price) })) as MenuItem[] };
  },

  async saveMenuItem(restaurantId: string, draft: MenuItemDraft): Promise<ServiceResult<MenuItem>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const row = {
      name: draft.name.trim(),
      description: draft.description?.trim() || null,
      price: Math.round(Number(draft.price) * 100) / 100,
      category: draft.category.trim() || 'Mains',
      is_veg: draft.is_veg,
      is_recommended: draft.is_recommended,
      is_popular: draft.is_popular,
      is_available: draft.is_available,
      image_url: draft.image_url || null,
      updated_at: new Date().toISOString(),
    };
    const query = draft.id
      ? supabase.from('menu_items').update(row).eq('id', draft.id).eq('restaurant_id', restaurantId)
      : supabase.from('menu_items').insert({ ...row, restaurant_id: restaurantId });
    const { data, error } = await query.select('*').single();
    if (error) return fail(error.message);
    return { success: true, data: { ...data, price: Number(data.price) } as MenuItem };
  },

  async setAvailability(restaurantId: string, itemId: string, isAvailable: boolean): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId);
    return error ? fail(error.message) : { success: true, data: null };
  },

  async deleteMenuItem(restaurantId: string, itemId: string): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId).eq('restaurant_id', restaurantId);
    return error ? fail(error.message) : { success: true, data: null };
  },

  // ── Ratings & reviews ──────────────────────────────────────────────────
  async getRatingSummary(restaurantId: string): Promise<ServiceResult<RatingSummary>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase.from('restaurant_rating_summary').select('*').eq('restaurant_id', restaurantId).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return { success: true, data: EMPTY_SUMMARY };
    return {
      success: true,
      data: {
        average: Number(data.average_rating) || 0,
        count: data.review_count ?? 0,
        breakdown: { 5: data.stars_5 ?? 0, 4: data.stars_4 ?? 0, 3: data.stars_3 ?? 0, 2: data.stars_2 ?? 0, 1: data.stars_1 ?? 0 },
      },
    };
  },

  async listReviews(restaurantId: string, limit = 50): Promise<ServiceResult<RestaurantReview[]>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase
      .from('restaurant_reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return fail(error.message);
    const people = await fetchPeople((data ?? []).map((r) => r.user_id));
    return { success: true, data: (data ?? []).map((r) => ({ ...r, author: people.get(r.user_id) })) as RestaurantReview[] };
  },

  async submitReview(
    restaurantId: string,
    userId: string,
    review: { rating: number; body: string; photos: string[] },
  ): Promise<ServiceResult<RestaurantReview>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    if (restaurantId === userId) return { success: false, error: "You can't rate your own restaurant." };
    const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
    const { data, error } = await supabase
      .from('restaurant_reviews')
      .upsert(
        {
          restaurant_id: restaurantId,
          user_id: userId,
          rating,
          body: review.body.trim() || null,
          photos: review.photos.slice(0, 4),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'restaurant_id,user_id' },
      )
      .select('*')
      .single();
    if (error) return fail(error.message);
    return { success: true, data: data as RestaurantReview };
  },

  // ── Restaurant posts ───────────────────────────────────────────────────
  async listPosts(restaurantId: string): Promise<ServiceResult<RestaurantPost[]>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase
      .from('restaurant_posts')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return fail(error.message);
    return { success: true, data: (data ?? []) as RestaurantPost[] };
  },

  async createPost(
    restaurantId: string,
    post: { kind: PostKind; title: string; body: string; media_url: string | null; media_type: 'image' | 'video' | null; event_at: string | null },
  ): Promise<ServiceResult<RestaurantPost>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { data, error } = await supabase
      .from('restaurant_posts')
      .insert({
        restaurant_id: restaurantId,
        kind: post.kind,
        title: post.title.trim() || null,
        body: post.body.trim() || null,
        media_url: post.media_url,
        media_type: post.media_url ? post.media_type : null,
        event_at: post.event_at,
      })
      .select('*')
      .single();
    if (error) return fail(error.message);
    return { success: true, data: data as RestaurantPost };
  },

  async deletePost(restaurantId: string, postId: string): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const { error } = await supabase.from('restaurant_posts').delete().eq('id', postId).eq('restaurant_id', restaurantId);
    return error ? fail(error.message) : { success: true, data: null };
  },

  // ── Mentions & Tags ────────────────────────────────────────────────────
  /** Customers' published posts at the restaurant's place + written reviews, newest first. */
  async listMentions(restaurantId: string, placeId: string | null): Promise<ServiceResult<Mention[]>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');

    const [cardsRes, reviewsRes] = await Promise.all([
      placeId
        ? supabase
            .from('food_cards')
            .select('*')
            .eq('place_id', placeId)
            .eq('status', 'PUBLISHED')
            .neq('user_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(60)
        : Promise.resolve({ data: [] as FoodCardRecord[], error: null }),
      supabase
        .from('restaurant_reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('body', 'is', null)
        .order('created_at', { ascending: false })
        .limit(60),
    ]);
    if (cardsRes.error) return fail(cardsRes.error.message);

    const cards = (cardsRes.data ?? []) as FoodCardRecord[];
    const reviews = (reviewsRes.error ? [] : reviewsRes.data ?? []) as RestaurantReview[];
    const people = await fetchPeople([...cards.map((c) => c.user_id), ...reviews.map((r) => r.user_id)]);

    const items: Mention[] = [
      ...cards.map((card) => ({ kind: 'card' as const, id: `card-${card.id}`, created_at: card.created_at, author: people.get(card.user_id), card })),
      ...reviews.map((review) => ({ kind: 'review' as const, id: `review-${review.id}`, created_at: review.created_at, author: people.get(review.user_id), review })),
    ];
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, data: items };
  },

  // ── Discovery (Scout map) ──────────────────────────────────────────────
  /**
   * For a batch of Google place_ids (e.g. the pins on the Scout map), returns
   * the ones linked to a FUZO restaurant account, keyed by place_id.
   */
  async findByPlaceIds(placeIds: string[]): Promise<ServiceResult<Map<string, FuzoRestaurantLink>>> {
    const out = new Map<string, FuzoRestaurantLink>();
    const ids = [...new Set(placeIds.filter(Boolean))].slice(0, 200);
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    if (ids.length === 0) return { success: true, data: out };

    // select('*') so this keeps working before lat/lng exist (older schema).
    const { data: rows, error } = await supabase.from('restaurant_profiles').select('*').in('place_id', ids);
    if (error) return fail(error.message);
    (await toLinks((rows ?? []) as ProfileRow[])).forEach((link) => link.placeId && out.set(link.placeId, link));
    return { success: true, data: out };
  },

  /**
   * Every FUZO restaurant with a map location within radiusMeters of a point -
   * so Scout shows them even when Google doesn't return them (or they aren't
   * on Google at all).
   */
  async listInArea(center: { lat: number; lng: number }, radiusMeters: number): Promise<ServiceResult<FuzoRestaurantLink[]>> {
    const supabase = createClient();
    if (!supabase) return fail('Supabase not configured');
    const dLat = radiusMeters / 111320;
    const dLng = radiusMeters / (111320 * Math.max(0.01, Math.cos((center.lat * Math.PI) / 180)));
    const { data: rows, error } = await supabase
      .from('restaurant_profiles')
      .select('*')
      .gte('lat', center.lat - dLat)
      .lte('lat', center.lat + dLat)
      .gte('lng', center.lng - dLng)
      .lte('lng', center.lng + dLng)
      .limit(200);
    if (error) return fail(error.message);
    return { success: true, data: await toLinks((rows ?? []) as ProfileRow[]) };
  },

  // ── Media ──────────────────────────────────────────────────────────────
  async uploadImage(file: File): Promise<ServiceResult<string>> {
    if (!file.type.startsWith('image/')) return { success: false, error: 'Please choose an image file.' };
    try {
      return await MediaUploadService.uploadDataUrlImage(await fileToDataUrl(file));
    } catch {
      return { success: false, error: 'Could not read that photo.' };
    }
  },

  async uploadVideo(file: File): Promise<ServiceResult<string>> {
    return MediaUploadService.uploadVideo(file);
  },
};
