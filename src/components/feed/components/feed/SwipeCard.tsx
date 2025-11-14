import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { FeedCard } from '../../data/feed-content';
import { Info, Share2, Bookmark } from 'lucide-react';
import { RestaurantCardContent } from './cards/RestaurantCard';
import { MasterbotCardContent } from './cards/MasterbotCard';
import { AdCardContent } from './cards/AdCard';
import { RecipeCardContent } from './cards/RecipeCard';
import { VideoCardContent } from './cards/VideoCard';

interface SwipeCardProps {
  card: FeedCard;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  style?: React.CSSProperties;
}

export function SwipeCard({ card, onSwipe, style }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(latestX * latestX + latestY * latestY);
      return distance > 300 ? 0 : 1;
    }
  );
  
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const shareOpacity = useTransform(y, [-100, 0], [1, 0]);
  const saveOpacity = useTransform(y, [0, 100], [0, 1]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const swipeThreshold = 100;
    
    // Check vertical swipes first
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
      if (info.offset.y < -swipeThreshold) {
        onSwipe('up'); // Share
      } else if (info.offset.y > swipeThreshold) {
        onSwipe('down'); // Save
      }
    } else {
      // Horizontal swipes
      if (info.offset.x > swipeThreshold) {
        onSwipe('right');
      } else if (info.offset.x < -swipeThreshold) {
        onSwipe('left');
      }
    }
  };

  const renderCardContent = () => {
    switch (card.type) {
      case 'restaurant':
        return <RestaurantCardContent card={card} />;
      case 'masterbot':
        return <MasterbotCardContent card={card} />;
      case 'ad':
        return <AdCardContent card={card} />;
      case 'recipe':
        return <RecipeCardContent card={card} />;
      case 'video':
        return <VideoCardContent card={card} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity,
        ...style,
      }}
      drag
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-red-900">
        {renderCardContent()}
        
        {/* LIKE Indicator */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 right-8 px-4 py-2 border-4 border-green-500 rounded-lg rotate-12 z-10"
        >
          <span className="text-green-500 tracking-wider">
            LIKE
          </span>
        </motion.div>
        
        {/* NOPE Indicator */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 left-8 px-4 py-2 border-4 border-red-500 rounded-lg -rotate-12 z-10"
        >
          <span className="text-red-500 tracking-wider">
            NOPE
          </span>
        </motion.div>
        
        {/* SHARE Indicator (Swipe Up) */}
        <motion.div
          style={{ opacity: shareOpacity }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 px-4 py-2 border-4 border-blue-500 rounded-lg flex items-center gap-2 z-10"
        >
          <Share2 className="w-5 h-5 text-blue-500" />
          <span className="text-blue-500 tracking-wider">
            SHARE
          </span>
        </motion.div>
        
        {/* SAVE Indicator (Swipe Down) */}
        <motion.div
          style={{ opacity: saveOpacity }}
          className="absolute bottom-1/3 left-1/2 -translate-x-1/2 px-4 py-2 border-4 border-purple-500 rounded-lg flex items-center gap-2 z-10"
        >
          <Bookmark className="w-5 h-5 text-purple-500 fill-purple-500" />
          <span className="text-purple-500 tracking-wider">
            SAVE TO {card.saveCategory.toUpperCase()}
          </span>
        </motion.div>
        
        {/* Info Button */}
        <button className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/30 transition-colors z-10">
          <Info className="w-5 h-5 text-white" />
        </button>
      </div>
    </motion.div>
  );
}
