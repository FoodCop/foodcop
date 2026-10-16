/**
 * TRIMS - the Home "Trims" reel: real member videos, newest first (client,
 * 2026-10-16: "no demo clips, use real clips"; plan: docs/VIDEO_URL_PLAN.md,
 * phase 3). Published video posts that have an uploaded video (imported
 * links come with URL import). Privacy follows the database: a private
 * profile's videos only come back for people allowed to see them.
 */

import { createClient } from '@/lib/supabase/client';
import { VIDEO_CARD_TYPES, type FoodCardRecord } from '@/lib/types/foodCard';
import type { ServiceResult } from '@/lib/types/serviceResult';

export interface TrimAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Trim {
  card: FoodCardRecord;
  author: TrimAuthor;
}

export const TRIMS_PAGE = 10;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function withAuthors(cards: FoodCardRecord[]): Promise<Trim[]> {
  const supabase = createClient();
  if (!supabase || !cards.length) return [];
  const ids = [...new Set(cards.map((c) => c.user_id))];
  const { data } = await supabase.from('users').select('id, display_name, username, avatar_url').in('id', ids);
  const byId = new Map(
    (data ?? []).map((u) => [
      u.id as string,
      { id: u.id as string, name: (u.display_name as string) || (u.username as string) || 'FUZO member', avatar: (u.avatar_url as string) || null },
    ]),
  );
  return cards.map((card) => ({ card, author: byId.get(card.user_id) ?? { id: card.user_id, name: 'FUZO member', avatar: null } }));
}

export const TrimsService = {
  /** A page of the reel. Pass the last trim's created_at to get the next page. */
  async list(before?: string, limit = TRIMS_PAGE): Promise<ServiceResult<Trim[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };
    let query = supabase
      .from('food_cards')
      .select('*')
      .eq('status', 'PUBLISHED')
      .in('card_type', VIDEO_CARD_TYPES)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (before) query = query.lt('created_at', before);
    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    // Only real uploads play in the reel (older cards may hold other links).
    const cards = ((data ?? []) as FoodCardRecord[]).filter((c) => /^https:\/\//i.test(c.media_url ?? ''));
    return { success: true, data: await withAuthors(cards) };
  },

  /** One trim by its post id (shared links), if the viewer may see it. */
  async get(cardId: string): Promise<Trim | null> {
    const supabase = createClient();
    if (!supabase || !UUID.test(cardId)) return null;
    const { data } = await supabase.from('food_cards').select('*').eq('id', cardId).eq('status', 'PUBLISHED').in('card_type', VIDEO_CARD_TYPES).maybeSingle();
    const card = data as FoodCardRecord | null;
    if (!card?.media_url) return null;
    return (await withAuthors([card]))[0] ?? null;
  },
};

export default TrimsService;
