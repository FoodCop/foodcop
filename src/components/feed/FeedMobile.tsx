/**
 * FeedMobile Component
 * Mobile version of the Feed page with swipe gestures
 *
 * Interactive swipe feed based on UXpilot designs
 */

import { useState, useEffect, useCallback } from 'react';
import './FeedCard.css';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Heart, Bookmark, Send, MapPin, Star } from 'lucide-react';
import { FeedService } from '../../services/feedService';
import { GeocodingService } from '../../services/geocodingService';
import type { FeedCard } from './data/feed-content';
import { dealCardsWithSeed, generateSeed, isAd, isTrivia, type DealerContent } from '../../utils/seedDealer';
import { AdCard } from './AdCard';
import { TriviaCard } from './TriviaCard';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeableCardProps {
  card: DealerContent;
  onSwipe: (direction: SwipeDirection) => void;
  isActive: boolean;
  zIndex: number;
  scale: number;
  translateY: number;
  opacity: number;
  exitDirection?: SwipeDirection | null;
}

// Separate component for Ad cards
function AdCardWrapper({ 
  card, 
  onSwipe, 
  isActive, 
  zIndex, 
  scale, 
  translateY, 
  opacity 
}: SwipeableCardProps) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      style={{
        zIndex,
        scale,
        y: translateY,
        opacity,
      }}
      onClick={() => {
        // Skip to next card when clicking ad
        if (isActive) {
          onSwipe('right');
        }
      }}
    >
      <div className="w-full max-w-[335px] h-[540px]">
        <AdCard ad={card as any} />
      </div>
    </motion.div>
  );
}

// Separate component for Trivia cards
function TriviaCardWrapper({ 
  card, 
  onSwipe, 
  isActive, 
  zIndex, 
  scale, 
  translateY, 
  opacity 
}: SwipeableCardProps) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      style={{
        zIndex,
        scale,
        y: translateY,
        opacity,
      }}
      onClick={() => {
        // Skip to next card when clicking trivia
        if (isActive) {
          onSwipe('right');
        }
      }}
    >
      <div className="w-full max-w-[335px] h-[540px]">
        <TriviaCard trivia={card as any} />
      </div>
    </motion.div>
  );
}

// Main SwipeableCard component
function SwipeableCard(props: SwipeableCardProps) {
  const { card } = props;
  
  // Check type and render appropriate component
  if (isAd(card)) {
    return <AdCardWrapper {...props} />;
  }
  
  if (isTrivia(card)) {
    return <TriviaCardWrapper {...props} />;
  }
  
  // All other feed card types (restaurant, recipe, video, masterbot) use the same swipeable card
  return <FeedCardWrapper {...props} />;
}

// Separate component for Restaurant cards with all hooks
function FeedCardWrapper({ 
  card, 
  onSwipe, 
  isActive, 
  zIndex, 
  scale, 
  translateY, 
  opacity,
  exitDirection
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Rotation based on horizontal drag (0.05 × distance)
  const rotate = useTransform(x, (latest) => latest * 0.05);
  
  // Hint overlay opacities
  const hintLeftOpacity = useTransform(x, [-100, -50], [1, 0]);
  const hintRightOpacity = useTransform(x, [50, 100], [0, 1]);
  const hintUpOpacity = useTransform(y, [-100, -50], [1, 0]);
  const hintDownOpacity = useTransform(y, [50, 100], [0, 1]);

  // Restaurant card logic
  const feedCard = card as FeedCard;

  const handleDragEnd = useCallback((_event: unknown, info: PanInfo) => {
    const threshold = 100;
    
    // Check vertical swipes first
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
      if (info.offset.y < -threshold) {
        onSwipe('up');
      } else if (info.offset.y > threshold) {
        onSwipe('down');
      } else {
        // Reset position
        x.set(0);
        y.set(0);
      }
    } else {
      // Horizontal swipes
      if (info.offset.x > threshold) {
        onSwipe('right');
      } else if (info.offset.x < -threshold) {
        onSwipe('left');
      } else {
        // Reset position
        x.set(0);
        y.set(0);
      }
    }
  }, [onSwipe, x, y]);

  // Exit animation based on direction
  const getExitAnimation = () => {
    if (!exitDirection) return {};
    
    switch (exitDirection) {
      case 'left':
        return { x: -400, rotate: -30, opacity: 0 };
      case 'right':
        return { x: 400, rotate: 30, opacity: 0 };
      case 'up':
        return { y: -400, opacity: 0 };
      case 'down':
        return { y: 400, opacity: 0 };
      default:
        return {};
    }
  };

  // Reset position when card becomes inactive
  useEffect(() => {
    if (!isActive) {
      x.set(0);
      y.set(0);
    }
  }, [isActive, x, y]);

  if (!isActive) {
    // Background card - static - show simplified preview
    const imageUrl = (feedCard as any).imageUrl || (feedCard as any).thumbnailUrl;
    const cardTitle = (feedCard as any).name || (feedCard as any).title;
    
    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          zIndex,
          scale,
          y: translateY,
          opacity,
        }}
      >
        <div className="w-full max-w-[335px] h-[540px] bg-white rounded-[10px] shadow-[-2px_4px_12px_4px_rgba(51,51,51,0.05)] overflow-hidden">
          {/* Image Section with 9:16 aspect ratio */}
          <div className="relative aspect-[9/16]">
            <img
              src={imageUrl}
              alt={cardTitle}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Text overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-20">
              <h2 className="feed-card-title line-clamp-2">{cardTitle}</h2>
            </div>
            
            {/* Source Badge - Bottom Right Avatar */}
            {feedCard.type === 'restaurant' && (
              <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-google z-10">
                G
              </div>
            )}
            {feedCard.type === 'video' && (
              <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-youtube z-10">
                Y
              </div>
            )}
            {feedCard.type === 'recipe' && (
              <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-spoonacular z-10">
                S
              </div>
            )}
            {feedCard.type === 'masterbot' && (
              <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-fuzo z-10">
                F
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Active card - swipeable
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        zIndex,
        x,
        y,
        rotate,
      }}
      drag={!exitDirection}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={exitDirection ? getExitAnimation() : { scale: 1, y: 0, opacity: 1, x: 0, rotate: 0 }}
      transition={exitDirection 
        ? { duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }
        : { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
      }
    >
      <div className="w-full max-w-[335px] h-[540px] bg-white rounded-[10px] shadow-[_-2px_4px_12px_4px_rgba(51,51,51,0.05)] overflow-hidden relative">
        {/* Hint Overlays */}
        {/* Left (Nope) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: hintLeftOpacity }}
        >
          <div className="bg-[rgba(239,68,68,0.15)] absolute inset-0" />
          <div className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold text-lg flex items-center gap-2 relative z-10">
            <X className="w-5 h-5" />
            <span>NOPE</span>
          </div>
        </motion.div>

        {/* Right (Like) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: hintRightOpacity }}
        >
          <div className="bg-[rgba(34,197,94,0.15)] absolute inset-0" />
          <div className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold text-lg flex items-center gap-2 relative z-10">
            <Heart className="w-5 h-5" />
            <span>LIKE</span>
          </div>
        </motion.div>

        {/* Up (Send) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: hintUpOpacity }}
        >
          <div className="bg-[rgba(59,130,246,0.15)] absolute inset-0" />
          <div className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold text-lg flex items-center gap-2 relative z-10">
            <Send className="w-5 h-5" />
            <span>SEND</span>
          </div>
        </motion.div>

        {/* Down (Save) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: hintDownOpacity }}
        >
          <div className="bg-[rgba(245,158,11,0.15)] absolute inset-0" />
          <div className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold text-lg flex items-center gap-2 relative z-10">
            <Bookmark className="w-5 h-5" />
            <span>SAVE</span>
          </div>
        </motion.div>

        {/* Card Content - Dynamic based on type */}
        {/* Ads and Trivia: Show as full vertical images without details */}
        {(isAd(feedCard) || isTrivia(feedCard)) ? (
          <div className="bg-white flex flex-col relative h-full">
            <div className="aspect-[9/16] flex items-center justify-center relative">
              <img
                src={feedCard.imageUrl}
                alt={isAd(feedCard) ? (feedCard as any).brandName : 'Food Trivia'}
                className="w-full h-full object-contain"
              />
              {/* Source Badge - Bottom Right Avatar */}
              <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-fuzo z-10">
                F
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative aspect-[9/16]">
              <img
                src={feedCard.type === 'video' ? feedCard.thumbnailUrl : feedCard.imageUrl}
                alt={
                  feedCard.type === 'restaurant' ? feedCard.name :
                  feedCard.type === 'masterbot' ? feedCard.caption :
                  feedCard.type === 'ad' ? feedCard.brandName :
                  feedCard.title
                }
                className="w-full h-full object-cover"
              />
              
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Text overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                {feedCard.type === 'restaurant' && (
                  <>
                    <h2 className="feed-card-title">{feedCard.name}</h2>
                    <p className="feed-card-subtitle flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {feedCard.location} • {feedCard.distance}
                    </p>
                    {feedCard.description && (
                      <p className="feed-card-description line-clamp-2 mb-16">
                        {feedCard.description}
                      </p>
                    )}
                  </>
                )}
                {feedCard.type === 'recipe' && (
                  <>
                    <h2 className="feed-card-title">{(feedCard as any).title}</h2>
                    <p className="feed-card-subtitle">By {(feedCard as any).author}</p>
                    <p className="feed-card-description line-clamp-2 mb-3">
                      {(feedCard as any).description}
                    </p>
                    <div className="feed-card-meta flex gap-3 mb-16">
                      <span>⏱️ {(feedCard as any).prepTime}</span>
                      <span>🔥 {(feedCard as any).difficulty}</span>
                      <span>🍽️ {(feedCard as any).servings} servings</span>
                    </div>
                  </>
                )}
                {feedCard.type === 'video' && (
                  <>
                    <h2 className="feed-card-title">{(feedCard as any).title}</h2>
                    <p className="feed-card-subtitle">By {(feedCard as any).creator}</p>
                    <p className="feed-card-description line-clamp-2 mb-3">
                      {(feedCard as any).description}
                    </p>
                    <div className="feed-card-meta flex gap-3 mb-16">
                      <span>⏱️ {(feedCard as any).duration}</span>
                      <span>👁️ {(feedCard as any).views.toLocaleString()} views</span>
                    </div>
                  </>
                )}
                {feedCard.type === 'masterbot' && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {(feedCard as any).avatarUrl && (
                        <img 
                          src={(feedCard as any).avatarUrl} 
                          alt={(feedCard as any).displayName}
                          className="w-8 h-8 rounded-full border-2 border-white"
                        />
                      )}
                      <div>
                        <p className="feed-card-subtitle font-semibold">{(feedCard as any).displayName}</p>
                        <p className="feed-card-meta">@{(feedCard as any).username}</p>
                      </div>
                    </div>
                    <p className="feed-card-subtitle">
                      {(feedCard as any).caption}
                    </p>
                    <div className="feed-card-meta flex items-center gap-2 mb-16">
                      <Heart className="w-4 h-4" />
                      <span>{(feedCard as any).likes.toLocaleString()} likes</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Source Badge - Bottom Right Avatar */}
              {feedCard.type === 'restaurant' && (
                <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-google z-20">
                  G
                </div>
              )}
              {feedCard.type === 'video' && (
                <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-youtube z-20">
                  Y
                </div>
              )}
              {feedCard.type === 'recipe' && (
                <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-spoonacular z-20">
                  S
                </div>
              )}
              {feedCard.type === 'masterbot' && (
                <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-fuzo z-20">
                  F
                </div>
              )}
            </div>


          </>
        )}
      </div>
    </motion.div>
  );
}

export function FeedMobile() {
  const [cards, setCards] = useState<DealerContent[]>([]);
  const [seed, setSeed] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);

  // Generate seed on mount (only once per session)
  useEffect(() => {
    const sessionSeed = generateSeed();
    setSeed(sessionSeed);
    console.log(`🎲 Generated feed seed: ${sessionSeed}`);
  }, []);

  // Get user location and load feed data on mount
  useEffect(() => {
    // Only load feed when seed is ready
    if (!seed) return;

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
            console.log('📍 FeedMobile: Using user location:', userLocation);
          }
        } catch (error) {
          console.warn('⚠️ FeedMobile: Could not get user location, using default:', error);
        }

        const feedCards = await FeedService.generateFeed({ 
          pageSize: 20,
          userLocation 
        });
        console.log('📋 FeedMobile: Generated feed cards:', feedCards.length);
        console.log('📋 FeedMobile: Card types:', feedCards.map(c => c.type));
        
        // Deal cards using seed pattern
        const dealtCards = dealCardsWithSeed(feedCards, seed, 30);
        
        setCards(dealtCards);
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeed();
  }, [seed]);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setExitDirection(direction);
    
    // Handle swipe action (functionality will be added later)
    console.log(`Swiped ${direction} on card ${cards[currentIndex]?.id}`);
    
    // Move to next card after exit animation
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
      setExitDirection(null);
      setIsAnimating(false);
    }, 400);
  }, [currentIndex, cards, isAnimating]);

  // Get visible cards (active + 2 background)
  const getVisibleCards = useCallback(() => {
    const total = cards.length;
    if (total === 0) return [];

    const activeIndex = currentIndex % total;
    const nextIndex = (currentIndex + 1) % total;
    const nextNextIndex = (currentIndex + 2) % total;

    return [
      {
        card: cards[activeIndex],
        isActive: true,
        zIndex: 3,
        scale: 1,
        translateY: 0,
        opacity: 1,
      },
      {
        card: cards[nextIndex],
        isActive: false,
        zIndex: 2,
        scale: 0.97,
        translateY: 4,
        opacity: 0.6,
      },
      {
        card: cards[nextNextIndex],
        isActive: false,
        zIndex: 1,
        scale: 0.95,
        translateY: 8,
        opacity: 0.4,
      },
    ];
  }, [cards, currentIndex]);

  const visibleCards = getVisibleCards();

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No content available. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6 relative overflow-hidden min-h-[750px]">
        {/* Card Stack Container with 3D Perspective */}
        <div 
          className="relative w-full max-w-[335px] h-[600px]"
          style={{ perspective: '1000px' }}
        >
          {visibleCards.map((cardData, index) => (
            <SwipeableCard
              key={`${cardData.card.id}-${index}`}
              card={cardData.card}
              onSwipe={handleSwipe}
              isActive={cardData.isActive}
              zIndex={cardData.zIndex}
              scale={cardData.scale}
              translateY={cardData.translateY}
              opacity={cardData.opacity}
              exitDirection={cardData.isActive ? exitDirection : undefined}
            />
          ))}
        </div>
      </main>
      
    </div>
  );
}

