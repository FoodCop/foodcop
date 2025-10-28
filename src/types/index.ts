// Type definitions for FUZO Food Discovery App

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  points: number;
  created_at: string;
  updated_at: string;
}

// Restaurant and Place Types
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  cuisine_types: string[];
  price_level: 1 | 2 | 3 | 4;
  rating: number;
  review_count: number;
  photos: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  opening_hours?: string[];
  features: string[];
}

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
}

// Food and Recipe Types
export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
}

export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  image: string;
}

export interface NutritionInfo {
  calories: number;
  protein: string;
  fat: string;
  carbohydrates: string;
}

// Review and Content Types
export interface Review {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  title: string;
  content: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  helpful_count: number;
  user: Pick<User, 'name' | 'avatar_url'>;
}

export interface VideoReview {
  id: string;
  user_id: string;
  restaurant_id: string;
  video_url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  duration: number; // in seconds
  view_count: number;
  like_count: number;
  created_at: string;
  user: Pick<User, 'name' | 'avatar_url'>;
}

// AI Assistant Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIRecommendation {
  restaurant: Restaurant;
  reason: string;
  confidence: number;
  tags: string[];
}

export interface AIAnalysis {
  dietary_preferences: string[];
  cuisine_preferences: string[];
  price_sensitivity: 'low' | 'medium' | 'high';
  discovery_radius: number; // in kilometers
}

// Points and Rewards Types
export interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  type: 'earned' | 'redeemed';
  description: string;
  reference_id?: string; // review_id, photo_id, etc.
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  category: 'dining' | 'experience' | 'discount' | 'priority';
  image_url: string;
  terms_conditions: string[];
  expiry_date?: string;
  is_available: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  cuisine_types?: string[];
  price_range?: [number, number];
  rating_min?: number;
  distance_km?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features?: string[];
  open_now?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

// YouTube Types
export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

// Chat and Social Types
export interface ChatMessage {
  id: string;
  user_id: string;
  recipient_id?: string; // for direct messages
  room_id?: string; // for group chats
  content: string;
  type: 'text' | 'image' | 'restaurant_share' | 'recipe_share';
  metadata?: Record<string, unknown>;
  created_at: string;
  user: Pick<User, 'name' | 'avatar_url'>;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'restaurant_specific';
  restaurant_id?: string;
  member_count: number;
  last_message?: ChatMessage;
  created_at: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Form and Validation Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  name: string;
  terms_accepted: boolean;
}

export interface ReviewForm {
  restaurant_id: string;
  rating: number;
  title: string;
  content: string;
  photos?: File[];
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortOption = 
  | 'relevance'
  | 'rating_desc'
  | 'rating_asc' 
  | 'distance_asc'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'oldest';

export type CuisineType = 
  | 'italian'
  | 'chinese'
  | 'japanese'
  | 'mexican'
  | 'indian'
  | 'thai'
  | 'french'
  | 'american'
  | 'mediterranean'
  | 'korean'
  | 'vietnamese'
  | 'middle_eastern'
  | 'african'
  | 'latin_american'
  | 'seafood'
  | 'vegetarian'
  | 'vegan'
  | 'fast_food'
  | 'fine_dining'
  | 'casual_dining';

export type RestaurantFeature =
  | 'wheelchair_accessible'
  | 'outdoor_seating'
  | 'delivery'
  | 'takeout'
  | 'reservations'
  | 'wifi'
  | 'parking'
  | 'live_music'
  | 'pet_friendly'
  | 'family_friendly'
  | 'romantic'
  | 'business_dining'
  | 'happy_hour'
  | 'brunch'
  | 'late_night';

