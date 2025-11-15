import { useState, useCallback, useEffect, useMemo } from 'react';
import { Heart, X, Star, MapPin, Clock, Flame, Share2, Bookmark, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { FeedService, type UserLocation, type UserPreferences } from '../../services/feedService';
import { useAuth } from '../auth/AuthProvider';
import { useSmartSave } from '../../hooks/useSmartSave';
import { useFeedInfiniteScroll } from '../../hooks/useFeedInfiniteScroll';
import type { FeedCard } from './data/feed-content';
import { toast } from 'sonner';

export function FeedNew() {
  const { user } = useAuth();
  const { saveToPlate } = useSmartSave();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Request user's location
  const requestUserLocation = async (): Promise<UserLocation> => {
    return new Promise((resolve) => {
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        try {
          const parsed = JSON.parse(storedLocation);
          if (parsed.lat && parsed.lng) {
            setUserLocation(parsed);
            return resolve({ lat: parsed.lat, lng: parsed.lng });
          }
        } catch (e) {
          // Fall through
        }
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            localStorage.setItem('userLocation', JSON.stringify(location));
            setUserLocation(location);
            resolve(location);
          },
          (_error) => {
            const fallback = { lat: 37.7749, lng: -122.4194 };
            setUserLocation(fallback);
            resolve(fallback);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        const fallback = { lat: 37.7749, lng: -122.4194 };
        setUserLocation(fallback);
        resolve(fallback);
      }
    });
  };

  // Get user preferences
  const getUserPreferences = (): UserPreferences => {
    const storedPrefs = localStorage.getItem('userFeedPreferences');
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs);
        return {
          cuisinePreferences: parsed.cuisinePreferences || [],
          dietaryRestrictions: parsed.dietaryRestrictions || [],
          preferredRadius: parsed.preferredRadius || 5000,
          priceRange: parsed.priceRange || ['$', '$$', '$$$'],
          contentTypes: parsed.contentTypes || ['restaurant', 'recipe', 'video', 'masterbot']
        };
      } catch (e) {
        // Fall through
      }
    }

    const defaultPrefs = {
      cuisinePreferences: [],
      dietaryRestrictions: [],
      preferredRadius: 5000,
      priceRange: ['$', '$$', '$$$'],
      contentTypes: ['restaurant', 'recipe', 'video', 'masterbot']
    };

    localStorage.setItem('userFeedPreferences', JSON.stringify(defaultPrefs));
    return defaultPrefs;
  };

  // Initialize location
  useEffect(() => {
    requestUserLocation();
  }, []);

  const currentUserLocation = useMemo(() => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        if (parsed.lat && parsed.lng) {
          return { lat: parsed.lat, lng: parsed.lng };
        }
      } catch (e) {
        // Fall through
      }
    }
    return userLocation || { lat: 37.7749, lng: -122.4194 };
  }, [userLocation]);

  const currentUserPreferences = useMemo(() => getUserPreferences(), []);

  // Use infinite scroll hook
  const {
    cards: feedCards,
    isLoading,
    currentIndex,
    moveToNextCard,
    loadMore
  } = useFeedInfiniteScroll({
    userLocation: currentUserLocation,
    userPreferences: currentUserPreferences,
    userId: user?.id
  }, {
    prefetchThreshold: 2,
    initialBatchSize: 8,
    subsequentBatchSize: 6,
    maxCardsInMemory: 25,
    enablePrefetch: false
  });

  const handleSwipe = async (direction: 'left' | 'right' | 'up' | 'down', cardId: string) => {
    const card = feedCards.find(c => c.id === cardId);
    if (!card) return;

    FeedService.markContentAsSeen(card.id);
    moveToNextCard();
    setCurrentCardIndex(prev => prev + 1);

    if (user) {
      try {
        await FeedService.trackSwipeEvent({
          cardId: cardId,
          cardType: card.type,
          contentId: card.id,
          swipeDirection: direction,
          swipeAction: mapDirectionToAction(direction),
          userId: user.id
        });
      } catch (error) {
        console.error('Failed to track swipe:', error);
      }
    }

    switch (direction) {
      case 'up':
        await handleShare(card);
        toast.success('Shared!');
        break;
      case 'down':
        await handleSaveToPlate(card);
        toast.success('Saved to Plate!');
        break;
      case 'right':
        toast.success('Liked!');
        break;
      case 'left':
        break;
    }
  };

  const handleSaveToPlate = async (card: FeedCard) => {
    if (!user) {
      toast.error('Please sign in to save');
      return;
    }

    try {
      const saveParams = transformFeedCardToSaveParams(card);
      await saveToPlate(saveParams);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save');
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
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

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
          itemId: card.id,
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
          itemId: card.id,
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
          itemId: card.id,
          itemType: 'video' as const,
          metadata: {
            title: videoCard.title,
            creator: videoCard.creator,
            thumbnailUrl: videoCard.thumbnailUrl,
            duration: videoCard.duration,
            views: videoCard.views,
            description: videoCard.description,
            url: `https://www.youtube.com/watch?v=${card.id}`
          } as Record<string, unknown>
        };
      }
      default: {
        return {
          itemId: card.id,
          itemType: 'other' as const,
          metadata: { ...card } as Record<string, unknown>
        };
      }
    }
  };

  const currentCard = feedCards[currentCardIndex];
  const nextCard = feedCards[currentCardIndex + 1];
  const hasMoreCards = currentCardIndex < feedCards.length;

  return (
    <div className="w-full max-w-[375px] mx-auto bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#FF6B35] to-[#EA580C] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <h1 className="text-white font-[Poppins] font-bold text-xl">Feed</h1>
          </div>
          <button
            onClick={() => loadMore()}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative px-5 py-6" style={{ height: 'calc(100vh - 200px)' }}>
        {!hasMoreCards ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#EA580C] flex items-center justify-center mb-6"
            >
              <RefreshCw className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="font-[Poppins] font-bold text-xl text-gray-900 mb-2">
              You're All Caught Up!
            </h2>
            <p className="text-gray-600 mb-6">Check back later for more recommendations</p>
            <button
              onClick={() => {
                setCurrentCardIndex(0);
                loadMore();
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#EA580C] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Start Over
            </button>
          </div>
        ) : (
          <div className="relative h-full">
            <AnimatePresence>
              {/* Next card (background) */}
              {nextCard && (
                <div className="absolute inset-0" style={{ zIndex: 1 }}>
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 0.95, y: 10 }}
                    className="w-full h-full"
                  >
                    <CardContent card={nextCard} isActive={false} />
                  </motion.div>
                </div>
              )}

              {/* Current card (foreground) */}
              {currentCard && (
                <div className="absolute inset-0" style={{ zIndex: 2 }}>
                  <SwipeableCard
                    card={currentCard}
                    onSwipe={handleSwipe}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasMoreCards && currentCard && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 z-40">
          <div className="max-w-[375px] mx-auto flex items-center justify-center gap-4">
            <button
              onClick={() => handleSwipe('left', currentCard.id)}
              className="w-14 h-14 rounded-full bg-white border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center shadow-md"
            >
              <X className="w-7 h-7 text-gray-600" />
            </button>
            <button
              onClick={() => handleSwipe('down', currentCard.id)}
              className="w-12 h-12 rounded-full bg-white border-2 border-blue-400 hover:border-blue-500 transition-colors flex items-center justify-center shadow-md"
            >
              <Bookmark className="w-5 h-5 text-blue-500" />
            </button>
            <button
              onClick={() => handleSwipe('right', currentCard.id)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#EA580C] hover:opacity-90 transition-opacity flex items-center justify-center shadow-lg"
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </button>
            <button
              onClick={() => handleSwipe('up', currentCard.id)}
              className="w-12 h-12 rounded-full bg-white border-2 border-purple-400 hover:border-purple-500 transition-colors flex items-center justify-center shadow-md"
            >
              <Share2 className="w-5 h-5 text-purple-500" />
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Swipeable Card Component
function SwipeableCard({ card, onSwipe }: { card: FeedCard; onSwipe: (direction: 'left' | 'right' | 'up' | 'down', cardId: string) => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_event: any, info: any) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction, card.id);
    } else if (Math.abs(info.offset.y) > threshold) {
      const direction = info.offset.y > 0 ? 'down' : 'up';
      onSwipe(direction, card.id);
    }
  };

  return (
    <motion.div
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      initial={{ scale: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CardContent card={card} isActive={true} />
    </motion.div>
  );
}

// Card Content Component
function CardContent({ card, isActive }: { card: FeedCard; isActive: boolean }) {
  const renderCardContent = () => {
    switch (card.type) {
      case 'restaurant':
        return <RestaurantCard card={card as any} />;
      case 'recipe':
        return <RecipeCard card={card as any} />;
      case 'video':
        return <VideoCard card={card as any} />;
      case 'masterbot':
        return <MasterbotCard card={card as any} />;
      default:
        return <DefaultCard card={card} />;
    }
  };

  return (
    <div className={`w-full h-full rounded-2xl overflow-hidden shadow-[0_4px_12px_0_rgba(0,0,0,0.15)] bg-white ${isActive ? '' : 'opacity-50'}`}>
      {renderCardContent()}
    </div>
  );
}

// Restaurant Card
function RestaurantCard({ card }: { card: any }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <img
          src={card.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'}
          alt={card.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-[#FF6B35] rounded-full text-xs font-semibold">
            {card.cuisine || 'Restaurant'}
          </span>
          {card.priceRange && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
              {card.priceRange}
            </span>
          )}
        </div>
        
        <h2 className="font-[Poppins] font-bold text-2xl mb-2">{card.name}</h2>
        
        <div className="flex items-center gap-4 text-sm">
          {card.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{card.rating}</span>
            </div>
          )}
          {card.distance && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{card.distance}</span>
            </div>
          )}
        </div>
        
        {card.description && (
          <p className="mt-2 text-sm text-white/90 line-clamp-2">{card.description}</p>
        )}
      </div>
    </div>
  );
}

// Recipe Card
function RecipeCard({ card }: { card: any }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <img
          src={card.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
          alt={card.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>
      
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1 bg-green-500 rounded-full text-white text-xs font-semibold">
          Recipe
        </span>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h2 className="font-[Poppins] font-bold text-2xl mb-2">{card.title}</h2>
        
        <div className="flex items-center gap-4 text-sm mb-2">
          {card.prepTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{card.prepTime}</span>
            </div>
          )}
          {card.difficulty && (
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4" />
              <span>{card.difficulty}</span>
            </div>
          )}
        </div>
        
        {card.author && (
          <p className="text-sm text-white/80">by {card.author}</p>
        )}
      </div>
    </div>
  );
}

// Video Card
function VideoCard({ card }: { card: any }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <img
          src={card.thumbnailUrl || 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=500'}
          alt={card.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>
      
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-semibold">
          Video
        </span>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h2 className="font-[Poppins] font-bold text-2xl mb-2">{card.title}</h2>
        
        <div className="flex items-center gap-4 text-sm mb-2">
          {card.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{card.duration}</span>
            </div>
          )}
          {card.views && (
            <span>{card.views} views</span>
          )}
        </div>
        
        {card.creator && (
          <p className="text-sm text-white/80">by {card.creator}</p>
        )}
      </div>
    </div>
  );
}

// Masterbot Card
function MasterbotCard({ card }: { card: any }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
        <div>
          <h3 className="text-white font-semibold">{card.displayName}</h3>
          <p className="text-white/80 text-sm">MasterBot</p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white text-lg text-center font-medium leading-relaxed">
          {card.content || card.message || 'Check out this amazing recommendation!'}
        </p>
      </div>
      
      <div className="text-white/60 text-xs text-center">
        AI-powered recommendation
      </div>
    </div>
  );
}

// Default Card
function DefaultCard({ card }: { card: FeedCard }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="font-[Poppins] font-bold text-xl text-gray-700 mb-2">
          {(card as any).name || (card as any).title || 'Discovery'}
        </h2>
        <p className="text-gray-600">{card.type}</p>
      </div>
    </div>
  );
}
