'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraView } from './CameraView';
import { TaggingView } from './TaggingView';
import { GamificationFeedback } from './GamificationFeedback';
import { SnapErrorBoundary } from './SnapErrorBoundary';
import { toast } from 'sonner';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  imageBlob: Blob;
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
  visitDate: Date;
}

type SnapStep = 'camera' | 'tagging' | 'gamification';

export function SnapContainer() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SnapStep>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [taggingData, setTaggingData] = useState<TaggingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedSnapId, setSavedSnapId] = useState<string | null>(null);

  // Component mount effect for initialization
  React.useEffect(() => {
    // Component mounted and ready
  }, []);

  const handlePhotoCapture = (photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
    setCurrentStep('tagging');
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setSavedSnapId(null);
    setCurrentStep('camera');
  };

  const calculatePoints = (data: TaggingData): number => {
    let points = 0;
    points += data.foodTags.length * 5; // 5 points per food tag
    points += data.additionalTags.length * 3; // 3 points per additional tag
    points += data.review.trim() ? 20 : 0; // 20 points for review
    points += data.rating > 0 ? 10 : 0; // 10 points for rating
    points += 15; // 15 base points for taking photo
    return points;
  };

  const handleTaggingComplete = async (data: TaggingData) => {
    if (!capturedPhoto) return;

    setIsProcessing(true);
    setTaggingData(data);

    try {
      // Calculate points first
      const points = calculatePoints(data);
      
      // Try to upload photo and save metadata
      const result = await saveSnapToPlate(capturedPhoto, data);
      
      if (result.success) {
        // Save the snap ID for save to plate functionality
        setSavedSnapId(result.data?.id);
        
        // Show gamification feedback
        setCurrentStep('gamification');
        
        // Try to update user points in backend (optional)
        try {
          await updateUserPoints(points, data);
        } catch (pointsError) {
          console.error('Points update failed:', pointsError);
          // Don't block the user experience for points update failure
        }
      } else {
        // If auth failed, still show demo experience but with a warning
        if (result.error?.includes('sign in') || result.error?.includes('Authentication')) {
          toast.error('Demo mode: Sign in to save permanently');
          setCurrentStep('gamification'); // Still show the gamification feedback
        } else {
          toast.error(result.error || 'Failed to save snap');
        }
      }
    } catch (error) {
      console.error('Error saving snap:', error);
      toast.error('Demo mode: Sign in to save permanently');
      // Still allow users to see the gamification feedback in demo mode
      setCurrentStep('gamification');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSnapToPlate = async (photo: CapturedPhoto, data: TaggingData) => {
    try {
      // Validate the blob
      if (!photo.imageBlob || !(photo.imageBlob instanceof Blob)) {
        throw new Error('Invalid image data - blob is missing or not a valid Blob object');
      }

      // Convert blob to base64 for upload
      const base64 = await blobToBase64(photo.imageBlob);
      
      const response = await fetch('/api/snap-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          filename: `snap_${photo.id}.jpg`,
          metadata: {
            restaurantName: data.restaurantName,
            rating: data.rating,
            foodTags: data.foodTags,
            additionalTags: data.additionalTags,
            review: data.review,
            priceRange: data.priceRange,
            visitDate: data.visitDate.toISOString(),
            capturedAt: photo.timestamp.toISOString(),
            location: photo.location || null // Include GPS coordinates and address if available
          }
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', result);
        return { success: false, error: result.error || 'Failed to save snap' };
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading snap:', error);
      return { success: false, error: 'Upload failed' };
    }
  };

  const updateUserPoints = async (points: number, data: TaggingData) => {
    try {
      await fetch('/api/user/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
          activity: 'snap_created',
          metadata: {
            restaurantName: data.restaurantName,
            foodTags: data.foodTags.length,
            additionalTags: data.additionalTags.length,
            hasReview: !!data.review.trim(),
            rating: data.rating
          }
        }),
      });
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!blob || !(blob instanceof Blob)) {
        reject(new Error('Invalid blob provided to blobToBase64'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to read blob as data URL'));
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader error occurred'));
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleGamificationComplete = () => {
    router.push('/plate?tab=photos');
  };

  const handleTakeAnother = () => {
    setCapturedPhoto(null);
    setTaggingData(null);
    setSavedSnapId(null);
    setCurrentStep('camera');
  };

  const handleClose = () => {
    router.back();
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Saving Your Snap</h2>
          <p className="text-muted-foreground">
            Adding to your plate and calculating points...
          </p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'camera':
        return (
          <CameraView 
            onPhotoCapture={handlePhotoCapture}
            onClose={handleClose}
          />
        );
      
      case 'tagging':
        return capturedPhoto ? (
          <TaggingView 
            photo={capturedPhoto}
            onComplete={handleTaggingComplete}
            onRetake={handleRetakePhoto}
            snapId={savedSnapId || undefined}
          />
        ) : null;
      
      case 'gamification':
        return (capturedPhoto && taggingData) ? (
          <GamificationFeedback 
            pointsEarned={calculatePoints(taggingData)}
            taggingData={taggingData}
            onComplete={handleGamificationComplete}
            onTakeAnother={handleTakeAnother}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <SnapErrorBoundary>
      {renderStep()}
    </SnapErrorBoundary>
  );
}