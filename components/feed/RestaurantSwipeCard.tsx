'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Star, MapPin, User } from 'lucide-react';
import { RestaurantCardProps } from '@/types/restaurant-feed';

export function RestaurantSwipeCard({
  id,
  restaurant_name,
  restaurant_location,
  restaurant_rating,
  restaurant_price_range,
  restaurant_cuisine,
  image_url,
  bot_display_name,
  bot_avatar_url,
  content,
  className,
  onSwipe,
  onDragEnd,
  style
}: RestaurantCardProps) {
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);
  
  // Transform for like/save indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);
  const likeScale = useTransform(x, [0, 100], [0.5, 1]);
  const passScale = useTransform(x, [-100, 0], [1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (info.offset.x > swipeThreshold) {
      // Swiped right (save/like)
      setIsLiked(true);
      onSwipe?.('right', id);
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped left (pass)
      setIsLiked(false);
      onSwipe?.('left', id);
    }
    
    onDragEnd?.();
  };

  // Generate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
    }
    
    return stars;
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-0 w-full h-full rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing shadow-2xl",
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
      whileTap={{ scale: 1.02 }}
      data-node-id={`restaurant-card-${id}`}
    >
      {/* Background Image */}
      <div className="relative w-full h-full">
        <Image
          src={image_url}
          alt={`${restaurant_name}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        
        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-[125px] bg-gradient-to-b from-black/50 to-transparent" />
        
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-black to-transparent" />

        {/* SAVE indicator */}
        <motion.div
          className="absolute top-12 left-6 border-4 border-green-400 rounded-xl px-4 py-3 pointer-events-none"
          style={{
            opacity: likeOpacity,
            scale: likeScale,
          }}
        >
          <p className="text-green-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
            SAVE
          </p>
        </motion.div>

        {/* PASS indicator */}
        <motion.div
          className="absolute top-12 right-6 border-4 border-red-400 rounded-xl px-4 py-3 pointer-events-none"
          style={{
            opacity: passOpacity,
            scale: passScale,
          }}
        >
          <p className="text-red-400 text-2xl font-semibold font-['Poppins'] whitespace-nowrap">
            PASS
          </p>
        </motion.div>

        {/* Master Bot Avatar & Name */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            {bot_avatar_url ? (
              <Image
                src={bot_avatar_url}
                alt={bot_display_name}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <span className="text-white text-sm font-medium font-['Poppins'] bg-black/30 px-3 py-1 rounded-full">
            {bot_display_name}
          </span>
        </div>

        {/* Restaurant Information */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Restaurant Name & Rating */}
          <div className="mb-3">
            <h2 className="text-white text-3xl font-semibold font-['Poppins'] mb-2 leading-tight">
              {restaurant_name}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {renderStars(restaurant_rating)}
              </div>
              <span className="text-white text-lg font-medium">
                {restaurant_rating.toFixed(1)}
              </span>
              <span className="text-white/80 text-lg">
                • {restaurant_price_range}
              </span>
            </div>
          </div>

          {/* Location & Cuisine */}
          <div className="flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4 text-white/70" />
            <span className="text-white text-lg font-['Poppins']">
              {restaurant_location} • {restaurant_cuisine}
            </span>
          </div>

          {/* Bot Recommendation */}
          <div className="bg-black/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white text-base font-['Poppins'] leading-relaxed line-clamp-3">
              &ldquo;{content}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}