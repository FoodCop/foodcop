import { supabase } from './supabase';
import type { 
  SaveItemParams, 
  SavedItem, 
  Restaurant, 
  PlateResponse, 
  ListSavedItemsParams,
  SavedItemsResponse 
} from '../types/plate';
import { AuthService } from './authService';
import { DeduplicationService } from './deduplicationService';

/**
 * Plate service for save-to-plate functionality
 * Provides idempotent operations for saving and managing user's food items
 */
export class PlateService {
  private static readonly APP_TENANT_ID = '00000000-0000-4000-8000-000000000001';

  /**
   * Idempotent save operation - returns success even if already saved
   */
  static async saveToPlate(params: SaveItemParams): Promise<PlateResponse<SavedItem>> {
    try {
      // Validate required fields
      if (!params.itemId || !params.itemType) {
        throw new Error('itemId and itemType are required');
      }

      // Ensure user is authenticated
      const user = await AuthService.ensureAuthenticated();

      console.log('💾 Saving to plate:', {
        user_id: user.id,
        item_type: params.itemType,
        item_id: params.itemId,
        metadata: params.metadata ? 'provided' : 'null'
      });

      const { data, error } = await supabase
        .from('saved_items')
        .upsert({
          user_id: user.id,
          item_type: params.itemType,
          item_id: params.itemId.toString(),
          metadata: params.metadata || {},
          tenant_id: this.APP_TENANT_ID
        }, {
          onConflict: 'tenant_id,user_id,item_type,item_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving to plate:', error);
        throw new Error(error.message);
      }

      console.log('✅ Successfully saved to plate:', data);
      return {
        success: true,
        data,
        message: `${params.itemType} saved to plate successfully`
      };
    } catch (error) {
      console.error('Error in saveToPlate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save to plate'
      };
    }
  }

  /**
   * Save restaurant with comprehensive metadata validation
   */
  static async saveRestaurant(restaurant: Restaurant): Promise<PlateResponse<SavedItem>> {
    try {
      // Validate required restaurant fields
      if (!restaurant?.id || !restaurant?.name) {
        throw new Error('Restaurant must have id and name');
      }

      // Check for address in multiple formats
      const hasAddress = restaurant.address || 
                        restaurant.vicinity || 
                        restaurant.formatted_address;
      if (!hasAddress) {
        throw new Error('Restaurant must have address information');
      }

      // Check for coordinates in multiple formats
      const hasLocation = (restaurant.latitude && restaurant.longitude) || 
                         (restaurant.lat && restaurant.lng) ||
                         (restaurant.coordinates?.lat && restaurant.coordinates?.lng) ||
                         (restaurant.geometry?.location?.lat && restaurant.geometry?.location?.lng);
      if (!hasLocation) {
        throw new Error('Restaurant must have coordinate information');
      }

      // Normalize restaurant metadata
      const metadata = {
        ...restaurant,
        restaurant_id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address || restaurant.vicinity || restaurant.formatted_address || 'Address not available',
        latitude: restaurant.latitude || restaurant.lat || 
                 restaurant.coordinates?.lat || restaurant.geometry?.location?.lat || 0,
        longitude: restaurant.longitude || restaurant.lng || 
                  restaurant.coordinates?.lng || restaurant.geometry?.location?.lng || 0,
        saved_at: new Date().toISOString(),
        saved_from: 'ViteApp',
        saved_method: restaurant.search_method || 'unknown',
        types: restaurant.types || [],
        photos: restaurant.photos || [],
        rating: restaurant.rating,
        price_level: restaurant.price_level,
        user_ratings_total: restaurant.user_ratings_total
      };

      return await this.saveToPlate({
        itemId: restaurant.id,
        itemType: 'restaurant',
        metadata
      });
    } catch (error) {
      console.error('Error in saveRestaurant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save restaurant'
      };
    }
  }

  /**
   * Check if item is already saved (idempotent check)
   */
  static async isItemSaved(itemType: string, itemId: string): Promise<PlateResponse<boolean>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking if item is saved:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        data: !!data,
        message: data ? 'Item is already saved' : 'Item is not saved'
      };
    } catch (error) {
      console.error('Error in isItemSaved:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check if item is saved'
      };
    }
  }

  /**
   * List saved items with filtering and pagination
   */
  static async listSavedItems(params: ListSavedItemsParams = {}): Promise<SavedItemsResponse> {
    try {
      const user = await AuthService.ensureAuthenticated();

      let query = supabase
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
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error listing saved items:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data || [],
        total: count || data?.length || 0
      };
    } catch (error) {
      console.error('Error in listSavedItems:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get saved restaurants specifically
   */
  static async getSavedRestaurants(limit?: number, offset?: number): Promise<SavedItemsResponse> {
    return this.listSavedItems({ 
      itemType: 'restaurant', 
      limit, 
      offset 
    });
  }

  /**
   * Remove item from plate
   */
  static async removeFromPlate(itemType: string, itemId: string): Promise<PlateResponse<void>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (error) {
        console.error('Error removing from plate:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Item removed from plate successfully'
      };
    } catch (error) {
      console.error('Error in removeFromPlate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to remove from plate'
      };
    }
  }

  /**
   * Get total count of saved items by type
   */
  static async getItemCount(itemType?: string): Promise<PlateResponse<number>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      let query = supabase
        .from('saved_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error getting item count:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        data: count || 0,
        message: `Found ${count || 0} saved items`
      };
    } catch (error) {
      console.error('Error in getItemCount:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: 0,
        message: 'Failed to get item count'
      };
    }
  }

  /**
   * Enhanced save with duplicate detection and normalization
   */
  static async saveToPlateEnhanced(params: SaveItemParams): Promise<PlateResponse<SavedItem> & {
    isDuplicate?: boolean;
    similarItems?: SavedItem[];
    duplicateCheck?: {
      exactDuplicate: SavedItem | null;
      similarItems: SavedItem[];
      shouldWarn: boolean;
    };
  }> {
    try {
      // Validate required fields
      if (!params.itemId || !params.itemType) {
        throw new Error('itemId and itemType are required');
      }

      // Normalize the item ID to prevent format-based duplicates
      const normalizedId = DeduplicationService.normalizeItemId(params.itemType, params.itemId);
      
      console.log('🔍 Enhanced save with duplicate detection:', {
        originalId: params.itemId,
        normalizedId,
        itemType: params.itemType
      });

      // Perform comprehensive duplicate check
      const duplicateCheck = await DeduplicationService.performDuplicateCheck(
        params.metadata || { id: normalizedId }, 
        params.itemType
      );

      // If exact duplicate exists, return it
      if (duplicateCheck.exactDuplicate) {
        console.log('✅ Item already saved, returning existing:', duplicateCheck.exactDuplicate.id);
        return {
          success: true,
          data: duplicateCheck.exactDuplicate,
          message: `${params.itemType} already saved to plate`,
          isDuplicate: true,
          duplicateCheck
        };
      }

      // Proceed with save using normalized ID
      const saveResult = await this.saveToPlate({
        ...params,
        itemId: normalizedId
      });

      // Add duplicate check information to response
      return {
        ...saveResult,
        duplicateCheck
      };

    } catch (error) {
      console.error('Error in saveToPlateEnhanced:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save to plate with duplicate detection'
      };
    }
  }

  /**
   * Check for existing item with duplicate detection
   */
  static async checkForDuplicates(
    itemId: string | number, 
    itemType: string,
    metadata?: Record<string, unknown>
  ): Promise<{
    exactDuplicate: SavedItem | null;
    similarItems: SavedItem[];
    shouldWarn: boolean;
  }> {
    try {
      return await DeduplicationService.performDuplicateCheck(
        metadata || { id: itemId }, 
        itemType
      );
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return {
        exactDuplicate: null,
        similarItems: [],
        shouldWarn: false
      };
    }
  }

  /**
   * Get duplicate statistics for current user
   */
  static async getDuplicateAnalysis(): Promise<PlateResponse<{
    totalItems: number;
    potentialDuplicates: number;
    duplicateGroups: Array<{
      items: SavedItem[];
      similarity: number;
      type: 'exact' | 'similar';
    }>;
  }>> {
    try {
      const stats = await DeduplicationService.getDuplicateStats();
      
      return {
        success: true,
        data: stats,
        message: `Found ${stats.duplicateGroups.length} potential duplicate groups`
      };
    } catch (error) {
      console.error('Error getting duplicate analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to analyze duplicates'
      };
    }
  }

  /**
   * Get the Supabase client instance (for advanced usage)
   */
  static getSupabaseClient() {
    return supabase;
  }
}