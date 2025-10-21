// Multi-Stream Feed Type Definitions
// Comprehensive type system for FUZO's feed cards and swipe interactions

// =====================================================
// Core Card Types
// =====================================================

export type CardType = 'RECIPE' | 'RESTAURANT_NEARBY' | 'VIDEO' | 'PHOTO' | 'AD';
export type SwipeDirection = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
export type SwipeAction = 'DISLIKE' | 'LIKE' | 'SHARE' | 'SAVE';

// =====================================================
// Base Feed Card Structure
// =====================================================

export interface BaseFeedCard {
  id: string;
  card_type: CardType;
  content_id: string;
  source_api?: string;
  source_url?: string;
  relevance_score: number;
  quality_score: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Content-Specific Metadata Types
// =====================================================

export interface RecipeMetadata {
  title: string;
  image: string;
  cook_time: number; // minutes
  servings: number;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients_count: number;
  source_url?: string;
  author?: string;
  rating?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
}

export interface RestaurantMetadata {
  name: string;
  image: string;
  rating: number;
  price_level: 1 | 2 | 3 | 4; // $ to $$$$
  cuisine: string;
  address: string;
  phone?: string;
  hours?: string;
  distance_km: number;
  place_id?: string; // Google Places ID
  website?: string;
  menu_url?: string;
  photos?: string[];
  reviews_count?: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface VideoMetadata {
  title: string;
  channel: string;
  thumbnail: string;
  video_url: string;
  duration: number; // seconds
  views: number;
  published_at: string;
  cuisine?: string;
  category: string; // 'tutorial', 'review', 'documentary', etc.
  description?: string;
  channel_avatar?: string;
  subscribers?: number;
  likes?: number;
  tags?: string[];
}

export interface PhotoMetadata {
  user_id: string;
  username: string;
  user_avatar: string;
  image: string;
  caption: string;
  location?: string;
  tags: string[];
  likes_count: number;
  comments_count?: number;
  taken_at: string;
  camera_info?: {
    make?: string;
    model?: string;
    settings?: string;
  };
}

export interface AdMetadata {
  title: string;
  image: string;
  description: string;
  cta_text: string;
  cta_url: string;
  sponsor: string;
  campaign_id: string;
  ad_type: 'product' | 'service' | 'app' | 'restaurant' | 'recipe_book';
  target_audience?: string[];
  budget_tier?: 'premium' | 'standard' | 'budget';
}

// =====================================================
// Unified Feed Card Types
// =====================================================

export interface RecipeCard extends BaseFeedCard {
  card_type: 'RECIPE';
  metadata: RecipeMetadata;
}

export interface RestaurantCard extends BaseFeedCard {
  card_type: 'RESTAURANT_NEARBY';
  metadata: RestaurantMetadata;
}

export interface VideoCard extends BaseFeedCard {
  card_type: 'VIDEO';
  metadata: VideoMetadata;
}

export interface PhotoCard extends BaseFeedCard {
  card_type: 'PHOTO';
  metadata: PhotoMetadata;
}

export interface AdCard extends BaseFeedCard {
  card_type: 'AD';
  metadata: AdMetadata;
}

export type FeedCard = RecipeCard | RestaurantCard | VideoCard | PhotoCard | AdCard;

// =====================================================
// Swipe Event Types
// =====================================================

export interface SwipeEvent {
  id: string;
  event_id: string; // Stable ID for idempotency
  user_id: string;
  card_id: string;
  swipe_direction: SwipeDirection;
  swipe_action: SwipeAction;
  card_type: CardType;
  content_id: string;
  
  // Context
  session_id?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  user_agent?: string;
  
  // Mechanics
  swipe_velocity?: number;
  swipe_distance?: number;
  interaction_duration: number;
  
  // Location
  user_lat?: number;
  user_lng?: number;
  
  created_at: string;
}

export interface SwipeEventRequest {
  user_id: string;
  card_id: string;
  swipe_direction: SwipeDirection;
  card_type: CardType;
  content_id: string;
  content_metadata: RecipeMetadata | RestaurantMetadata | VideoMetadata | PhotoMetadata | AdMetadata;
  
  // Optional context
  session_id?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  user_agent?: string;
  swipe_velocity?: number;
  swipe_distance?: number;
  interaction_duration?: number;
  user_lat?: number;
  user_lng?: number;
}

export interface SwipeEventResponse {
  event_id: string;
  swipe_action: SwipeAction;
  saved_item_id?: string;
  preferences_updated: number;
  already_existed: boolean;
}

// =====================================================
// Saved Items Types
// =====================================================

export type SavedItemType = 'RECIPE' | 'RESTAURANT' | 'VIDEO' | 'PHOTO';

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string;
  
  // References
  card_id?: string;
  swipe_event_id?: string;
  
  // Content
  metadata: RecipeMetadata | RestaurantMetadata | VideoMetadata | PhotoMetadata;
  
  // Organization
  collection_name?: string;
  tags?: string[];
  notes?: string;
  
  // Privacy
  is_private: boolean;
  is_favorite: boolean;
  
  // Engagement
  view_count: number;
  last_viewed_at?: string;
  
  saved_at: string;
  updated_at: string;
}

// =====================================================
// User Preferences Types
// =====================================================

export interface UserPreference {
  id: string;
  user_id: string;
  preference_type: string;
  preference_key: string;
  preference_value: Record<string, any>;
  confidence_score: number; // 0-1
  interaction_count: number;
  positive_interactions: number;
  negative_interactions: number;
  source: 'swipe' | 'explicit' | 'onboarding' | 'import';
  metadata: Record<string, any>;
  first_learned_at: string;
  updated_at: string;
}

export interface FeedCompositionPreferences {
  preferred_cuisines: string[];
  preferred_difficulty_levels: string[];
  preferred_cook_times: string[];
  preferred_price_levels: number[];
  preferred_video_categories: string[];
}

// =====================================================
// Feed Composer Types
// =====================================================

export interface FeedComposerRequest {
  user_id: string;
  exclude_cards?: string[];
  user_lat?: number;
  user_lng?: number;
  radius_km?: number;
  custom_ratio?: {
    recipes?: number;
    restaurants?: number;
    videos?: number;
    photos?: number;
    ads?: number;
  };
}

export interface FeedComposerResponse {
  cards: FeedCard[];
  composition: {
    recipes: number;
    restaurants: number;
    videos: number;
    photos: number;
    ads: number;
  };
  total_available: {
    recipes: number;
    restaurants: number;
    videos: number;
    photos: number;
    ads: number;
  };
  user_preferences_applied: boolean;
}

// =====================================================
// Component Props Types
// =====================================================

export interface UniversalSwipeCardProps {
  card: FeedCard;
  className?: string;
  onSwipe?: (direction: SwipeDirection, cardId: string) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
  isTopCard?: boolean;
}

export interface UniversalTinderSwipeProps {
  cards: FeedCard[];
  onSwipe?: (direction: SwipeDirection, card: FeedCard) => void;
  onNoMoreCards?: () => void;
  onCardChange?: (currentCard: FeedCard | null) => void;
  loading?: boolean;
}

export interface UniversalViewerProps {
  card: FeedCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSwipe?: (direction: SwipeDirection, card: FeedCard) => void;
}

// =====================================================
// Content Adapter Types
// =====================================================

export interface ContentAdapterProps<T extends FeedCard> {
  card: T;
  isFullView?: boolean;
  onActionClick?: (action: string, card: T) => void;
}

export type RecipeAdapterProps = ContentAdapterProps<RecipeCard>;
export type RestaurantAdapterProps = ContentAdapterProps<RestaurantCard>;
export type VideoAdapterProps = ContentAdapterProps<VideoCard>;
export type PhotoAdapterProps = ContentAdapterProps<PhotoCard>;
export type AdAdapterProps = ContentAdapterProps<AdCard>;

// =====================================================
// Hook Types
// =====================================================

export interface UseFeedOptions {
  user_id: string;
  initial_radius_km?: number;
  auto_fetch?: boolean;
  custom_ratio?: FeedComposerRequest['custom_ratio'];
}

export interface UseFeedReturn {
  // State
  cards: FeedCard[];
  currentCard: FeedCard | null;
  currentIndex: number;
  loading: boolean;
  error: string | null;
  
  // Feed composition info
  composition: FeedComposerResponse['composition'] | null;
  totalAvailable: FeedComposerResponse['total_available'] | null;
  preferencesApplied: boolean;
  usingFallback: boolean;
  
  // Actions
  handleSwipe: (direction: SwipeDirection, cardId: string) => Promise<void>;
  fetchMoreCards: () => Promise<void>;
  refetch: () => Promise<void>;
  resetFeed: () => void;
  
  // Card navigation
  nextCard: () => void;
  previousCard: () => void;
  goToCard: (index: number) => void;
}

// =====================================================
// Utility Types
// =====================================================

export type CardContentType<T extends CardType> = 
  T extends 'RECIPE' ? RecipeMetadata :
  T extends 'RESTAURANT_NEARBY' ? RestaurantMetadata :
  T extends 'VIDEO' ? VideoMetadata :
  T extends 'PHOTO' ? PhotoMetadata :
  T extends 'AD' ? AdMetadata :
  never;

export type CardByType<T extends CardType> = 
  T extends 'RECIPE' ? RecipeCard :
  T extends 'RESTAURANT_NEARBY' ? RestaurantCard :
  T extends 'VIDEO' ? VideoCard :
  T extends 'PHOTO' ? PhotoCard :
  T extends 'AD' ? AdCard :
  never;

// Type guard functions
export const isRecipeCard = (card: FeedCard): card is RecipeCard => card.card_type === 'RECIPE';
export const isRestaurantCard = (card: FeedCard): card is RestaurantCard => card.card_type === 'RESTAURANT_NEARBY';
export const isVideoCard = (card: FeedCard): card is VideoCard => card.card_type === 'VIDEO';
export const isPhotoCard = (card: FeedCard): card is PhotoCard => card.card_type === 'PHOTO';
export const isAdCard = (card: FeedCard): card is AdCard => card.card_type === 'AD';

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =====================================================
// Error Types
// =====================================================

export interface FeedError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export class FeedComposerError extends Error {
  constructor(
    message: string,
    public code: string = 'FEED_COMPOSER_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'FeedComposerError';
  }
}

export class SwipeEventError extends Error {
  constructor(
    message: string,
    public code: string = 'SWIPE_EVENT_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SwipeEventError';
  }
}