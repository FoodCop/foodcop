import { supabaseBrowser } from '@/lib/supabase/client';

// TypeScript interfaces
export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'restaurant' | 'recipe' | 'photo' | 'other';
  item_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SaveItemParams {
  itemId: string;
  itemType: 'restaurant' | 'recipe' | 'photo' | 'other';
  metadata?: Record<string, any>;
}

export interface ListSavedItemsParams {
  itemType?: 'restaurant' | 'recipe' | 'photo' | 'other';
  limit?: number;
  offset?: number;
}

export interface SavedItemsServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SavedItemsService {
  private supabase = supabaseBrowser();

  /**
   * Save an item to the user's plate (idempotent operation)
   * Returns success even if item was already saved
   */
  async saveItem(params: SaveItemParams): Promise<SavedItemsServiceResult<SavedItem>> {
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
        .upsert({
          user_id: user.id,
          item_type: params.itemType,
          item_id: params.itemId,
          metadata: params.metadata || {}
        }, {
          onConflict: 'user_id,item_type,item_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving item:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Unexpected error in saveItem:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
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
        .eq('item_type', params.itemType)
        .eq('item_id', params.itemId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking if item is saved:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: !!data
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
   * List saved items for the current user with optional filtering
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
        query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error listing saved items:', error);
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
        .eq('item_type', params.itemType)
        .eq('item_id', params.itemId);

      if (error) {
        console.error('Error unsaving item:', error);
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
   * Get count of saved items by type for the current user
   */
  async getSavedItemsCount(): Promise<SavedItemsServiceResult<Record<string, number>>> {
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
        .select('item_type')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error getting saved items count:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const counts: Record<string, number> = {};
      data?.forEach((item: any) => {
        counts[item.item_type] = (counts[item.item_type] || 0) + 1;
      });

      return {
        success: true,
        data: counts
      };
    } catch (error) {
      console.error('Unexpected error in getSavedItemsCount:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  // Restaurant-specific helper methods

  /**
   * Save a restaurant to the user's plate with restaurant-specific metadata
   */
  async saveRestaurant(restaurant: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    rating?: number | null;
    price_level?: number | null;
    types?: string[];
    photos?: any[];
    search_method?: string;
    restaurant_type?: string;
    [key: string]: any;
  }): Promise<SavedItemsServiceResult<SavedItem>> {
    return this.saveItem({
      itemId: restaurant.id,
      itemType: 'restaurant',
      metadata: {
        // Core restaurant data
        ...restaurant,
        // Override with specific fields to ensure consistency
        restaurant_id: restaurant.id,
        saved_at: new Date().toISOString(),
        // Ensure arrays are properly formatted
        types: restaurant.types || [],
        photos: restaurant.photos || [],
        // Set defaults for optional fields
        search_method: restaurant.search_method || 'unknown',
        restaurant_type: restaurant.restaurant_type || 'all'
      }
    });
  }

  /**
   * Check if a restaurant is already saved
   */
  async isRestaurantSaved(restaurantId: string): Promise<SavedItemsServiceResult<boolean>> {
    return this.isItemSaved({
      itemId: restaurantId,
      itemType: 'restaurant'
    });
  }

  /**
   * Get all saved restaurants for the current user
   */
  async getSavedRestaurants(params: { limit?: number; offset?: number } = {}): Promise<SavedItemsServiceResult<SavedItem[]>> {
    return this.listSavedItems({
      itemType: 'restaurant',
      ...params
    });
  }

  /**
   * Remove a restaurant from saved items
   */
  async unsaveRestaurant(restaurantId: string): Promise<SavedItemsServiceResult<boolean>> {
    return this.unsaveItem({
      itemId: restaurantId,
      itemType: 'restaurant'
    });
  }

  /**
   * Get saved restaurants with enhanced data processing
   */
  async getProcessedSavedRestaurants(params: { limit?: number; offset?: number } = {}): Promise<SavedItemsServiceResult<any[]>> {
    try {
      const result = await this.getSavedRestaurants(params);
      
      if (!result.success || !result.data) {
        return result;
      }

      const processedRestaurants = result.data.map(savedItem => ({
        // Database fields
        id: savedItem.id,
        user_id: savedItem.user_id,
        item_id: savedItem.item_id,
        created_at: savedItem.created_at,
        updated_at: savedItem.updated_at,
        
        // Restaurant data from metadata
        restaurant_id: savedItem.item_id,
        name: savedItem.metadata.name,
        address: savedItem.metadata.address,
        latitude: savedItem.metadata.latitude,
        longitude: savedItem.metadata.longitude,
        rating: savedItem.metadata.rating,
        price_level: savedItem.metadata.price_level,
        types: savedItem.metadata.types || [],
        photos: savedItem.metadata.photos || [],
        
        // Context data
        search_method: savedItem.metadata.search_method,
        restaurant_type: savedItem.metadata.restaurant_type,
        saved_at: savedItem.metadata.saved_at,
        google_maps_url: savedItem.metadata.google_maps_url,
        
        // Display helpers
        display_rating: savedItem.metadata.rating ? `${savedItem.metadata.rating}/5` : 'No rating',
        display_price: savedItem.metadata.price_level ? '$'.repeat(savedItem.metadata.price_level) : 'No price info',
        display_types: (savedItem.metadata.types || []).slice(0, 3).join(', '),
        has_photos: (savedItem.metadata.photos || []).length > 0 || !!savedItem.metadata.photoUrl || !!savedItem.metadata.imageUrl,
        photo_url: savedItem.metadata.photoUrl || // New format 
                   savedItem.metadata.imageUrl || // Old format
                   (savedItem.metadata.photos || [])[0]?.photo_url || // Photos array
                   null,
        
        // Full metadata for debugging
        full_metadata: savedItem.metadata
      }));

      return {
        success: true,
        data: processedRestaurants
      };
    } catch (error) {
      console.error('Unexpected error in getProcessedSavedRestaurants:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }
}

// Export singleton instance
export const savedItemsService = new SavedItemsService();