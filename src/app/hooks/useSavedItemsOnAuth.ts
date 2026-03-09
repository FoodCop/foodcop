import { useEffect } from 'react';
import { PlateService } from '../../services/plateService';
import { hasSupabaseConfig } from '../../services/supabaseClient';

export const useSavedItemsOnAuth = ({
  isAuthenticated,
  setSavedItems,
  fallbackSavedItems,
  normalizeSavedItemForUI,
}: {
  isAuthenticated: boolean;
  setSavedItems: (value: any[] | ((prev: any[]) => any[])) => void;
  fallbackSavedItems: any[];
  normalizeSavedItemForUI: (value: any) => any;
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
