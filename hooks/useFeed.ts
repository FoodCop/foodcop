import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedCard, SwipeDirection, SwipeAction, UseFeedOptions, UseFeedReturn, FeedComposerRequest, FeedComposerResponse, SwipeEventRequest } from '@/types/feed';
import { supabaseBrowser } from '@/lib/supabase/client';

const FEED_COMPOSER_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/feed-composer';
const EVENTS_INGEST_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/events-ingest';

export function useFeed(options: UseFeedOptions): UseFeedReturn {
  const {
    user_id,
    initial_radius_km = 50,
    auto_fetch = true,
    custom_ratio
  } = options;

  // State
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composition, setComposition] = useState<FeedComposerResponse['composition'] | null>(null);
  const [totalAvailable, setTotalAvailable] = useState<FeedComposerResponse['total_available'] | null>(null);
  const [preferencesApplied, setPreferencesApplied] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Refs
  const sessionId = useRef(Math.random().toString(36).substring(7));
  const excludedCards = useRef<Set<string>>(new Set());
  const userLocation = useRef<{ lat: number; lng: number } | null>(null);

  // Get current card
  const currentCard = cards[currentIndex] || null;

  // Get user location
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) return null;
    
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          userLocation.current = location;
          resolve(location);
        },
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }, []);

  // Fetch cards from feed composer
  const fetchCards = useCallback(async (excludeCards: string[] = []) => {
    if (!user_id) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user location if not already available
      if (!userLocation.current) {
        await getUserLocation();
      }

      const requestBody: FeedComposerRequest = {
        user_id,
        exclude_cards: excludeCards,
        user_lat: userLocation.current?.lat,
        user_lng: userLocation.current?.lng,
        radius_km: initial_radius_km,
        custom_ratio
      };

      // Get Supabase session for authentication
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authentication session found');
      }

      // Try Edge Function first, fall back to direct database query
      let data: FeedComposerResponse;
      
      try {
        console.log('🚀 Attempting to use Edge Function...');
        setUsingFallback(false);
        
        const response = await fetch(FEED_COMPOSER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();
        console.log('✅ Edge Function succeeded!');
      } catch (fetchError) {
        console.warn('⚠️ Edge Function failed, using database fallback:', fetchError);
        setUsingFallback(true);
        
        // Fallback: Query database directly
        const { data: fallbackCards, error: dbError } = await supabase
          .from('feed_cards')
          .select('*')
          .eq('is_active', true)
          .order('relevance_score', { ascending: false })
          .limit(7);

        if (dbError) {
          throw new Error(`Database fallback failed: ${dbError.message}`);
        }

        // Create fallback response
        data = {
          cards: fallbackCards || [],
          composition: {
            recipes: fallbackCards?.filter((c: any) => c.card_type === 'RECIPE').length || 0,
            restaurants: fallbackCards?.filter((c: any) => c.card_type === 'RESTAURANT_NEARBY').length || 0,
            videos: fallbackCards?.filter((c: any) => c.card_type === 'VIDEO').length || 0,
            photos: fallbackCards?.filter((c: any) => c.card_type === 'PHOTO').length || 0,
            ads: fallbackCards?.filter((c: any) => c.card_type === 'AD').length || 0,
          },
          total_available: {
            recipes: 10,
            restaurants: 5,
            videos: 2,
            photos: 1,
            ads: 1,
          },
          user_preferences_applied: false
        };
        
        console.log('Using fallback data:', data);
      }
      
      // Debug: Log detailed card information
      console.log('🎯 FEED COMPOSER RESULTS:');
      console.log('📊 Target Ratio: 3 recipes, 2 restaurants, 1 video, 1 ad');
      console.log('📦 Actual Composition:', data.composition);
      console.log('📋 Cards Received:');
      
      data.cards.forEach((card, index) => {
        const metadata = card.metadata as any;
        const title = metadata?.title || metadata?.name || 'Untitled';
        console.log(`  ${index + 1}. [${card.card_type}] ${title} (score: ${card.relevance_score})`);
      });
      
      console.log(`✅ Total Cards: ${data.cards.length}`);
      console.log(`🎯 Composition Breakdown:`);
      console.log(`   🍳 Recipes: ${data.composition.recipes}`);
      console.log(`   🍽️ Restaurants: ${data.composition.restaurants}`);
      console.log(`   📺 Videos: ${data.composition.videos}`);
      console.log(`   📷 Photos: ${data.composition.photos}`);
      console.log(`   📢 Ads: ${data.composition.ads}`);
      
      // Update state
      setCards(data.cards);
      setComposition(data.composition);
      setTotalAvailable(data.total_available);
      setPreferencesApplied(data.user_preferences_applied);
      setCurrentIndex(0);
      
      // Add to excluded cards
      data.cards.forEach(card => excludedCards.current.add(card.id));

    } catch (err) {
      console.error('Error fetching feed cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  }, [user_id, initial_radius_km, custom_ratio, getUserLocation]);

  // Process swipe event
  const processSwipeEvent = useCallback(async (
    direction: SwipeDirection,
    card: FeedCard,
    action: SwipeAction
  ) => {
    try {
      const eventData: SwipeEventRequest = {
        user_id,
        card_id: card.id,
        swipe_direction: direction,
        card_type: card.card_type,
        content_id: card.content_id,
        content_metadata: card.metadata,
        session_id: sessionId.current,
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        user_agent: navigator.userAgent,
        user_lat: userLocation.current?.lat,
        user_lng: userLocation.current?.lng,
      };

      // Get Supabase session for authentication
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No authentication session found for swipe event');
        return;
      }

      const response = await fetch(EVENTS_INGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        console.error('Failed to process swipe event:', response.status);
        return;
      }

      const result = await response.json();
      console.log('Swipe event processed:', result);

    } catch (err) {
      console.error('Error processing swipe event:', err);
    }
  }, [user_id]);

  // Handle swipe action
  const handleSwipe = useCallback(async (direction: SwipeDirection, cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Map direction to action
    const actionMap: Record<string, SwipeAction> = {
      'LEFT': 'DISLIKE',
      'RIGHT': 'LIKE', 
      'UP': 'SHARE',
      'DOWN': 'SAVE'
    };
    
    const action = actionMap[direction.toUpperCase()];

    // Process the swipe event
    await processSwipeEvent(direction, card, action);

    // Move to next card
    setCurrentIndex(prev => prev + 1);
    
    // If we're getting close to the end, fetch more cards
    if (currentIndex >= cards.length - 2) {
      const excludeList = Array.from(excludedCards.current);
      await fetchCards(excludeList);
    }
  }, [cards, currentIndex, processSwipeEvent, fetchCards]);

  // Fetch more cards
  const fetchMoreCards = useCallback(async () => {
    const excludeList = Array.from(excludedCards.current);
    await fetchCards(excludeList);
  }, [fetchCards]);

  // Refetch cards (reset feed)
  const refetch = useCallback(async () => {
    excludedCards.current.clear();
    await fetchCards();
  }, [fetchCards]);

  // Reset feed state
  const resetFeed = useCallback(() => {
    setCards([]);
    setCurrentIndex(0);
    setError(null);
    setComposition(null);
    setTotalAvailable(null);
    setPreferencesApplied(false);
    excludedCards.current.clear();
  }, []);

  // Navigation functions
  const nextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, cards.length]);

  const previousCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToCard = useCallback((index: number) => {
    if (index >= 0 && index < cards.length) {
      setCurrentIndex(index);
    }
  }, [cards.length]);

  // Auto-fetch on mount
  useEffect(() => {
    if (auto_fetch && user_id) {
      fetchCards();
    }
  }, [auto_fetch, user_id, fetchCards]);

  return {
    // State
    cards,
    currentCard,
    currentIndex,
    loading,
    error,
    
    // Feed composition info
    composition,
    totalAvailable,
    preferencesApplied,
    usingFallback,
    
    // Actions
    handleSwipe,
    fetchMoreCards,
    refetch,
    resetFeed,
    
    // Navigation
    nextCard,
    previousCard,
    goToCard,
  };
}