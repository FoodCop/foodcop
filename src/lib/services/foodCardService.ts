/**
 * FOOD CARD SERVICE
 * The "saveCard() fix" from card_creation_analysis.md §5 and
 * fuzo-recommendation-engine-solution.md §4: a single write path used by
 * every Create Card studio (Recipe/Restaurant/Video/Discovery families) that
 * always persists flavor_profile + tags, regardless of card_type — the old
 * demo flow only did this for RECIPE cards.
 *
 * Restaurant-family cards additionally dual-write to fuzo_locations via the
 * existing ScoutPersistence.saveScoutFind, so new cards keep appearing on the
 * Scout map without any change to ScoutView's query. This mirrors the
 * "multi-channel persistence" convention already established by
 * legacy snapPersistence.ts.
 */

import { createClient } from '@/lib/supabase/client';
import { ScoutPersistence } from '@/lib/services/scoutPersistence';
import { PointsService, type PointsActionType } from '@/lib/services/pointsService';
import type { ServiceResult } from '@/lib/types/serviceResult';
import {
  familyOf,
  type CardTags,
  type FlavorVector,
  type FoodCardFamily,
  type FoodCardRecord,
  type FoodCardType,
} from '@/lib/types/foodCard';

const FAMILY_ACTION_TYPE: Record<FoodCardFamily, PointsActionType> = {
  recipe: 'create_recipe',
  restaurant: 'create_restaurant',
  video: 'create_video',
  discovery: 'create_discovery',
};

// Best-effort, non-blocking - mirrors the existing Scout dual-write
// convention below: a points-award failure should never fail the card write.
// Idempotent via points_ledger's unique key, so calling this for a card
// that's already been awarded (e.g. re-publishing) is a safe no-op.
const awardCardPoints = async (card: FoodCardRecord) => {
  try {
    await PointsService.awardPoints({
      actionType: FAMILY_ACTION_TYPE[familyOf(card.card_type)],
      sourceType: 'food_card',
      sourceId: card.id,
    });
  } catch (pointsError) {
    console.warn('food_cards points award failed:', pointsError);
  }
};

export interface CreateFoodCardInput {
  cardType: FoodCardType;
  title: string;
  caption?: string;
  tags: CardTags;
  flavorProfile: FlavorVector;
  ingredients?: [string, string, string][];
  nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number };
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  mediaUrl?: string | null;
  imageUrl?: string | null;
}

export const foodCardService = {
  async createFoodCard(
    input: CreateFoodCardInput,
    status: 'DRAFT' | 'PUBLISHED',
  ): Promise<ServiceResult<FoodCardRecord>> {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: 'You must be logged in to create a food card' };
    }

    const family = familyOf(input.cardType);
    const isRecipe = family === 'recipe';
    const isRestaurant = family === 'restaurant';
    const isVideo = family === 'video';

    const row = {
      user_id: userId,
      card_type: input.cardType,
      title: input.title || 'Untitled',
      caption: input.caption || null,
      tags: input.tags,
      flavor_profile: input.flavorProfile,
      ingredients: isRecipe ? (input.ingredients || []).filter((row) => row[0]) : [],
      nutrition: isRecipe ? input.nutrition || {} : {},
      place_id: isRestaurant ? input.placeId ?? null : null,
      lat: isRestaurant ? input.lat ?? null : null,
      lng: isRestaurant ? input.lng ?? null : null,
      media_url: isVideo ? input.mediaUrl ?? null : null,
      image_url: input.imageUrl ?? null,
      status,
      stats: { likes: 0, saves: 0 },
    };

    const { data, error } = await supabase.from('food_cards').insert(row).select().single();
    if (error) {
      return { success: false, error: error.message };
    }

    if (isRestaurant && input.lat != null && input.lng != null) {
      try {
        await ScoutPersistence.saveScoutFind(userId, {
          name: input.title,
          category: input.tags.cuisine[0] || input.cardType,
          lat: input.lat,
          lng: input.lng,
          address: input.address || '',
          notes: input.caption || '',
          photos: input.imageUrl ? [input.imageUrl] : [],
          tags: input.tags.cuisine,
        });
      } catch (dualWriteError) {
        console.warn('food_cards Scout map dual-write failed:', dualWriteError);
      }
    }

    const card = data as FoodCardRecord;
    if (status === 'PUBLISHED') {
      await awardCardPoints(card);
    }

    return { success: true, data: card };
  },

  async listMyCards(userId: string): Promise<ServiceResult<FoodCardRecord[]>> {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data, error } = await supabase
      .from('food_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as FoodCardRecord[] };
  },

  // Promotes a DRAFT card to PUBLISHED (e.g. from the Activity tab's Your
  // Cards grid) - the only other place a card can become PUBLISHED besides
  // creation time, so it shares the same points-award call.
  async publishCard(cardId: string): Promise<ServiceResult<FoodCardRecord>> {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const { data, error } = await supabase
      .from('food_cards')
      .update({ status: 'PUBLISHED' })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const card = data as FoodCardRecord;
    await awardCardPoints(card);

    return { success: true, data: card };
  },
};

export default foodCardService;
