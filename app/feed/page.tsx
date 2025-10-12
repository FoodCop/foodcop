'use client';

import { useState, useCallback } from 'react';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { TinderSwipe } from '@/components/feed/TinderSwipe';
import { SwipeActions } from '@/components/feed/SwipeActions';
import { sampleProfiles } from '@/data/sample-profiles';
import { toast } from 'sonner';

export default function FeedPage() {
  const [currentProfiles, setCurrentProfiles] = useState(sampleProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback((direction: 'left' | 'right', profileId: string) => {
    const profile = currentProfiles.find(p => p.id === profileId);
    if (profile) {
      if (direction === 'right') {
        toast.success(`You liked ${profile.name}! 💕`);
      } else {
        toast(`You passed on ${profile.name}`);
      }
    }
    setCurrentIndex(prev => prev + 1);
  }, [currentProfiles]);

  const handleNoMoreCards = useCallback(() => {
    toast.success('You\'ve seen all the profiles! Check back later for more.');
  }, []);

  const handlePass = useCallback(() => {
    if (currentIndex < currentProfiles.length) {
      const profile = currentProfiles[currentIndex];
      handleSwipe('left', profile.id);
    }
  }, [currentIndex, currentProfiles, handleSwipe]);

  const handleLike = useCallback(() => {
    if (currentIndex < currentProfiles.length) {
      const profile = currentProfiles[currentIndex];
      handleSwipe('right', profile.id);
    }
  }, [currentIndex, currentProfiles, handleSwipe]);

  const handleSuperLike = useCallback(() => {
    if (currentIndex < currentProfiles.length) {
      const profile = currentProfiles[currentIndex];
      toast.success(`You super liked ${profile.name}! ⭐`);
      handleSwipe('right', profile.id);
    }
  }, [currentIndex, currentProfiles, handleSwipe]);

  const handleRewind = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      toast('Rewound to previous profile');
    }
  }, [currentIndex]);

  const handleMessage = useCallback(() => {
    toast('Messaging feature coming soon!');
  }, []);

  const hasCards = currentIndex < currentProfiles.length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <FeedHeader 
        onProfileClick={() => toast('Profile page coming soon!')}
        onSettingsClick={() => toast('Settings coming soon!')}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Card Stack */}
        <div className="flex-1 px-4 py-6">
          <div className="h-full max-w-sm mx-auto">
            <TinderSwipe
              profiles={currentProfiles}
              onSwipe={handleSwipe}
              onNoMoreCards={handleNoMoreCards}
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
    </div>
  );
}
