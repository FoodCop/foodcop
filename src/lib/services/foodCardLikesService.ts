/**
 * FOOD CARD LIKES SERVICE
 * The Feed's swipe-right "like" (supabase/migrations/20261006020000_food_card_likes.sql).
 * Kept apart from saved_items: a like isn't a save - swiping down saves to
 * My Plate, swiping right only likes.
 */

import { createClient } from '../supabase/client';

type Result = { success: boolean; error?: string };

export const FoodCardLikesService = {
  async like(cardId: string): Promise<Result> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) return { success: false, error: 'User not authenticated' };

    // Liking twice is fine - the (user, card) key just keeps one row.
    const { error } = await client
      .from('food_card_likes')
      .upsert({ user_id: user.id, card_id: cardId }, { onConflict: 'user_id,card_id', ignoreDuplicates: true });
    return error ? { success: false, error: error.message } : { success: true };
  },

  async unlike(cardId: string): Promise<Result> {
    const client = createClient();
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) return { success: false, error: 'User not authenticated' };
    const { error } = await client.from('food_card_likes').delete().eq('user_id', user.id).eq('card_id', cardId);
    return error ? { success: false, error: error.message } : { success: true };
  },

  /** Which of these cards the signed-in user liked. */
  async likedAmong(cardIds: string[]): Promise<Set<string>> {
    const client = createClient();
    if (!client || !cardIds.length) return new Set();
    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) return new Set();
    const { data } = await client.from('food_card_likes').select('card_id').eq('user_id', user.id).in('card_id', cardIds.slice(0, 100));
    return new Set((data ?? []).map((r) => r.card_id as string));
  },

  /** How many people liked each card (numbers only; 20261016010000_card_like_counts.sql). */
  async counts(cardIds: string[]): Promise<Record<string, number>> {
    const client = createClient();
    if (!client || !cardIds.length) return {};
    const { data, error } = await client.rpc('get_card_like_counts', { p_ids: cardIds.slice(0, 100) });
    if (error || !data) return {};
    return Object.fromEntries((data as { card_id: string; likes: number }[]).map((r) => [r.card_id, Number(r.likes) || 0]));
  },
};
