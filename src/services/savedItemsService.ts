import { supabase } from './supabase';

// TypeScript interfaces
export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'restaurant' | 'recipe' | 'photo' | 'video' | 'other';
  item_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SaveItemParams {
  itemId: string;
  itemType: 'restaurant' | 'recipe' | 'photo' | 'video' | 'other';
  metadata?: Record<string, unknown>;
}

export interface ListSavedItemsParams {
  itemType?: 'restaurant' | 'recipe' | 'photo' | 'video' | 'other';
  limit?: number;
  offset?: number;
}

export interface SavedItemsServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * SavedItems Service - Manages user's saved content
 */
export class SavedItemsService {
  private supabase = supabase;

  /**
   * Save an item to the user's plate
   */
  async saveItem(params: SaveItemParams): Promise<SavedItemsServiceResult<SavedItem>> {
    try {
      console.log('🔐 SavedItemsService: Getting user from Supabase auth...');
      const { data: { user } } = await this.supabase.auth.getUser();

      console.log('👤 SavedItemsService: User from auth.getUser():', user);

      if (!user) {
        console.log('❌ SavedItemsService: No user found in auth.getUser()');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      console.log('✅ SavedItemsService: User authenticated, checking existing items...');

      // Check if item already exists
      const { data: existingItems } = await this.supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', params.itemId)
        .eq('item_type', params.itemType);

      if (existingItems && existingItems.length > 0) {
        console.log('ℹ️ SavedItemsService: Item already exists');
        return {
          success: false,
          error: 'Item already saved'
        };
      }

      console.log('💾 SavedItemsService: Inserting new saved item...');

      // Insert new saved item
      const { data, error } = await this.supabase
        .from('saved_items')
        .insert({
          user_id: user.id,
          item_id: params.itemId,
          item_type: params.itemType,
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SavedItemsService: Supabase error saving item:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ SavedItemsService: Item saved successfully:', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('💥 SavedItemsService: Unexpected error in saveItem:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Save a restaurant to the user's plate with restaurant-specific metadata
   */
  async saveRestaurant(restaurant: {
    place_id: string;
    name: string;
    vicinity?: string;
    address?: string;
    lat?: number;
    lng?: number;
    rating?: number;
    price_level?: number;
    types?: string[];
    photos?: unknown[];
    phone?: string;
    website?: string;
    opening_hours?: unknown;
    [key: string]: unknown;
  }): Promise<SavedItemsServiceResult<SavedItem>> {
    const metadata = {
      name: restaurant.name,
      vicinity: restaurant.vicinity || restaurant.address,
      address: restaurant.address || restaurant.vicinity,
      latitude: restaurant.lat,
      longitude: restaurant.lng,
      rating: restaurant.rating,
      price_level: restaurant.price_level,
      types: restaurant.types,
      photos: restaurant.photos,
      phone: restaurant.phone,
      website: restaurant.website,
      opening_hours: restaurant.opening_hours,
      place_id: restaurant.place_id,
      search_method: 'google_places',
      restaurant_type: 'food_establishment'
    };

    return this.saveItem({
      itemId: restaurant.place_id,
      itemType: 'restaurant',
      metadata
    });
  }

  /**
   * Check if an item is already saved by the user
   */
  async isItemSaved(params: Omit<SaveItemParams, 'metadata'>): Promise<SavedItemsServiceResult<boolean>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { data, error } = await this.supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', params.itemId)
        .eq('item_type', params.itemType);

      if (error) {
        console.error('Supabase error checking saved item:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: (data && data.length > 0)
      };
    } catch (error) {
      console.error('Unexpected error in isItemSaved:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Remove an item from the user's saved items
   */
  async unsaveItem(params: Omit<SaveItemParams, 'metadata'>): Promise<SavedItemsServiceResult<boolean>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { error } = await this.supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', params.itemId)
        .eq('item_type', params.itemType);

      if (error) {
        console.error('Supabase error removing saved item:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Unexpected error in unsaveItem:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * List all saved items for the user
   */
  async listSavedItems(params: ListSavedItemsParams = {}): Promise<SavedItemsServiceResult<SavedItem[]>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      let query = this.supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (params.itemType) {
        query = query.eq('item_type', params.itemType);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error listing saved items:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Unexpected error in listSavedItems:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }
}

// Export singleton instance
export const savedItemsService = new SavedItemsService();