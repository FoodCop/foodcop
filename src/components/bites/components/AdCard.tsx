import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ImageWithFallback } from '../../ui/image-with-fallback';
import type { AdItem } from '../../../types/ad';

interface AdCardProps {
  ad: AdItem;
  onClick?: () => void;
}

export function AdCard({ ad, onClick }: AdCardProps) {
  const handleClick = () => {
    if (ad.link && ad.link !== '#') {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
    onClick?.();
  };

  // Determine aspect ratio class
  const aspectRatioClass = {
    '1:1': 'aspect-square',
    '2:3': 'aspect-[2/3]',
    '3:4': 'aspect-[3/4]'
  }[ad.aspectRatio];

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg border-gray-200 relative group"
      onClick={handleClick}
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
            <div className="bg-white rounded-full p-3 shadow-lg">
              <ExternalLink className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
