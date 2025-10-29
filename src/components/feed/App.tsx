import { useState, useCallback, useEffect } from 'react';
import { TinderSwipe } from './components/feed';
import { FeedService, type UserLocation, type UserPreferences } from '../../services/feedService';
import { useAuth } from '../auth/AuthProvider';
import { useSmartSave } from '../../hooks/useSmartSave';
import { useFeedInfiniteScroll } from '../../hooks/useFeedInfiniteScroll';
import type { FeedCard } from './data/feed-content';

export default function App() {
  const { user } = useAuth();
  const { saveToPlate } = useSmartSave();

  // Get user location (mock for now - in production would use geolocation API)
  const getCurrentUserLocation = (): UserLocation => {
    // Default to San Francisco coordinates - in production get from geolocation API
    return { lat: 37.7749, lng: -122.4194 };
  };

  // Get user preferences (mock for now - in production get from user profile)
  const getUserPreferences = (): UserPreferences => {
    return {
      cuisinePreferences: ['Italian', 'Mexican', 'Asian'],
      dietaryRestrictions: [],
      preferredRadius: 5000, // 5km
      priceRange: ['$$', '$$$'],
      contentTypes: ['restaurant', 'recipe', 'video', 'masterbot']
    };
  };

  // Phase 3: Use infinite scroll hook for enhanced feed management
  const {
    cards: feedCards,
    isLoading,
    error,
    currentIndex,
    moveToNextCard,
    reset: resetFeed,
    loadMore
  } = useFeedInfiniteScroll({
    userLocation: getCurrentUserLocation(),
    userPreferences: getUserPreferences(),
    userId: user?.id
  }, {
    prefetchThreshold: 5,
    initialBatchSize: 15,
    subsequentBatchSize: 10,
    maxCardsInMemory: 50,
    enablePrefetch: true
  });

  const handleSwipe = async (direction: 'left' | 'right' | 'up' | 'down', cardId: string) => {
    console.log(`Swiped ${direction} on card ${cardId}`);
    
    const card = feedCards.find(c => c.id === cardId);
    if (!card) {
      console.error('Card not found:', cardId);
      return;
    }

    // Phase 2: Mark content as seen for anti-repetition system
    FeedService.markContentAsSeen(extractContentId(card));
    
    // Phase 3: Move to next card and trigger prefetch if needed
    moveToNextCard();
    
    // Track swipe event for analytics and learning
    if (user) {
      try {
        await FeedService.trackSwipeEvent({
          cardId: cardId,
          cardType: card.type,
          contentId: extractContentId(card),
          swipeDirection: direction,
          swipeAction: mapDirectionToAction(direction),
          userId: user.id
        });
      } catch (error) {
        console.error('Failed to track swipe event:', error);
      }
    }
    
    // Handle different swipe directions
    if (direction === 'up') {
      console.log('🔗 SHARE card:', cardId);
      await handleShare(card);
    } else if (direction === 'down') {
      console.log('💾 SAVE card to PLATE:', cardId);
      await handleSaveToPlate(card);
    } else if (direction === 'right') {
      console.log('❤️ LIKE card:', cardId);
      await handleLike(card);
    } else if (direction === 'left') {
      console.log('👎 PASS card:', cardId);
      await handlePass(card);
    }
  };  const handleSaveToPlate = async (card: FeedCard) => {
    if (!user) {
      console.log('⚠️ User not authenticated for save');
      return;
    }

    try {
      // Transform feed card to save parameters
      const saveParams = transformFeedCardToSaveParams(card);
      
      // Use existing SmartSaveButton logic
      const success = await saveToPlate(saveParams);
      
      if (success) {
        const cardName = getCardDisplayName(card);
        console.log('✅ Successfully saved to plate:', cardName);
        // Could show success animation here
      }
    } catch (error) {
      console.error('❌ Failed to save to plate:', error);
    }
  };

  const handleShare = async (card: FeedCard) => {
    const cardName = getCardDisplayName(card);
    const shareText = `Check out this ${card.type}: ${cardName} - Found on FuzoFoodCop!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: cardName,
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        console.log('📋 Share text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const handleLike = async (card: FeedCard) => {
    console.log('❤️ Liked:', getCardDisplayName(card));
    // In the future, this could update user preferences or send to backend
  };

  const handlePass = async (card: FeedCard) => {
    console.log('👎 Passed on:', getCardDisplayName(card));
    // In the future, this could update recommendation algorithm
  };

  // Helper functions
  const getCardDisplayName = (card: FeedCard): string => {
    switch (card.type) {
      case 'restaurant':
        return (card as any).name;
      case 'recipe':
        return (card as any).title;
      case 'video':
        return (card as any).title;
      case 'masterbot':
        return (card as any).displayName + "'s post";
      case 'ad':
        return (card as any).brandName + " Ad";
      default:
        return 'Unknown';
    }
  };

  const extractContentId = (card: FeedCard): string => {
    // Extract the actual content ID from the feed card ID
    return card.id.split('-').slice(1).join('-');
  };

  const mapDirectionToAction = (direction: string): 'pass' | 'like' | 'share' | 'save' => {
    switch (direction) {
      case 'left': return 'pass';
      case 'right': return 'like';
      case 'up': return 'share';
      case 'down': return 'save';
      default: return 'pass';
    }
  };

  const transformFeedCardToSaveParams = (card: FeedCard) => {
    switch (card.type) {
      case 'restaurant': {
        const restaurantCard = card as any;
        return {
          itemId: extractContentId(card),
          itemType: 'restaurant' as const,
          metadata: {
            name: restaurantCard.name,
            cuisine: restaurantCard.cuisine,
            rating: restaurantCard.rating,
            priceRange: restaurantCard.priceRange,
            location: restaurantCard.location,
            distance: restaurantCard.distance,
            imageUrl: restaurantCard.imageUrl,
            description: restaurantCard.description
          } as Record<string, unknown>
        };
      }
      case 'recipe': {
        const recipeCard = card as any;
        return {
          itemId: extractContentId(card),
          itemType: 'recipe' as const,
          metadata: {
            title: recipeCard.title,
            author: recipeCard.author,
            imageUrl: recipeCard.imageUrl,
            prepTime: recipeCard.prepTime,
            cookTime: recipeCard.cookTime,
            difficulty: recipeCard.difficulty,
            servings: recipeCard.servings,
            description: recipeCard.description
          } as Record<string, unknown>
        };
      }
      case 'video': {
        const videoCard = card as any;
        return {
          itemId: extractContentId(card),
          itemType: 'video' as const,
          metadata: {
            title: videoCard.title,
            creator: videoCard.creator,
            thumbnailUrl: videoCard.thumbnailUrl,
            duration: videoCard.duration,
            views: videoCard.views,
            description: videoCard.description,
            url: `https://www.youtube.com/watch?v=${extractContentId(card)}`
          } as Record<string, unknown>
        };
      }
      case 'masterbot':
      case 'ad':
      default: {
        return {
          itemId: extractContentId(card),
          itemType: 'other' as const,
          metadata: {
            ...card
          } as Record<string, unknown>
        };
      }
    }
  };

  const handleNoMoreCards = useCallback(async () => {
    console.log('🔚 No more cards in current batch - loading more...');
    
    try {
      await loadMore();
      console.log('✅ Successfully loaded more cards');
    } catch (error) {
      console.error('❌ Failed to load more cards:', error);
      // Could show error UI here or retry logic
    }
  }, [loadMore]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <TinderSwipe
        cards={feedCards}
        onSwipe={handleSwipe}
        onNoMoreCards={handleNoMoreCards}
      />
    </div>
  );
}