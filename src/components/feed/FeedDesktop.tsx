/**
 * FeedDesktop Component
 * Desktop version of the Feed page
 * 
 * "Deal Cards" mechanic: Cards are dealt in batches of 3, start face down,
 * and can be flipped to reveal content.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place, Refresh, BookmarkBorder } from '@mui/icons-material';
import { dealCardsWithSeed, generateSeed, isAd, isTrivia, type DealerContent } from '../../utils/seedDealer';
import { FeedService } from '../../services/feedService';
import { GeocodingService } from '../../services/geocodingService';
import type { RestaurantCard } from './data/feed-content';
import { SharePostButton } from './SharePostButton';
import { savedItemsService } from '../../services/savedItemsService';
import { toastHelpers } from '../../utils/toastHelpers';
import { toast } from 'sonner';

// --- DealCard Component ---

interface DealCardProps {
  card: DealerContent;
  index: number;
}

function DealCard({ card, index }: DealCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSaveCard = async (cardToSave: DealerContent, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const itemType = cardToSave.type === 'restaurant'
        ? 'restaurant'
        : cardToSave.type === 'recipe'
          ? 'recipe'
          : cardToSave.type === 'video'
            ? 'video'
            : 'other';

      const metadata = {
        title: (cardToSave as any).title || (cardToSave as any).name || (cardToSave as any).caption,
        imageUrl: (cardToSave as any).imageUrl || (cardToSave as any).thumbnailUrl,
        subtitle: (cardToSave as any).author || (cardToSave as any).creator || (cardToSave as any).cuisine,
        description: (cardToSave as any).description,
        saveCategory: (cardToSave as any).saveCategory,
      };

      const result = await savedItemsService.saveItem({
        itemId: String(cardToSave.id),
        itemType,
        metadata,
      });

      if (result.success) {
        toastHelpers.saved(metadata.title || 'Item');
      } else if (result.error === 'Item already saved') {
        toastHelpers.info('Already saved');
      } else {
        toast.error(result.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving feed card:', error);
      toast.error('Failed to save item');
    }
  };

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
        damping: 28,
        stiffness: 140,
        mass: 0.8,
        velocity: 0,
        delay: i * 0.08
      }
    }),
    exit: {
      y: 1000,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const flipVariants = {
    front: { rotateY: 0 },
    back: { rotateY: 180 }
  };

  return (
    <motion.div
      className="relative w-[280px] h-[498px] cursor-pointer perspective-1000"
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
          className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-xl overflow-hidden border-4 border-white"
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: "var(--yellow-feed)"
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <img src="/logo_mobile.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 opacity-90" />
              <i className="fa-solid fa-eye text-white text-3xl"></i>
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
            <div className="h-full w-full relative overflow-hidden">
              <img
                src={card.imageUrl}
                alt={isAd(card) ? card.altText : 'Food Trivia'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`❌ Image failed to load: ${card.imageUrl}`, e);
                }}
                onLoad={() => {
                  console.log(`✅ Loaded: ${card.imageUrl}`);
                }}
              />
              {/* FUZO Badge for ads and trivia - overlaid */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full">
                <div className="w-6 h-6 rounded-full bg-[#FFC909] flex items-center justify-center text-gray-900 text-xs font-bold">
                  F
                </div>
                <span className="text-xs text-gray-700 font-medium">FUZO</span>
              </div>
            </div>
          ) : (
            <>
              {/* Image - 9:16 aspect ratio */}
              <div className="h-[60%] overflow-hidden relative">
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
              <div className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center text-gray-600 mb-2 text-sm">
                    <Place className="w-4 h-4 mr-1 flex-shrink-0" />
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

                {/* Actions */}
                {!isAd(card) && !isTrivia(card) && (
                  <div className="flex items-center gap-2 mt-3">
                    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <SharePostButton
                        cardId={card.id}
                        title={(card as any).title || (card as any).name || (card as any).caption}
                        imageUrl={(card as any).imageUrl || (card as any).thumbnailUrl}
                        type={card.type === 'restaurant' ? 'RESTAURANT' : card.type === 'recipe' ? 'RECIPE' : card.type === 'video' ? 'VIDEO' : 'POST'}
                        subtitle={(card as any).author || (card as any).creator || (card as any).cuisine}
                        variant="light"
                      />
                    </div>
                    <button
                      onClick={(e) => handleSaveCard(card, e)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--button-bg-default)] text-[var(--button-text)] text-xs font-medium"
                    >
                      <BookmarkBorder className="w-4 h-4" />
                      Save to Plate
                    </button>
                  </div>
                )}

                {/* Source Badge */}
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-100">
                  {card.type === 'restaurant' && (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-xs font-bold">
                        G
                      </div>
                      <span className="text-xs text-gray-500">Google Maps</span>
                    </>
                  )}
                  {card.type === 'video' && (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#FF0000] flex items-center justify-center text-white text-xs font-bold">
                        Y
                      </div>
                      <span className="text-xs text-gray-500">YouTube</span>
                    </>
                  )}
                  {(card.type === 'recipe' || card.type === 'masterbot') && (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#FFC909] flex items-center justify-center text-gray-900 text-xs font-bold">
                        F
                      </div>
                      <span className="text-xs text-gray-500">FUZO</span>
                    </>
                  )}
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

    // Sequential state updates: first exit old cards, then enter new cards
    // This prevents simultaneous animations that cause jerk
    setCurrentBatch([]);
    
    // Small timeout to let exit animation complete before showing new batch
    setTimeout(() => {
      setBatchIndex(nextIndex);
      setCurrentBatch(nextBatch);
    }, 300); // Matches exit animation duration
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
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center py-12">

        {/* Table / Card Area */}
        <div className="relative w-full max-w-6xl mx-auto h-[600px] flex items-center justify-center">
          {/* Card Container */}
          <div className="flex gap-8 items-center justify-center perspective-1000">
            <AnimatePresence mode="popLayout">
              {currentBatch.map((card, index) => (
                <DealCard
                  key={card.id} // Stable key - animation triggered by AnimatePresence layout change
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
            className="flex items-center gap-2 px-8 py-4 text-gray-900 rounded-full font-bold text-lg shadow-lg transition-colors"
            style={{ backgroundColor: "var(--yellow-feed)" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--yellow-feed-alternate)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--yellow-feed)"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Refresh className="w-5 h-5" />
            Deal Next Hand
          </motion.button>
        </div>

      </div>

      {/* Page Endpoint Banner (Desktop only) */}
      <footer className="hidden md:block px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <img src="/banners/fb_01.png" alt="Feed banner" className="max-w-full h-auto rounded-md shadow-sm" />
        </div>
      </footer>
    </div>
  );
}
