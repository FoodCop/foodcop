'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SwipeCardProps {
  id: string;
  name: string;
  age: number;
  location: string;
  distance: string;
  imageUrl: string;
  className?: string;
  onSwipe?: (direction: 'left' | 'right', id: string) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
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
  style
}: SwipeCardProps) {
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);
  
  // Transform for like/nope indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const likeScale = useTransform(x, [0, 100], [0.5, 1]);
  const nopeScale = useTransform(x, [-100, 0], [1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (info.offset.x > swipeThreshold) {
      // Swiped right (like)
      setIsLiked(true);
      onSwipe?.('right', id);
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped left (pass)
      setIsLiked(false);
      onSwipe?.('left', id);
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
        rotate,
        opacity,
        ...style
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
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

        {/* LIKE indicator */}
        <motion.div
          className="absolute top-12 left-6 border-4 border-green-400 rounded-xl px-4 py-3 pointer-events-none"
          style={{
            opacity: likeOpacity,
            scale: likeScale,
          }}
        >
          <p className="text-green-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
            LIKE
          </p>
        </motion.div>

        {/* NOPE indicator */}
        <motion.div
          className="absolute top-12 right-6 border-4 border-red-400 rounded-xl px-4 py-3 pointer-events-none"
          style={{
            opacity: nopeOpacity,
            scale: nopeScale,
          }}
        >
          <p className="text-red-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
            NOPE
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