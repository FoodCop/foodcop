'use client';

import { useState, useCallback } from 'react';
import { UniversalSwipeCard } from './UniversalSwipeCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedCard, SwipeDirection, SwipeAction } from '@/types/feed';

interface UniversalTinderSwipeProps {
  cards: FeedCard[];
  onSwipe?: (direction: SwipeDirection, card: FeedCard, action: SwipeAction) => void;
  onNoMoreCards?: () => void;
  onCardChange?: (currentCard: FeedCard | null) => void;
  loading?: boolean;
}

export function UniversalTinderSwipe({ 
  cards, 
  onSwipe, 
  onNoMoreCards, 
  onCardChange,
  loading = false 
}: UniversalTinderSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());

  const handleSwipe = useCallback((direction: SwipeDirection, cardId: string, action: SwipeAction) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Mark card as removed
    setRemovedCards(prev => new Set(prev.add(cardId)));
    
    // Move to next card
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    
    // Call the onSwipe callback with full card data
    onSwipe?.(direction, card, action);
    
    // Notify about card change
    const nextCard = nextIndex < cards.length ? cards[nextIndex] : null;
    onCardChange?.(nextCard);
    
    // Check if we've gone through all cards
    if (nextIndex >= cards.length) {
      setTimeout(() => onNoMoreCards?.(), 300);
    }
  }, [currentIndex, cards, onSwipe, onCardChange, onNoMoreCards]);

  // Get the cards that should be visible (current + next 2)
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).filter(card => 
    !removedCards.has(card.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  if (visibleCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-muted-foreground">
            No more cards!
          </h3>
          <p className="text-muted-foreground">
            Check back later for new content to discover.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <AnimatePresence>
        {visibleCards.map((card, index) => {
          const isTopCard = index === 0;
          const cardIndex = currentIndex + index;
          
          return (
            <motion.div
              key={card.id}
              className="absolute inset-0"
              initial={{ 
                scale: 0.9 - (index * 0.05), 
                y: index * 10,
                opacity: 1 - (index * 0.2)
              }}
              animate={{ 
                scale: 1 - (index * 0.05), 
                y: index * 10,
                opacity: 1 - (index * 0.2),
                zIndex: 10 - index
              }}
              exit={{
                x: 1000,
                opacity: 0,
                transition: { duration: 0.3 }
              }}
              style={{
                zIndex: 10 - index
              }}
            >
              <UniversalSwipeCard
                card={card}
                onSwipe={handleSwipe}
                isTopCard={isTopCard}
                className={!isTopCard ? 'pointer-events-none' : ''}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Card counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
        <p className="text-white text-sm font-medium">
          {Math.min(currentIndex + 1, cards.length)} / {cards.length}
        </p>
      </div>
    </div>
  );
}