import fs from 'fs';
import path from 'path';

export interface Restaurant {
  id: string;
  placeId: string;
  name: string;
  description?: string;
  address: string;
  street: string;
  city: string;
  country: string;
  postalCode: string | null;
  neighborhood: string | null;
  price: string | null;
  priceLevel: number;
  category: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  website: string | null;
  phone: string | null;
  openingHours: any[];
  tags: string[];
}

export interface MasterBotPersonality {
  username: string;
  display_name: string;
  specialty: string;
  tone: 'enthusiastic' | 'sophisticated' | 'zen' | 'adventurous' | 'analytical' | 'warm' | 'nomadic';
  emoji_style: string[];
  common_phrases: string[];
}

// Master Bot personalities for post generation
export const MASTER_BOT_PERSONALITIES: Record<string, MasterBotPersonality> = {
  'spice_scholar_anika': {
    username: 'spice_scholar_anika',
    display_name: 'Anika Kapoor',
    specialty: 'Indian/Asian Cuisine Expert',
    tone: 'enthusiastic',
    emoji_style: ['🌶️', '🔥', '💫', '✨', '🙌'],
    common_phrases: [
      'The spice levels here are absolutely divine!',
      'As a spice scholar, I must say',
      'The complexity of flavors is remarkable',
      'This place understands authentic spice blending'
    ]
  },
  'sommelier_seb': {
    username: 'sommelier_seb',
    display_name: 'Sebastian LeClair',
    specialty: 'Fine Dining Expert',
    tone: 'sophisticated',
    emoji_style: ['🍷', '🥂', '🌟', '✨', '👨‍🍳'],
    common_phrases: [
      'The culinary artistry here is exceptional',
      'A truly sophisticated dining experience',
      'The wine pairing potential is extraordinary',
      'This establishment exemplifies fine dining excellence'
    ]
  },
  'plant_pioneer_lila': {
    username: 'plant_pioneer_lila',
    display_name: 'Lila Cheng',
    specialty: 'Vegan Specialist',
    tone: 'warm',
    emoji_style: ['🌱', '💚', '🌿', '✨', '🙏'],
    common_phrases: [
      'Plant-based paradise found!',
      'Cruelty-free and delicious',
      'This is why I love the plant-based movement',
      'Sustainable dining at its finest'
    ]
  },
  'zen_minimalist_jun': {
    username: 'zen_minimalist_jun',
    display_name: 'Jun Tanaka',
    specialty: 'Japanese Cuisine Master',
    tone: 'zen',
    emoji_style: ['🍣', '🍜', '🌸', '🎋', '⭐'],
    common_phrases: [
      'Simple perfection in every bite',
      'The harmony of flavors speaks to the soul',
      'Minimalist excellence',
      'True Japanese craftsmanship'
    ]
  },
  'coffee_pilgrim_omar': {
    username: 'coffee_pilgrim_omar',
    display_name: 'Omar Darzi',
    specialty: 'Coffee Culture Expert',
    tone: 'analytical',
    emoji_style: ['☕', '🌍', '📍', '✈️', '🗺️'],
    common_phrases: [
      'The coffee journey brought me here',
      'Bean sourcing and brewing excellence',
      'Every cup tells a story',
      'Coffee culture at its finest'
    ]
  },
  'adventure_rafa': {
    username: 'adventure_rafa',
    display_name: 'Rafael Mendez',
    specialty: 'Adventure Foodie',
    tone: 'adventurous',
    emoji_style: ['🏔️', '🌮', '🔥', '⚡', '🌎'],
    common_phrases: [
      'Adventure led me to this gem!',
      'Bold flavors for bold souls',
      'This is what food exploration is about',
      'Fuel for the next adventure'
    ]
  },
  'nomad_aurelia': {
    username: 'nomad_aurelia',
    display_name: 'Aurelia Voss',
    specialty: 'Street Food Explorer',
    tone: 'nomadic',
    emoji_style: ['🚶‍♀️', '🍜', '🌍', '🎒', '💫'],
    common_phrases: [
      'Street food wanderlust satisfied',
      'Local flavors, global soul',
      'The nomad life brought me here',
      'Authentic street culture'
    ]
  }
};

/**
 * Restaurant Data Service
 * Loads restaurant data from JSON datasets for Master Bot feed generation
 */
export class RestaurantDataService {
  private static dataCache: Map<string, Restaurant[]> = new Map();
  
  /**
   * Get restaurants for a specific Master Bot
   */
  static async getRestaurantsForBot(botUsername: string): Promise<Restaurant[]> {
    if (this.dataCache.has(botUsername)) {
      return this.dataCache.get(botUsername)!;
    }

    try {
      const dataPath = path.join(process.cwd(), 'data', `${botUsername}-data.json`);
      
      if (!fs.existsSync(dataPath)) {
        console.warn(`Data file not found for bot: ${botUsername}`);
        return [];
      }

      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const restaurants: Restaurant[] = JSON.parse(rawData);
      
      // Cache the data
      this.dataCache.set(botUsername, restaurants);
      
      return restaurants;
    } catch (error) {
      console.error(`Error loading restaurants for bot ${botUsername}:`, error);
      return [];
    }
  }

  /**
   * Get a random restaurant for a bot (excluding recently posted ones)
   */
  static async getRandomRestaurantForBot(
    botUsername: string, 
    excludeRecentDays: number = 30
  ): Promise<Restaurant | null> {
    const restaurants = await this.getRestaurantsForBot(botUsername);
    
    if (restaurants.length === 0) {
      return null;
    }

    // TODO: Add logic to exclude recently posted restaurants from Supabase
    // For now, just return a random restaurant
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    return restaurants[randomIndex];
  }

  /**
   * Generate a Master Bot post for a restaurant
   */
  static generateBotPost(restaurant: Restaurant, botUsername: string): {
    title: string;
    content: string;
    content_type: string;
  } {
    const personality = MASTER_BOT_PERSONALITIES[botUsername];
    
    if (!personality) {
      throw new Error(`Unknown bot personality: ${botUsername}`);
    }

    const emoji = personality.emoji_style[Math.floor(Math.random() * personality.emoji_style.length)];
    const phrase = personality.common_phrases[Math.floor(Math.random() * personality.common_phrases.length)];
    
    // Generate title
    const title = `${emoji} ${restaurant.name} - A ${restaurant.category} Experience`;
    
    // Generate content based on personality
    let content = '';
    
    switch (personality.tone) {
      case 'enthusiastic':
        content = `Just discovered this amazing ${restaurant.category.toLowerCase()}! ${restaurant.name} in ${restaurant.city} is absolutely incredible. ${phrase} The ${restaurant.rating}-star rating speaks volumes, and at ${this.getPriceLevelText(restaurant.priceLevel)}, it's totally worth it!`;
        break;
        
      case 'sophisticated':
        content = `${phrase} at ${restaurant.name} in ${restaurant.city}. ${restaurant.description || `This ${restaurant.category.toLowerCase()} establishment`} demonstrates remarkable culinary expertise. The ${restaurant.rating}-star rating reflects the quality one expects at this ${this.getPriceLevelText(restaurant.priceLevel)} venue.`;
        break;
        
      case 'zen':
        content = `Found tranquility at ${restaurant.name} in ${restaurant.city}. ${restaurant.description || `This ${restaurant.category.toLowerCase()}`} embodies ${phrase.toLowerCase()}. The ${restaurant.rating}-star experience at ${this.getPriceLevelText(restaurant.priceLevel)} pricing creates perfect harmony.`;
        break;
        
      case 'adventurous':
        content = `${phrase} ${restaurant.name} in ${restaurant.city} delivers bold ${restaurant.category.toLowerCase()} flavors! ${restaurant.description || 'The menu here'} is perfect fuel for adventurers. ${restaurant.rating} stars and ${this.getPriceLevelText(restaurant.priceLevel)} - adventure awaits!`;
        break;
        
      case 'analytical':
        content = `Analysis complete: ${restaurant.name} in ${restaurant.city} scores ${restaurant.rating}/5.0 across ${restaurant.reviewsCount} reviews. ${phrase} This ${restaurant.category.toLowerCase()} spot offers exceptional value at ${this.getPriceLevelText(restaurant.priceLevel)} price point.`;
        break;
        
      case 'warm':
        content = `Feeling so grateful for discovering ${restaurant.name} in ${restaurant.city}! ${phrase} This ${restaurant.category.toLowerCase()} gem with ${restaurant.rating} stars reminds us why conscious dining matters. ${this.getPriceLevelText(restaurant.priceLevel)} for such quality! 💚`;
        break;
        
      case 'nomadic':
        content = `${phrase} - ${restaurant.name} in ${restaurant.city}! ${restaurant.description || `This ${restaurant.category.toLowerCase()}`} captures the essence of local culture. ${restaurant.rating} stars earned through authentic experiences. ${this.getPriceLevelText(restaurant.priceLevel)} for wanderers!`;
        break;
        
      default:
        content = `${restaurant.name} in ${restaurant.city} - ${restaurant.description || `Amazing ${restaurant.category.toLowerCase()}`} with ${restaurant.rating} stars. ${this.getPriceLevelText(restaurant.priceLevel)} pricing. Highly recommend!`;
    }

    return {
      title,
      content,
      content_type: Math.random() > 0.7 ? 'story' : 'review' // 70% reviews, 30% stories
    };
  }

  /**
   * Convert price level to human readable text
   */
  private static getPriceLevelText(priceLevel: number): string {
    switch (priceLevel) {
      case 1: return '$';
      case 2: return '$$';
      case 3: return '$$$';
      case 4: return '$$$$';
      default: return 'Affordable';
    }
  }

  /**
   * Get all Master Bot usernames
   */
  static getMasterBotUsernames(): string[] {
    return Object.keys(MASTER_BOT_PERSONALITIES);
  }
}