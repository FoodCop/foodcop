import React from 'react';
import { Dialog, DialogContent } from '../dialog';
import { ViewerControls } from './controls/ViewerControls';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import type { UniversalViewerProps } from './types';

// Import viewers directly (not lazy loading for now to avoid export issues)
import { RecipeViewer } from './viewers/RecipeViewer';
import { RestaurantViewer } from './viewers/RestaurantViewer';
import { PhotoViewer } from './viewers/PhotoViewer';
import { VideoViewer } from './viewers/VideoViewer';

export const UniversalViewer: React.FC<UniversalViewerProps> = ({
  state,
  onClose,
  onNavigate
}) => {
  // Keyboard navigation (ESC to close, arrows to navigate)
  useKeyboardNav({
    onClose,
    onNavigate,
    isOpen: state.isOpen
  });

  const renderViewer = () => {
    if (!state.data || !state.type) return null;

    try {
      switch (state.type) {
        case 'recipe':
          if (!state.data.recipe) return <div>No recipe data available</div>;
          return (
            <React.Suspense fallback={<div className="p-6 text-center">Loading recipe...</div>}>
              <RecipeViewer data={state.data.recipe} />
            </React.Suspense>
          );
        case 'restaurant':
          if (!state.data.restaurant) return <div>No restaurant data available</div>;
          return (
            <React.Suspense fallback={<div className="p-6 text-center">Loading restaurant...</div>}>
              <RestaurantViewer data={state.data.restaurant} />
            </React.Suspense>
          );
        case 'photo':
          if (!state.data.photo) return <div>No photo data available</div>;
          return (
            <React.Suspense fallback={<div className="p-6 text-center">Loading photo...</div>}>
              <PhotoViewer data={state.data.photo} />
            </React.Suspense>
          );
        case 'video':
          if (!state.data.video) return <div>No video data available</div>;
          return (
            <React.Suspense fallback={<div className="p-6 text-center">Loading video...</div>}>
              <VideoViewer data={state.data.video} />
            </React.Suspense>
          );
        default:
          return (
            <div className="p-6 text-center">
              <p className="text-gray-500">Unsupported content type: {state.type}</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering viewer:', error);
      return (
        <div className="p-6 text-center">
          <p className="text-red-500">Error loading content</p>
        </div>
      );
    }
  };

  return (
    <Dialog open={state.isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside for better UX
          e.preventDefault();
        }}
      >
        {/* Controls overlay */}
        <ViewerControls
          type={state.type}
          onClose={onClose}
          onNavigate={onNavigate}
          canNavigate={!!onNavigate}
          currentIndex={state.itemIndex}
          totalItems={state.totalItems}
        />
        
        {/* Main content area with scroll */}
        <div className="overflow-y-auto max-h-[85vh] relative">
          {renderViewer()}
        </div>
      </DialogContent>
    </Dialog>
  );
};