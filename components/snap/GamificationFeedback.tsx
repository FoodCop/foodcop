import React, { useState, useEffect } from 'react';
import { Star, Trophy, Zap, Target, Camera } from 'lucide-react';
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
}

interface GamificationFeedbackProps {
  pointsEarned: number;
  taggingData: TaggingData;
  onComplete: () => void;
}

const BADGES = [
  { 
    id: 'explorer', 
    name: 'Explorer', 
    icon: '🗺️', 
    description: 'Discover new restaurants',
    requirement: 'Visit 5 different restaurants',
    progress: 3,
    total: 5
  },
  { 
    id: 'tag_master', 
    name: 'Tag Master', 
    icon: '🏷️', 
    description: 'Master of detailed tagging',
    requirement: 'Add 50 food tags',
    progress: 42,
    total: 50
  },
  { 
    id: 'food_critic', 
    name: 'Food Critic', 
    icon: '✍️', 
    description: 'Share thoughtful reviews',
    requirement: 'Write 10 reviews',
    progress: 7,
    total: 10
  },
  { 
    id: 'master_taster', 
    name: 'Master Taster', 
    icon: '👨‍🍳', 
    description: 'Ultimate food connoisseur',
    requirement: 'Reach 1000 points',
    progress: 650,
    total: 1000
  }
];

export function GamificationFeedback({ pointsEarned, taggingData, onComplete }: GamificationFeedbackProps) {
  const [showAnimation, setShowAnimation] = useState(true);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(5);
  const [levelProgress, setLevelProgress] = useState(75);

  // Calculate points breakdown
  const pointsBreakdown = [
    { label: 'Food Tags', points: taggingData.foodTags.length * 5, count: taggingData.foodTags.length },
    { label: 'Additional Tags', points: taggingData.additionalTags.length * 5, count: taggingData.additionalTags.length },
    { label: 'Review Bonus', points: taggingData.review.trim() ? 20 : 0, count: taggingData.review.trim() ? 1 : 0 },
    { label: 'New Restaurant', points: 10, count: 1 }
  ];

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
        
        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, 50);

    // Hide initial animation after delay
    setTimeout(() => setShowAnimation(false), 3000);

    return () => clearInterval(timer);
  }, [pointsEarned]);

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '⭐', '🏆', '✨', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 p-6 pt-16">
        {/* Tako Mascot Celebration */}
        <div className="text-center mb-8">
          <div className={`text-8xl mb-4 ${showAnimation ? 'animate-bounce' : ''}`}>
            🐙
          </div>
          <h1 className="text-2xl mb-2 text-primary">
            Fantastic Snap!
          </h1>
          <p className="text-muted-foreground">
            Tako is proud of your food discovery!
          </p>
        </div>

        {/* Points Earned */}
        <div className="bg-card rounded-2xl p-6 mb-6 shadow-lg border border-border">
          <div className="text-center mb-4">
            <div className="text-4xl text-primary mb-2">
              +{animatedPoints}
            </div>
            <div className="text-sm text-muted-foreground">
              Points Earned
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="space-y-3">
            {pointsBreakdown.map((item, index) => (
              item.points > 0 && (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    <span>{item.label}</span>
                    {item.count > 1 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </div>
                  <span className="text-primary">+{item.points}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-card rounded-2xl p-6 mb-6 shadow-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-accent mr-2" />
              <span>Level {currentLevel}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {levelProgress}/100 XP
            </span>
          </div>
          
          <Progress 
            value={levelProgress + (pointsEarned / 5)} 
            className="mb-3 h-3"
          />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {levelProgress + (pointsEarned / 5) >= 100 
                ? "🎉 Level up! You're now Level 6!" 
                : `${100 - levelProgress - Math.floor(pointsEarned / 5)} XP to next level`
              }
            </p>
          </div>
        </div>

        {/* Badges Progress */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-lg border border-border">
          <h3 className="text-lg mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-primary mr-2" />
            Badge Progress
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {BADGES.map(badge => (
              <div key={badge.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{badge.icon}</span>
                    <span className="text-sm">{badge.name}</span>
                  </div>
                  {badge.progress >= badge.total && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Unlocked!
                    </Badge>
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
          <h3 className="text-lg mb-4 flex items-center">
            <Target className="h-5 w-5 text-primary mr-2" />
            Your Stats
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl text-primary">847</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-2xl text-primary">23</div>
              <div className="text-sm text-muted-foreground">Restaurants</div>
            </div>
            <div>
              <div className="text-2xl text-primary">156</div>
              <div className="text-sm text-muted-foreground">Tags Added</div>
            </div>
            <div>
              <div className="text-2xl text-primary">12</div>
              <div className="text-sm text-muted-foreground">Reviews</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleContinue}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Camera className="h-4 w-4 mr-2" />
            Snap Another Food
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {/* Navigate to profile */}}
            className="w-full border-primary text-primary hover:bg-primary/10"
            size="lg"
          >
            <Trophy className="h-4 w-4 mr-2" />
            View Profile & Badges
          </Button>
        </div>
      </div>
    </div>
  );
}
