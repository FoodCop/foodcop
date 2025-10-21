'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Heart, X, Share, Bookmark } from 'lucide-react';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';
type SwipeAction = 'DISLIKE' | 'LIKE' | 'SHARE' | 'SAVE';

interface SwipeCardProps {
  id: string;
  name: string;
  age: number;
  location: string;
  distance: string;
  imageUrl: string;
  className?: string;
  onSwipe?: (direction: SwipeDirection, id: string, action: SwipeAction) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
  // Backward compatibility - legacy onSwipe handler
  onLegacySwipe?: (direction: 'left' | 'right', id: string) => void;
}

export function SwipeCard({
  id,
  name,
  age,
  location,
  distance,
  imageUrl,
  className,
  onSwipe,
  onDragEnd,
  style,
  onLegacySwipe
}: SwipeCardProps) {
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
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
      // Horizontal swipes (existing behavior)
      if (offset.x > swipeThreshold) {
        // Swiped right (like)
        setIsLiked(true);
        setSwipeAction('LIKE');
        onSwipe?.('right', id, 'LIKE');
        onLegacySwipe?.('right', id); // Backward compatibility
      } else if (offset.x < -swipeThreshold) {
        // Swiped left (pass)
        setIsLiked(false);
        setSwipeAction('DISLIKE');
        onSwipe?.('left', id, 'DISLIKE');
        onLegacySwipe?.('left', id); // Backward compatibility
      }
    } else {
      // Vertical swipes (new behavior)
      if (offset.y < -swipeThreshold) {
        // Swiped up (share)
        setSwipeAction('SHARE');
        onSwipe?.('up', id, 'SHARE');
      } else if (offset.y > swipeThreshold) {
        // Swiped down (save)
        setSwipeAction('SAVE');
        onSwipe?.('down', id, 'SAVE');
      }
    }
    
    onDragEnd?.();
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
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.05 }}
      data-node-id={`swipe-card-${id}`}
    >
      {/* Background Image */}
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt={`${name}, ${age}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        
        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-[125px] bg-gradient-to-b from-black/50 to-transparent" />
        
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[201px] bg-gradient-to-t from-black to-transparent" />

        {/* LIKE indicator (right swipe) */}
        <motion.div
          className="absolute top-12 left-6 border-4 border-green-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2"
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
          className="absolute top-12 right-6 border-4 border-red-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2"
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
          className="absolute top-6 left-1/2 transform -translate-x-1/2 border-4 border-blue-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2"
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
          className="absolute bottom-32 left-1/2 transform -translate-x-1/2 border-4 border-purple-400 rounded-xl px-4 py-3 pointer-events-none flex items-center gap-2"
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

        {/* Profile Information */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-white text-3xl font-semibold font-['Poppins'] mb-2">
            {name}, {age}
          </h2>
          <p className="text-white text-lg font-['Poppins'] mb-1">
            {location}
          </p>
          <p className="text-white text-lg font-['Poppins']">
            {distance}
          </p>
        </div>
      </div>
    </motion.div>
  );
}