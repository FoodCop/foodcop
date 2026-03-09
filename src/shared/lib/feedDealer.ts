import type { DealerContent, FeedCard } from '../types/feed';

export const generateSeed = () => Date.now();

export const dealCardsWithSeed = (feedCards: FeedCard[], _seed: number, limit = 36): DealerContent[] => {
  if (!Array.isArray(feedCards)) return [];
  return feedCards.slice(0, limit) as DealerContent[];
};
