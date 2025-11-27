import { useState, useCallback } from 'react';
import { SharedItem } from '../services/dmChatService';

interface UseShareToChatReturn {
  isShareModalOpen: boolean;
  shareItem: SharedItem | null;
  openShareModal: (item: SharedItem) => void;
  closeShareModal: () => void;
}

/**
 * Hook to manage ShareToChat modal state
 * Use this hook in components that have share buttons
 */
export function useShareToChat(): UseShareToChatReturn {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState<SharedItem | null>(null);

  const openShareModal = useCallback((item: SharedItem) => {
    setShareItem(item);
    setIsShareModalOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
    // Delay clearing item to allow animation
    setTimeout(() => setShareItem(null), 200);
  }, []);

  return {
    isShareModalOpen,
    shareItem,
    openShareModal,
    closeShareModal,
  };
}

/**
 * Helper to create a SharedItem from different content types
 */
export const createShareItem = {
  restaurant: (data: {
    id: string;
    name: string;
    image_url?: string;
    address?: string;
    rating?: number;
  }): SharedItem => ({
    type: 'restaurant',
    id: data.id,
    title: data.name,
    image_url: data.image_url,
    subtitle: data.address,
    metadata: { rating: data.rating },
  }),

  recipe: (data: {
    id: string;
    title: string;
    image_url?: string;
    ready_in_minutes?: number;
    servings?: number;
  }): SharedItem => ({
    type: 'recipe',
    id: data.id,
    title: data.title,
    image_url: data.image_url,
    subtitle: data.ready_in_minutes
      ? `${data.ready_in_minutes} mins • ${data.servings || 4} servings`
      : undefined,
    metadata: {
      ready_in_minutes: data.ready_in_minutes,
      servings: data.servings,
    },
  }),

  video: (data: {
    id: string;
    title: string;
    thumbnail_url?: string;
    channel_name?: string;
    duration?: string;
  }): SharedItem => ({
    type: 'video',
    id: data.id,
    title: data.title,
    image_url: data.thumbnail_url,
    subtitle: data.channel_name,
    metadata: { duration: data.duration },
  }),
};

export default useShareToChat;

