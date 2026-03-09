import type { FeedCard } from '../../../shared/types/feed';

export const FeedService = {
  async generateFeed(_params: { pageSize: number; userLocation?: { lat: number; lng: number } }) {
    return [] as FeedCard[];
  },
};
