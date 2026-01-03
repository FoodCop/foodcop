/**
 * Trims Content Mixer
 * Injects ads into video feed at regular intervals
 */

import type { AdItem } from '../types/ad';
import { getVerticalAds, AD_INJECTION_CONFIG } from '../config/adsConfig';

export type TrimsContent<T> = T | AdItem;

/**
 * Check if content item is an ad
 */
export function isAd(item: unknown): item is AdItem {
  return (item as AdItem).type === 'ad';
}

/**
 * Mix videos with ads at fixed intervals
 * @param videos Array of video items
 * @returns Mixed array of videos and ads
 */
export function mixVideosWithAds<T extends { id: string }>(
  videos: T[]
): TrimsContent<T>[] {
  if (videos.length === 0) {
    return [];
  }

  const interval = AD_INJECTION_CONFIG.trims.interval;
  const adCount = Math.floor(videos.length / interval);
  const ads = getVerticalAds(adCount);
  
  console.log(`🎬 Trims Mixer: Mixing ${videos.length} videos with ${ads.length} ads (every ${interval} videos)`);
  
  const mixed: TrimsContent<T>[] = [];
  let adIndex = 0;

  videos.forEach((video, index) => {
    mixed.push(video);

    // Insert ad at fixed intervals
    if ((index + 1) % interval === 0 && adIndex < ads.length) {
      console.log(`📢 Inserting ad at position ${mixed.length}`);
      mixed.push(ads[adIndex]);
      adIndex++;
    }
  });

  console.log(`✅ Mixed video content: ${mixed.length} items total (${adIndex} ads inserted)`);
  return mixed;
}
