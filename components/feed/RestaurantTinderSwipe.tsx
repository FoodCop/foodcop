'use client';

import { useState, useCallback } from 'react';
import { RestaurantSwipeCard } from './RestaurantSwipeCard';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantCard, RestaurantSwipeProps } from '@/types/restaurant-feed';

export function RestaurantTinderSwipe({ restaurants, currentIndex, onSwipe, onNoMoreCards }: RestaurantSwipeProps) {
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());

  const handleSwipe = useCallback((direction: 'left' | 'right', restaurantId: string) => {
    console.log(`🔄 Swipe detected: ${direction} on restaurant ${restaurantId}`);
    console.log(`📊 Current index before swipe: ${currentIndex}`);
    
    // Mark card as removed for animation
    setRemovedCards(prev => new Set(prev.add(restaurantId)));
    
    // Call parent's onSwipe handler (which will update currentIndex)
    onSwipe?.(direction, restaurantId);
    
    // Check if we've gone through all cards
    if (currentIndex >= restaurants.length - 1) {
      console.log('🏁 No more cards available');
      setTimeout(() => onNoMoreCards?.(), 300);
    }
  }, [currentIndex, restaurants.length, onSwipe, onNoMoreCards]);

  const visibleRestaurants = restaurants.filter(r => !removedCards.has(r.id)).slice(0, 3);
  
  console.log(`🎴 Rendering stack - Current index: ${currentIndex}, Visible cards: ${visibleRestaurants.length}, Total: ${restaurants.length}`);

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
              distance_from_user={restaurant.distance_from_user}
              relevance_score={restaurant.relevance_score}
              onSwipe={index === 0 ? handleSwipe : undefined}
              className={index > 0 ? 'pointer-events-none' : ''}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}