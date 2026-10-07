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
};
