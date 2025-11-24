import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UnifiedContentData, ViewerType } from '../components/ui/universal-viewer/types';
import type { 
  RecipeViewerData, 
  RestaurantViewerData, 
  PhotoViewerData, 
  VideoViewerData 
} from '../components/ui/universal-viewer/types';
import {
  transformRecipeToUnified,
  transformRestaurantToUnified,
  transformPhotoToUnified,
  transformVideoToUnified,
  transformToUnified,
} from '../utils/unifiedContentTransformers';

export interface ViewerState {
  isOpen: boolean;
  type: ViewerType | null;
  data: UnifiedContentData | null;
  items?: UnifiedContentData[] | null; // All items for navigation
  currentIndex: number;
  itemIndex?: number;
  totalItems?: number;
}

interface UniversalViewerContextValue {
  viewerState: ViewerState;
  openViewer: (data: UnifiedContentData, allItems?: UnifiedContentData[], initialIndex?: number) => void;
  openRecipe: (recipe: RecipeViewerData | UnifiedContentData, savedItemId?: string) => void;
  openVideo: (video: VideoViewerData | UnifiedContentData, savedItemId?: string) => void;
  openRestaurant: (restaurant: RestaurantViewerData | UnifiedContentData, savedItemId?: string) => void;
  openPhoto: (photo: PhotoViewerData | UnifiedContentData, savedItemId?: string) => void;
  closeViewer: () => void;
  navigateViewer: (direction: 'prev' | 'next') => void;
  setDeleteHandler: (handler: ((itemId: string, itemType: string) => void) | null) => void;
  deleteHandler: ((itemId: string, itemType: string) => void) | null;
}

const UniversalViewerContext = createContext<UniversalViewerContextValue | undefined>(undefined);

interface UniversalViewerProviderProps {
  children: ReactNode;
}

export function UniversalViewerProvider({ children }: UniversalViewerProviderProps) {
  const [viewerState, setViewerState] = useState<ViewerState>({
    isOpen: false,
    type: null,
    data: null,
    items: null,
    currentIndex: 0,
  });
  const [deleteHandler, setDeleteHandlerState] = useState<((itemId: string, itemType: string) => void) | null>(null);
  
  // Memoize setDeleteHandler to prevent infinite loops
  const setDeleteHandler = useCallback((handler: ((itemId: string, itemType: string) => void) | null) => {
    setDeleteHandlerState(handler);
  }, []);

  const openViewer = useCallback((data: UnifiedContentData, allItems?: UnifiedContentData[], initialIndex?: number) => {
    let currentIndex = 0;
    
    if (initialIndex !== undefined) {
      currentIndex = initialIndex;
    } else if (allItems && allItems.length > 0) {
      currentIndex = allItems.findIndex(item => item.id === data.id);
      if (currentIndex === -1) currentIndex = 0;
    }

    setViewerState({
      isOpen: true,
      type: data.type,
      data,
      items: allItems || null,
      currentIndex,
      itemIndex: currentIndex,
      totalItems: allItems?.length || 1,
    });
  }, []);

  const openRecipe = useCallback((recipe: RecipeViewerData | UnifiedContentData, savedItemId?: string) => {
    const unified = 'type' in recipe && recipe.type === 'recipe'
      ? recipe as UnifiedContentData
      : transformRecipeToUnified(recipe as RecipeViewerData, savedItemId);
    openViewer(unified);
  }, [openViewer]);

  const openVideo = useCallback((video: VideoViewerData | UnifiedContentData, savedItemId?: string) => {
    const unified = 'type' in video && video.type === 'video'
      ? video as UnifiedContentData
      : transformVideoToUnified(video as VideoViewerData, savedItemId);
    openViewer(unified);
  }, [openViewer]);

  const openRestaurant = useCallback((restaurant: RestaurantViewerData | UnifiedContentData, savedItemId?: string) => {
    const unified = 'type' in restaurant && restaurant.type === 'restaurant'
      ? restaurant as UnifiedContentData
      : transformRestaurantToUnified(restaurant as RestaurantViewerData, savedItemId);
    openViewer(unified);
  }, [openViewer]);

  const openPhoto = useCallback((photo: PhotoViewerData | UnifiedContentData, savedItemId?: string) => {
    const unified = 'type' in photo && photo.type === 'photo'
      ? photo as UnifiedContentData
      : transformPhotoToUnified(photo as PhotoViewerData, savedItemId);
    openViewer(unified);
  }, [openViewer]);

  const closeViewer = useCallback(() => {
    setViewerState({
      isOpen: false,
      type: null,
      data: null,
      items: null,
      currentIndex: 0,
    });
  }, []);

  const navigateViewer = useCallback((direction: 'prev' | 'next') => {
    if (!viewerState.items || !viewerState.isOpen || viewerState.items.length <= 1) return;

    const newIndex = direction === 'next' 
      ? Math.min(viewerState.currentIndex + 1, viewerState.items.length - 1)
      : Math.max(viewerState.currentIndex - 1, 0);

    if (newIndex !== viewerState.currentIndex) {
      const newData = viewerState.items[newIndex];
      setViewerState(prev => ({
        ...prev,
        type: newData.type,
        data: newData,
        currentIndex: newIndex,
        itemIndex: newIndex,
      }));
    }
  }, [viewerState]);

  const value: UniversalViewerContextValue = {
    viewerState,
    openViewer,
    openRecipe,
    openVideo,
    openRestaurant,
    openPhoto,
    closeViewer,
    navigateViewer,
    setDeleteHandler,
    deleteHandler,
  };

  return (
    <UniversalViewerContext.Provider value={value}>
      {children}
    </UniversalViewerContext.Provider>
  );
}

export function useUniversalViewer(): UniversalViewerContextValue {
  const context = useContext(UniversalViewerContext);
  if (context === undefined) {
    throw new Error('useUniversalViewer must be used within a UniversalViewerProvider');
  }
  return context;
}

