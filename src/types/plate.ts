// Plate service types for save-to-plate functionality
export interface SaveItemParams {
  itemId: string;
  itemType: 'restaurant' | 'recipe' | 'photo' | 'video' | 'other';
  metadata?: Record<string, unknown>;
}
export interface SavedItem {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  vicinity?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  photos?: string[];
  rating?: number;
  price_level?: number;
  user_ratings_total?: number;
  search_method?: string;
  restaurant_type?: string;
}

export interface RestaurantMetadata extends Restaurant {
  restaurant_id: string;
  saved_at: string;
  saved_from: string;
  saved_method?: string;
  rating?: number;
  price_level?: number;
  user_ratings_total?: number;
}

export interface PhotoMetadata {
  title?: string;
  image?: string;
  image_url?: string;
  restaurant_name?: string;
  rating?: number;
  visit_date?: string;
  [key: string]: unknown;
}

export interface RecipeMetadata {
  title?: string;
  summary?: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  healthScore?: number;
  diets?: string[];
  [key: string]: unknown;
}

export type SavedItemMetadata = PhotoMetadata | RecipeMetadata | RestaurantMetadata | Record<string, unknown>;
export interface PlateResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListSavedItemsParams {
  itemType?: 'restaurant' | 'recipe' | 'photo' | 'video' | 'other';
  limit?: number;
  offset?: number;
}

export interface SavedItemsResponse {
  success: boolean;
  data?: SavedItem[];
  error?: string;
  total?: number;
}