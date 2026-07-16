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
import type { ServiceResult } from '@/lib/types/serviceResult';
import {
  familyOf,
  type CardTags,
  type FlavorVector,
  type FoodCardRecord,
  type FoodCardType,
} from '@/lib/types/foodCard';

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

    return { success: true, data: data as FoodCardRecord };
  },
};

export default foodCardService;
