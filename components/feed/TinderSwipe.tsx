'use client';

import { useState, useCallback } from 'react';
import { SwipeCard } from './SwipeCard';
import { motion, AnimatePresence } from 'framer-motion';

export interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  distance: string;
  imageUrl: string;
}

interface TinderSwipeProps {
  profiles: Profile[];
  onSwipe?: (direction: 'left' | 'right', profileId: string) => void;
  onNoMoreCards?: () => void;
}

export function TinderSwipe({ profiles, onSwipe, onNoMoreCards }: TinderSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());

  const handleSwipe = useCallback((direction: 'left' | 'right', profileId: string) => {
    setRemovedCards(prev => new Set(prev.add(profileId)));
    setCurrentIndex(prev => prev + 1);
    onSwipe?.(direction, profileId);
    
    // Check if we've gone through all cards
    if (currentIndex >= profiles.length - 1) {
      setTimeout(() => onNoMoreCards?.(), 300);
    }
  }, [currentIndex, profiles.length, onSwipe, onNoMoreCards]);

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);

  if (visibleProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-muted-foreground">
            No more profiles!
          </h3>
          <p className="text-muted-foreground">
            Check back later for new people to discover.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full max-w-sm mx-auto">
      <AnimatePresence>
        {visibleProfiles.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ 
              scale: 0.95 - index * 0.05,
              y: index * 10,
              opacity: 1 - index * 0.1 
            }}
            animate={{ 
              scale: 0.95 - index * 0.05,
              y: index * 10,
              opacity: 1 - index * 0.1 
            }}
            exit={{
              x: 300,
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            className="absolute inset-0"
            style={{ zIndex: visibleProfiles.length - index }}
          >
            <SwipeCard
              id={profile.id}
              name={profile.name}
              age={profile.age}
              location={profile.location}
              distance={profile.distance}
              imageUrl={profile.imageUrl}
              onLegacySwipe={index === 0 ? handleSwipe : undefined}
              className={index > 0 ? 'pointer-events-none' : ''}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}