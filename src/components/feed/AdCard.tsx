import React from 'react';
import type { AdItem } from '../../types/ad';

interface AdCardProps {
  ad: AdItem;
}

export function AdCard({ ad }: AdCardProps) {
  const handleClick = () => {
    if (ad.link && ad.link !== '#') {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleClick}
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
