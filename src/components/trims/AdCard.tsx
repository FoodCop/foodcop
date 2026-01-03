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
    <button
      type="button"
      className="relative snap-start h-screen w-full overflow-hidden border-0 p-0 cursor-pointer"
      onClick={handleClick}
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
