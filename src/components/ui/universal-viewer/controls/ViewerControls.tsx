import React from 'react';
import { Button } from '../../button';
import {
  Close,
  ChevronLeft,
  ChevronRight,
  Share,
  Delete
} from '@mui/icons-material';
import type { ViewerControlsProps } from '../types';

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  type,
  onClose,
  onNavigate,
  canNavigate,
  currentIndex,
  totalItems,
  onDelete,
  itemId
}) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `FUZO ${type} viewer`,
        text: `Check out this ${type} on FUZO`,
        url: globalThis.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(globalThis.location.href).catch(console.error);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {/* Navigation Controls */}
      {!!(canNavigate && onNavigate && totalItems && totalItems > 1) && (
        <>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {!!(currentIndex !== undefined && totalItems) && (
            <div className="bg-black/50 text-white px-3 py-1 rounded text-sm">
              {currentIndex + 1} / {totalItems}
            </div>
          )}
          
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onNavigate('next')}
            disabled={currentIndex === (totalItems - 1)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Delete Button */}
      {onDelete && itemId && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onDelete}
          className="bg-red-500/70 text-white hover:bg-red-600/90"
          title="Remove from Plate"
        >
          <Delete className="w-4 h-4" />
        </Button>
      )}

      {/* Close Button */}
        <Button
        variant="secondary"
        size="icon"
        onClick={onClose}
        className="bg-black/50 text-white hover:bg-black/70"
      >
          <Close className="w-4 h-4" />
      </Button>
    </div>
  );
};