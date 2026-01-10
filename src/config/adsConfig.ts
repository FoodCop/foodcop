/**
 * Advertisement Configuration
 * Central configuration for ads displayed in the Bites feed
 */

import type { AdItem } from '../types/ad';

/**
 * Generate ad configurations from local images
 */
function generateAdsFromFolder(): AdItem[] {
  const ads: AdItem[] = [];
  
  // Add Square ads (1:1 ratio) - Using 20 of them
  for (let i = 0; i < 20; i++) {
    ads.push({
      type: 'ad',
      id: `ad-square-${i}`,
      imageUrl: `/ads/Square/F_S_${String(i).padStart(4, '0')}.png`,
      format: 'square',
      aspectRatio: '1:1',
      altText: `Food Advertisement ${i + 1}`,
      sponsor: 'Featured Partner'
    });
  }
  
  // Add Vertical ads (3:4 ratio) - Using all 55 of them
  for (let i = 0; i < 55; i++) {
    ads.push({
      type: 'ad',
      id: `ad-vertical-${i}`,
      imageUrl: `/ads/Vertical/F_V_${String(i).padStart(4, '0')}.png`,
      format: 'vertical',
      aspectRatio: '3:4',
      altText: `Food Advertisement ${i + 21}`,
      sponsor: 'Featured Partner'
    });
  }
  
  console.log(`🎨 Generated ${ads.length} ads from folder`);
  return ads;
}

export const ADS_CONFIG: AdItem[] = generateAdsFromFolder();

/**
 * Ad injection configuration
 */
export const AD_INJECTION_CONFIG = {
  // Bites Desktop: Insert 1 ad every 6-8 recipes
  desktop: {
    minInterval: 6,
    maxInterval: 8
  },
  // Bites Mobile: Insert 1 ad every 4-5 recipes
  mobile: {
    minInterval: 4,
    maxInterval: 5
  },
  // Feed: Insert 1 ad every 3 posts
  feed: {
    interval: 3
  },
  // Trims: Insert 1 ad every 8 videos
  trims: {
    interval: 8
  }
};

/**
 * Get a random ad from the pool
 */
export function getRandomAd(): AdItem {
  return ADS_CONFIG[Math.floor(Math.random() * ADS_CONFIG.length)];
}

/**
 * Get multiple unique random ads
 */
export function getRandomAds(count: number): AdItem[] {
  const shuffled = [...ADS_CONFIG].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ADS_CONFIG.length));
}

/**
 * Get vertical ads only (for Feed and Trims)
 */
export function getVerticalAds(count: number): AdItem[] {
  const verticalAds = ADS_CONFIG.filter(ad => ad.format === 'vertical');
  const shuffled = [...verticalAds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, verticalAds.length));
}
