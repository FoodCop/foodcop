import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedService, type FeedGenerationParams } from '../services/feedService';
import type { FeedCard } from '../components/feed/data/feed-content';

interface InfiniteScrollConfig {
  /** Trigger prefetch when this many cards from the end */
  prefetchThreshold?: number;
  /** Initial batch size for feed generation */
  initialBatchSize?: number;
  /** Subsequent batch size for prefetching */
  subsequentBatchSize?: number;
  /** Maximum cards to keep in memory */
  maxCardsInMemory?: number;
  /** Enable automatic prefetching */
  enablePrefetch?: boolean;
}

interface InfiniteScrollState {
  cards: FeedCard[];
  isLoading: boolean;
  isInitialLoad: boolean;
  hasMore: boolean;
  error: string | null;
  currentIndex: number;
  totalFetched: number;
}

interface InfiniteScrollActions {
  /** Manually load more cards */
  loadMore: () => Promise<void>;
  /** Move to next card and trigger prefetch if needed */
  moveToNextCard: () => void;
  /** Reset the feed (useful for refresh) */
  reset: () => Promise<void>;
  /** Clear old cards from memory */
  cleanup: () => void;
}

export interface UseFeedInfiniteScrollReturn extends InfiniteScrollState, InfiniteScrollActions {}

/**
 * Phase 3: Infinite Scroll Hook with intelligent prefetching
 * 
 * Features:
 * - Background prefetching when approaching end of cards
 * - Memory management with automatic cleanup
 * - Error handling with retry logic
 * - Loading states for smooth UX
 * - Configurable thresholds and batch sizes
 */
export const useFeedInfiniteScroll = (
  feedParams: FeedGenerationParams,
  config: InfiniteScrollConfig = {}
): UseFeedInfiniteScrollReturn => {
  const {
    prefetchThreshold = 5,
    initialBatchSize = 15,
    subsequentBatchSize = 10,
    maxCardsInMemory = 50,
    enablePrefetch = true
  } = config;

  // State management
  const [state, setState] = useState<InfiniteScrollState>({
    cards: [],
    isLoading: false,
    isInitialLoad: true,
    hasMore: true,
    error: null,
    currentIndex: 0,
    totalFetched: 0
  });

  // Refs for avoiding stale closure issues
  const stateRef = useRef(state);
  const prefetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  
  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Core feed loading function with error handling
   */
  const loadFeedBatch = useCallback(async (batchSize: number, isInitial = false): Promise<FeedCard[]> => {
    console.log(`🔄 Loading ${isInitial ? 'initial' : 'additional'} feed batch:`, batchSize, 'cards');
    
    try {
      const newCards = await FeedService.generateFeed({
        ...feedParams,
        pageSize: batchSize
      });

      if (!newCards || newCards.length === 0) {
        console.warn('⚠️ No new cards received from FeedService');
        return [];
      }

      console.log(`✅ Loaded ${newCards.length} new cards`);
      retryCountRef.current = 0; // Reset retry count on success
      return newCards;

    } catch (error) {
      console.error('❌ Failed to load feed batch:', error);
      
      // Exponential backoff retry logic
      const maxRetries = 3;
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
        
        console.log(`🔄 Retrying in ${delay}ms... (attempt ${retryCountRef.current}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadFeedBatch(batchSize, isInitial);
      }
      
      throw error;
    }
  }, [feedParams]);

  /**
   * Load more cards and update state
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (stateRef.current.isLoading || !stateRef.current.hasMore) {
      console.log('🚫 Skipping loadMore - already loading or no more cards');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      const isInitial = stateRef.current.cards.length === 0;
      const batchSize = isInitial ? initialBatchSize : subsequentBatchSize;
      
      const newCards = await loadFeedBatch(batchSize, isInitial);
      
      setState(prev => {
        const updatedCards = [...prev.cards, ...newCards];
        
        // Apply memory management if we exceed limit
        const managedCards = updatedCards.length > maxCardsInMemory
          ? updatedCards.slice(-maxCardsInMemory) // Keep last N cards
          : updatedCards;

        // Mark new cards as seen in session to prevent duplicates
        newCards.forEach(card => {
          FeedService.markContentAsSeen(card.id);
        });

        return {
          ...prev,
          cards: managedCards,
          isLoading: false,
          isInitialLoad: false,
          hasMore: newCards.length > 0,
          totalFetched: prev.totalFetched + newCards.length
        };
      });

      console.log(`📊 Feed state updated: ${stateRef.current.cards.length} cards in memory`);

    } catch (error) {
      console.error('💥 Error in loadMore:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load more cards'
      }));
    }
  }, [loadFeedBatch, initialBatchSize, subsequentBatchSize, maxCardsInMemory]);

  /**
   * Move to next card and trigger prefetch if needed
   */
  const moveToNextCard = useCallback((): void => {
    setState(prev => {
      const newIndex = Math.min(prev.currentIndex + 1, prev.cards.length - 1);
      
      // Check if we need to prefetch
      const cardsRemaining = prev.cards.length - newIndex;
      const shouldPrefetch = enablePrefetch 
        && cardsRemaining <= prefetchThreshold 
        && !prev.isLoading 
        && prev.hasMore
        && !prefetchingRef.current;

      if (shouldPrefetch) {
        console.log(`🔮 Prefetch triggered: ${cardsRemaining} cards remaining`);
        prefetchingRef.current = true;
        
        // Trigger prefetch without blocking UI
        loadMore().finally(() => {
          prefetchingRef.current = false;
        });
      }

      return {
        ...prev,
        currentIndex: newIndex
      };
    });
  }, [enablePrefetch, prefetchThreshold, loadMore]);

  /**
   * Reset feed (useful for refresh)
   */
  const reset = useCallback(async (): Promise<void> => {
    console.log('🔄 Resetting feed...');
    
    setState({
      cards: [],
      isLoading: false,
      isInitialLoad: true,
      hasMore: true,
      error: null,
      currentIndex: 0,
      totalFetched: 0
    });

    prefetchingRef.current = false;
    retryCountRef.current = 0;
    
    // Clear session seen content for fresh start
    FeedService.clearSessionSeen();
    
    // Load initial batch
    await loadMore();
  }, [loadMore]);

  /**
   * Clean up old cards from memory
   */
  const cleanup = useCallback((): void => {
    setState(prev => {
      if (prev.cards.length <= maxCardsInMemory) return prev;
      
      const cardsToKeep = Math.floor(maxCardsInMemory * 0.7); // Keep 70% of max
      const cleanedCards = prev.cards.slice(-cardsToKeep);
      const removedCount = prev.cards.length - cleanedCards.length;
      
      console.log(`🧹 Memory cleanup: Removed ${removedCount} old cards`);
      
      return {
        ...prev,
        cards: cleanedCards,
        currentIndex: Math.max(0, prev.currentIndex - removedCount)
      };
    });
  }, [maxCardsInMemory]);

  /**
   * Initialize feed on mount - only run once
   */
  useEffect(() => {
    let mounted = true;
    
    const initializeFeed = async () => {
      try {
        if (stateRef.current.cards.length === 0 && !stateRef.current.isLoading) {
          await loadMore();
        }
      } catch (error) {
        if (mounted) {
          console.error('💥 Failed to initialize feed:', error);
        }
      }
    };

    initializeFeed();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  /**
   * Periodic cleanup effect
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (stateRef.current.cards.length > maxCardsInMemory) {
        cleanup();
      }
    }, 30000); // Cleanup every 30 seconds if needed

    return () => clearInterval(cleanupInterval);
  }, [cleanup, maxCardsInMemory]);

  return {
    ...state,
    loadMore,
    moveToNextCard,
    reset,
    cleanup
  };
};

/**
 * Phase 3: Simplified hook for basic infinite scrolling without advanced features
 */
export const useFeedInfiniteScrollBasic = (feedParams: FeedGenerationParams) => {
  return useFeedInfiniteScroll(feedParams, {
    prefetchThreshold: 3,
    initialBatchSize: 10,
    subsequentBatchSize: 8,
    maxCardsInMemory: 30,
    enablePrefetch: true
  });
};

export default useFeedInfiniteScroll;