/**
 * Feed Content Mixer
 * Injects ads into feed posts at regular intervals
 */

import type { AdItem } from '../types/ad';
import { getVerticalAds, AD_INJECTION_CONFIG } from '../config/adsConfig';

export type FeedContent<T> = T | AdItem;

/**
 * Check if content item is an ad
 */
export function isAd(item: unknown): item is AdItem {
  return (item as AdItem).type === 'ad';
}

/**
 * Mix feed posts with ads at fixed intervals
 * @param posts Array of feed posts
 * @returns Mixed array of posts and ads
 */
export function mixFeedWithAds<T extends { id: string }>(
  posts: T[]
): FeedContent<T>[] {
  if (posts.length === 0) {
    return [];
  }

  const interval = AD_INJECTION_CONFIG.feed.interval;
  const adCount = Math.floor(posts.length / interval);
  const ads = getVerticalAds(adCount);
  
  console.log(`📰 Feed Mixer: Mixing ${posts.length} posts with ${ads.length} ads (every ${interval} posts)`);
  
  const mixed: FeedContent<T>[] = [];
  let adIndex = 0;

  posts.forEach((post, index) => {
    mixed.push(post);

    // Insert ad at fixed intervals
    if ((index + 1) % interval === 0 && adIndex < ads.length) {
      console.log(`📢 Inserting ad at position ${mixed.length}`);
      mixed.push(ads[adIndex]);
      adIndex++;
    }
  });

  console.log(`✅ Mixed feed content: ${mixed.length} items total (${adIndex} ads inserted)`);
  return mixed;
}
