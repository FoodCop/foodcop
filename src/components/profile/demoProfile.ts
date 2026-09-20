export interface RestaurantDish {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  dietary?: ('Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Halal' | 'Dairy-Free')[];
  flavors?: ('Spicy' | 'Savoury' | 'Smoky' | 'Tangy' | 'Creamy' | 'Sweet' | 'Crunchy' | 'Fresh' | 'Bitter' | 'Salty')[];
  isSpecialty?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  dishes: RestaurantDish[];
}

export interface RestaurantInfo {
  tagline: string;
  cuisines: string[];
  priceTier: string;
  rating: number;
  reviewCount: number;
  address: string;
  neighborhood: string;
  phone: string;
  website: string;
  hours: { day: string; hours: string; isOpenNow?: boolean }[];
  amenities: string[];
  lat?: number;
  lng?: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  category: 'Food' | 'Ambience' | 'Interior' | 'Bar';
}

export type UserProfile = {
  name: string;
  handle: string;
  role: string;
  /** users.bio - public. Shown under the name, including on a private profile. */
  bio?: string | null;
  location?: string;
  level?: number;
  type: 'person' | 'restaurant';
  bites: number;
  /** Total published food_cards across every family (recipe/restaurant/video/discovery) - the "Posts" stat. */
  posts: number;
  friends?: number;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  restaurantInfo?: RestaurantInfo;
  menuCategories?: MenuCategory[];
  galleryPhotos?: GalleryPhoto[];
};

/** Alias for backward compatibility */
export type DemoProfile = UserProfile;
