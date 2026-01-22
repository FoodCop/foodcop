# SNAP Feature - Complete Architecture & Solution

**Date:** January 15, 2026  
**Status:** Design Phase  
**Complexity Level:** High - Multi-stage flow with gamification, format conversion, and dual-path publishing

---

## Executive Summary

The SNAP feature is a sophisticated food photography tool that transforms casual food photos into shareable feed content. The workflow is complex because it involves:

1. **Dual image input** (camera capture OR gallery upload)
2. **Location metadata** capture
3. **Tag-based gamification** (points system)
4. **Card formatting** (convert raw image into feed-ready card)
5. **Dual publishing paths** (save to Plate OR publish to Feed)
6. **Database integration** (Supabase for persistence)

This document provides the architectural solution to keep this complexity manageable and maintainable.

---

## Current State Analysis

### ✅ Implemented Features
- Camera capture with geolocation tracking
- Photo preview with metadata overlay (timestamp, location indicator)
- Restaurant/cuisine tagging form
- Basic save to Plate functionality
- Mock mode for testing

### ❌ Missing Features
- Gallery/file upload functionality
- Card formatting & preview before publishing
- Points/gamification feedback
- Dual publishing workflow (Plate → Feed)
- Success state with sharing options
- Image crop/rotate tools

---

## Proposed Architecture

### 1. **State Management Layer**
Use a custom hook `useSnapWorkflow` to manage the complex multi-step process:

```typescript
// src/hooks/useSnapWorkflow.ts
interface SnapWorkflowState {
  // Image input
  imageSource: 'camera' | 'gallery' | null;
  rawImage: string | null;  // Base64 data
  imageMetadata: ImageMetadata;
  
  // Tagging & metadata
  tags: SnapTag[];  // User-added tags
  pointsEarned: number;
  
  // Card formatting
  cardPreview: SnapCard | null;  // Formatted for feed
  
  // Publishing
  publishTarget: 'plate' | 'feed' | null;
  isPublished: boolean;
  
  // Flow control
  currentStep: 'input' | 'tag' | 'format' | 'publish' | 'success';
}
```

**Benefits:**
- Single source of truth for entire workflow
- Easy to save/restore workflow state
- Prevents state inconsistency across components
- Makes debugging easier

---

### 2. **Component Structure**

Break down the monolithic `Snap.tsx` into focused sub-components:

```
src/components/snap/
├── Snap.tsx                           # Main orchestrator component
├── steps/
│   ├── ImageInputStep.tsx            # Camera OR gallery upload
│   ├── TaggingStep.tsx               # Add tags, earn points
│   ├── CardFormattingStep.tsx        # Preview card, add caption
│   └── PublishStep.tsx               # Choose Plate or Feed
├── sections/
│   ├── CameraCapture.tsx             # Camera functionality
│   ├── GalleryUpload.tsx             # File upload & preview
│   └── CardPreview.tsx               # Shows formatted card
├── dialogs/
│   ├── DisclaimerDialog.tsx          # Food photo guidelines
│   └── SuccessDialog.tsx             # Congrats + sharing options
└── utils/
    ├── snapCardFormatter.ts          # Converts raw image → SnapCard
    ├── snapGameification.ts          # Tag-based point calculation
    └── snapPostService.ts            # Backend integration
```

**Benefits:**
- Each component has single responsibility
- Easier to test individual steps
- Reusable sub-components
- Clear data flow

---

### 3. **Data Models & Types**

```typescript
// src/types/snap.ts

/** Raw image data captured/uploaded */
export interface ImageMetadata {
  imageData: string;        // Base64 encoded
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  accuracy: number | null;
  source: 'camera' | 'gallery';
  fileName?: string;
}

/** User-added tags with point values */
export interface SnapTag {
  id: string;
  label: string;
  category: 'cuisine' | 'restaurant' | 'dish' | 'ambiance' | 'custom';
  pointValue: number;  // 5, 10, or 15 points
}

/** Formatted card ready for feed */
export interface SnapCard {
  id: string;
  imageUrl: string;        // Processed/optimized
  imageData: string;       // Original base64
  caption: string;         // User-added caption
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
    address?: string;
  };
  createdAt: Date;
  publishedTo: 'plate' | 'feed';
}

/** Unified feed card (matches FeedCard structure) */
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
```

---

### 4. **Gamification System**

Tag-based point calculation:

```typescript
// src/services/snapGameification.ts

const TAG_POINT_VALUES = {
  cuisine: 10,      // 'Italian', 'Japanese', etc.
  dish: 10,         // 'Pasta', 'Sushi', etc.
  restaurant: 5,    // Restaurant name
  ambiance: 5,      // 'cozy', 'modern', etc.
  custom: 5         // User-defined tags
};

export function calculatePoints(tags: SnapTag[]): number {
  return tags.reduce((total, tag) => total + tag.pointValue, 0);
}

export function createPointsNotification(
  pointsEarned: number,
  tags: SnapTag[]
): {
  title: string;
  description: string;
  icon: string;
} {
  const breakdown = tags
    .map(t => `${t.label} (+${t.pointValue})`)
    .join(', ');
  
  return {
    title: `🎉 +${pointsEarned} Points Earned!`,
    description: `Tags: ${breakdown}`,
    icon: 'award'
  };
}
```

**Flow:**
1. User selects tags → points calculated
2. Show points notification at tagging step
3. Display total at card preview
4. Award actual points on successful publish

---

### 5. **Card Formatting Service**

```typescript
// src/services/snapCardFormatter.ts

export async function formatImageToCard(
  imageData: string,
  metadata: ImageMetadata,
  tags: SnapTag[],
  caption: string,
  user: User
): Promise<SnapCard> {
  
  // 1. Optimize image for feed display
  const optimizedImageUrl = await optimizeSnapImage(imageData);
  
  // 2. Generate unique ID
  const cardId = `snap-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  // 3. Calculate points
  const pointsEarned = calculatePoints(tags);
  
  // 4. Format as SnapCard
  const card: SnapCard = {
    id: cardId,
    imageUrl: optimizedImageUrl,
    imageData,
    caption,
    tags,
    pointsEarned,
    author: {
      userId: user.id,
      displayName: user.user_metadata?.full_name || user.email,
      avatar: user.user_metadata?.avatar_url || ''
    },
    location: metadata.latitude && metadata.longitude
      ? { latitude: metadata.latitude, longitude: metadata.longitude }
      : undefined,
    createdAt: new Date(),
    publishedTo: 'plate'
  };
  
  return card;
}

async function optimizeSnapImage(
  base64: string,
  width: number = 600,
  height: number = 600,
  quality: number = 85
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      // Center-crop image to maintain aspect ratio
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      
      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }
      
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality / 100));
    };
    img.src = base64;
  });
}
```

**Benefits:**
- Consistent card format across all snaps
- Optimized images for feed performance
- Generates unique IDs
- Centralizes image processing logic

---

### 6. **Publishing Service**

```typescript
// src/services/snapPublishService.ts

export async function publishToPlate(
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
        type: 'snap'
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
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function publishToFeed(
  card: SnapCard,
  userId: string
): Promise<{ success: boolean; feedCardId?: string; error?: string }> {
  try {
    // Convert SnapCard to FeedCard format
    const feedCard: SnapFeedCard = {
      id: card.id,
      type: 'snap',
      saveCategory: 'Posts',
      imageUrl: card.imageUrl,
      caption: card.caption,
      author: card.author.displayName,
      authorImage: card.author.avatar,
      authorId: card.author.userId,
      pointsEarned: card.pointsEarned,
      tags: card.tags.map(t => t.label),
      views: 0,
      likes: 0
    };
    
    // Save to feed_posts table
    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        id: feedCard.id,
        user_id: userId,
        image_url: feedCard.imageUrl,
        caption: feedCard.caption,
        tags: feedCard.tags,
        points_earned: feedCard.pointsEarned,
        location: card.location,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      feedCardId: data?.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

---

### 7. **Main Workflow Component**

```typescript
// src/components/snap/Snap.tsx (refactored)

export function Snap() {
  const { user } = useAuth();
  const workflow = useSnapWorkflow();
  
  // Show appropriate step
  switch (workflow.currentStep) {
    case 'input':
      return (
        <>
          <DisclaimerDialog 
            onContinue={() => workflow.nextStep()}
            onClose={() => workflow.reset()}
          />
          <ImageInputStep 
            onImageSelected={(metadata) => {
              workflow.setImageMetadata(metadata);
              workflow.nextStep();
            }}
            onCancel={() => workflow.reset()}
          />
        </>
      );
    
    case 'tag':
      return (
        <TaggingStep
          imageUrl={workflow.imageMetadata?.imageData!}
          onTagsSelected={(tags) => {
            workflow.setTags(tags);
            workflow.nextStep();
          }}
          onBack={() => workflow.prevStep()}
          onCancel={() => workflow.reset()}
        />
      );
    
    case 'format':
      return (
        <CardFormattingStep
          card={workflow.cardPreview!}
          onCaptionChanged={(caption) => {
            workflow.updateCardCaption(caption);
          }}
          onPublish={() => workflow.nextStep()}
          onBack={() => workflow.prevStep()}
          onCancel={() => workflow.reset()}
        />
      );
    
    case 'publish':
      return (
        <PublishStep
          card={workflow.cardPreview!}
          onPublish={async (target) => {
            const success = await workflow.publish(user!.id, target);
            if (success) workflow.nextStep();
          }}
          onBack={() => workflow.prevStep()}
          onCancel={() => workflow.reset()}
        />
      );
    
    case 'success':
      return (
        <SuccessDialog
          card={workflow.cardPreview!}
          pointsEarned={workflow.cardPreview!.pointsEarned}
          onViewInPlate={() => {
            // Navigate to plate
            workflow.reset();
          }}
          onShareToFeed={() => {
            // Optionally publish to feed
            workflow.reset();
          }}
        />
      );
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (2-3 hours)
- [ ] Create type definitions (`src/types/snap.ts`)
- [ ] Create `useSnapWorkflow` hook
- [ ] Refactor `Snap.tsx` into step components
- [ ] Extract current tagging logic into `TaggingStep`

### Phase 2: Gallery Upload (1-2 hours)
- [ ] Create `GalleryUpload.tsx` component
- [ ] File input with validation (size, format)
- [ ] Image preview with crop/rotate tools
- [ ] Integrate with workflow

### Phase 3: Card Formatting (2-3 hours)
- [ ] Create `snapCardFormatter.ts` service
- [ ] Create `CardFormattingStep.tsx` component
- [ ] Image optimization logic
- [ ] Caption input + preview

### Phase 4: Gamification (1 hour)
- [ ] Create `snapGameification.ts` service
- [ ] Integrate point calculation
- [ ] Display point notifications
- [ ] Add point indicators to success screen

### Phase 5: Publishing (2-3 hours)
- [ ] Create `snapPublishService.ts`
- [ ] Create `PublishStep.tsx` component
- [ ] Dual-path publishing (Plate → Feed)
- [ ] Success state with share options

### Phase 6: Polish & Testing (2-3 hours)
- [ ] Loading states during uploads
- [ ] Error handling & retry logic
- [ ] Toast notifications for each step
- [ ] E2E testing of entire workflow

---

## Data Flow Diagram

```
User Input
├─→ Camera/Gallery
│   └─→ ImageMetadata (base64, geo, timestamp)
│
└─→ Select Tags
    └─→ Calculate Points
        └─→ Format Card
            ├─ Optimize Image
            ├─ Add Caption
            └─ Create SnapCard
                └─→ Choose Publish Target
                    ├─→ Plate (saved to user profile)
                    │   └─→ Success Screen
                    └─→ Feed (public, points awarded)
                        └─→ Success Screen + Share Options
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `useSnapWorkflow` hook | Decouples state from UI, makes testing easier |
| Component-based steps | Each step is testable, reusable, clear |
| Card formatting layer | Guarantees consistency, enables image optimization |
| Gamification service | Centralized point logic, easy to adjust values |
| Dual publishing paths | Users have control, Plate is permanent, Feed is share |
| Base64 → optimized URL | Performance, WebP format, consistent sizing |

---

## Error Handling Strategy

```typescript
// At each step:
// 1. Validate input
// 2. Attempt operation with try/catch
// 3. Provide user-friendly error toast
// 4. Allow retry or cancel

const handlePublish = async () => {
  try {
    setLoading(true);
    const result = await publishToFeed(card, userId);
    
    if (!result.success) {
      toast.error(result.error || 'Failed to publish');
      return;
    }
    
    toast.success('Published to feed!');
    workflow.nextStep();
  } catch (error) {
    toast.error('An error occurred. Please try again.');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

---

## Success Metrics

- ✅ Workflow completion rate (% of users finishing publish)
- ✅ Average points earned per post
- ✅ Feed engagement from snap posts
- ✅ Image optimization (performance)
- ✅ Error rate during publishing

---

## Next Steps

1. **Review & discuss** this architecture with team
2. **Start Phase 1**: Create types and hook
3. **Build step by step**, testing each phase
4. **Gather user feedback** on UI/UX
5. **Optimize performance** based on real usage

---

## Questions to Answer

1. Should points be awarded on save-to-plate or only on feed publish?
2. Should users be able to tag others in the image?
3. Should snap posts show in user's feed by default, or only after deliberate sharing?
4. What's the max file size for gallery uploads?
5. Should crop/rotate tools be included, or keep simple?
6. Can snaps be edited after publishing to Plate?

