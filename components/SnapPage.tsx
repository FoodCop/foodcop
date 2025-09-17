import React, { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { CameraView } from './snap/CameraView';
import { TaggingView } from './snap/TaggingView';
import { GamificationFeedback } from './snap/GamificationFeedback';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface TaggingData {
  restaurantName: string;
  rating: number;
  foodTags: string[];
  additionalTags: string[];
  review: string;
  priceRange: string;
}

interface SnapPageProps {
  onNavigateToFeed?: () => void;
  onNavigateToScout?: () => void;
  onNavigateToRecipes?: () => void;
}

export function SnapPage({
  onNavigateToFeed,
  onNavigateToScout,
  onNavigateToRecipes
}: SnapPageProps = {}) {
  const [currentScreen, setCurrentScreen] = useState<'camera' | 'tagging' | 'gamification'>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [taggingData, setTaggingData] = useState<TaggingData | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [activeTab, setActiveTab] = useState("snap");

  const handleTabChange = (tab: string) => {
    if (tab === "feed" && onNavigateToFeed) {
      onNavigateToFeed();
    } else if (tab === "scout" && onNavigateToScout) {
      onNavigateToScout();
    } else if (tab === "bites" && onNavigateToRecipes) {
      onNavigateToRecipes();
    } else {
      setActiveTab(tab);
    }
  };

  const handlePhotoCapture = (photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
    setCurrentScreen('tagging');
  };

  const handleTaggingComplete = (data: TaggingData) => {
    setTaggingData(data);
    
    // Calculate points
    let points = 0;
    points += data.foodTags.length * 5; // 5 points per food tag
    points += data.additionalTags.length * 5; // 5 points per additional tag
    if (data.review.trim()) points += 20; // 20 points for review
    points += 10; // 10 points for new restaurant
    
    setPointsEarned(points);
    setCurrentScreen('gamification');
  };

  const handleGamificationComplete = () => {
    // Reset to camera for next photo
    setCapturedPhoto(null);
    setTaggingData(null);
    setPointsEarned(0);
    setCurrentScreen('camera');
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setCurrentScreen('camera');
  };

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'camera' && (
        <CameraView onPhotoCapture={handlePhotoCapture} />
      )}
      
      {currentScreen === 'tagging' && capturedPhoto && (
        <TaggingView
          photo={capturedPhoto}
          onComplete={handleTaggingComplete}
          onRetake={handleRetakePhoto}
        />
      )}
      
      {currentScreen === 'gamification' && (
        <GamificationFeedback
          pointsEarned={pointsEarned}
          taggingData={taggingData!}
          onComplete={handleGamificationComplete}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
