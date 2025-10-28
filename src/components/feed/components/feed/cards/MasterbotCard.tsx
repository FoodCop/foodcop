import type { MasterbotCard } from '../../../data/feed-content';
import { Bot, Heart, MessageCircle, Share } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../ui/avatar';

interface MasterbotCardContentProps {
  card: MasterbotCard;
}

export function MasterbotCardContent({ card }: MasterbotCardContentProps) {
  return (
    <>
      {/* Post Image */}
      <img
        src={card.imageUrl}
        alt={card.displayName}
        className="w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      
      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">💬 Saved to {card.saveCategory}</span>
      </div>
      
      {/* Creator Info at Top */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
        <Avatar className="w-8 h-8 border-2 border-white">
          <AvatarImage src={card.avatarUrl} alt={card.displayName} />
          <AvatarFallback>{card.displayName[0]}</AvatarFallback>
        </Avatar>
        <div className="text-white">
          <p className="leading-none">{card.displayName}</p>
          <p className="text-white/70 text-[12px]">{card.username}</p>
        </div>
      </div>
      
      {/* Post Info at Bottom */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <p className="text-white mb-3">{card.caption}</p>
        
        {card.restaurantTag && (
          <div className="mb-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white">
              📍 {card.restaurantTag}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-white" />
            <span className="text-white">{card.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white">Comment</span>
          </div>
        </div>
        
        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="text-white/60 text-[14px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
