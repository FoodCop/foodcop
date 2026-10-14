/**
 * COMMUNITY PLACES - restaurants FUZO members add when they aren't on the map
 * yet (Create -> Restaurant -> "Add a new restaurant"; client, 2026-10-14,
 * plan Phase 7). Migration: 20261014020000_community_places.sql.
 *
 * - add(): the database refuses a place when a FUZO restaurant or another
 *   community place with a similar name is within ~150 m.
 * - findDuplicates(): the same check plus Google's places there, so the
 *   form can point the user to the existing place before they post.
 * - vote(): once per person, "Yes, it's real" or "Not real". At 100 votes a
 *   2/3 majority verifies or removes the place.
 */

import { createClient } from '@/lib/supabase/client';
import { PlacesService } from '@/lib/services/placesService';
import type { ServiceResult } from '@/lib/types/serviceResult';

export const PLACE_CATEGORIES = ['Restaurant', 'Café', 'Street food', 'Bakery', 'Dessert', 'Bar', 'Food truck', 'Dhaba', 'Other'] as const;

/** Votes needed before the community decides. */
export const VOTES_TO_DECIDE = 100;

export type CommunityPlaceStatus = 'community' | 'verified' | 'removed';

export interface CommunityPlace {
  id: string;
  createdBy: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  category: string;
  businessIdentity: string[];
  cuisines: string[];
  priceLevel: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  status: CommunityPlaceStatus;
  yes: number;
  no: number;
}

/** What the user fills in for a new restaurant (kept on drafts as food_cards.new_place). */
export interface NewPlaceFields {
  name: string;
  lat: number | null;
  lng: number | null;
  address: string;
  category: string;
  businessIdentity: string[];
  cuisines: string[];
  priceLevel: string | null;
  hours: string;
  phone: string;
  website: string;
}

export const emptyNewPlace = (): NewPlaceFields => ({
  name: '',
  lat: null,
  lng: null,
  address: '',
  category: '',
  businessIdentity: [],
  cuisines: [],
  priceLevel: null,
  hours: '',
  phone: '',
  website: '',
});

/** An existing place the new one would duplicate. */
export interface PlaceDuplicate {
  kind: 'restaurant' | 'community' | 'google';
  /** FUZO restaurant / community place id (not for Google). */
  id?: string;
  name: string;
  lat: number;
  lng: number;
  /** Google place id, when known. */
  placeId?: string | null;
  address?: string | null;
}

export interface VoteState {
  status: CommunityPlaceStatus;
  yes: number;
  no: number;
  myVote: boolean | null;
}

type Row = {
  id: string;
  created_by: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  category: string;
  business_identity: string[] | null;
  cuisines: string[] | null;
  price_level: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  status: CommunityPlaceStatus;
  yes_votes: number;
  no_votes: number;
};

const fromRow = (r: Row): CommunityPlace => ({
  id: r.id,
  createdBy: r.created_by,
  name: r.name,
  lat: Number(r.lat),
  lng: Number(r.lng),
  address: r.address,
  category: r.category,
  businessIdentity: r.business_identity ?? [],
  cuisines: r.cuisines ?? [],
  priceLevel: r.price_level,
  hours: r.hours,
  phone: r.phone,
  website: r.website,
  status: r.status,
  yes: r.yes_votes,
  no: r.no_votes,
});

/** Same idea as the database's place_names_match(): "The Spice-Route" ~ "Spice Route Cafe". */
const nameKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/^\s*the\s+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
export const namesMatch = (a: string, b: string) => {
  const x = nameKey(a);
  const y = nameKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x));
};

const metersBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

/** A plain http(s) link for a website someone typed ("spot.com" -> "https://spot.com"). */
export const websiteHref = (site: string) => (/^https?:\/\//i.test(site) ? site : `https://${site}`);

const REASONS: Record<string, string> = {
  name: 'Add the restaurant name.',
  location: 'Set the restaurant on the map.',
  category: 'Pick a category.',
  website: "That website doesn't look right.",
  limit: 'You can add up to 5 new places a day. Try again tomorrow.',
};

export const CommunityPlacesService = {
  /**
   * Places on FUZO or Google with a similar name within ~150 m. FUZO's check
   * is the same one add() enforces; Google's is checked here.
   */
  async findDuplicates(name: string, lat: number, lng: number): Promise<PlaceDuplicate[]> {
    if (nameKey(name).length < 2) return [];
    const supabase = createClient();
    const [fuzo, google] = await Promise.all([
      supabase
        ? supabase.rpc('find_place_duplicates', { p_name: name, p_lat: lat, p_lng: lng }).then(({ data }) => (data ?? []) as Array<{ kind: 'restaurant' | 'community'; id: string; name: string; lat: number; lng: number; place_id: string | null }>)
        : Promise.resolve([]),
      PlacesService.searchNearby(lat, lng, 150).then((res) => res.data?.results ?? []).catch(() => []),
    ]);
    const out: PlaceDuplicate[] = fuzo.map((d) => ({ kind: d.kind, id: d.id, name: d.name, lat: Number(d.lat), lng: Number(d.lng), placeId: d.place_id }));
    for (const g of google) {
      const gl = g.geometry?.location;
      if (!g.name || typeof gl?.lat !== 'number' || typeof gl?.lng !== 'number') continue;
      if (!namesMatch(name, g.name) || metersBetween({ lat, lng }, { lat: gl.lat, lng: gl.lng }) > 150) continue;
      if (g.place_id && out.some((o) => o.placeId === g.place_id)) continue;
      out.push({ kind: 'google', name: g.name, lat: gl.lat, lng: gl.lng, placeId: g.place_id ?? null, address: g.formatted_address || g.vicinity || null });
    }
    return out.slice(0, 5);
  },

  /** Adds the place. On a duplicate, `duplicate` says which place it is. */
  async add(fields: NewPlaceFields): Promise<ServiceResult<string> & { duplicate?: PlaceDuplicate }> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    if (fields.lat == null || fields.lng == null) return { success: false, error: REASONS.location };

    // Google first (the database can't ask Google).
    const google = (await this.findDuplicates(fields.name, fields.lat, fields.lng)).find((d) => d.kind === 'google');
    if (google) return { success: false, error: `${google.name} is already on the map.`, duplicate: google };

    const { data, error } = await supabase.rpc('add_community_place', {
      p_name: fields.name,
      p_lat: fields.lat,
      p_lng: fields.lng,
      p_category: fields.category,
      p_address: fields.address || null,
      p_business_identity: fields.businessIdentity,
      p_cuisines: fields.cuisines,
      p_price_level: fields.priceLevel,
      p_hours: fields.hours || null,
      p_phone: fields.phone || null,
      p_website: fields.website || null,
    });
    if (error) {
      const missing = /add_community_place|schema cache|PGRST202/i.test(error.message);
      return { success: false, error: missing ? 'Adding new restaurants needs the latest database update.' : error.message };
    }
    const res = data as { ok: boolean; id?: string; reason?: string; duplicate?: { kind: 'restaurant' | 'community'; id: string; name: string; lat: number; lng: number; placeId: string | null } };
    if (res.ok && res.id) return { success: true, data: res.id };
    if (res.reason === 'duplicate' && res.duplicate) {
      const d = res.duplicate;
      return { success: false, error: `${d.name} is already on the map.`, duplicate: { kind: d.kind, id: d.id, name: d.name, lat: d.lat, lng: d.lng, placeId: d.placeId } };
    }
    return { success: false, error: REASONS[res.reason ?? ''] ?? 'Could not add the place.' };
  },

  async get(id: string): Promise<CommunityPlace | null> {
    const supabase = createClient();
    if (!supabase) return null;
    const { data } = await supabase.from('community_places').select('*').eq('id', id).maybeSingle();
    return data ? fromRow(data as Row) : null;
  },

  /** Community places (not removed) inside a radius - for Scout's map. */
  async listInArea(center: { lat: number; lng: number }, radiusMeters: number): Promise<CommunityPlace[]> {
    const supabase = createClient();
    if (!supabase) return [];
    const dLat = radiusMeters / 111320;
    const dLng = radiusMeters / (111320 * Math.max(0.01, Math.cos((center.lat * Math.PI) / 180)));
    const { data, error } = await supabase
      .from('community_places')
      .select('*')
      .neq('status', 'removed')
      .gte('lat', center.lat - dLat)
      .lte('lat', center.lat + dLat)
      .gte('lng', center.lng - dLng)
      .lte('lng', center.lng + dLng)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error || !data) return []; // e.g. before the migration is applied
    return (data as Row[]).map(fromRow);
  },

  /** The signed-in user's vote on a place (null = not voted / signed out). */
  async myVote(placeId: string): Promise<boolean | null> {
    const supabase = createClient();
    if (!supabase) return null;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return null;
    const { data } = await supabase.from('community_place_votes').select('is_real').eq('place_id', placeId).eq('user_id', auth.user.id).maybeSingle();
    return data ? (data.is_real as boolean) : null;
  },

  async vote(placeId: string, isReal: boolean): Promise<ServiceResult<VoteState>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { success: false, error: 'Sign in to vote.' };
    const { data, error } = await supabase.rpc('vote_community_place', { p_place_id: placeId, p_is_real: isReal });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as VoteState };
  },
};

export default CommunityPlacesService;
