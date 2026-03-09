import { useEffect } from 'react';
import { PlateService } from '../../services/plateService';
import { hasSupabaseConfig } from '../../services/supabaseClient';
import type { AppItem } from '../../shared/types/appItem';

export const useSavedItemsOnAuth = ({
  isAuthenticated,
  setSavedItems,
  fallbackSavedItems,
  normalizeSavedItemForUI,
}: {
  isAuthenticated: boolean;
  setSavedItems: (value: AppItem[] | ((prev: AppItem[]) => AppItem[])) => void;
  fallbackSavedItems: AppItem[];
  normalizeSavedItemForUI: (value: unknown) => AppItem;
}) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadSavedItems = async () => {
      if (!hasSupabaseConfig) {
        setSavedItems(fallbackSavedItems);
        return;
      }

      try {
        const response = await PlateService.listSavedItems();
        if (!response.success || !response.data) {
          setSavedItems(fallbackSavedItems);
          return;
        }

        const mapped = response.data.map(normalizeSavedItemForUI);
        setSavedItems(mapped.length > 0 ? mapped : fallbackSavedItems);
      } catch {
        setSavedItems(fallbackSavedItems);
      }
    };

    loadSavedItems();
  }, [fallbackSavedItems, isAuthenticated, normalizeSavedItemForUI, setSavedItems]);
};
