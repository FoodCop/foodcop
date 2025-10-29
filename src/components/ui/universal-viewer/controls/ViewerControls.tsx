import React from 'react';
import { Button } from '../../button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  ExternalLink 
} from 'lucide-react';
import type { ViewerControlsProps } from '../types';

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  type,
  onClose,
  onNavigate,
  canNavigate,
  currentIndex,
  totalItems
}) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `FUZO ${type} viewer`,
        text: `Check out this ${type} on FUZO`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).catch(console.error);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {/* Navigation Controls */}
      {canNavigate && onNavigate && totalItems && totalItems > 1 && (
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
          
          {currentIndex !== undefined && totalItems && (
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

      {/* Share Button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={handleShare}
        className="bg-black/50 text-white hover:bg-black/70"
      >
        <Share2 className="w-4 h-4" />
      </Button>

      {/* Close Button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onClose}
        className="bg-black/50 text-white hover:bg-black/70"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};