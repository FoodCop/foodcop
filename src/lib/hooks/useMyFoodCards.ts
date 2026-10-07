'use client';

import { useCallback, useEffect, useState } from 'react';
import { foodCardService } from '@/lib/services/foodCardService';
import type { FoodCardRecord } from '@/lib/types/foodCard';

// Shared between /profile (own cards) and /profile/[userId] (someone else's) -
// both need the same food_cards list: Profile's ActivityTab renders it as the
// "Your Cards" grid, and ProfileHero's Bites count is derived from it, so one
// create/delete anywhere refreshes both instead of drifting out of sync until
// a full page reload.
export function useMyFoodCards(userId: string | undefined) {
  const [cards, setCards] = useState<FoodCardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setCards([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await foodCardService.listMyCards(userId);
      setCards(result.success && result.data ? result.data : []);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { cards, isLoading, refetch, setCards };
}
