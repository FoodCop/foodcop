import { useState, useCallback } from 'react';
import type { ViewerState, ViewerType, ViewerData } from '../types';

export const useUniversalViewer = () => {
  const [state, setState] = useState<ViewerState>({
    isOpen: false,
    type: null,
    data: null,
    itemIndex: undefined,
    totalItems: undefined
  });

  const openViewer = useCallback((
    type: ViewerType, 
    data: ViewerData, 
    itemIndex?: number, 
    totalItems?: number
  ) => {
    console.log('🎯 Universal Viewer: Opening viewer', { type, itemIndex, totalItems });
    setState({
      isOpen: true,
      type,
      data,
      itemIndex,
      totalItems
    });
  }, []);

  const closeViewer = useCallback(() => {
    console.log('🔒 Universal Viewer: Closing viewer');
    setState({
      isOpen: false,
      type: null,
      data: null,
      itemIndex: undefined,
      totalItems: undefined
    });
  }, []);

  const navigateItem = useCallback((direction: 'prev' | 'next') => {
    console.log(`🧭 Universal Viewer: Navigate ${direction}`, {
      currentIndex: state.itemIndex,
      totalItems: state.totalItems
    });
    
    // This will be implemented by the parent component
    // that has access to the full item list
    // For now, just log the navigation request
  }, [state.itemIndex, state.totalItems]);

  return {
    state,
    openViewer,
    closeViewer,
    navigateItem
  };
};