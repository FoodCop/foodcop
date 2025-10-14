/**
 * Restaurant Feed Types
 * Updated interfaces for Master Bot restaurant recommendations in Tinder-style swipe feed
 */

export interface RestaurantCard {
  id: string;
  // Restaurant details
  restaurant_name: string;
  restaurant_location: string; // "City, Country"
  restaurant_rating: number;
  restaurant_price_range: string; // $, $$, $$$, $$$$
  restaurant_cuisine: string;
  image_url: string;
  
  // Master Bot details
  bot_id: string;
  bot_username: string;
  bot_display_name: string;
  bot_avatar_url?: string;
  
  // Post content
  title: string;
  content: string; // Bot's recommendation/review
  content_type: 'review' | 'story' | 'tip' | 'travel' | 'philosophy';
  personality_trait: string;
  
  // Engagement
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  
  // Metadata
  tags: string[];
  created_at: string;
  
  // Future geolocation support
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance_from_user?: string;
  place_id?: string; // For Google Maps integration
}

export interface RestaurantSwipeProps {
  restaurants: RestaurantCard[];
  onSwipe?: (direction: 'left' | 'right', restaurantId: string) => void;
  onNoMoreCards?: () => void;
}

export interface RestaurantCardProps {
  id: string;
  restaurant_name: string;
  restaurant_location: string;
  restaurant_rating: number;
  restaurant_price_range: string;
  restaurant_cuisine: string;
  image_url: string;
  bot_display_name: string;
  bot_avatar_url?: string;
  content: string;
  className?: string;
  onSwipe?: (direction: 'left' | 'right', id: string) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
}

// Action types for swipe interactions
export interface SwipeAction {
  type: 'save' | 'share' | 'message_bot' | 'view_location' | 'view_restaurant';
  restaurant_id: string;
  bot_id: string;
}

// Response to swipe actions
export interface SwipeResult {
  action: 'saved' | 'shared' | 'messaged' | 'visited' | 'passed';
  message: string;
}

// Feed filtering for future geo features
export interface FeedFilters {
  cuisine_types?: string[];
  price_ranges?: string[];
  rating_min?: number;
  distance_max?: number; // km
  bot_preferences?: string[]; // specific master bot usernames
  location?: {
    lat: number;
    lng: number;
    radius: number; // km
  };
}

// Geolocation utilities for Google Maps integration
export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface DistanceCalculation {
  distance_km: number;
  distance_display: string; // "2.1 km", "500m", etc.
  travel_time_walking?: string;
  travel_time_driving?: string;
}

// Google Maps Places integration
export interface PlaceDetails {
  place_id: string;
  google_rating?: number;
  google_reviews_count?: number;
  opening_hours?: string[];
  phone_number?: string;
  website?: string;
  photos?: string[];
  address_components?: AddressComponent[];
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Statistics for Master Bot feed performance
export interface BotFeedStats {
  bot_id: string;
  bot_username: string;
  total_posts: number;
  total_likes: number;
  total_saves: number;
  avg_rating: number;
  top_cuisines: string[];
  recent_activity: string;
}