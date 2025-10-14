'use client';

import { useState, useCallback } from 'react';
import { RestaurantSwipeCard } from './RestaurantSwipeCard';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantCard, RestaurantSwipeProps } from '@/types/restaurant-feed';

export function RestaurantTinderSwipe({ restaurants, onSwipe, onNoMoreCards }: RestaurantSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());

  const handleSwipe = useCallback((direction: 'left' | 'right', restaurantId: string) => {
    setRemovedCards(prev => new Set(prev.add(restaurantId)));
    setCurrentIndex(prev => prev + 1);
    onSwipe?.(direction, restaurantId);
    
    // Check if we've gone through all cards
    if (currentIndex >= restaurants.length - 1) {
      setTimeout(() => onNoMoreCards?.(), 300);
    }
  }, [currentIndex, restaurants.length, onSwipe, onNoMoreCards]);

  const visibleRestaurants = restaurants.slice(currentIndex, currentIndex + 3);

  if (visibleRestaurants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-muted-foreground">
            No more restaurants!
          </h3>
          <p className="text-muted-foreground">
            Check back later for new Master Bot recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full max-w-sm mx-auto">
      <AnimatePresence>
        {visibleRestaurants.map((restaurant, index) => (
          <motion.div
            key={restaurant.id}
            initial={{ 
              scale: 0.95 - index * 0.05,
              y: index * 10,
              opacity: 1 - index * 0.1 
            }}
            animate={{ 
              scale: 0.95 - index * 0.05,
              y: index * 10,
              opacity: 1 - index * 0.1 
            }}
            exit={{
              x: 300,
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            className="absolute inset-0"
            style={{ zIndex: visibleRestaurants.length - index }}
          >
            <RestaurantSwipeCard
              id={restaurant.id}
              restaurant_name={restaurant.restaurant_name}
              restaurant_location={restaurant.restaurant_location}
              restaurant_rating={restaurant.restaurant_rating}
              restaurant_price_range={restaurant.restaurant_price_range}
              restaurant_cuisine={restaurant.restaurant_cuisine}
              image_url={restaurant.image_url}
              bot_display_name={restaurant.bot_display_name}
              bot_avatar_url={restaurant.bot_avatar_url}
              content={restaurant.content}
              onSwipe={index === 0 ? handleSwipe : undefined}
              className={index > 0 ? 'pointer-events-none' : ''}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}