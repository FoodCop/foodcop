// Shared Content Types for Chat System Integration
// Phase 7.5: Cross-System Integration

export interface RestaurantData {
  id: string;
  name: string;
  address: string;
  rating: number;
  photo_url?: string;
  cuisine_type: string;
  price_range: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description?: string;
  phone?: string;
  website?: string;
  opening_hours?: string;
  distance?: number; // in meters from user
}

export interface RecipeData {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  cooking_time: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  servings?: number;
  calories?: number;
  category?: string;
  author?: string;
  prep_time?: number;
  instructions?: string[];
}

export interface RestaurantMessage {
  type: 'restaurant';
  restaurant: RestaurantData;
  shared_by_user_id: string;
  shared_at: string;
  message?: string; // optional message from sharer
}

export interface RecipeMessage {
  type: 'recipe';
  recipe: RecipeData;
  shared_by_user_id: string;
  shared_at: string;
  message?: string; // optional message from sharer
}

export type SharedContentMessage = RestaurantMessage | RecipeMessage;

export interface ShareTarget {
  id: string;
  name: string;
  type: 'user' | 'group';
  avatar_url?: string;
  username?: string;
  is_master_bot?: boolean;
}

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (targets: ShareTarget[], message?: string) => void;
  content: RestaurantData | RecipeData;
  contentType: 'restaurant' | 'recipe';
}

export interface SharedContentCardProps {
  content: RestaurantMessage | RecipeMessage;
  onSaveToPlate?: (content: RestaurantData | RecipeData) => void;
  onViewDetails?: (content: RestaurantData | RecipeData) => void;
  onGetDirections?: (restaurant: RestaurantData) => void;
  className?: string;
}

// Actions that can be performed on shared content
export interface ContentAction {
  type: 'save' | 'view' | 'directions' | 'share' | 'like';
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  handler: (content: RestaurantData | RecipeData) => void;
}

// Chat message extensions for shared content
export interface ExtendedChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'restaurant' | 'recipe';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  shared_content?: SharedContentMessage;
  reactions?: Array<{
    emoji: string;
    user_id: string;
    user_name: string;
  }>;
}