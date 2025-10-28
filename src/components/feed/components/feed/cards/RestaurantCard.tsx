import type { RestaurantCard } from '../../../data/feed-content';
import { MapPin, Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../ui/avatar';

interface RestaurantCardContentProps {
  card: RestaurantCard;
}

export function RestaurantCardContent({ card }: RestaurantCardContentProps) {
  return (
    <>
      {/* Restaurant Image */}
      <img
        src={card.imageUrl}
        alt={card.name}
        className="w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
      
      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">📍 Saved to {card.saveCategory}</span>
      </div>
      
      {/* Restaurant Info */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white">{card.name}</h2>
          <span className="text-white opacity-90">{card.priceRange}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white">{card.rating}</span>
          </div>
          <span className="text-white/60">({card.reviewCount})</span>
          <span className="text-white/60">•</span>
          <span className="text-white/90">{card.cuisine}</span>
        </div>
        
        <div className="flex items-center gap-1 text-white/90 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{card.distance}</span>
        </div>
        
        {card.description && (
          <p className="text-white/80 line-clamp-2 mb-2">{card.description}</p>
        )}
        
        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Owner Profile Picture */}
      {card.ownerImage && (
        <div className="absolute bottom-6 right-6">
          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
            <AvatarImage src={card.ownerImage} alt={card.ownerName || 'Owner'} />
            <AvatarFallback>{card.ownerName?.[0] || 'C'}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </>
  );
}
