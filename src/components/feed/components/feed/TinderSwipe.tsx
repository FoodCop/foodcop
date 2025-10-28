import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FeedCard } from '../../data/feed-content';
import { SwipeCard } from './SwipeCard';
import { SwipeActions } from './SwipeActions';
import { RefreshCw } from 'lucide-react';

interface TinderSwipeProps {
  cards: FeedCard[];
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', cardId: string) => void;
  onNoMoreCards?: () => void;
}

export function TinderSwipeComponent({ cards, onSwipe, onNoMoreCards }: TinderSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentCard = cards[currentIndex];
  const hasMoreCards = currentIndex < cards.length;  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (currentCard) {
      onSwipe?.(direction, currentCard.id);
      
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        if (currentIndex + 1 >= cards.length) {
          onNoMoreCards?.();
        }
      }, 300);
    }
  }, [currentCard, currentIndex, cards.length, onSwipe, onNoMoreCards]);

  const handlePass = () => handleSwipe('left');
  const handleLike = () => handleSwipe('right');
  const handleSuperLike = () => handleSwipe('right');
  const handleRewind = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      setCurrentIndex(previousIndex);
    }
  };
  const handleMessage = () => {
    console.log('Message clicked');
  };

  // Get visible cards (current + next 2)
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  if (!hasMoreCards) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6"
        >
          <RefreshCw className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-gray-800 mb-2">No More Restaurants</h2>
        <p className="text-gray-600 mb-6">
          Check back later for new restaurants in your area
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
          }}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Card Stack Container */}
      <div className="flex-1 relative px-4 py-4 overflow-hidden">
        <div className="max-w-md mx-auto h-full relative" style={{ minHeight: '400px' }}>
          <AnimatePresence>
            {visibleCards.map((card, index) => {
              const isTop = index === 0;
              const zIndex = visibleCards.length - index;
              const scale = 1 - index * 0.05;
              const yOffset = index * 10;
              
              return (
                <div
                  key={card.id}
                  className="absolute inset-0"
                  style={{ zIndex }}
                >
                  {isTop ? (
                    <SwipeCard
                      card={card}
                      onSwipe={handleSwipe}
                    />
                  ) : (
                    <motion.div
                      initial={{ scale, y: yOffset }}
                      animate={{ scale, y: yOffset }}
                      className="w-full h-full rounded-2xl overflow-hidden shadow-xl"
                    >
                      <img
                        src={
                          card.type === 'restaurant' ? card.imageUrl :
                          card.type === 'masterbot' ? card.imageUrl :
                          card.type === 'ad' ? card.imageUrl :
                          card.type === 'recipe' ? card.imageUrl :
                          card.type === 'video' ? card.thumbnailUrl :
                          ''
                        }
                        alt={
                          card.type === 'restaurant' ? card.name :
                          card.type === 'masterbot' ? card.displayName :
                          card.type === 'ad' ? card.brandName :
                          card.type === 'recipe' ? card.title :
                          card.type === 'video' ? card.title :
                          'Card preview'
                        }
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-white">
                            {card.type === 'restaurant' ? card.name :
                             card.type === 'masterbot' ? card.displayName :
                             card.type === 'ad' ? card.brandName :
                             card.type === 'recipe' ? card.title :
                             card.type === 'video' ? card.title :
                             'Preview'}
                          </h2>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Actions */}
      <SwipeActions
        onPass={handlePass}
        onLike={handleLike}
        onSuperLike={handleSuperLike}
        onRewind={handleRewind}
        onMessage={handleMessage}
        canRewind={currentIndex > 0}
        disabled={!hasMoreCards}
      />
    </div>
  );
}

export const TinderSwipe = TinderSwipeComponent;