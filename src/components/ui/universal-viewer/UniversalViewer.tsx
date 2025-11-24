import React from 'react';
import { Dialog, DialogContent } from '../dialog';
import { ViewerControls } from './controls/ViewerControls';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import type { UniversalViewerProps, UnifiedContentData, ViewerData } from './types';
import { UnifiedContentRenderer } from './UnifiedContentRenderer';
import { transformToUnified } from '../../../utils/unifiedContentTransformers';

// Import old viewers for backward compatibility
import { RecipeViewer } from './viewers/RecipeViewer';
import { RestaurantViewer } from './viewers/RestaurantViewer';
import { PhotoViewer } from './viewers/PhotoViewer';
import { VideoViewer } from './viewers/VideoViewer';

export const UniversalViewer: React.FC<UniversalViewerProps> = ({
  state,
  onClose,
  onNavigate,
  onDelete
}) => {
  // Keyboard navigation (ESC to close, arrows to navigate)
  useKeyboardNav({
    onClose,
    onNavigate,
    isOpen: state.isOpen
  });

  const renderViewer = () => {
    // Prioritize new unified format
    if (state.data && 'type' in state.data && 'media' in state.data && 'metadata' in state.data) {
      return (
        <React.Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
          <UnifiedContentRenderer data={state.data as UnifiedContentData} />
        </React.Suspense>
      );
    }

    // Fallback to old format for backward compatibility
    if (!state.data || !state.type) return null;

    try {

      // Fallback to old viewers for backward compatibility
      const oldData = state.data as ViewerData;
      
      switch (state.type) {
        case 'recipe':
          if (!oldData.recipe) return <div>No recipe data available</div>;
          // Try to transform to unified format
          try {
            const unified = transformToUnified(oldData.recipe, oldData.savedItemId);
            return <UnifiedContentRenderer data={unified} />;
          } catch {
            return (
              <React.Suspense fallback={<div className="p-6 text-center">Loading recipe...</div>}>
                <RecipeViewer data={oldData.recipe} />
              </React.Suspense>
            );
          }
        case 'restaurant':
          if (!oldData.restaurant) return <div>No restaurant data available</div>;
          try {
            const unified = transformToUnified(oldData.restaurant, oldData.savedItemId);
            return <UnifiedContentRenderer data={unified} />;
          } catch {
            return (
              <React.Suspense fallback={<div className="p-6 text-center">Loading restaurant...</div>}>
                <RestaurantViewer data={oldData.restaurant} />
              </React.Suspense>
            );
          }
        case 'photo':
          if (!oldData.photo) return <div>No photo data available</div>;
          try {
            const unified = transformToUnified(oldData.photo, oldData.savedItemId);
            return <UnifiedContentRenderer data={unified} />;
          } catch {
            return (
              <React.Suspense fallback={<div className="p-6 text-center">Loading photo...</div>}>
                <PhotoViewer data={oldData.photo} />
              </React.Suspense>
            );
          }
        case 'video':
          if (!oldData.video) return <div>No video data available</div>;
          try {
            const unified = transformToUnified(oldData.video, oldData.savedItemId);
            return <UnifiedContentRenderer data={unified} />;
          } catch {
            return (
              <React.Suspense fallback={<div className="p-6 text-center">Loading video...</div>}>
                <VideoViewer data={oldData.video} />
              </React.Suspense>
            );
          }
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
          type={state.type || (state.data && 'type' in state.data ? (state.data as UnifiedContentData).type : null)}
          onClose={onClose}
          onNavigate={onNavigate}
          canNavigate={!!onNavigate && !!state.items && state.items.length > 1}
          currentIndex={state.currentIndex}
          totalItems={state.totalItems || state.items?.length}
          onDelete={onDelete && state.data && 'savedItemId' in state.data && state.data.savedItemId ? () => {
            const unifiedData = state.data as UnifiedContentData;
            onDelete(unifiedData.savedItemId!, unifiedData.type);
          } : undefined}
          itemId={state.data && 'savedItemId' in state.data ? state.data.savedItemId : undefined}
        />
        
        {/* Main content area with scroll */}
        <div className="overflow-y-auto max-h-[85vh] relative">
          {renderViewer()}
        </div>
      </DialogContent>
    </Dialog>
  );
};