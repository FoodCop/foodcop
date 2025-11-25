/**
 * FeedDesktop Component
 * Desktop version of the Feed page
 * 
 * Interactive carousel feed based on UXpilot designs
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Bookmark, Send, MapPin } from 'lucide-react';
import { sampleRestaurants } from './data/feed-content';
import type { RestaurantCard } from './data/feed-content';

type CardState = 'active' | 'side' | 'hidden';
type ExitAnimation = 'nope' | 'like' | 'send' | null;

interface CarouselCardProps {
  card: RestaurantCard;
  state: CardState;
  index: number;
  onClick: () => void;
  exitAnimation?: ExitAnimation;
}

function CarouselCard({ card, state, onClick, exitAnimation }: CarouselCardProps) {
  const getCardStyles = () => {
    const baseStyles = {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      rotate: 0,
      zIndex: 10,
      filter: 'blur(0px)',
      cursor: 'default' as const,
    };

    switch (state) {
      case 'active':
        // Apply exit animation if active and exiting
        if (exitAnimation === 'nope') {
          return {
            ...baseStyles,
            x: -600,
            rotate: -30,
            opacity: 0,
          };
        }
        if (exitAnimation === 'like') {
          // First scale up, then swipe up
          return {
            ...baseStyles,
            scale: 1.1,
            y: -600,
            opacity: 0,
          };
        }
        if (exitAnimation === 'send') {
          return {
            ...baseStyles,
            x: 600,
            rotate: 30,
            opacity: 0,
          };
        }
        return baseStyles;
      case 'side':
        return {
          scale: 0.8,
          opacity: 0.3,
          x: 0,
          y: 0,
          rotate: 0,
          zIndex: 5,
          filter: 'blur(4px)',
          cursor: 'pointer' as const,
        };
      case 'hidden':
        return {
          scale: 0.6,
          opacity: 0,
          x: 0,
          y: 0,
          rotate: 0,
          zIndex: 1,
          filter: 'blur(0px)',
          cursor: 'default' as const,
          pointerEvents: 'none' as const,
        };
    }
  };

  const styles = getCardStyles();
  const isExiting = state === 'active' && exitAnimation !== null;

  return (
    <motion.div
      className="flex-shrink-0 w-[420px] h-[580px] bg-white rounded-[10px] overflow-hidden shadow-[_-2px_4px_12px_4px_rgba(51,51,51,0.05)]"
      style={styles}
      animate={styles}
      transition={{
        duration: isExiting ? 0.4 : 0.6,
        ease: isExiting ? [0.4, 0, 0.2, 1] : [0.4, 0, 0.2, 1],
      }}
      onClick={state === 'side' ? onClick : undefined}
    >
      {/* Image Section */}
      <div className="relative h-[420px] overflow-hidden">
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
        />
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-sm font-semibold text-gray-900">{card.priceRange}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{card.name}</h3>
        <div className="flex items-center text-gray-500 mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{card.location}</span>
        </div>
        {card.tags && card.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
}

function ActionButton({ icon, onClick, label, className = '' }: ActionButtonProps) {
  return (
    <motion.button
      className={`w-20 h-20 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-md flex items-center justify-center ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
}

export function FeedDesktop() {
  const [cards] = useState<RestaurantCard[]>(sampleRestaurants);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitAnimation, setExitAnimation] = useState<ExitAnimation>(null);

  // Get visible cards (prev, current, next)
  const getVisibleCards = useCallback(() => {
    const total = cards.length;
    if (total === 0) return [];

    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    return cards.map((card, index) => {
      let state: CardState = 'hidden';
      if (index === currentIndex) {
        state = 'active';
      } else if (index === prevIndex || index === nextIndex) {
        state = 'side';
      }
      return { card, state, index };
    });
  }, [cards, currentIndex]);

  const visibleCards = getVisibleCards();

  const nextCard = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [cards.length, isAnimating]);

  const prevCard = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [cards.length, isAnimating]);

  const handleCardClick = useCallback((index: number) => {
    if (isAnimating) return;
    const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
    const nextIndex = (currentIndex + 1) % cards.length;

    if (index === prevIndex) {
      prevCard();
    } else if (index === nextIndex) {
      nextCard();
    }
  }, [currentIndex, cards.length, isAnimating, prevCard, nextCard]);

  const handleNope = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setExitAnimation('nope');
    setTimeout(() => {
      setExitAnimation(null);
      nextCard();
      setIsAnimating(false);
    }, 500);
  }, [nextCard, isAnimating]);

  const handleLike = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Scale up animation happens in the card component
    setExitAnimation('like');
    setTimeout(() => {
      setExitAnimation(null);
      nextCard();
      setIsAnimating(false);
    }, 600);
  }, [nextCard, isAnimating]);

  const handleSave = useCallback(() => {
    if (isAnimating) return;
    // Toggle bookmark state (visual only for now)
    setTimeout(() => {
      nextCard();
    }, 600);
  }, [nextCard, isAnimating]);

  const handleSend = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setExitAnimation('send');
    setTimeout(() => {
      setExitAnimation(null);
      nextCard();
      setIsAnimating(false);
    }, 500);
  }, [nextCard, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'ArrowRight') {
        nextCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevCard, nextCard, isAnimating]);

  if (cards.length === 0) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#FAFAFA] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg.svg)',
        }}
      >
        <div className="text-center">
          <p className="text-gray-500">No content available. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-[#FAFAFA] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/bg.svg)',
        fontSize: '10pt',
      }}
    >
      <div className="flex-1 flex items-center justify-center py-12">
      <div className="w-full">
        {/* Carousel Section */}
        <div className="relative mb-16">
          <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
            <div className="flex items-center justify-center gap-8 w-full px-20">
              {visibleCards.map(({ card, state, index }) => (
                <CarouselCard
                  key={`${card.id}-${index}`}
                  card={card}
                  state={state}
                  index={index}
                  onClick={() => handleCardClick(index)}
                  exitAnimation={state === 'active' ? exitAnimation : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          <ActionButton
            icon={<X className="w-8 h-8 text-gray-600" />}
            onClick={handleNope}
            label="Nope"
          />
          <ActionButton
            icon={<Heart className="w-8 h-8 text-gray-600" />}
            onClick={handleLike}
            label="Like"
          />
          <ActionButton
            icon={<Bookmark className="w-8 h-8 text-gray-600" />}
            onClick={handleSave}
            label="Save"
          />
          <ActionButton
            icon={<Send className="w-8 h-8 text-gray-600" />}
            onClick={handleSend}
            label="Send"
          />
        </div>
      </div>
      </div>
    </div>
  );
}
