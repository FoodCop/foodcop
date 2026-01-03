/**
 * Content Mixer Utility
 * Merges recipes with advertisements for the Bites feed
 */

import type { Recipe } from '../components/bites/components/RecipeCard';
import type { AdItem } from '../types/ad';
import { getRandomAds, AD_INJECTION_CONFIG } from '../config/adsConfig';

export type BitesContent = Recipe | AdItem;

/**
 * Check if content item is an ad
 */
export function isAd(item: BitesContent): item is AdItem {
  return (item as AdItem).type === 'ad';
}

/**
 * Check if content item is a recipe
 */
export function isRecipe(item: BitesContent): item is Recipe {
  return !isAd(item);
}

/**
 * Mix recipes with ads at random intervals
 * @param recipes Array of recipe items
 * @param isMobile Whether to use mobile injection intervals
 * @returns Mixed array of recipes and ads
 */
export function mixRecipesWithAds(
  recipes: Recipe[],
  isMobile: boolean = false
): BitesContent[] {
  if (recipes.length === 0) {
    return [];
  }

  const config = isMobile
    ? AD_INJECTION_CONFIG.mobile
    : AD_INJECTION_CONFIG.desktop;

  const mixed: BitesContent[] = [];
  const adCount = Math.ceil(recipes.length / ((config.minInterval + config.maxInterval) / 2));
  const ads = getRandomAds(adCount);
  
  console.log(`🎯 Content Mixer: Mixing ${recipes.length} recipes with ${ads.length} ads (${isMobile ? 'mobile' : 'desktop'} mode)`);
  
  let adIndex = 0;
  let nextAdPosition = Math.floor(
    Math.random() * (config.maxInterval - config.minInterval + 1) + config.minInterval
  );

  recipes.forEach((recipe, index) => {
    mixed.push(recipe);

    // Insert ad at random intervals
    if (index === nextAdPosition - 1 && adIndex < ads.length) {
      console.log(`📢 Inserting ad at position ${mixed.length}:`, ads[adIndex]);
      mixed.push(ads[adIndex]);
      adIndex++;
      
      // Calculate next ad position
      const interval = Math.floor(
        Math.random() * (config.maxInterval - config.minInterval + 1) + config.minInterval
      );
      nextAdPosition = index + interval + 1;
    }
  });

  console.log(`✅ Mixed content: ${mixed.length} items total (${adIndex} ads inserted)`);
  return mixed;
}

/**
 * Mix recipes with ads at fixed intervals (more predictable)
 * @param recipes Array of recipe items
 * @param interval Insert an ad every N recipes
 * @returns Mixed array of recipes and ads
 */
export function mixRecipesWithAdsFixed(
  recipes: Recipe[],
  interval: number = 7
): BitesContent[] {
  if (recipes.length === 0) {
    return [];
  }

  const mixed: BitesContent[] = [];
  const adCount = Math.floor(recipes.length / interval);
  const ads = getRandomAds(adCount);
  
  let adIndex = 0;

  recipes.forEach((recipe, index) => {
    mixed.push(recipe);

    // Insert ad at fixed intervals
    if ((index + 1) % interval === 0 && adIndex < ads.length) {
      mixed.push(ads[adIndex]);
      adIndex++;
    }
  });

  return mixed;
}
