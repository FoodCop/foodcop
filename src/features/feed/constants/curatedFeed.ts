import { resolvePublicAssetPath } from '../../../shared/lib/resolvePublicAssetPath';
import type { FeedUiItem } from '../types/feedUi';

export const LOCAL_CURATED_FEED_ITEMS: FeedUiItem[] = [
  { id: 'recipe-r1', itemType: 'recipe', itemId: 'r1', name: 'Crispy Miso Salmon', cat: 'Recipe', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', author: 'Chef Studio', metadata: {} },
  { id: 'video-v1', itemType: 'video', itemId: 'v1', name: '30-Minute Sushi Roll', cat: 'Studio Trim', img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', author: 'FUZO Studio', metadata: {} },
  { id: 'ad-fallback-1', itemType: 'ad', itemId: 'fallback-1', name: 'FoodieFinds', cat: 'Ad', img: resolvePublicAssetPath('ads/Vertical/F_V_0000.png'), metadata: {} },
  { id: 'trivia-fallback-1', itemType: 'trivia', itemId: 'fallback-1', name: 'Food Trivia', cat: 'Trivia', img: resolvePublicAssetPath('trivia/vertical/TRIV_V_0000.png'), metadata: {} },
  { id: 'recipe-r2', itemType: 'recipe', itemId: 'r2', name: 'Pesto Burrata Pasta', cat: 'Recipe', img: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80', author: 'Chef Studio', metadata: {} },
  { id: 'video-v2', itemType: 'video', itemId: 'v2', name: 'Street Taco Masterclass', cat: 'Studio Trim', img: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=800&q=80', author: 'FUZO Studio', metadata: {} },
  { id: 'ad-fallback-2', itemType: 'ad', itemId: 'fallback-2', name: 'CookingMaster', cat: 'Ad', img: resolvePublicAssetPath('ads/Vertical/F_V_0001.png'), metadata: {} },
  { id: 'trivia-fallback-2', itemType: 'trivia', itemId: 'fallback-2', name: 'Food Trivia', cat: 'Trivia', img: resolvePublicAssetPath('trivia/vertical/TRIV_V_0001.png'), metadata: {} },
];
