export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  avatar: string;
  preferences: string[];
  points: number;
  badges: Badge[];
  crew: Friend[];
  savedPlaces: SavedPlace[];
  savedRecipes: SavedRecipe[];
  photos: UserPhoto[];
  reviews: UserReview[];
}

export interface Friend {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  bio: string;
  preferences: string[];
  points: number;
  badges: Badge[];
  isFollowing: boolean;
  mutualFriends: number;
  savedPlaces: SavedPlace[];
  photos: UserPhoto[];
  reviews: UserReview[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
  isUnlocked: boolean;
}

export interface SavedPlace {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  price: string;
  location: string;
  savedAt: string;
}

export interface SavedRecipe {
  id: string;
  title: string;
  image: string;
  cookingTime: number;
  rating: number;
  cuisine: string;
  savedAt: string;
}

export interface UserPhoto {
  id: string;
  url: string;
  caption: string;
  restaurant?: string;
  createdAt: string;
  likes: number;
}

export interface UserReview {
  id: string;
  restaurant: string;
  rating: number;
  text: string;
  photos: string[];
  createdAt: string;
}

// Empty data - no mock data
export const mockUserProfile: UserProfile = {
  id: "",
  displayName: "",
  handle: "",
  bio: "",
  avatar: "",
  preferences: [],
  points: 0,
  badges: [],
  crew: [],
  savedPlaces: [],
  savedRecipes: [],
  photos: [],
  reviews: [],
};

export const mockFriendProfiles: Record<string, Friend> = {};
