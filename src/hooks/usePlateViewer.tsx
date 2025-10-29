import { useState, useCallback } from 'react';
import type { SavedItem } from '../types/plate';
import type { ViewerState, ViewerType } from '../components/ui/universal-viewer/types';
import { 
  transformSavedItemToViewerData, 
  transformSavedItemsToViewerData,
  getItemIndexInViewerData 
} from '../utils/plateViewerTransform';

export function usePlateViewer() {
  const [viewerState, setViewerState] = useState<ViewerState>({
    isOpen: false,
    type: null,
    data: null,
    items: null,
    currentIndex: 0
  });

  const openViewer = useCallback((
    item: SavedItem, 
    allItems?: SavedItem[], 
    type?: ViewerType
  ) => {
    try {
      // Transform the current item
      const viewerData = transformSavedItemToViewerData(item);
      
      // If we have all items, transform them all for navigation
      let allViewerData = null;
      let currentIndex = 0;
      
      if (allItems && allItems.length > 0) {
        allViewerData = transformSavedItemsToViewerData(allItems);
        currentIndex = getItemIndexInViewerData(allViewerData, item.id);
        
        // Fallback if not found
        if (currentIndex === -1) {
          currentIndex = 0;
        }
      }

      setViewerState({
        isOpen: true,
        type: (type || item.item_type) as ViewerType,
        data: viewerData,
        items: allViewerData,
        currentIndex
      });

      console.log('🎯 Universal Viewer opened:', {
        type: type || item.item_type,
        itemId: item.id,
        hasNavigation: !!allViewerData,
        currentIndex,
        totalItems: allViewerData?.length || 0
      });
    } catch (error) {
      console.error('Failed to open Universal Viewer:', error);
    }
  }, []);

  const closeViewer = useCallback(() => {
    setViewerState({
      isOpen: false,
      type: null,
      data: null,
      items: null,
      currentIndex: 0
    });

    console.log('🎯 Universal Viewer closed');
  }, []);

  const navigateViewer = useCallback((direction: 'prev' | 'next') => {
    if (!viewerState.items || !viewerState.isOpen) return;

    const newIndex = direction === 'next' 
      ? Math.min(viewerState.currentIndex + 1, viewerState.items.length - 1)
      : Math.max(viewerState.currentIndex - 1, 0);

    if (newIndex !== viewerState.currentIndex) {
      const newData = viewerState.items[newIndex];
      let newType: ViewerType = 'recipe'; // Default fallback

      // Determine type from data
      if (newData.recipe) newType = 'recipe';
      else if (newData.restaurant) newType = 'restaurant';
      else if (newData.photo) newType = 'photo';
      else if (newData.video) newType = 'video';

      setViewerState(prev => ({
        ...prev,
        type: newType,
        data: newData,
        currentIndex: newIndex
      }));

      console.log('🎯 Universal Viewer navigated:', {
        direction,
        newIndex,
        newType,
        totalItems: viewerState.items.length
      });
    }
  }, [viewerState]);

  return {
    viewerState,
    openViewer,
    closeViewer,
    navigateViewer,
    canNavigate: viewerState.items && viewerState.items.length > 1,
    currentIndex: viewerState.currentIndex,
    totalItems: viewerState.items?.length || 0
  };
}