/**
 * Feed Content Mixer
 * Injects ads and trivia into feed posts at regular intervals
 */

import type { AdItem } from '../types/ad';
import type { TriviaItem } from '../types/trivia';
import { getVerticalAds, AD_INJECTION_CONFIG } from '../config/adsConfig';
import { getVerticalTrivias, TRIVIA_INJECTION_CONFIG } from '../config/triviaConfig';

export type FeedContent<T> = T | AdItem | TriviaItem;

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
 * Mix feed posts with ads and trivia at fixed intervals
 * @param posts Array of feed posts
 * @returns Mixed array of posts, ads, and trivia
 */
export function mixFeedWithAds<T extends { id: string }>(
  posts: T[]
): FeedContent<T>[] {
  if (posts.length === 0) {
    return [];
  }

  const adInterval = AD_INJECTION_CONFIG.feed.interval;
  const triviaInterval = TRIVIA_INJECTION_CONFIG.feed.interval;
  const adCount = Math.floor(posts.length / adInterval);
  const triviaCount = Math.floor(posts.length / triviaInterval);
  
  const ads = getVerticalAds(adCount);
  const trivias = getVerticalTrivias(triviaCount);
  
  console.log(`📰 Feed Mixer: Mixing ${posts.length} posts with ${ads.length} ads (every ${adInterval} posts) and ${trivias.length} trivias (every ${triviaInterval} posts)`);
  
  const mixed: FeedContent<T>[] = [];
  let adIndex = 0;
  let triviaIndex = 0;

  posts.forEach((post, index) => {
    mixed.push(post);

    // Insert ad at fixed intervals
    if ((index + 1) % adInterval === 0 && adIndex < ads.length) {
      console.log(`📢 Inserting ad at position ${mixed.length}`);
      mixed.push(ads[adIndex]);
      adIndex++;
    }
    
    // Insert trivia at fixed intervals (offset from ads)
    if ((index + 1) % triviaInterval === 0 && triviaIndex < trivias.length) {
      console.log(`🧠 Inserting trivia at position ${mixed.length}`);
      mixed.push(trivias[triviaIndex]);
      triviaIndex++;
    }
  });

  console.log(`✅ Mixed feed content: ${mixed.length} items total (${adIndex} ads, ${triviaIndex} trivias inserted)`);
  return mixed;
}
