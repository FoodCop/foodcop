'use client';

import React, { useState, useEffect } from 'react';
import { Star, Trophy, Zap, Target, Camera, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

interface TaggingData {
  restaurantName: string;
  rating: number;
  foodTags: string[];
  additionalTags: string[];
  review: string;
  priceRange: string;
  visitDate: Date;
}

interface GamificationFeedbackProps {
  pointsEarned: number;
  taggingData: TaggingData;
  onComplete: () => void;
  onTakeAnother: () => void;
}

const BADGES = [
  { 
    id: 'explorer', 
    name: 'Food Explorer', 
    icon: '🗺️', 
    description: 'Discover new restaurants',
    requirement: 'Visit 5 different restaurants',
    progress: 3,
    total: 5,
    category: 'discovery'
  },
  { 
    id: 'tag_master', 
    name: 'Tag Master', 
    icon: '🏷️', 
    description: 'Master of detailed tagging',
    requirement: 'Add 50 food tags',
    progress: 42,
    total: 50,
    category: 'tagging'
  },
  { 
    id: 'food_critic', 
    name: 'Food Critic', 
    icon: '✍️', 
    description: 'Share thoughtful reviews',
    requirement: 'Write 10 reviews',
    progress: 7,
    total: 10,
    category: 'reviews'
  },
  { 
    id: 'snap_king', 
    name: 'Snap King', 
    icon: '📸', 
    description: 'Food photography expert',
    requirement: 'Take 25 food snaps',
    progress: 18,
    total: 25,
    category: 'photography'
  },
  { 
    id: 'social_butterfly', 
    name: 'Social Butterfly', 
    icon: '🦋', 
    description: 'Connect with fellow food lovers',
    requirement: 'Share 15 posts',
    progress: 12,
    total: 15,
    category: 'social'
  },
  { 
    id: 'master_taster', 
    name: 'Master Taster', 
    icon: '👨‍🍳', 
    description: 'Ultimate food connoisseur',
    requirement: 'Reach 1000 points',
    progress: 650,
    total: 1000,
    category: 'points'
  }
];

export function GamificationFeedback({ pointsEarned, taggingData, onComplete, onTakeAnother }: GamificationFeedbackProps) {
  const [showAnimation, setShowAnimation] = useState(true);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(5);
  const [levelProgress, setLevelProgress] = useState(75);
  const [newBadgeUnlocked, setNewBadgeUnlocked] = useState<string | null>(null);

  // Calculate points breakdown
  const pointsBreakdown = [
    { 
      label: 'Food Tags', 
      points: taggingData.foodTags.length * 5, 
      count: taggingData.foodTags.length,
      icon: '🏷️'
    },
    { 
      label: 'Additional Details', 
      points: taggingData.additionalTags.length * 3, 
      count: taggingData.additionalTags.length,
      icon: '✨'
    },
    { 
      label: 'Review Bonus', 
      points: taggingData.review.trim() ? 20 : 0, 
      count: taggingData.review.trim() ? 1 : 0,
      icon: '✍️'
    },
    { 
      label: 'Rating Added', 
      points: taggingData.rating > 0 ? 10 : 0, 
      count: taggingData.rating > 0 ? 1 : 0,
      icon: '⭐'
    },
    { 
      label: 'Photo Snap', 
      points: 15, 
      count: 1,
      icon: '📸'
    }
  ];

  const checkBadgeUnlocks = React.useCallback(() => {
    // Simulate badge unlock logic
    if (pointsEarned >= 20 && Math.random() > 0.7) {
      // Random chance to unlock a badge
      const eligibleBadges = BADGES.filter(badge => 
        badge.progress < badge.total && badge.progress + 1 >= badge.total
      );
      
      if (eligibleBadges.length > 0) {
        const unlockedBadge = eligibleBadges[Math.floor(Math.random() * eligibleBadges.length)];
        setNewBadgeUnlocked(unlockedBadge.id);
      }
    }
  }, [pointsEarned]);

  useEffect(() => {
    // Animate points counting up
    const duration = 2000;
    const increment = pointsEarned / (duration / 50);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= pointsEarned) {
        setAnimatedPoints(pointsEarned);
        setShowConfetti(true);
        clearInterval(timer);
        
        // Check for badge unlocks
        checkBadgeUnlocks();
        
        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, 50);

    // Hide initial animation after delay
    setTimeout(() => setShowAnimation(false), 3000);

    return () => clearInterval(timer);
  }, [pointsEarned, checkBadgeUnlocks]);

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '⭐', '🏆', '✨', '🎊', '🍔', '🍕', '🍜'][Math.floor(Math.random() * 8)]}
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 p-6 pt-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`text-8xl mb-4 ${showAnimation ? 'animate-bounce' : ''}`}>
            🎉
          </div>
          <h1 className="text-3xl font-bold mb-2 text-primary">
            Snap Saved!
          </h1>
          <p className="text-muted-foreground">
            Great job discovering and sharing {taggingData.restaurantName}!
          </p>
        </div>

        {/* Points Earned */}
        <div className="bg-card rounded-2xl p-6 mb-6 shadow-lg border border-border">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-primary mb-2">
              +{animatedPoints}
            </div>
            <div className="text-lg text-muted-foreground">
              Points Earned
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="space-y-4">
            {pointsBreakdown.map((item, index) => (
              item.points > 0 && (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{item.icon}</span>
                    <div>
                      <span className="font-medium">{item.label}</span>
                      {item.count > 1 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-primary font-semibold">+{item.points}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* New Badge Unlock */}
        {newBadgeUnlocked && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-xl font-bold text-yellow-600 mb-2">Badge Unlocked!</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl mr-2">
                  {BADGES.find(b => b.id === newBadgeUnlocked)?.icon}
                </span>
                <span className="font-semibold">
                  {BADGES.find(b => b.id === newBadgeUnlocked)?.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {BADGES.find(b => b.id === newBadgeUnlocked)?.description}
              </p>
            </div>
          </div>
        )}

        {/* Level Progress */}
        <div className="bg-card rounded-2xl p-6 mb-6 shadow-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-accent mr-2" />
              <span className="font-semibold">Level {currentLevel}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {levelProgress + Math.floor(pointsEarned / 5)}/100 XP
            </span>
          </div>
          
          <Progress 
            value={Math.min(100, levelProgress + (pointsEarned / 5))} 
            className="mb-3 h-3"
          />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {levelProgress + Math.floor(pointsEarned / 5) >= 100 
                ? "🎉 Level up! You're now Level 6!" 
                : `${Math.max(0, 100 - levelProgress - Math.floor(pointsEarned / 5))} XP to next level`
              }
            </p>
          </div>
        </div>

        {/* Badge Progress */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-lg border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-primary mr-2" />
            Badge Progress
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {BADGES.slice(0, 4).map(badge => (
              <div key={badge.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{badge.icon}</span>
                    <span className="text-sm font-medium">{badge.name}</span>
                  </div>
                  {badge.progress >= badge.total && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                
                <Progress 
                  value={(badge.progress / badge.total) * 100} 
                  className="h-2"
                />
                
                <div className="text-xs text-muted-foreground">
                  {badge.progress}/{badge.total} - {badge.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-lg border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 text-primary mr-2" />
            Your Stats
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">847</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">23</div>
              <div className="text-sm text-muted-foreground">Restaurants</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">156</div>
              <div className="text-sm text-muted-foreground">Food Tags</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">34</div>
              <div className="text-sm text-muted-foreground">Snaps Taken</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onTakeAnother}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Camera className="h-4 w-4 mr-2" />
            Snap Another Food
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleContinue}
            className="w-full border-primary text-primary hover:bg-primary/10"
            size="lg"
          >
            <Trophy className="h-4 w-4 mr-2" />
            View My Plate
          </Button>
        </div>
      </div>
    </div>
  );
}