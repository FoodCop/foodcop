import { dealCardsWithSeed, generateSeed } from '../../../shared/lib/feedDealer';
import { resolvePublicAssetPath } from '../../../shared/lib/resolvePublicAssetPath';
import type { DealerContent, FeedCard } from '../../../shared/types/feed';
import type { FeedUiItem, FeedUiItemType } from '../types/feedUi';

const TARGET_FEED_TYPES: FeedUiItemType[] = ['ad', 'trivia', 'recipe', 'video'];

const buildStableUiId = (itemType: FeedUiItemType, itemId: string) => `${itemType}-${itemId}`;

const normalizeFeedImagePathForType = (itemType: FeedUiItemType, imagePath: string) => {
  if (!imagePath) return imagePath;
  const normalized = imagePath.replace(/\\/g, '/');
  if (itemType === 'ad') {
    return normalized.replace(/(^|\/)ads\/vertical\//i, '$1ads/Vertical/');
  }
  if (itemType === 'trivia') {
    return normalized.replace(/(^|\/)trivia\/vertical\//i, '$1trivia/vertical/');
  }
  return normalized;
};

export const normalizeDealerContentToCards = (dealerCards: DealerContent[]): FeedUiItem[] => {
  const normalized = dealerCards
    .map((entry) => {
      const sourceType = String((entry as any).type || '').toLowerCase();
      if (!TARGET_FEED_TYPES.includes(sourceType as FeedUiItemType)) return null;

      const rawId = String((entry as any).id || '').trim();
      if (!rawId) return null;

      const itemType = sourceType as FeedUiItemType;
      const itemId = rawId.replace(new RegExp(`^${itemType}-`), '') || rawId;
      const id = buildStableUiId(itemType, itemId);

      const name = itemType === 'recipe'
        ? String((entry as any).title || 'Recipe')
        : itemType === 'video'
          ? String((entry as any).title || 'Video')
          : itemType === 'ad'
            ? String((entry as any).brandName || (entry as any).headline || 'Sponsored')
            : String((entry as any).title || (entry as any).question || 'Food Trivia');

      const cat = itemType === 'recipe'
        ? 'Recipe'
        : itemType === 'video'
          ? 'Studio Trim'
          : itemType === 'ad'
            ? 'Ad'
            : 'Trivia';

      const rawImage = itemType === 'video'
        ? String((entry as any).thumbnailUrl || '')
        : String((entry as any).imageUrl || '');

      const normalizedImage = normalizeFeedImagePathForType(itemType, rawImage);

      const img = resolvePublicAssetPath(normalizedImage);

      if (!name || !img) return null;

      return {
        id,
        itemType,
        itemId,
        name,
        cat,
        img,
        metadata: {
          title: name,
          name,
          cat,
          image: img,
          sourceType,
          sourceId: rawId,
        },
      };
    })
    .filter(Boolean) as FeedUiItem[];

  const uniqueById = new Map<string, FeedUiItem>();
  normalized.forEach((item) => {
    if (!uniqueById.has(item.id)) {
      uniqueById.set(item.id, item);
    }
  });

  return Array.from(uniqueById.values());
};

export const normalizeFeedServiceToCards = (feedCards: FeedCard[]) => {
  const seed = generateSeed();
  const dealtCards = dealCardsWithSeed(feedCards, seed, 36);
  return normalizeDealerContentToCards(dealtCards);
};

const getMissingFieldNames = (item: any) => {
  const missing: string[] = [];
  if (!item.id) missing.push('id');
  if (!item.itemType) missing.push('itemType');
  if (!item.itemId) missing.push('itemId');
  if (!item.name) missing.push('name');
  if (!item.cat) missing.push('cat');
  if (!item.img) missing.push('img');
  return missing;
};

const isValidImageUrl = (url?: string) => !!url && /^(https?:\/\/|\/)/.test(url);

export const ensureAdTriviaPresence = (
  items: FeedUiItem[],
  fallbackItems: readonly { id: string; itemType: string; itemId: string; name: string; cat: string; img: string }[]
): FeedUiItem[] => {
  const hasAd = items.some((item) => item.itemType === 'ad');
  const hasTrivia = items.some((item) => item.itemType === 'trivia');
  if (hasAd && hasTrivia) return items;

  const fallbackAd = fallbackItems.find((item) => item.itemType === 'ad');
  const fallbackTrivia = fallbackItems.find((item) => item.itemType === 'trivia');

  const toFeedUiItem = (fallbackItem: { id: string; itemType: string; itemId: string; name: string; cat: string; img: string }): FeedUiItem => ({
    id: fallbackItem.id,
    itemType: fallbackItem.itemType as FeedUiItemType,
    itemId: fallbackItem.itemId,
    name: fallbackItem.name,
    cat: fallbackItem.cat,
    img: fallbackItem.img,
    metadata: {
      title: fallbackItem.name,
      name: fallbackItem.name,
      cat: fallbackItem.cat,
      image: fallbackItem.img,
      sourceType: fallbackItem.itemType,
      sourceId: fallbackItem.id,
    },
  });

  return [
    ...items,
    ...(!hasAd && fallbackAd ? [toFeedUiItem(fallbackAd)] : []),
    ...(!hasTrivia && fallbackTrivia ? [toFeedUiItem(fallbackTrivia)] : []),
  ];
};

export const logFeedParity = (localItems: readonly any[], serviceItems: readonly any[]) => {
  const localMissing = localItems.map((item) => ({ id: item.id, missing: getMissingFieldNames(item) })).filter((row) => row.missing.length > 0);
  const serviceMissing = serviceItems.map((item) => ({ id: item.id, missing: getMissingFieldNames(item) })).filter((row) => row.missing.length > 0);
  const localInvalidImages = localItems.filter((item) => !isValidImageUrl(item.img)).map((item) => item.id);
  const serviceInvalidImages = serviceItems.filter((item) => !isValidImageUrl(item.img)).map((item) => item.id);
  const localIds = new Set(localItems.map((item) => item.id));
  const serviceIds = new Set(serviceItems.map((item) => item.id));
  const overlappingIds = Array.from(serviceIds).filter((id) => localIds.has(id));

  console.groupCollapsed('🍽️ [Feed Parity] Local vs FeedService');
  console.log('Counts', { local: localItems.length, feedService: serviceItems.length });
  console.log('Missing fields', { local: localMissing, feedService: serviceMissing });
  console.log('Invalid image URLs', { local: localInvalidImages, feedService: serviceInvalidImages });
  console.log('IDs', {
    localSample: localItems.slice(0, 8).map((item) => item.id),
    feedServiceSample: serviceItems.slice(0, 8).map((item) => item.id),
    overlapCount: overlappingIds.length,
  });
  console.groupEnd();
};
