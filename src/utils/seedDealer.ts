/**
 * Seed-based Card Dealer
 * Deals cards in a deterministic pattern based on a seed
 */

import type { FeedCard } from '../components/feed/data/feed-content';
import type { AdItem } from '../types/ad';
import type { TriviaItem } from '../types/trivia';
import { getVerticalAds } from '../config/adsConfig';
import { getVerticalTrivias } from '../config/triviaConfig';

export type DealerContent = FeedCard | AdItem | TriviaItem;

/**
 * Card type mapping
 * 1 = Restaurant/JSON (masterbot posts)
 * 2 = Recipe
 * 3 = Video
 * 4 = Google Maps suggestion (future feature)
 * 5 = Ad
 * 6 = Trivia
 */
export const CARD_TYPE_MAP = {
  1: 'restaurant',
  2: 'recipe',
  3: 'video',
  4: 'maps',
  5: 'ad',
  6: 'trivia'
} as const;

/**
 * Generate a balanced seed for the session
 * Ensures good distribution: 1 restaurant, 1 recipe, 1 video, 1 maps, 1 ad, 1 trivia
 * Then shuffles to randomize order
 */
export function generateSeed(): string {
  // Start with a balanced base: 1 of each type (6 cards per cycle)
  const basePattern = [1, 2, 3, 4, 5, 6];
  
  // Shuffle the pattern
  for (let i = basePattern.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [basePattern[i], basePattern[j]] = [basePattern[j], basePattern[i]];
  }
  
  return basePattern.join('');
}

/**
 * Parse seed into card type pattern
 */
export function parseSeedPattern(seed: string): string[] {
  return seed.split('').map(digit => {
    const num = parseInt(digit);
    return CARD_TYPE_MAP[num as keyof typeof CARD_TYPE_MAP] || 'restaurant';
  });
}

/**
 * Check if content item is an ad
 */
export function isAd(item: unknown): item is AdItem {
  return (item as AdItem).type === 'ad';
}

/**
 * Check if content item is trivia
 */
export function isTrivia(item: unknown): item is TriviaItem {
  return (item as TriviaItem).type === 'trivia';
}

/**
 * Deal cards based on seed pattern
 * @param feedCards All feed cards from the service (restaurants, recipes, videos, etc.)
 * @param seed The seed pattern (e.g., "123456")
 * @param totalCards Total number of cards to deal
 * @returns Dealt cards in seed pattern order
 */
export function dealCardsWithSeed(
  feedCards: FeedCard[],
  seed: string,
  totalCards: number = 20
): DealerContent[] {
  const pattern = parseSeedPattern(seed);
  console.log(`🎲 Seed Dealer: Using seed ${seed}, pattern:`, pattern);

  // Separate feed cards by type
  const restaurantCards = feedCards.filter(c => c.type === 'restaurant' && !c.id.startsWith('maps-'));
  const recipeCards = feedCards.filter(c => c.type === 'recipe');
  const videoCards = feedCards.filter(c => c.type === 'video');
  const mapsCards = feedCards.filter(c => c.type === 'restaurant' && c.id.startsWith('maps-'));

  // Use restaurant cards as "JSON" cards (type 1) - includes generated images
  const jsonCards = restaurantCards;

  // Calculate how many of each type we need
  const typeCounts = pattern.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cyclesNeeded = Math.ceil(totalCards / pattern.length);
  const adsNeeded = (typeCounts['ad'] || 0) * cyclesNeeded;
  const triviasNeeded = (typeCounts['trivia'] || 0) * cyclesNeeded;

  // Get ads and trivias
  const ads = getVerticalAds(adsNeeded);
  const trivias = getVerticalTrivias(triviasNeeded);

  console.log(`📊 Card pools:`, {
    json: jsonCards.length,
    recipe: recipeCards.length,
    video: videoCards.length,
    maps: mapsCards.length,
    ad: ads.length,
    trivia: trivias.length
  });

  // ⚠️ CRITICAL: If we don't have enough content, warn but continue
  if (recipeCards.length === 0) {
    console.warn('⚠️ No recipe cards available - will use fallbacks');
  }
  if (videoCards.length === 0) {
    console.warn('⚠️ No video cards available - will use fallbacks');
  }
  
  // Debug: Log first few cards of each type
  if (recipeCards.length > 0) {
    console.log('🍳 Sample recipe card:', { id: recipeCards[0].id, title: recipeCards[0].title });
  }
  if (videoCards.length > 0) {
    console.log('📹 Sample video card:', { id: videoCards[0].id, title: videoCards[0].title });
  }
  if (mapsCards.length > 0) {
    const firstCard = mapsCards[0];
    const displayName = firstCard.type === 'restaurant' ? firstCard.name : 
                        firstCard.type === 'masterbot' ? firstCard.username : 
                        firstCard.type === 'recipe' || firstCard.type === 'video' ? firstCard.title :
                        firstCard.brandName;
    console.log('🗺️ Sample maps card:', { id: firstCard.id, name: displayName });
  }

  // Index trackers for each pool
  const indices = {
    restaurant: 0,
    recipe: 0,
    video: 0,
    maps: 0,
    ad: 0,
    trivia: 0
  };

  const dealtCards: DealerContent[] = [];
  let patternIndex = 0;

  // Deal cards following the seed pattern
  for (let i = 0; i < totalCards; i++) {
    const cardType = pattern[patternIndex];
    let card: DealerContent | null = null;

    switch (cardType) {
      case 'restaurant':
        // Use JSON cards (restaurants + masterbot)
        if (jsonCards.length > 0) {
          card = jsonCards[indices.restaurant % jsonCards.length];
          indices.restaurant++;
        }
        break;

      case 'recipe':
        if (recipeCards.length > 0) {
          card = recipeCards[indices.recipe % recipeCards.length];
          indices.recipe++;
        } else {
          // Fallback to JSON cards
          if (jsonCards.length > 0) {
            card = jsonCards[indices.restaurant % jsonCards.length];
            indices.restaurant++;
          }
        }
        break;

      case 'video':
        if (videoCards.length > 0) {
          card = videoCards[indices.video % videoCards.length];
          indices.video++;
        } else {
          // Fallback to JSON cards
          if (jsonCards.length > 0) {
            card = jsonCards[indices.restaurant % jsonCards.length];
            indices.restaurant++;
          }
        }
        break;

      case 'maps':
        // Google Maps restaurant cards
        if (mapsCards.length > 0) {
          card = mapsCards[indices.maps % mapsCards.length];
          indices.maps++;
        } else {
          // Fallback to JSON cards if no maps cards available
          if (jsonCards.length > 0) {
            card = jsonCards[indices.restaurant % jsonCards.length];
            indices.restaurant++;
          }
        }
        break;

      case 'ad':
        if (ads.length > 0) {
          card = ads[indices.ad % ads.length];
          indices.ad++;
        }
        break;

      case 'trivia':
        if (trivias.length > 0) {
          card = trivias[indices.trivia % trivias.length];
          indices.trivia++;
        }
        break;
    }

    // If we got a card, add it
    if (card) {
      dealtCards.push(card);
      if (i < 10) { // Only log first 10 for readability
        console.log(`🎴 Card ${i + 1}: ${cardType} - ${card.type} - ${card.id}`);
      }
    }

    // Move to next position in pattern (cycles)
    patternIndex = (patternIndex + 1) % pattern.length;
  }

  console.log(`✅ Dealt ${dealtCards.length} cards with seed ${seed}`);
  console.log(`🎯 Card types:`, dealtCards.map(c => 
    isAd(c) ? 'ad' : isTrivia(c) ? 'trivia' : (c as FeedCard).type
  ));

  return dealtCards;
}
