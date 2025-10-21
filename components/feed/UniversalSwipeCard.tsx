'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Heart, X, Share, Bookmark } from 'lucide-react';
import { FeedCard, SwipeDirection, SwipeAction, isRecipeCard, isRestaurantCard, isVideoCard, isPhotoCard, isAdCard } from '@/types/feed';
import { RecipeAdapter, RestaurantAdapter, VideoAdapter, PhotoAdapter, AdAdapter } from './adapters/CardAdapters';

interface UniversalSwipeCardProps {
  card: FeedCard;
  className?: string;
  onSwipe?: (direction: SwipeDirection, cardId: string, action: SwipeAction) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
  isTopCard?: boolean;
}

export function UniversalSwipeCard({
  card,
  className,
  onSwipe,
  onDragEnd,
  style,
  isTopCard = false
}: UniversalSwipeCardProps) {
  const [swipeAction, setSwipeAction] = useState<SwipeAction | null>(null);
  
  // Motion values for x and y axis
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform values for rotation and opacity
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);
  
  // Transform for directional indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const shareOpacity = useTransform(y, [-100, 0], [1, 0]);
  const saveOpacity = useTransform(y, [0, 100], [0, 1]);
  
  const likeScale = useTransform(x, [0, 100], [0.5, 1]);
  const nopeScale = useTransform(x, [-100, 0], [1, 0.5]);
  const shareScale = useTransform(y, [-100, 0], [1, 0.5]);
  const saveScale = useTransform(y, [0, 100], [0.5, 1]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const { offset } = info;
    
    // Determine swipe direction based on the larger offset
    const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y);
    
    if (isHorizontal) {
      // Horizontal swipes
      if (offset.x > swipeThreshold) {
        // Swiped right (like)
        setSwipeAction('LIKE');
        onSwipe?.('right' as SwipeDirection, card.id, 'LIKE');
      } else if (offset.x < -swipeThreshold) {
        // Swiped left (dislike)
        setSwipeAction('DISLIKE');
        onSwipe?.('left' as SwipeDirection, card.id, 'DISLIKE');
      }
    } else {
      // Vertical swipes
      if (offset.y < -swipeThreshold) {
        // Swiped up (share)
        setSwipeAction('SHARE');
        onSwipe?.('up' as SwipeDirection, card.id, 'SHARE');
      } else if (offset.y > swipeThreshold) {
        // Swiped down (save)
        setSwipeAction('SAVE');
        onSwipe?.('down' as SwipeDirection, card.id, 'SAVE');
      }
    }
    
    onDragEnd?.();
  };

  // Render the appropriate adapter based on card type
  const renderCardContent = () => {
    if (isRecipeCard(card)) {
      return <RecipeAdapter card={card} />;
    } else if (isRestaurantCard(card)) {
      return <RestaurantAdapter card={card} />;
    } else if (isVideoCard(card)) {
      return <VideoAdapter card={card} />;
    } else if (isPhotoCard(card)) {
      return <PhotoAdapter card={card} />;
    } else if (isAdCard(card)) {
      return <AdAdapter card={card} />;
    }
    
    // Fallback for unknown card types
    return (
      <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Unknown card type: {(card as any).card_type}</p>
      </div>
    );
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-0 w-full h-full rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing",
        className
      )}
      style={{
        x,
        y,
        rotate,
        opacity,
        ...style
      }}
      drag={isTopCard}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.05 }}
      data-node-id={`universal-swipe-card-${card.id}`}
      data-card-type={card.card_type}
    >
      {/* Card Content */}
      {renderCardContent()}

      {/* Swipe Indicators - Only show when dragging */}
      {isTopCard && (
        <>
          {/* LIKE indicator (right swipe) */}
          <motion.div
            className="absolute top-12 left-6 border-4 border-green-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2 bg-black/20 backdrop-blur-sm"
            style={{
              opacity: likeOpacity,
              scale: likeScale,
            }}
          >
            <Heart className="w-6 h-6 text-green-400 fill-current" />
            <p className="text-green-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
              LIKE
            </p>
          </motion.div>

          {/* NOPE indicator (left swipe) */}
          <motion.div
            className="absolute top-12 right-6 border-4 border-red-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2 bg-black/20 backdrop-blur-sm"
            style={{
              opacity: nopeOpacity,
              scale: nopeScale,
            }}
          >
            <X className="w-6 h-6 text-red-400" />
            <p className="text-red-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
              NOPE
            </p>
          </motion.div>

          {/* SHARE indicator (up swipe) */}
          <motion.div
            className="absolute top-6 left-1/2 transform -translate-x-1/2 border-4 border-blue-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2 bg-black/20 backdrop-blur-sm"
            style={{
              opacity: shareOpacity,
              scale: shareScale,
            }}
          >
            <Share className="w-6 h-6 text-blue-400" />
            <p className="text-blue-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
              SHARE
            </p>
          </motion.div>

          {/* SAVE indicator (down swipe) */}
          <motion.div
            className="absolute bottom-32 left-1/2 transform -translate-x-1/2 border-4 border-purple-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2 bg-black/20 backdrop-blur-sm"
            style={{
              opacity: saveOpacity,
              scale: saveScale,
            }}
          >
            <Bookmark className="w-6 h-6 text-purple-400" />
            <p className="text-purple-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
              SAVE
            </p>
          </motion.div>
        </>
      )}

      {/* Card Type Indicator */}
      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
        <p className="text-white text-xs font-medium uppercase tracking-wider">
          {card.card_type.replace('_', ' ')}
        </p>
      </div>
    </motion.div>
  );
}