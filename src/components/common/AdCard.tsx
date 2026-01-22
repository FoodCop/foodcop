import type { AdItem } from '../../types/ad';
import { ExternalLink } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../ui/image-with-fallback';

interface AdCardProps {
  ad: AdItem;
  variant?: 'feed' | 'bites' | 'trims';
  onClick?: () => void;
}

/**
 * Unified AdCard Component
 * Supports multiple variants for different contexts (feed, bites, trims)
 */
export function AdCard({ ad, variant = 'feed', onClick }: AdCardProps) {
  const handleClick = () => {
    if (ad.link && ad.link !== '#') {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
    onClick?.();
  };

  // Trims variant - Full screen vertical ad
  if (variant === 'trims') {
    return (
      <button
        type="button"
        className="relative snap-start h-screen w-full overflow-hidden border-0 p-0 cursor-pointer"
        onClick={handleClick}
        aria-label={`Advertisement: ${ad.altText}`}
      >
        {/* Full-screen Ad Image */}
        <div className="absolute inset-0">
          <img
            src={ad.imageUrl}
            alt={ad.altText}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/50" />
        </div>

        {/* Sponsored Badge - Top */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-yellow-400 text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg">
            SPONSORED
          </div>
        </div>

        {/* Tap to Learn More - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-24">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-xl">
            <p className="text-gray-900 font-semibold text-base">
              Tap to learn more
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Bites variant - Card with aspect ratio
  if (variant === 'bites') {
    const aspectRatioClass = {
      '1:1': 'aspect-square',
      '2:3': 'aspect-[2/3]',
      '3:4': 'aspect-[3/4]'
    }[ad.aspectRatio];

    return (
      <Card
        className="overflow-hidden cursor-pointer transition-all hover:shadow-lg border-gray-200 relative group"
        onClick={handleClick}
        role="button"
        aria-label={`Advertisement: ${ad.altText}`}
      >
        {/* Sponsored badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
            Sponsored
          </Badge>
        </div>

        {/* Ad Image */}
        <div className={`${aspectRatioClass} overflow-hidden bg-gray-100 relative`}>
          <ImageWithFallback
            src={ad.imageUrl}
            alt={ad.altText}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Feed variant (default) - Vertical card with 9:16 aspect ratio
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleClick}
      role="button"
      aria-label={`Advertisement: ${ad.altText}`}
    >
      {/* Sponsored Badge */}
      <div className="absolute top-4 left-4 z-10 bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
        SPONSORED
      </div>

      {/* Ad Image - 9:16 aspect ratio for vertical */}
      <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
        <img
          src={ad.imageUrl}
          alt={ad.altText}
          className="absolute top-0 left-0 w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
