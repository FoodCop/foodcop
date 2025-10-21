'use client';

import { useState, useCallback, useEffect } from 'react';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { UniversalTinderSwipe, UniversalViewer } from '@/components/feed';
import { SwipeActions } from '@/components/feed/SwipeActions';
import { useFeed } from '@/hooks/useFeed';
import { FeedCard, SwipeDirection, SwipeAction } from '@/types/feed';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function FeedPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FeedCard | null>(null);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Initialize FUZO feed
  const {
    cards,
    currentCard,
    currentIndex,
    loading,
    error,
    composition,
    totalAvailable,
    preferencesApplied,
    usingFallback,
    handleSwipe,
    fetchMoreCards,
    refetch
  } = useFeed({
    user_id: userId || '',
    initial_radius_km: 50,
    auto_fetch: true
  });

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Handle swipe actions with enhanced feedback
  const handleSwipeAction = useCallback(async (direction: SwipeDirection, card: FeedCard, action: SwipeAction) => {
    console.log(`� Swipe: ${direction} on ${card.card_type} (${action})`);
    
    // Process the swipe through our hook
    await handleSwipe(direction, card.id);
    
    // Provide user feedback based on action
    switch (action) {
      case 'LIKE':
        if (card.card_type === 'RECIPE') {
          toast.success(`Liked ${card.metadata.title}! 💚`);
        } else if (card.card_type === 'RESTAURANT_NEARBY') {
          toast.success(`Liked ${card.metadata.name}! 💚`);
        } else if (card.card_type === 'VIDEO') {
          toast.success(`Liked ${card.metadata.title}! 💚`);
        } else if (card.card_type === 'PHOTO') {
          toast.success(`Liked photo by @${card.metadata.username}! 💚`);
        } else if (card.card_type === 'AD') {
          toast.success(`Liked ${card.metadata.title}! 💚`);
        }
        break;
        
      case 'SAVE':
        if (card.card_type === 'RECIPE') {
          toast.success(`Saved ${card.metadata.title} to your collection! 🔖`);
        } else if (card.card_type === 'RESTAURANT_NEARBY') {
          toast.success(`Saved ${card.metadata.name} to your plate! 🍽️`);
        } else if (card.card_type === 'VIDEO') {
          toast.success(`Saved ${card.metadata.title} to watch later! 📺`);
        } else if (card.card_type === 'PHOTO') {
          toast.success(`Saved photo to your collection! 📷`);
        }
        break;
        
      case 'SHARE':
        toast.success('Opening share options... 🔗', {
          description: 'Share feature coming soon!'
        });
        break;
        
      case 'DISLIKE':
        toast('Passed on this recommendation', {
          description: 'We\'ll learn from your preferences'
        });
        break;
    }
  }, [handleSwipe]);

  // Handle manual action buttons
  const handlePass = useCallback(() => {
    if (currentCard) {
      handleSwipeAction('LEFT' as SwipeDirection, currentCard, 'DISLIKE');
    }
  }, [currentCard, handleSwipeAction]);

  const handleLike = useCallback(() => {
    if (currentCard) {
      handleSwipeAction('RIGHT' as SwipeDirection, currentCard, 'LIKE');
    }
  }, [currentCard, handleSwipeAction]);

  const handleSuperLike = useCallback(() => {
    if (currentCard) {
      // Super like = like + save
      handleSwipeAction('RIGHT' as SwipeDirection, currentCard, 'LIKE');
      setTimeout(() => {
        handleSwipeAction('DOWN' as SwipeDirection, currentCard, 'SAVE');
      }, 300);
    }
  }, [currentCard, handleSwipeAction]);

  const handleRewind = useCallback(() => {
    toast('Rewind feature coming soon!', {
      description: 'Premium feature to undo swipes'
    });
  }, []);

  const handleMessage = useCallback(() => {
    toast('AI recommendations coming soon!', {
      description: 'Get personalized dining insights'
    });
  }, []);

  const handleNoMoreCards = useCallback(() => {
    toast.success('You\'ve explored all recommendations!', {
      description: 'New content arrives daily'
    });
  }, []);

  const handleCardTap = useCallback((card: FeedCard) => {
    setSelectedCard(card);
    setViewerOpen(true);
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h3 className="text-xl font-semibold">Curating your perfect feed...</h3>
          <p className="text-muted-foreground">Discovering recipes, restaurants, videos & more</p>
          {preferencesApplied && (
            <p className="text-sm text-primary">✨ Personalized for your taste</p>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <h3 className="text-xl font-semibold text-destructive">Oops! Something went wrong</h3>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={refetch}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasCards = cards.length > 0;
  const cardTypeLabels = {
    'RECIPE': 'Recipe',
    'RESTAURANT_NEARBY': 'Restaurant', 
    'VIDEO': 'Video',
    'PHOTO': 'Photo',
    'AD': 'Sponsored'
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <FeedHeader 
        onProfileClick={() => toast('Profile page coming soon!')}
        onSettingsClick={() => toast('Settings coming soon!')}
      />

      {/* Feed Stats Bar - Enhanced for Testing */}
      {composition && (
        <div className="shrink-0 px-4 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-blue-900">
                📊 FEED TEST: Card {currentIndex + 1}/{cards.length}
              </div>
              <button 
                onClick={refetch}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                🔄 Refresh Feed
              </button>
              {currentCard && (
                <div className="px-2 py-1 bg-blue-200 rounded text-sm text-blue-800 font-medium">
                  {cardTypeLabels[currentCard.card_type]}
                </div>
              )}
              {preferencesApplied && (
                <span className="text-green-600 font-medium">✨ Personalized</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-blue-900">Composition:</div>
              {composition.recipes > 0 && (
                <div className="px-2 py-1 bg-orange-100 rounded text-sm text-orange-800">
                  🍳 {composition.recipes} recipes
                </div>
              )}
              {composition.restaurants > 0 && (
                <div className="px-2 py-1 bg-red-100 rounded text-sm text-red-800">
                  🍽️ {composition.restaurants} restaurants
                </div>
              )}
              {composition.videos > 0 && (
                <div className="px-2 py-1 bg-purple-100 rounded text-sm text-purple-800">
                  📺 {composition.videos} videos
                </div>
              )}
              {composition.photos > 0 && (
                <div className="px-2 py-1 bg-pink-100 rounded text-sm text-pink-800">
                  📷 {composition.photos} photos
                </div>
              )}
              {composition.ads > 0 && (
                <div className="px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-800">
                  📢 {composition.ads} ads
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug: Card List for Testing */}
      {cards.length > 0 && (
        <div className="shrink-0 px-4 py-2 bg-gray-50 border-b text-xs">
          <details>
            <summary className="cursor-pointer text-gray-700 font-medium">
              🔍 Debug: Show All Cards ({cards.length} total)
            </summary>
            <div className="mt-2 space-y-1">
              {cards.map((card, index) => {
                const metadata = card.metadata as any;
                const title = metadata?.title || metadata?.name || 'Untitled';
                const isCurrentCard = index === currentIndex;
                return (
                  <div 
                    key={card.id} 
                    className={`flex items-center gap-2 p-1 rounded ${
                      isCurrentCard ? 'bg-blue-200 text-blue-900' : 'text-gray-600'
                    }`}
                  >
                    <span className="font-mono text-xs w-6">{index + 1}.</span>
                    <span className="w-20 text-xs">[{card.card_type}]</span>
                    <span className="flex-1">{title}</span>
                    <span className="text-xs">Score: {card.relevance_score}</span>
                    {isCurrentCard && <span className="text-blue-600">← Current</span>}
                  </div>
                );
              })}
            </div>
          </details>
          
          {/* Debug section */}
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className={`w-2 h-2 rounded-full ${usingFallback ? 'bg-orange-500' : 'bg-green-500'}`} />
              <span>Source: {usingFallback ? 'Database Fallback' : 'Edge Function'}</span>
            </div>
            <div className="text-xs text-gray-500">
              Total Available: {typeof totalAvailable === 'number' ? totalAvailable : Object.values(totalAvailable || {}).reduce((a, b) => a + b, 0)} | Preferences: {preferencesApplied ? 'Applied' : 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Card Stack */}
        <div className="flex-1 px-4 py-6">
          <div className="h-full max-w-sm mx-auto">
            <UniversalTinderSwipe
              cards={cards}
              onSwipe={handleSwipeAction}
              onNoMoreCards={handleNoMoreCards}
              onCardChange={(card) => console.log('Current card:', card?.card_type)}
              loading={loading}
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

      {/* Universal Viewer Modal */}
      <UniversalViewer
        card={selectedCard}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onSwipe={handleSwipeAction}
      />
    </div>
  );
}
