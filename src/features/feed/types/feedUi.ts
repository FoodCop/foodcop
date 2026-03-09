export type FeedUiItemType = 'recipe' | 'video' | 'ad' | 'trivia';

export type FeedUiItem = {
  id: string;
  itemType: FeedUiItemType;
  itemId: string;
  name: string;
  cat: string;
  img: string;
  metadata: Record<string, any>;
};
