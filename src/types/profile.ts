// User profile types
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  preferences?: UserPreferences;
  dietary_restrictions?: string[];
  cuisine_preferences?: string[];
  cuisine_dislikes?: string[];
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: NotificationSettings;
  privacy?: PrivacySettings;
  food_preferences?: FoodPreferences;
}

export interface NotificationSettings {
  email_notifications?: boolean;
  push_notifications?: boolean;
  friend_requests?: boolean;
  shared_items?: boolean;
  ai_recommendations?: boolean;
}

export interface PrivacySettings {
  profile_visibility?: 'public' | 'friends' | 'private';
  plate_visibility?: 'public' | 'friends' | 'private';
  location_sharing?: boolean;
}

export interface FoodPreferences {
  dietary_restrictions?: string[];
  preferred_cuisines?: string[];
  disliked_cuisines?: string[];
  spice_tolerance?: 'mild' | 'medium' | 'hot' | 'extreme';
  price_range?: 'budget' | 'moderate' | 'expensive' | 'fine_dining';
}

export interface ProfileUpdateParams {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location_city?: string;
  location_state?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ProfileResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}