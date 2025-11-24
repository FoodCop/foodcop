// Universal Viewer TypeScript Interfaces
// Based on analysis of Plate page saved items structure

export type ViewerType = 'recipe' | 'restaurant' | 'photo' | 'video' | 'map' | 'post';

// Unified Content Data Structure - Single structure for all media types
export interface UnifiedContentData {
  type: ViewerType;
  id: string;
  title: string;
  description?: string;
  
  // Media (varies by type)
  media: {
    // For recipes/photos: image URL
    image?: string;
    // For videos: video URL or YouTube ID
    video?: string;
    youtubeId?: string;
    // For restaurants: photos array
    photos?: Array<{ url: string; reference?: string }>;
    // For posts: content/images
    content?: string;
    images?: string[];
  };
  
  // Metadata (type-specific)
  metadata: {
    // Recipe metadata
    ingredients?: Array<{name: string; amount: string; unit?: string}>;
    instructions?: string[];
    nutrition?: {
      calories?: number;
      protein?: string;
      carbs?: string;
      fat?: string;
    };
    readyInMinutes?: number;
    servings?: number;
    diets?: string[];
    healthScore?: number;
    sourceUrl?: string;
    spoonacularId?: number;
    
    // Restaurant metadata
    location?: {lat: number; lng: number};
    address?: string;
    rating?: number;
    priceLevel?: number;
    openingHours?: {
      open_now?: boolean;
      weekday_text?: string[];
    };
    phoneNumber?: string;
    website?: string;
    googleMapsUrl?: string;
    types?: string[];
    googlePlaceId?: string;
    
    // Video metadata
    duration?: number;
    channelName?: string;
    channelAvatar?: string;
    viewCount?: number;
    subscriberCount?: number;
    uploadDate?: string;
    thumbnail?: string;
    
    // Photo metadata
    visitDate?: string;
    restaurantName?: string;
    
    // Post metadata
    author?: string;
    authorAvatar?: string;
    likes?: number;
    comments?: number;
    createdAt?: string;
    
    // Common metadata
    tags?: string[];
    [key: string]: any; // Allow additional fields
  };
  
  // Actions
  actions?: {
    save?: () => void;
    share?: () => void;
    like?: () => void;
    delete?: () => void;
  };
  
  // Saved item ID for delete functionality
  savedItemId?: string;
}

// Main viewer state interface
// Supports both old ViewerData format and new UnifiedContentData format
export interface ViewerState {
  isOpen: boolean;
  type: ViewerType | null;
  data: ViewerData | UnifiedContentData | null;
  items?: (ViewerData | UnifiedContentData)[] | null; // All items for navigation
  currentIndex: number; // Current item index
  itemIndex?: number; // Current item index (alternative name)
  totalItems?: number; // Total items count
}

// Union type for all viewer data
export interface ViewerData {
  recipe?: RecipeViewerData;
  restaurant?: RestaurantViewerData;
  photo?: PhotoViewerData;
  video?: VideoViewerData;
  savedItemId?: string; // ID of the saved item in the database for delete functionality
}

// Recipe viewer data structure (from Spoonacular API)
export interface RecipeViewerData {
  id: string;
  title: string;
  summary: string;
  image: string;
  instructions: string[];
  ingredients: Array<{
    name: string;
    amount: string;
    unit?: string;
  }>;
  nutrition?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  readyInMinutes: number;
  servings: number;
  diets: string[];
  healthScore?: number;
  sourceUrl?: string;
  spoonacularId?: number;
}

// Restaurant viewer data structure (from Google Places API)
export interface RestaurantViewerData {
  id: string; // place_id from Google Places
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  priceLevel?: number;
  photos: Array<{
    url: string;
    reference?: string;
  }>;
  googleMapsUrl: string;
  types: string[];
  openingHours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  phoneNumber?: string;
  website?: string;
}

// Photo viewer data structure
export interface PhotoViewerData {
  id: string;
  url: string;
  title?: string;
  description?: string;
  restaurantName?: string;
  visitDate?: string;
  rating?: number;
  tags?: string[];
}

// Video viewer data structure
export interface VideoViewerData {
  id: string;
  title: string;
  description?: string;
  url: string; // Video file URL or stream URL
  thumbnail?: string;
  youtubeUrl?: string; // Original YouTube URL if applicable
  channelName?: string;
  channelAvatar?: string;
  duration?: number; // Duration in seconds
  viewCount?: number;
  subscriberCount?: number;
  uploadDate?: string;
  tags?: string[];
  // Recipe connection fields
  recipeTitle?: string;
  recipeDescription?: string;
}

// Props interfaces for components
export interface UniversalViewerProps {
  state: ViewerState;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onDelete?: (itemId: string, itemType: string) => void;
}

export interface RecipeViewerProps {
  data: RecipeViewerData;
}

export interface RestaurantViewerProps {
  data: RestaurantViewerData;
}

export interface PhotoViewerProps {
  data: PhotoViewerData;
}

export interface VideoViewerProps {
  data: VideoViewerData;
}

// Viewer controls props
export interface ViewerControlsProps {
  type: ViewerType | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigate?: boolean;
  currentIndex?: number;
  totalItems?: number;
  onDelete?: () => void;
  itemId?: string;
}

// Keyboard navigation hook props
export interface UseKeyboardNavProps {
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  isOpen: boolean;
}