import type { AdCard } from '../../../data/feed-content';
import { OpenInNew } from '@mui/icons-material';

interface AdCardContentProps {
  card: AdCard;
}

export function AdCardContent({ card }: AdCardContentProps) {
  return (
    <>
      {/* Ad Image */}
      <img
        src={card.imageUrl}
        alt={card.brandName}
        className="w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      
      {/* Ad Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm rounded-full">
        <span className="text-white text-[12px]">Sponsored</span>
      </div>
      
      {/* Save Category Badge */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">💾 Saved to {card.saveCategory}</span>
      </div>
      
      {/* Ad Content */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <div className="mb-2">
          <span className="text-white/70">{card.brandName}</span>
        </div>
        
        <h2 className="text-white mb-2">{card.headline}</h2>
        
        <p className="text-white/90 mb-4">{card.description}</p>
        
        <button className="w-full bg-white text-gray-900 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
          <span>{card.ctaText}</span>
          <OpenInNew className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
