import { supabase } from './supabase';
import { AuthService } from './authService';
import type { SavedItem, RecipeMetadata, Restaurant } from '../types/plate';

/**
 * Enhanced deduplication service for preventing duplicate saves
 * Handles ID normalization, semantic similarity, and user experience
 */
export class DeduplicationService {
  
  /**
   * Normalize item IDs to prevent format-based duplicates
   */
  static normalizeItemId(itemType: string, rawId: string | number): string {
    const idString = String(rawId).trim();
    
    switch (itemType) {
      case 'recipe':
        // Spoonacular recipe IDs - ensure numeric string only
        return idString.replace(/[^0-9]/g, '');
        
      case 'restaurant':
        // Google Places IDs - clean and normalize case
        return idString.toLowerCase().replace(/\s+/g, '');
        
      case 'video':
        // YouTube video IDs - extract from URLs if needed
        const videoIdMatch = idString.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        return videoIdMatch ? videoIdMatch[1] : idString;
        
      case 'photo':
        // Photo URLs/IDs - remove query parameters and fragments
        return idString.split('?')[0].split('#')[0];
        
      default:
        return idString;
    }
  }

  /**
   * Check if item already exists for current user
   */
  static async checkExistingItem(
    itemType: string, 
    itemId: string | number
  ): Promise<SavedItem | null> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return null;
      
      const normalizedId = this.normalizeItemId(itemType, itemId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', normalizedId)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing item:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in checkExistingItem:', error);
      return null;
    }
  }

  /**
   * Find similar recipes based on title similarity
   */
  static async findSimilarRecipes(
    recipeTitle: string, 
    userId?: string,
    threshold: number = 0.8
  ): Promise<SavedItem[]> {
    try {
      const currentUser = userId || (await AuthService.getCurrentUser())?.id;
      if (!currentUser) return [];
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', currentUser)
        .eq('item_type', 'recipe');
        
      if (error || !data) return [];
      
      const similar = data.filter(item => {
        const metadata = item.metadata as RecipeMetadata;
        if (!metadata?.title) return false;
        
        const similarity = this.calculateTitleSimilarity(recipeTitle, metadata.title);
        return similarity >= threshold;
      });
      
      return similar;
    } catch (error) {
      console.error('Error finding similar recipes:', error);
      return [];
    }
  }

  /**
   * Find similar restaurants based on name and location proximity
   */
  static async findSimilarRestaurants(
    restaurant: { name: string; lat?: number; lng?: number },
    userId?: string,
    distanceThreshold: number = 50 // meters
  ): Promise<SavedItem[]> {
    try {
      const currentUser = userId || (await AuthService.getCurrentUser())?.id;
      if (!currentUser) return [];
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', currentUser)
        .eq('item_type', 'restaurant');
        
      if (error || !data) return [];
      
      const similar = data.filter(item => {
        const metadata = item.metadata as any;
        if (!metadata) return false;
        
        // Check name similarity
        const nameSimilarity = this.calculateTitleSimilarity(
          restaurant.name, 
          metadata.name || ''
        );
        
        if (nameSimilarity > 0.8) return true;
        
        // Check location proximity if coordinates available
        if (restaurant.lat && restaurant.lng && metadata.lat && metadata.lng) {
          const distance = this.calculateLocationDistance(
            { lat: restaurant.lat, lng: restaurant.lng },
            { lat: metadata.lat, lng: metadata.lng }
          );
          
          return distance <= distanceThreshold;
        }
        
        return false;
      });
      
      return similar;
    } catch (error) {
      console.error('Error finding similar restaurants:', error);
      return [];
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  static calculateTitleSimilarity(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    
    // Normalize strings for comparison
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/[^a-z0-9\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();
         
    const a = normalize(title1);
    const b = normalize(title2);
    
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    // Quick similarity check for very different lengths
    const lengthDiff = Math.abs(a.length - b.length);
    const maxLength = Math.max(a.length, b.length);
    if (lengthDiff / maxLength > 0.7) return 0;
    
    // Calculate Levenshtein distance
    const matrix: number[][] = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[a.length][b.length];
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate distance between two geographic points in meters
   */
  static calculateLocationDistance(
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * Comprehensive duplicate check for any item type
   */
  static async performDuplicateCheck(
    item: any, 
    itemType: string
  ): Promise<{
    exactDuplicate: SavedItem | null;
    similarItems: SavedItem[];
    shouldWarn: boolean;
  }> {
    try {
      // Check for exact duplicate first
      const exactDuplicate = await this.checkExistingItem(itemType, item.id);
      
      if (exactDuplicate) {
        return {
          exactDuplicate,
          similarItems: [],
          shouldWarn: false // Already saved, no warning needed
        };
      }
      
      // Check for similar items based on content type
      let similarItems: SavedItem[] = [];
      
      switch (itemType) {
        case 'recipe':
          similarItems = await this.findSimilarRecipes(item.title || item.name || '');
          break;
          
        case 'restaurant':
          similarItems = await this.findSimilarRestaurants({
            name: item.name || item.title || '',
            lat: item.lat || item.latitude || item.geometry?.location?.lat,
            lng: item.lng || item.longitude || item.geometry?.location?.lng
          });
          break;
          
        // For photos and videos, only check exact duplicates for now
        case 'photo':
        case 'video':
        default:
          similarItems = [];
          break;
      }
      
      return {
        exactDuplicate: null,
        similarItems,
        shouldWarn: similarItems.length > 0
      };
      
    } catch (error) {
      console.error('Error in duplicate check:', error);
      return {
        exactDuplicate: null,
        similarItems: [],
        shouldWarn: false
      };
    }
  }

  /**
   * Get duplicate statistics for user's saved items
   */
  static async getDuplicateStats(userId?: string): Promise<{
    totalItems: number;
    potentialDuplicates: number;
    duplicateGroups: Array<{
      items: SavedItem[];
      similarity: number;
      type: 'exact' | 'similar';
    }>;
  }> {
    try {
      const currentUser = userId || (await AuthService.getCurrentUser())?.id;
      if (!currentUser) {
        return { totalItems: 0, potentialDuplicates: 0, duplicateGroups: [] };
      }
      
      const { data: allItems } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', currentUser)
        .order('created_at', { ascending: false });
        
      if (!allItems) {
        return { totalItems: 0, potentialDuplicates: 0, duplicateGroups: [] };
      }
      
      const duplicateGroups: Array<{
        items: SavedItem[];
        similarity: number;
        type: 'exact' | 'similar';
      }> = [];
      
      // Group by item type for efficient comparison
      const itemsByType = allItems.reduce((acc, item) => {
        if (!acc[item.item_type]) acc[item.item_type] = [];
        acc[item.item_type].push(item);
        return acc;
      }, {} as Record<string, SavedItem[]>);
      
      // Check for duplicates within each type
      for (const [type, typeItems] of Object.entries(itemsByType)) {
        const items = typeItems as SavedItem[];
        if (items.length < 2) continue;
        
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const item1 = items[i];
            const item2 = items[j];
            
            let similarity = 0;
            
            if (type === 'recipe') {
              const meta1 = item1.metadata as RecipeMetadata;
              const meta2 = item2.metadata as RecipeMetadata;
              similarity = this.calculateTitleSimilarity(
                meta1.title || '', 
                meta2.title || ''
              );
            } else if (type === 'restaurant') {
              const meta1 = item1.metadata as any;
              const meta2 = item2.metadata as any;
              similarity = this.calculateTitleSimilarity(
                meta1.name || '', 
                meta2.name || ''
              );
            }
            
            if (similarity > 0.8) {
              duplicateGroups.push({
                items: [item1, item2],
                similarity,
                type: similarity === 1 ? 'exact' : 'similar'
              });
            }
          }
        }
      }
      
      return {
        totalItems: allItems.length,
        potentialDuplicates: duplicateGroups.reduce((sum, group) => sum + group.items.length, 0),
        duplicateGroups
      };
      
    } catch (error) {
      console.error('Error getting duplicate stats:', error);
      return { totalItems: 0, potentialDuplicates: 0, duplicateGroups: [] };
    }
  }
}