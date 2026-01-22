# SNAP Feature - Implementation Guide & Best Practices

## Quick Start Checklist

```
PHASE 1: FOUNDATION
─────────────────────────────────────────
□ Create src/types/snap.ts
  □ ImageMetadata
  □ CapturedPhoto
  □ SnapTag
  □ SnapCard
  □ SnapFeedCard
  □ WorkflowStep

□ Create src/hooks/useSnapWorkflow.ts
  □ State initialization
  □ Step navigation
  □ Data setters
  □ Reset function

□ Refactor src/components/snap/Snap.tsx
  □ Import useSnapWorkflow
  □ Replace state with hook
  □ Switch on currentStep
  □ Render appropriate step component

□ Create directory structure:
  □ src/components/snap/steps/
  □ src/components/snap/sections/
  □ src/components/snap/dialogs/


PHASE 2: GALLERY UPLOAD
─────────────────────────────────────────
□ Create src/components/snap/sections/GalleryUpload.tsx
  □ File input (accept .jpg, .png, .webp)
  □ Size validation (max 10MB)
  □ Dimension validation
  □ Image preview
  □ Error messages

□ Create ImageMetadata from file
  □ Read as base64
  □ Get file creation date (fallback to now)
  □ Optional: Request geolocation


PHASE 3: CARD FORMATTING
─────────────────────────────────────────
□ Create src/services/snapCardFormatter.ts
  □ formatImageToCard()
  □ optimizeSnapImage()
  □ generateCardId()

□ Create src/components/snap/steps/CardFormattingStep.tsx
  □ Display optimized image
  □ Caption textarea
  □ Live preview
  □ Character counter

□ Create src/services/snapGameification.ts
  □ calculatePoints()
  □ createPointsNotification()


PHASE 4: PUBLISHING
─────────────────────────────────────────
□ Create src/services/snapPublishService.ts
  □ publishToPlate()
  □ publishToFeed()

□ Create src/components/snap/steps/PublishStep.tsx
  □ Radio buttons (Plate / Feed)
  □ Option descriptions
  □ Publish button

□ Create src/components/snap/dialogs/SuccessDialog.tsx
  □ Congrats message
  □ Points breakdown
  □ Share options


PHASE 5: POLISH
─────────────────────────────────────────
□ Add loading states
□ Add error handling
□ Add toast notifications
□ Test entire workflow
□ Performance optimization
```

---

## Type Definitions - Complete Reference

Create `src/types/snap.ts`:

```typescript
/**
 * SNAP Feature Types
 * 
 * Complete type definitions for the SNAP food photography feature,
 * including image metadata, tags, cards, and workflow states.
 */

/**
 * Raw image metadata captured or uploaded
 */
export interface ImageMetadata {
  imageData: string;        // Base64 encoded image data
  latitude: number | null;  // GPS latitude
  longitude: number | null; // GPS longitude
  timestamp: Date;          // When image was taken/uploaded
  accuracy: number | null;  // GPS accuracy in meters
  source: 'camera' | 'gallery';
  fileName?: string;        // Original file name from gallery
}

/**
 * User-added tag with associated points
 */
export interface SnapTag {
  id: string;
  label: string;
  category: 'cuisine' | 'dish' | 'restaurant' | 'ambiance' | 'custom';
  pointValue: number;  // 5, 10, or 15
  iconClass?: string;  // Font Awesome class if applicable
}

/**
 * Formatted card ready for feed display
 */
export interface SnapCard {
  id: string;
  imageUrl: string;           // Processed/optimized image URL or data URL
  imageData: string;          // Original base64 (for fallback)
  caption: string;
  tags: SnapTag[];
  pointsEarned: number;
  author: {
    userId: string;
    displayName: string;
    avatar: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;          // Optional: reverse geocoded address
  };
  createdAt: Date;
  publishedTo: 'plate' | 'feed';
  metadata?: {
    // Additional metadata for future features
    contentModeration?: boolean;
    aiTags?: string[];         // AI-detected tags
    imageQualityScore?: number; // 0-100
  };
}

/**
 * SnapCard transformed to FeedCard format
 */
export interface SnapFeedCard extends BaseFeedCard {
  type: 'snap';
  saveCategory: 'Posts';
  imageUrl: string;
  caption: string;
  author: string;
  authorImage: string;
  authorId: string;
  pointsEarned: number;
  tags: string[];
  views?: number;
  likes?: number;
}

/**
 * Workflow step types
 */
export type WorkflowStep = 'input' | 'tag' | 'format' | 'publish' | 'success';

/**
 * Workflow state
 */
export interface SnapWorkflowState {
  // Image input
  imageSource: 'camera' | 'gallery' | null;
  imageMetadata: ImageMetadata | null;
  
  // Tagging
  tags: SnapTag[];
  pointsEarned: number;
  
  // Card
  cardPreview: SnapCard | null;
  
  // Publishing
  publishTarget: 'plate' | 'feed' | null;
  isPublished: boolean;
  publishedCardId?: string;
  
  // Flow control
  currentStep: WorkflowStep;
  isLoading: boolean;
  error: string | null;
}

/**
 * Notification for points display
 */
export interface PointsNotification {
  title: string;
  description: string;
  icon: string;
  pointValue: number;
}

/**
 * For tracking user points
 */
export interface UserSnapStats {
  totalSnaps: number;
  totalPointsEarned: number;
  averagePointsPerSnap: number;
  lastSnapDate: Date | null;
  mostUsedTag?: string;
}
```

---

## Hook Implementation - Template

Create `src/hooks/useSnapWorkflow.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';
import type {
  SnapWorkflowState,
  ImageMetadata,
  SnapTag,
  SnapCard,
  WorkflowStep
} from '../types/snap';

const initialState: SnapWorkflowState = {
  imageSource: null,
  imageMetadata: null,
  tags: [],
  pointsEarned: 0,
  cardPreview: null,
  publishTarget: null,
  isPublished: false,
  currentStep: 'input',
  isLoading: false,
  error: null
};

export function useSnapWorkflow() {
  const [state, setState] = useState<SnapWorkflowState>(initialState);
  const historyRef = useRef<WorkflowStep[]>([]);

  // Setters
  const setImageMetadata = useCallback((metadata: ImageMetadata) => {
    setState(prev => ({
      ...prev,
      imageMetadata: metadata,
      imageSource: metadata.source
    }));
  }, []);

  const setTags = useCallback((tags: SnapTag[]) => {
    const pointsEarned = tags.reduce((total, tag) => total + tag.pointValue, 0);
    setState(prev => ({
      ...prev,
      tags,
      pointsEarned
    }));
  }, []);

  const setCardPreview = useCallback((card: SnapCard) => {
    setState(prev => ({
      ...prev,
      cardPreview: card
    }));
  }, []);

  const updateCardCaption = useCallback((caption: string) => {
    setState(prev => {
      if (!prev.cardPreview) return prev;
      return {
        ...prev,
        cardPreview: {
          ...prev.cardPreview,
          caption
        }
      };
    });
  }, []);

  const setPublishTarget = useCallback((target: 'plate' | 'feed') => {
    setState(prev => ({
      ...prev,
      publishTarget: target
    }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    setState(prev => {
      const steps: WorkflowStep[] = ['input', 'tag', 'format', 'publish', 'success'];
      const currentIndex = steps.indexOf(prev.currentStep);
      
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        historyRef.current.push(nextStep);
        return {
          ...prev,
          currentStep: nextStep,
          error: null // Clear errors on step change
        };
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      const steps: WorkflowStep[] = ['input', 'tag', 'format', 'publish', 'success'];
      const currentIndex = steps.indexOf(prev.currentStep);
      
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1];
        historyRef.current = historyRef.current.slice(0, -1);
        return {
          ...prev,
          currentStep: prevStep,
          error: null // Clear errors on step change
        };
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    historyRef.current = [];
  }, []);

  // Publishing
  const publish = useCallback(async (userId: string, target: 'plate' | 'feed') => {
    if (!state.cardPreview) {
      setState(prev => ({ ...prev, error: 'No card to publish' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Dynamically import service (avoid circular deps)
      const { snapPublishService } = await import('../services/snapPublishService');
      
      let result;
      if (target === 'plate') {
        result = await snapPublishService.publishToPlate(state.cardPreview, userId);
      } else {
        result = await snapPublishService.publishToFeed(state.cardPreview, userId);
      }

      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Publication failed'
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isPublished: true,
        publishTarget: target,
        publishedCardId: result.postId || result.feedCardId,
        currentStep: 'success'
      }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      return false;
    }
  }, [state.cardPreview]);

  // Expose state directly and actions
  return {
    ...state,
    
    // Setters
    setImageMetadata,
    setTags,
    setCardPreview,
    updateCardCaption,
    setPublishTarget,
    
    // Navigation
    nextStep,
    prevStep,
    reset,
    
    // Publishing
    publish,
    
    // Utility
    canGoBack: () => state.currentStep !== 'input',
    canGoForward: () => state.currentStep !== 'success',
    stepProgress: () => {
      const steps = ['input', 'tag', 'format', 'publish', 'success'];
      return {
        current: steps.indexOf(state.currentStep) + 1,
        total: steps.length
      };
    }
  };
}
```

---

## Service Examples

### snapCardFormatter.ts

```typescript
import type { ImageMetadata, SnapTag, SnapCard } from '../types/snap';
import { User } from '@supabase/supabase-js';
import { imageOptimizer } from './imageOptimizer';

export const snapCardFormatter = {
  /**
   * Convert raw image data + metadata + tags into a formatted SnapCard
   */
  async formatImageToCard(
    imageData: string,
    metadata: ImageMetadata,
    tags: SnapTag[],
    caption: string,
    user: User
  ): Promise<SnapCard> {
    // 1. Optimize image
    const optimizedImageUrl = await this.optimizeSnapImage(imageData);

    // 2. Generate unique ID
    const cardId = this.generateCardId();

    // 3. Calculate points
    const pointsEarned = tags.reduce((total, tag) => total + tag.pointValue, 0);

    // 4. Create card
    const card: SnapCard = {
      id: cardId,
      imageUrl: optimizedImageUrl,
      imageData, // Keep original as fallback
      caption,
      tags,
      pointsEarned,
      author: {
        userId: user.id,
        displayName: user.user_metadata?.full_name || user.email || 'Anonymous',
        avatar: user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'
      },
      location:
        metadata.latitude && metadata.longitude
          ? {
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              address: metadata.fileName // Could be reverse geocoded later
            }
          : undefined,
      createdAt: new Date(),
      publishedTo: 'plate'
    };

    return card;
  },

  /**
   * Optimize image: resize, crop, compress
   */
  async optimizeSnapImage(
    base64: string,
    width: number = 600,
    height: number = 600,
    quality: number = 85
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Center-crop to maintain aspect ratio
          const imgRatio = img.width / img.height;
          const canvasRatio = width / height;

          let sx = 0,
            sy = 0,
            sw = img.width,
            sh = img.height;

          if (imgRatio > canvasRatio) {
            // Image is wider, crop width
            sw = img.height * canvasRatio;
            sx = (img.width - sw) / 2;
          } else {
            // Image is taller, crop height
            sh = img.width / canvasRatio;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

          // Convert to WebP for better compression
          // Fallback to PNG if WebP not supported
          try {
            resolve(canvas.toDataURL('image/webp', quality / 100));
          } catch {
            resolve(canvas.toDataURL('image/png'));
          }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64;
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Generate unique card ID
   */
  generateCardId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `snap-${timestamp}-${random}`;
  }
};
```

### snapGameification.ts

```typescript
import type { SnapTag, PointsNotification } from '../types/snap';

const TAG_POINT_VALUES = {
  cuisine: 10,
  dish: 10,
  restaurant: 5,
  ambiance: 5,
  custom: 5
} as const;

export const snapGameification = {
  /**
   * Calculate total points for tags
   */
  calculatePoints(tags: SnapTag[]): number {
    return tags.reduce((total, tag) => total + tag.pointValue, 0);
  },

  /**
   * Get point value for a category
   */
  getPointsForCategory(category: SnapTag['category']): number {
    return TAG_POINT_VALUES[category] || 5;
  },

  /**
   * Create human-readable points notification
   */
  createPointsNotification(pointsEarned: number, tags: SnapTag[]): PointsNotification {
    const breakdown = tags.map(t => `${t.label} (+${t.pointValue})`).join(', ');

    return {
      title: `🏆 +${pointsEarned} Points Earned!`,
      description: `Tags: ${breakdown}`,
      icon: 'award',
      pointValue: pointsEarned
    };
  },

  /**
   * Adjust point values based on content quality/engagement
   * (Future: AI moderation, duplicate detection)
   */
  adjustPointsBasedOnQuality(basePoints: number, qualityScore: number): number {
    // qualityScore: 0-100
    // Multiply points by quality factor (0.5x to 1.5x)
    const factor = 0.5 + qualityScore / 100;
    return Math.round(basePoints * factor);
  }
};
```

### snapPublishService.ts

```typescript
import type { SnapCard } from '../types/snap';
import { PlateGateway } from './plateGateway';
import { supabase } from './supabase/client';

export const snapPublishService = {
  /**
   * Publish to Plate (private user profile)
   */
  async publishToPlate(
    card: SnapCard,
    userId: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const plateGateway = new PlateGateway(userId);

      const result = await plateGateway.savePost({
        content: card.caption,
        image: card.imageUrl,
        metadata: {
          snapCardId: card.id,
          pointsEarned: card.pointsEarned,
          tags: card.tags.map(t => t.label),
          location: card.location,
          type: 'snap',
          source: 'snap_feature'
        }
      });

      return {
        success: result.success,
        postId: result.post?.id,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Plate'
      };
    }
  },

  /**
   * Publish to Feed (public, shareable)
   */
  async publishToFeed(
    card: SnapCard,
    userId: string
  ): Promise<{ success: boolean; feedCardId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('feed_posts')
        .insert({
          id: card.id,
          user_id: userId,
          image_url: card.imageUrl,
          caption: card.caption,
          tags: card.tags.map(t => t.label),
          points_earned: card.pointsEarned,
          location: card.location
            ? JSON.stringify({
                latitude: card.location.latitude,
                longitude: card.location.longitude
              })
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Award points to user
      await this.awardPointsToUser(userId, card.pointsEarned);

      return {
        success: true,
        feedCardId: data?.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Feed'
      };
    }
  },

  /**
   * Award points to user's profile
   */
  private async awardPointsToUser(userId: string, points: number): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('snap_points')
        .eq('id', userId)
        .single();

      const currentPoints = user?.snap_points || 0;

      await supabase
        .from('users')
        .update({ snap_points: currentPoints + points })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to award points:', error);
      // Don't throw - publishing should succeed even if points fail
    }
  }
};
```

---

## Component Template: Step Component

```typescript
// src/components/snap/steps/ExampleStep.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { MinimalHeader } from '../../common/MinimalHeader';

interface ExampleStepProps {
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function ExampleStep({ onNext, onBack, onCancel }: ExampleStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      // Do work
      onNext();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen">
      <MinimalHeader
        title="Step Title"
        showBack={true}
        onBack={onBack}
      />

      <div className="px-5 py-6 space-y-6">
        {/* Content here */}
      </div>

      {/* Footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4 space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Continue'}
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (Jest)
- Point calculation logic
- Image optimization (mock canvas)
- Card ID generation
- Data transformation functions

### Integration Tests
- Hook state transitions
- Component step navigation
- Publishing workflow
- Error handling

### E2E Tests (Playwright)
- Complete workflow: Image → Tags → Card → Publish
- Gallery upload flow
- Camera capture flow
- Success dialog interactions

---

## Performance Optimization Tips

```typescript
// 1. Memoize expensive calculations
const pointsEarned = useMemo(
  () => calculatePoints(tags),
  [tags]
);

// 2. Debounce form inputs
const handleCaptionChange = useDebouncedCallback(
  (text: string) => {
    updateCaption(text);
  },
  300
);

// 3. Optimize image in background
const optimizeImageAsync = useCallback(async () => {
  // This doesn't block UI
  const optimized = await formatImageToCard(...);
  setCardPreview(optimized);
}, [imageData, tags]);

// 4. Use requestIdleCallback for non-critical work
useEffect(() => {
  requestIdleCallback(() => {
    // Log analytics, pre-cache images, etc.
  });
}, [cardPreview]);
```

---

## Debugging Checklist

```
□ Check MOCK_CAMERA_MODE flag
□ Verify geolocation permissions
□ Test with different image sizes
□ Verify Supabase credentials
□ Check PlateGateway URL
□ Verify feed_posts table schema
□ Test error states
□ Check loading states
□ Verify toast notifications
□ Test on mobile device
□ Test network failures
```

---

