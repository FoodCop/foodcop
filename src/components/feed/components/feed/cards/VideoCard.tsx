import type { VideoCard } from '../../../data/feed-content';
import { Play, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../ui/avatar';

interface VideoCardContentProps {
  card: VideoCard;
}

export function VideoCardContent({ card }: VideoCardContentProps) {
  return (
    <>
      {/* Video Thumbnail */}
      <img
        src={card.thumbnailUrl}
        alt={card.title}
        className="feed-card-hero"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/90" />
      
      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">🎬 Saved to {card.saveCategory}</span>
      </div>
      
      {/* Duration Badge */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-full">
        <span className="text-white">{card.duration}</span>
      </div>
      
      {/* Play Button Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
          <Play className="w-10 h-10 text-orange-500 fill-orange-500 ml-1" />
        </div>
      </div>
      
      {/* Video Info */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <div className="flex items-center gap-2 mb-3">
          {card.creatorImage && (
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={card.creatorImage} alt={card.creator} />
              <AvatarFallback>{card.creator[0]}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="text-white">{card.creator}</p>
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-white/70" />
              <span className="text-white/70 text-[12px]">
                {card.views >= 1000000 
                  ? `${(card.views / 1000000).toFixed(1)}M` 
                  : `${(card.views / 1000).toFixed(0)}K`} views
              </span>
            </div>
          </div>
        </div>
        
        <h2 className="text-white mb-2">{card.title}</h2>
        
        <p className="text-white/90 mb-3">{card.description}</p>
        
        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-[12px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
