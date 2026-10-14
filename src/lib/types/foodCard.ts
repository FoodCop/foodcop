// Canonical food card data model — shared by every Create Card studio.
// FlavorVector/CardTags mirror the schema fix described in
// fuzo-recommendation-engine-solution.md §1/§4: one flavor taxonomy and one
// categorized tag shape, written by every card type (not just RECIPE).

export const FLAVOR_AXES = [
  'spicy', 'sweet', 'tangy', 'salty', 'savory',
  'bitter', 'smoky', 'creamy', 'fresh', 'crunchy',
] as const;

export type FlavorAxis = (typeof FLAVOR_AXES)[number];
export type FlavorVector = Record<FlavorAxis, number>;

export const ZERO_FLAVOR: FlavorVector = FLAVOR_AXES.reduce((acc, axis) => {
  acc[axis] = 0;
  return acc;
}, {} as FlavorVector);

export const DEFAULT_FLAVOR: FlavorVector = {
  spicy: 2, sweet: 2, tangy: 2, salty: 2, savory: 3,
  bitter: 1, smoky: 1, creamy: 2, fresh: 2, crunchy: 1,
};

export interface CardTags {
  cuisine: string[];
  food_type: string[];
  meal_type: string[];
  cooking_style: string[];
  diet: string[];
  occasion: string[];
  season: string[];
  price_level: string | null;
}

export const emptyCardTags = (): CardTags => ({
  cuisine: [],
  food_type: [],
  meal_type: [],
  cooking_style: [],
  diet: [],
  occasion: [],
  season: [],
  price_level: null,
});

export type FoodCardFamily = 'recipe' | 'restaurant' | 'video' | 'discovery';

export const FOOD_CARD_TYPES = [
  'RECIPE', 'HOME_COOKING', 'DESSERT', 'DRINK',
  'RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD',
  'BITE_VIDEO',
  'FOOD_REVIEW', 'FOOD_EXPLORATION', 'FOOD_RECOMMENDATION', 'FOOD_COLLECTION',
  // Camera Create flow (client, 2026-10-14). Recipes from it reuse RECIPE.
  'VIBE_PHOTO', 'FOOD_PHOTO', 'RESTAURANT_PHOTO',
] as const;

export type FoodCardType = (typeof FOOD_CARD_TYPES)[number];

export interface TypeMeta {
  label: string;
  emoji: string;
  family: FoodCardFamily;
  color: string;
}

export const TYPE_META: Record<FoodCardType, TypeMeta> = {
  RECIPE: { label: 'Recipe', emoji: '📖', family: 'recipe', color: '#E8472B' },
  HOME_COOKING: { label: 'Home Cooking', emoji: '🏠', family: 'recipe', color: '#8FBB2A' },
  DESSERT: { label: 'Dessert', emoji: '🍰', family: 'recipe', color: '#D4609A' },
  DRINK: { label: 'Drink', emoji: '🥤', family: 'recipe', color: '#4EAED4' },

  RESTAURANT_VISIT: { label: 'Restaurant Visit', emoji: '🍴', family: 'restaurant', color: '#5B9BD5' },
  CAFE_VISIT: { label: 'Café Visit', emoji: '☕', family: 'restaurant', color: '#9B6A3F' },
  STREET_FOOD: { label: 'Street Food', emoji: '🌮', family: 'restaurant', color: '#E07B39' },

  BITE_VIDEO: { label: 'Bite Video', emoji: '🎬', family: 'video', color: '#7B5EA7' },

  FOOD_REVIEW: { label: 'Food Review', emoji: '⭐', family: 'discovery', color: '#F2A93B' },
  FOOD_EXPLORATION: { label: 'Food Exploration', emoji: '🧭', family: 'discovery', color: '#3EB49A' },
  FOOD_RECOMMENDATION: { label: 'Recommendation', emoji: '💡', family: 'discovery', color: '#C67B2F' },
  FOOD_COLLECTION: { label: 'Collection', emoji: '📚', family: 'discovery', color: '#6A7B4E' },

  VIBE_PHOTO: { label: 'Vibe', emoji: '✨', family: 'discovery', color: '#F28C6B' },
  FOOD_PHOTO: { label: 'Food', emoji: '🍝', family: 'discovery', color: '#4FAE6E' },
  RESTAURANT_PHOTO: { label: 'Restaurant', emoji: '🏪', family: 'restaurant', color: '#E0B33C' },
};

export const familyOf = (cardType: FoodCardType): FoodCardFamily => TYPE_META[cardType].family;

export interface FoodCardRecord {
  id: string;
  user_id: string;
  card_type: FoodCardType;
  title: string;
  caption: string | null;
  tags: CardTags;
  flavor_profile: FlavorVector;
  ingredients: [string, string, string][];
  nutrition: { calories?: number; protein?: number; carbs?: number; fat?: number };
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  media_url: string | null;
  image_url: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  stats: { likes: number; saves: number };
  created_at: string;
  updated_at: string;
  // Camera Create flow fields (20261014000000_create_flow_posts.sql). Optional:
  // rows read before that migration runs don't have them.
  /** Up to 5 photo URLs; image_url is the first. */
  photos?: string[];
  business_identity?: string[];
  /** Must-Try Dish, Weird Combo, or the user's own. */
  labels?: string[];
  /** Home food - the only post without a location. */
  is_home?: boolean;
  place_name?: string | null;
  address?: string | null;
  /** The FUZO restaurant this post is at, if any. */
  restaurant_id?: string | null;
  /** The dish picked from that restaurant's FUZO menu, if any. */
  menu_item_id?: string | null;
  /** Recipe preparation steps. */
  steps?: string[];
}
