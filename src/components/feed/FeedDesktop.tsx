/**
 * FeedDesktop Component
 * Desktop version of the Feed page
 * 
 * "Deal Cards" mechanic: Cards are dealt in batches of 3, start face down,
 * and can be flipped to reveal content.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, RefreshCw } from 'lucide-react';
import { dealCardsWithSeed, generateSeed, isAd, isTrivia, type DealerContent } from '../../utils/seedDealer';
import { FeedService } from '../../services/feedService';
import { GeocodingService } from '../../services/geocodingService';
import type { RestaurantCard } from './data/feed-content';

// --- DealCard Component ---

interface DealCardProps {
  card: DealerContent;
  index: number;
}

function DealCard({ card, index }: DealCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  // Animation variants
  const cardVariants = {
    hidden: {
      y: -1000,
      opacity: 0,
      rotate: Math.random() * 10 - 5 // Slight random rotation for natural feel
    },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
        delay: i * 0.15 // Staggered deal
      }
    }),
    exit: {
      y: 1000,
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };

  const flipVariants = {
    front: { rotateY: 0 },
    back: { rotateY: 180 }
  };

  return (
    <motion.div
      className="relative w-[300px] h-[450px] cursor-pointer perspective-1000"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={handleFlip}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-all duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of Card (Face Down) */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-xl overflow-hidden border-4 border-white bg-white"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <img src="/logo_mobile.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 opacity-90" />
              <i className="fa-solid fa-eye text-gray-700 text-3xl"></i>
            </div>
          </div>
        </div>

        {/* Back of Card (Face Up - Content) */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-white shadow-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          {/* Ads and Trivia: Show as full vertical images */}
          {(isAd(card) || isTrivia(card)) ? (
            <div className="h-full w-full bg-white flex items-center justify-center">
              <img
                src={card.imageUrl}
                alt={isAd(card) ? card.brandName : 'Food Trivia'}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <>
              {/* Image */}
              <div className="h-1/2 overflow-hidden relative">
                <img
                  src={(card as any).imageUrl || (card as any).thumbnailUrl}
                  alt={(card as any).name || (card as any).title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {(card as any).priceRange || (card as any).duration || ''}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg truncate">
                    {(card as any).name || (card as any).title}
                  </h3>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 h-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center text-gray-600 mb-2 text-sm">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {(card as any).location || (card as any).creator || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(card as any).tags?.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-3">
                    {(card as any).description}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-bold text-gray-800">
                      {(card as any).rating || (card as any).difficulty || 'N/A'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {(card as any).reviewCount ? `(${(card as any).reviewCount})` : ''}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    {(card as any).cuisine || card.type}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main FeedDesktop Component ---

const BATCH_SIZE = 3;

export function FeedDesktop() {
  const [seed] = useState(() => generateSeed());
  const [allCards, setAllCards] = useState<DealerContent[]>([]);
  const [currentBatch, setCurrentBatch] = useState<DealerContent[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dealKey, setDealKey] = useState(0); // Key to force re-render for deal animation

  // Get user location and load feed data
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setIsLoading(true);

        // Get user location
        let userLocation: { lat: number; lng: number } | undefined;
        try {
          const coordinates = await GeocodingService.getCurrentLocation();
          if (coordinates) {
            userLocation = {
              lat: coordinates.latitude,
              lng: coordinates.longitude
            };
            console.log('📍 FeedDesktop: Using user location:', userLocation);
          }
        } catch (error) {
          console.warn('⚠️ FeedDesktop: Could not get user location, using default:', error);
        }

        const feedCards = await FeedService.generateFeed({
          pageSize: 20,
          userLocation
        });
        
        console.log('📋 FeedDesktop: Generated feed cards:', feedCards.length);
        console.log('📋 FeedDesktop: Card types:', feedCards.map(c => c.type));
        
        // ✅ USE SEED DEALER: Deal cards using seed pattern (includes ads, trivia, recipes, videos)
        const dealtCards = dealCardsWithSeed(feedCards, seed, 30);
        setAllCards(dealtCards);

        // Deal first batch
        const firstBatch = dealtCards.slice(0, BATCH_SIZE);
        console.log('🎴 Setting initial batch:', firstBatch.length, 'cards');
        setCurrentBatch(firstBatch);
        setBatchIndex(BATCH_SIZE);
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeed();
  }, [seed]);

  const dealNextHand = () => {
    // Determine next batch
    let nextIndex = batchIndex + BATCH_SIZE;
    let nextBatch = allCards.slice(batchIndex, nextIndex);

    // If we run out of cards, loop back or fetch more (looping for simplicity now)
    if (nextBatch.length === 0) {
      nextIndex = BATCH_SIZE;
      nextBatch = allCards.slice(0, BATCH_SIZE);
    } else if (nextBatch.length < BATCH_SIZE) {
      // Wrap around to fill the hand
      const remainder = BATCH_SIZE - nextBatch.length;
      nextBatch = [...nextBatch, ...allCards.slice(0, remainder)];
      nextIndex = remainder;
    }

    // Update state
    setBatchIndex(nextIndex);
    setCurrentBatch(nextBatch);
    setDealKey(prev => prev + 1); // Trigger deal animation
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (currentBatch.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <p className="text-gray-500">No cards available. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FAFAFA] bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url(/bg.svg)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center py-12">

        {/* Table / Card Area */}
        <div className="relative w-full max-w-6xl mx-auto h-[600px] flex items-center justify-center">
          {/* Card Container */}
          <div className="flex gap-8 items-center justify-center perspective-1000">
            <AnimatePresence>
              {currentBatch.map((card, index) => (
                <DealCard
                  key={`${dealKey}-${card.id}`} // Key change triggers mount animation
                  card={card}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8">
          <motion.button
            onClick={dealNextHand}
            className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg shadow-lg hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-5 h-5" />
            Deal Next Hand
          </motion.button>
        </div>

      </div>
    </div>
  );
}
