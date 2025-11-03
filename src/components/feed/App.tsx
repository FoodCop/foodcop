import { useState, useCallback, useEffect, useMemo } from 'react';
import { TinderSwipe } from './components/feed';
import { FeedService, type UserLocation, type UserPreferences } from '../../services/feedService';
import { useAuth } from '../auth/AuthProvider';
import { useSmartSave } from '../../hooks/useSmartSave';
import { useFeedInfiniteScroll } from '../../hooks/useFeedInfiniteScroll';
import type { FeedCard } from './data/feed-content';

export default function App() {
  const { user } = useAuth();
  const { saveToPlate } = useSmartSave();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request user's actual location
  const requestUserLocation = async (): Promise<UserLocation> => {
    return new Promise((resolve) => {
      // Try to get stored location first (from Scout component or previous session)
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        try {
          const parsed = JSON.parse(storedLocation);
          if (parsed.lat && parsed.lng) {
            console.log('📍 Using stored user location:', parsed);
            setUserLocation(parsed);
            return resolve({ lat: parsed.lat, lng: parsed.lng });
          }
        } catch (e) {
          console.warn('Failed to parse stored location:', e);
        }
      }

      // Request geolocation permission
      if ('geolocation' in navigator) {
        console.log('📍 Requesting user geolocation...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log('✅ Got user location:', location);
            
            // Store for future use
            localStorage.setItem('userLocation', JSON.stringify(location));
            setUserLocation(location);
            setLocationError(null);
            resolve(location);
          },
          (error) => {
            console.warn('⚠️ Geolocation failed:', error.message);
            setLocationError(`Location access denied: ${error.message}`);
            
            // Fallback to default location
            const fallback = { lat: 37.7749, lng: -122.4194 };
            setUserLocation(fallback);
            resolve(fallback);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        console.warn('⚠️ Geolocation not supported');
        setLocationError('Geolocation not supported by this browser');
        
        // Fallback to default location
        const fallback = { lat: 37.7749, lng: -122.4194 };
        setUserLocation(fallback);
        resolve(fallback);
      }
    });
  };

  // Get user preferences from profile or localStorage with intelligent defaults
  const getUserPreferences = (): UserPreferences => {
    // Try to get stored preferences first
    const storedPrefs = localStorage.getItem('userFeedPreferences');
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs);
        console.log('🎯 Using stored user preferences:', parsed);
        return {
          cuisinePreferences: parsed.cuisinePreferences || [],
          dietaryRestrictions: parsed.dietaryRestrictions || [],
          preferredRadius: parsed.preferredRadius || 5000,
          priceRange: parsed.priceRange || ['$', '$$', '$$$'],
          contentTypes: parsed.contentTypes || ['restaurant', 'recipe', 'video', 'masterbot']
        };
      } catch (e) {
        console.warn('Failed to parse stored preferences:', e);
      }
    }

    // Intelligent defaults based on popular choices
    const defaultPrefs = {
      cuisinePreferences: [], // Start with no restrictions to show variety
      dietaryRestrictions: [],
      preferredRadius: 5000, // 5km is good for urban areas
      priceRange: ['$', '$$', '$$$'], // Include all price ranges initially
      contentTypes: ['restaurant', 'recipe', 'video', 'masterbot'] // All content types
    };

    // Store default preferences for future learning
    localStorage.setItem('userFeedPreferences', JSON.stringify(defaultPrefs));
    console.log('🎯 Using default preferences (will learn from swipes):', defaultPrefs);
    
    return defaultPrefs;
  };

  // Learn from user swipes to improve preferences
  const updatePreferencesFromSwipe = (card: FeedCard, action: string) => {
    if (action === 'like' || action === 'save') {
      const currentPrefs = getUserPreferences();
      let updated = false;

      // Learn cuisine preferences from restaurant cards
      if (card.type === 'restaurant') {
        const restaurantCard = card as any;
        const cuisine = restaurantCard.cuisine;
        
        if (cuisine && !currentPrefs.cuisinePreferences.includes(cuisine)) {
          currentPrefs.cuisinePreferences.push(cuisine);
          updated = true;
          console.log('📚 Learned cuisine preference:', cuisine);
        }
      }

      // Learn content type preferences
      if (!currentPrefs.contentTypes.includes(card.type)) {
        currentPrefs.contentTypes.push(card.type);
        updated = true;
        console.log('📚 Learned content type preference:', card.type);
      }

      // Save updated preferences
      if (updated) {
        localStorage.setItem('userFeedPreferences', JSON.stringify(currentPrefs));
        console.log('💾 Updated user preferences:', currentPrefs);
      }
    }
  };

  // State to track if we've fetched location at least once
  const [locationReady, setLocationReady] = useState(false);

  // Initialize location on mount and mark as ready when done
  useEffect(() => {
    const initLocation = async () => {
      await requestUserLocation();
      setLocationReady(true);
      console.log('✅ Location ready for feed generation');
    };
    initLocation();
  }, []);

  // Stable references to prevent hook re-initialization
  // IMPORTANT: Read location synchronously from localStorage to avoid SF fallback
  const currentUserLocation = useMemo(() => {
    // Read directly from localStorage first (synchronous)
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        if (parsed.lat && parsed.lng) {
          console.log('📍 Feed using stored location:', parsed, '(locationReady:', locationReady, ')');
          return { lat: parsed.lat, lng: parsed.lng };
        }
      } catch (e) {
        // Fall through
      }
    }
    
    // Fallback to userLocation state or SF
    const location = userLocation || { lat: 37.7749, lng: -122.4194 };
    console.log('📍 Feed using location:', location, '(locationReady:', locationReady, ')');
    return location;
  }, [userLocation, locationReady]);
  
  const currentUserPreferences = useMemo(() => getUserPreferences(), []);

  // Phase 3: Use infinite scroll hook for enhanced feed management
  // Location is now loaded synchronously from localStorage, so no need to wait
  const {
    cards: feedCards,
    isLoading,
    error,
    currentIndex,
    moveToNextCard,
    reset: resetFeed,
    loadMore
  } = useFeedInfiniteScroll({
    userLocation: currentUserLocation,
    userPreferences: currentUserPreferences,
    userId: user?.id
  }, {
    prefetchThreshold: 2,        // Only prefetch when 2 cards left (less aggressive)
    initialBatchSize: 8,         // Standard initial batch
    subsequentBatchSize: 6,      // Load fewer cards at a time
    maxCardsInMemory: 25,        // Keep fewer cards in memory
    enablePrefetch: false        // Disable automatic prefetching for now
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
    
    // Handle different swipe directions and learn preferences
    const swipeAction = mapDirectionToAction(direction);
    
    // Learn from positive interactions
    if (['like', 'save', 'share'].includes(swipeAction)) {
      updatePreferencesFromSwipe(card, swipeAction);
    }

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
    // ✅ FIX: Return full card ID instead of stripping prefix
    // This ensures consistency with filterSeenContent which checks full IDs
    // Old behavior: "masterbot-123" -> "123" (caused ID mismatch)
    // New behavior: "masterbot-123" -> "masterbot-123" (matches filtering)
    return card.id;
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
    console.log('🔚 No more cards in current batch');
    
    // Don't automatically load more - let user decide
    // This prevents the "slideshow" effect
    
    // Optional: You could show a "Load More" button here instead
    // For now, just log that we've reached the end
    console.log('💭 User has seen all current cards - waiting for manual action');
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden safe-area-top safe-area-bottom">
      <TinderSwipe
        cards={feedCards}
        onSwipe={handleSwipe}
        onNoMoreCards={handleNoMoreCards}
      />
      
      {/* Manual Load More Button */}
      {feedCards.length > 0 && !isLoading && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => loadMore()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg transition-colors duration-200"
          >
            🔄 Load More Cards
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}