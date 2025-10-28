// Base interface for all feed cards
export interface BaseFeedCard {
  id: string;
  type: 'restaurant' | 'masterbot' | 'ad' | 'recipe' | 'video';
  saveCategory: string; // Where this card will be saved in the PLATE
}

// Restaurant card
export interface RestaurantCard extends BaseFeedCard {
  type: 'restaurant';
  saveCategory: 'Places';
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  location: string;
  distance: string;
  imageUrl: string;
  description?: string;
  tags?: string[];
  ownerImage?: string;
  ownerName?: string;
}

// Masterbot post card (influencer/chef posts)
export interface MasterbotCard extends BaseFeedCard {
  type: 'masterbot';
  saveCategory: 'Posts';
  username: string;
  displayName: string;
  avatarUrl: string;
  imageUrl: string;
  caption: string;
  likes: number;
  restaurantTag?: string;
  tags?: string[];
}

// Ad card
export interface AdCard extends BaseFeedCard {
  type: 'ad';
  saveCategory: 'Ads';
  brandName: string;
  imageUrl: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl?: string;
}

// Recipe card
export interface RecipeCard extends BaseFeedCard {
  type: 'recipe';
  saveCategory: 'Recipes';
  title: string;
  author: string;
  authorImage?: string;
  imageUrl: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  description: string;
  tags?: string[];
}

// Video card
export interface VideoCard extends BaseFeedCard {
  type: 'video';
  saveCategory: 'Videos';
  title: string;
  creator: string;
  creatorImage?: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  description: string;
  tags?: string[];
}

export type FeedCard = RestaurantCard | MasterbotCard | AdCard | RecipeCard | VideoCard;

// Sample data for each type
export const sampleRestaurants: RestaurantCard[] = [
  {
    id: 'rest-1',
    type: 'restaurant',
    saveCategory: 'Places',
    name: 'The Garden Bistro',
    cuisine: 'French',
    priceRange: '$$',
    rating: 4.5,
    reviewCount: 328,
    location: 'Brooklyn, NY',
    distance: '0.5 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    description: 'Farm-to-table French cuisine with seasonal ingredients',
    tags: ['Romantic', 'Outdoor Seating', 'Wine Bar'],
    ownerImage: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80',
    ownerName: 'Chef Pierre'
  },
  {
    id: 'rest-2',
    type: 'restaurant',
    saveCategory: 'Places',
    name: 'Sake Lounge',
    cuisine: 'Japanese',
    priceRange: '$$$',
    rating: 4.7,
    reviewCount: 512,
    location: 'Manhattan, NY',
    distance: '1.2 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    description: 'Authentic sushi and Japanese fusion dishes',
    tags: ['Sushi', 'Date Night', 'Cocktails'],
    ownerImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    ownerName: 'Chef Yuki'
  },
  {
    id: 'rest-3',
    type: 'restaurant',
    saveCategory: 'Places',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    priceRange: '$',
    rating: 4.3,
    reviewCount: 892,
    location: 'Brooklyn, NY',
    distance: '0.8 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    description: 'Street-style tacos and fresh margaritas',
    tags: ['Casual', 'Happy Hour', 'Outdoor Seating'],
    ownerImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
    ownerName: 'Chef Carlos'
  },
  {
    id: 'rest-4',
    type: 'restaurant',
    saveCategory: 'Places',
    name: 'Bella Italia',
    cuisine: 'Italian',
    priceRange: '$$',
    rating: 4.6,
    reviewCount: 445,
    location: 'Queens, NY',
    distance: '2.1 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    description: 'Traditional Italian pasta and wood-fired pizza',
    tags: ['Family Friendly', 'Pizza', 'Wine'],
    ownerImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    ownerName: 'Chef Marco'
  }
];

export const sampleMasterbotPosts: MasterbotCard[] = [
  {
    id: 'mb-1',
    type: 'masterbot',
    saveCategory: 'Posts',
    username: '@chef_james',
    displayName: 'Chef James Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    caption: 'Just tried the most incredible homemade ramen. The broth was simmered for 12 hours! 🍜',
    likes: 2843,
    restaurantTag: 'Ramen House NYC',
    tags: ['Ramen', 'Foodie', 'NYC']
  },
  {
    id: 'mb-2',
    type: 'masterbot',
    saveCategory: 'Posts',
    username: '@foodie_sarah',
    displayName: 'Sarah Martinez',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    caption: 'Perfect date night spot 🍷✨ The ambiance here is unmatched',
    likes: 5621,
    restaurantTag: 'Vino & Cucina',
    tags: ['Date Night', 'Wine', 'Italian']
  },
  {
    id: 'mb-3',
    type: 'masterbot',
    saveCategory: 'Posts',
    username: '@tastytravels',
    displayName: 'Marcus Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
    caption: 'Brunch goals achieved! 🥞☕ These pancakes are life-changing',
    likes: 4102,
    restaurantTag: 'Morning Glory Cafe',
    tags: ['Brunch', 'Pancakes', 'Coffee']
  }
];

export const sampleAds: AdCard[] = [
  {
    id: 'ad-1',
    type: 'ad',
    saveCategory: 'Ads',
    brandName: 'HelloFresh',
    imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80',
    headline: 'Fresh Ingredients, Delivered',
    description: 'Get 50% off your first box + free shipping',
    ctaText: 'Claim Offer',
    ctaUrl: '#'
  },
  {
    id: 'ad-2',
    type: 'ad',
    saveCategory: 'Ads',
    brandName: 'OpenTable',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    headline: 'Reserve Your Table',
    description: 'Book the best restaurants in your city. Earn rewards!',
    ctaText: 'Browse Restaurants',
    ctaUrl: '#'
  }
];

export const sampleRecipes: RecipeCard[] = [
  {
    id: 'recipe-1',
    type: 'recipe',
    saveCategory: 'Recipes',
    title: 'Classic Carbonara',
    author: 'Chef Alessandro',
    authorImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
    prepTime: '10 min',
    cookTime: '15 min',
    difficulty: 'Medium',
    servings: 4,
    description: 'Authentic Italian carbonara with crispy pancetta and creamy egg sauce',
    tags: ['Italian', 'Pasta', 'Quick']
  },
  {
    id: 'recipe-2',
    type: 'recipe',
    saveCategory: 'Recipes',
    title: 'Spicy Thai Basil Chicken',
    author: 'Chef Mei',
    authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80',
    prepTime: '15 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    servings: 2,
    description: 'Quick and flavorful Thai stir-fry with fresh basil and chilies',
    tags: ['Thai', 'Spicy', 'Weeknight Dinner']
  }
];

export const sampleVideos: VideoCard[] = [
  {
    id: 'video-1',
    type: 'video',
    saveCategory: 'Videos',
    title: 'How to Make Perfect Croissants at Home',
    creator: 'The Pastry Lab',
    creatorImage: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    duration: '12:34',
    views: 842000,
    description: 'Step-by-step guide to making flaky, buttery croissants from scratch',
    tags: ['Baking', 'Tutorial', 'French']
  },
  {
    id: 'video-2',
    type: 'video',
    saveCategory: 'Videos',
    title: '5-Minute Breakfast Hacks',
    creator: 'Quick Bites',
    creatorImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    duration: '5:42',
    views: 1200000,
    description: 'Fast and easy breakfast ideas for busy mornings',
    tags: ['Breakfast', 'Quick', 'Life Hacks']
  }
];

// Function to create a mixed feed with the specified ratio
// Ratio: 2 restaurants, 2 masterbot posts, 1 ad, 1 recipe, 1 video (7 cards per cycle)
export function createMixedFeed(cycles: number = 3): FeedCard[] {
  const feed: FeedCard[] = [];
  
  for (let i = 0; i < cycles; i++) {
    const cycleOffset = i * 7;
    
    // Add 2 restaurants
    feed.push(sampleRestaurants[i % sampleRestaurants.length]);
    feed.push(sampleRestaurants[(i + 1) % sampleRestaurants.length]);
    
    // Add 2 masterbot posts
    feed.push(sampleMasterbotPosts[i % sampleMasterbotPosts.length]);
    feed.push(sampleMasterbotPosts[(i + 1) % sampleMasterbotPosts.length]);
    
    // Add 1 ad
    feed.push(sampleAds[i % sampleAds.length]);
    
    // Add 1 recipe
    feed.push(sampleRecipes[i % sampleRecipes.length]);
    
    // Add 1 video
    feed.push(sampleVideos[i % sampleVideos.length]);
  }
  
  return feed;
}
