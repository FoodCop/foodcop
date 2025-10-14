'use client';

import { useState, useCallback, useEffect } from 'react';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { RestaurantTinderSwipe } from '@/components/feed/RestaurantTinderSwipe';
import { SwipeActions } from '@/components/feed/SwipeActions';
import { CronDebugPanel } from '@/components/debug/CronDebugPanel';
import { RestaurantFeedClientService } from '@/lib/services/restaurant-feed-client';
import { RestaurantCard } from '@/types/restaurant-feed';
import { toast } from 'sonner';

export default function FeedPage() {
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load restaurant feed data
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        const feedData = await RestaurantFeedClientService.getRestaurantFeed(50);
        setRestaurants(feedData);
      } catch (error) {
        console.error('Error loading restaurant feed:', error);
        toast.error('Failed to load restaurant recommendations');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right', restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      if (direction === 'right') {
        toast.success(`Saved ${restaurant.restaurant_name}! 🍽️`);
        // TODO: Save to user's favorites
        RestaurantFeedClientService.saveRestaurant('user-id', restaurantId);
        RestaurantFeedClientService.likePost(restaurantId);
      } else {
        toast(`Passed on ${restaurant.restaurant_name}`);
      }
    }
    setCurrentIndex(prev => prev + 1);
  }, [restaurants]);

  const handleNoMoreCards = useCallback(() => {
    toast.success('You\'ve seen all recommendations! Master Bots post new content daily.');
  }, []);

  const handlePass = useCallback(() => {
    if (currentIndex < restaurants.length) {
      const restaurant = restaurants[currentIndex];
      handleSwipe('left', restaurant.id);
    }
  }, [currentIndex, restaurants, handleSwipe]);

  const handleLike = useCallback(() => {
    if (currentIndex < restaurants.length) {
      const restaurant = restaurants[currentIndex];
      handleSwipe('right', restaurant.id);
    }
  }, [currentIndex, restaurants, handleSwipe]);

  const handleSuperLike = useCallback(() => {
    if (currentIndex < restaurants.length) {
      const restaurant = restaurants[currentIndex];
      toast.success(`Super saved ${restaurant.restaurant_name}! ⭐`);
      handleSwipe('right', restaurant.id);
      // TODO: Add to special super-liked list
    }
  }, [currentIndex, restaurants, handleSwipe]);

  const handleRewind = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      toast('Rewound to previous restaurant');
    }
  }, [currentIndex]);

  const handleMessage = useCallback(() => {
    if (currentIndex < restaurants.length) {
      const restaurant = restaurants[currentIndex];
      toast(`Chat with ${restaurant.bot_display_name} about ${restaurant.restaurant_name} coming soon!`);
    }
  }, [currentIndex, restaurants]);

  const hasCards = currentIndex < restaurants.length;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Master Bot recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <FeedHeader 
        onProfileClick={() => toast('Profile page coming soon!')}
        onSettingsClick={() => toast('Settings coming soon!')}
      />

      {/* Debug Panel */}
      <div className="px-4 pt-2">
        <CronDebugPanel />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Card Stack */}
        <div className="flex-1 px-4 py-6">
          <div className="h-full max-w-sm mx-auto">
            <RestaurantTinderSwipe
              restaurants={restaurants}
              onSwipe={handleSwipe}
              onNoMoreCards={handleNoMoreCards}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0">
          <SwipeActions
            onPass={handlePass}
            onLike={handleLike}
            onSuperLike={handleSuperLike}
            onRewind={handleRewind}
            onMessage={handleMessage}
            disabled={!hasCards}
          />
        </div>
      </div>
    </div>
  );
}
