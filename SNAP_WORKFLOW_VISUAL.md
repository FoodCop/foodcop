# SNAP Feature - Visual Workflow & Component Map

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SNAP FEATURE WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌──────────────────────────────────┐
│   Disclaimer Dialog              │
│  (Food photo guidelines)         │
│  ✓ Continue  ✗ Cancel           │
└──────────────────────────────────┘
  │ Continue
  ▼
┌──────────────────────────────────┐     ┌─────────────────────────┐
│  Image Input Step                │────▶│ Camera Capture Section  │
│  Choose source:                  │     │ - Start camera          │
│  ├─ 📸 Camera                    │     │ - Capture photo         │
│  └─ 📁 Gallery                   │     │ - Get geolocation       │
└──────────────────────────────────┘     └─────────────────────────┘
  │                                            │
  │                        ┌──────────────────┘
  │                        ▼
  │                  ┌─────────────────────────┐
  └─────────────────│ Gallery Upload Section  │
                    │ - File picker            │
                    │ - Preview image          │
                    │ - Crop/rotate tools      │
                    │ - Size validation        │
                    └─────────────────────────┘
                            │
  ┌─────────────────────────┘
  ▼
┌──────────────────────────────────┐
│  Image Metadata                  │
│  ├─ imageData (base64)          │
│  ├─ latitude, longitude          │
│  ├─ timestamp                    │
│  ├─ accuracy                     │
│  └─ source ('camera'|'gallery')  │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Tagging Step                    │
│  Photo preview + tag selection   │
│                                  │
│  Available tags:                 │
│  • Cuisine (Italian, Thai...)    │
│  • Dish (Pasta, Sushi...)        │
│  • Restaurant (name)             │
│  • Ambiance (cozy, modern...)    │
│  • Custom (user-defined)         │
│                                  │
│  Points earned: [dynamic]        │
│  └─ Cuisine: +10                 │
│  └─ Dish: +10                    │
│  └─ Ambiance: +5                 │
│  └─ TOTAL: _____ Points          │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Card Formatting Step            │
│  ┌────────────────────────────┐  │
│  │  [Optimized Image]         │  │
│  │  Square crop, 600x600px    │  │
│  │  WebP optimized            │  │
│  └────────────────────────────┘  │
│                                  │
│  Caption: ___________________    │
│                                  │
│  Tags shown:                     │
│  [Italian] [Pasta] [Cozy]        │
│  Points: +25                     │
│                                  │
│  Preview format: ✓               │
│  Ready to publish               │
└──────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│  Publish Step                    │
│  Choose destination:             │
│                                  │
│  ○ Save to Plate (private)       │
│    └─ Visible only in your       │
│       profile                    │
│                                  │
│  ○ Publish to Feed (public)      │
│    └─ Visible to all users       │
│    └─ Earn points                │
│    └─ Get engagement (likes)     │
└──────────────────────────────────┘
  │
  ├─ Plate
  │  ▼
  │  Save via PlateGateway
  │
  └─ Feed
     ▼
     Save to feed_posts table
     └─ Points awarded to user

  Both paths ▼

┌──────────────────────────────────┐
│  Success Dialog                  │
│  🎉 Saved!                       │
│                                  │
│  "Your food photo is now in      │
│   your Plate"                    │
│                                  │
│  +25 Points Earned! 🏆           │
│                                  │
│  Tags:                           │
│  Italian (+10), Pasta (+10),     │
│  Cozy (+5)                       │
│                                  │
│  [View in Plate] [Share to Feed] │
└──────────────────────────────────┘
  │
  ▼
RESET WORKFLOW / CONTINUE
```

---

## Component Hierarchy

```
Snap (Main Orchestrator)
│
├─ DisclaimerDialog
│  ├─ Title & description
│  ├─ Do's & Don'ts
│  └─ Continue / Cancel buttons
│
├─ ImageInputStep
│  ├─ CameraCapture (conditional)
│  │  ├─ Video preview
│  │  ├─ Capture button
│  │  ├─ Loading state
│  │  └─ Permission handling
│  │
│  └─ GalleryUpload (conditional)
│     ├─ File input
│     ├─ Image preview
│     ├─ Crop/rotate tools (optional)
│     ├─ Size validation
│     └─ Cancel button
│
├─ TaggingStep
│  ├─ CardPreview (read-only)
│  │  ├─ Image display
│  │  ├─ Location badge
│  │  └─ Timestamp badge
│  │
│  ├─ Tag selector
│  │  ├─ Cuisine buttons
│  │  ├─ Dish buttons
│  │  ├─ Ambiance buttons
│  │  ├─ Custom tag input
│  │  └─ Add tag button
│  │
│  ├─ Points indicator
│  │  ├─ Tag-by-tag breakdown
│  │  └─ Total points
│  │
│  ├─ Submit button
│  ├─ Back button
│  └─ Cancel button
│
├─ CardFormattingStep
│  ├─ CardPreview (interactive)
│  │  ├─ Optimized image
│  │  ├─ Selected tags
│  │  └─ Points earned
│  │
│  ├─ Caption input
│  │  ├─ Text area
│  │  └─ Character counter
│  │
│  ├─ Next button
│  ├─ Back button
│  └─ Cancel button
│
├─ PublishStep
│  ├─ CardPreview (final)
│  │  ├─ Full formatted card
│  │  └─ All metadata
│  │
│  ├─ Publish target selector
│  │  ├─ Plate option
│  │  │  ├─ Icon & label
│  │  │  └─ Description
│  │  │
│  │  └─ Feed option
│  │     ├─ Icon & label
│  │     └─ Description + points note
│  │
│  ├─ Publish button
│  ├─ Back button
│  └─ Cancel button
│
└─ SuccessDialog
   ├─ Congratulations message
   ├─ Points earned display
   ├─ Tag breakdown
   └─ Action buttons
      ├─ View in Plate
      └─ Share to Feed (if saved to Plate)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SNAP WORKFLOW DATA FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

Step 1: IMAGE INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Camera / Gallery
        │
        ▼
  ┌──────────────────────┐
  │ ImageMetadata        │
  ├──────────────────────┤
  │ imageData: string    │ ◄─── Base64 encoded
  │ latitude: number     │ ◄─── From geolocation
  │ longitude: number    │ ◄─── From geolocation
  │ timestamp: Date      │ ◄─── Now
  │ accuracy: number     │ ◄─── GPS accuracy
  │ source: string       │ ◄─── 'camera' | 'gallery'
  └──────────────────────┘
        │
        ▼ Store in workflow state
  useSnapWorkflow.setImageMetadata()


Step 2: TAGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  User selects tags
        │
        ▼
  snapGameification.calculatePoints(tags)
        │
        ├─→ Tag: Italian       ─→ +10 points
        ├─→ Tag: Pasta         ─→ +10 points
        ├─→ Tag: Cozy          ─→ +5 points
        │
        └─→ Total: 25 points
              │
              ▼
  ┌──────────────────────┐
  │ SnapTag[]            │
  ├──────────────────────┤
  │ id: string           │
  │ label: string        │
  │ category: string     │
  │ pointValue: number   │
  └──────────────────────┘
        │
        ▼ Store in workflow state
  useSnapWorkflow.setTags(tags)


Step 3: CARD FORMATTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Base64 image + caption + tags + metadata
        │
        ▼
  snapCardFormatter.formatImageToCard()
        │
        ├─→ optimizeSnapImage()
        │   └─→ Canvas processing
        │   └─→ Center-crop to 600x600
        │   └─→ WebP compression
        │   └─→ Return optimized URL
        │
        ├─→ Generate unique ID
        │   └─→ snap-{timestamp}-{random}
        │
        ├─→ Calculate points
        │   └─→ snapGameification.calculatePoints()
        │
        └─→ Structure SnapCard
              │
              ▼
  ┌──────────────────────────┐
  │ SnapCard                 │
  ├──────────────────────────┤
  │ id: string               │
  │ imageUrl: string         │ ◄─── Optimized URL
  │ imageData: string        │ ◄─── Original base64
  │ caption: string          │
  │ tags: SnapTag[]          │
  │ pointsEarned: number     │
  │ author: {...}            │
  │ location: {...}          │
  │ createdAt: Date          │
  │ publishedTo: 'plate'     │
  └──────────────────────────┘
        │
        ▼ Store in workflow state
  useSnapWorkflow.setCardPreview(card)


Step 4: PUBLISH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  User chooses: Plate OR Feed
        │
        ├─→ PLATE PATH
        │   │
        │   ▼
        │   snapPublishService.publishToPlate(card, userId)
        │   │
        │   ▼
        │   PlateGateway.savePost({
        │     content: card.caption,
        │     image: card.imageUrl,
        │     metadata: {...}
        │   })
        │   │
        │   ▼ Result: { success, postId, error }
        │
        └─→ FEED PATH
            │
            ▼
            snapPublishService.publishToFeed(card, userId)
            │
            ▼
            supabase.from('feed_posts').insert({
              id, user_id, image_url,
              caption, tags, points_earned,
              location, created_at
            })
            │
            ▼ Result: { success, feedCardId, error }


COMMON FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Both paths merge
        │
        ▼
  If success:
    • Update user's points
    • Show success dialog
    • Store card ID for reference
    • Allow navigation to Plate or Feed
  
  If error:
    • Show error toast
    • Allow retry or cancel
    • Don't reset form state
```

---

## Service Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  SERVICES LAYER                                │
└────────────────────────────────────────────────────────────────┘

snapGameification.ts
├─ TAG_POINT_VALUES: { cuisine: 10, dish: 10, ... }
├─ calculatePoints(tags): number
└─ createPointsNotification(points, tags): Notification

snapCardFormatter.ts
├─ formatImageToCard(imageData, metadata, tags, caption, user): SnapCard
├─ optimizeSnapImage(base64, width, height, quality): string
└─ generateCardId(): string

snapPublishService.ts
├─ publishToPlate(card, userId): Promise<{ success, postId, error }>
├─ publishToFeed(card, userId): Promise<{ success, feedCardId, error }>
└─ convertSnapCardToFeedCard(card): SnapFeedCard

┌─────────────────────────────────────────────────────────────────┐
│                  EXISTING SERVICES USED                         │
└─────────────────────────────────────────────────────────────────┘

SavedItemsService
└─ saveItem(itemId, itemType, metadata): Promise

PlateGateway
├─ savePost(post): Promise
├─ savePhoto(photo): Promise
└─ saveBatch(items): Promise

FeedService
├─ fetchFeed(userId, count): Promise<FeedCard[]>
├─ fetchMasterbotCards(): Promise<MasterbotCard[]>
└─ transformSnapCardToFeedCard(): FeedCard

ImageOptimizer
├─ optimizeImageByType(url, type): string
└─ getImageConfig(type): Config

AuthProvider
├─ useAuth(): { user, loading, error }
└─ signIn, signOut, signUp methods
```

---

## Step Component Interfaces

```typescript
// Step components share common props structure

interface ImageInputStepProps {
  onImageSelected: (metadata: ImageMetadata) => void;
  onCancel: () => void;
}

interface TaggingStepProps {
  imageUrl: string;
  onTagsSelected: (tags: SnapTag[]) => void;
  onBack: () => void;
  onCancel: () => void;
}

interface CardFormattingStepProps {
  card: SnapCard;
  onCaptionChanged: (caption: string) => void;
  onPublish: () => void;
  onBack: () => void;
  onCancel: () => void;
}

interface PublishStepProps {
  card: SnapCard;
  onPublish: (target: 'plate' | 'feed') => Promise<void>;
  onBack: () => void;
  onCancel: () => void;
}

interface SuccessDialogProps {
  card: SnapCard;
  pointsEarned: number;
  onViewInPlate: () => void;
  onShareToFeed: () => void;
}
```

---

## State Management with Hook

```typescript
interface UseSnapWorkflowReturn {
  // State
  imageSource: 'camera' | 'gallery' | null;
  imageMetadata: ImageMetadata | null;
  tags: SnapTag[];
  pointsEarned: number;
  cardPreview: SnapCard | null;
  publishTarget: 'plate' | 'feed' | null;
  currentStep: WorkflowStep;
  isLoading: boolean;
  
  // Actions
  setImageMetadata: (metadata: ImageMetadata) => void;
  setTags: (tags: SnapTag[]) => void;
  updateCardCaption: (caption: string) => void;
  setPublishTarget: (target: 'plate' | 'feed') => void;
  
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  
  // Publishing
  publish: (userId: string, target: 'plate' | 'feed') => Promise<boolean>;
}
```

---

## Key Metrics & Analytics

Track these events for insights:

```
snap_flow_started
snap_image_source { camera | gallery }
snap_tags_selected { cuisine, dish, ambiance, custom }
snap_points_earned { value: 5-50 }
snap_card_formatted
snap_published_to { plate | feed }
snap_publish_success
snap_publish_error { error_type }
snap_flow_completed { duration: ms, points: num }
snap_flow_abandoned { step: which step }
```

---

## Error Scenarios & Handling

```
IMAGE INPUT
├─ Camera permission denied
│  └─ Show permission request dialog
├─ File too large (gallery)
│  └─ Show size limit error
├─ Invalid file format
│  └─ Show format error
└─ Geolocation unavailable
   └─ Continue with null location

TAGGING
└─ No tags selected
   └─ Warn but allow continue

FORMATTING
├─ Image optimization failed
│  └─ Use original image
└─ Caption too long
   └─ Enforce character limit

PUBLISHING
├─ Network error
│  └─ Show retry button
├─ Database error
│  └─ Show error + retry
├─ Permission denied
│  └─ Redirect to login
└─ Quota exceeded
   └─ Show friendly message

GENERAL
└─ Unknown error
   └─ Log to Sentry + show generic message
```

---

## Performance Considerations

```
Image Processing
├─ Run canvas operations in requestAnimationFrame
├─ Debounce crop/rotate tool interactions
├─ Compress to 600x600 max
├─ Use WebP for better compression
└─ Cache optimized images

Publishing
├─ Show progress indicator for uploads
├─ Batch multiple publishes if needed
├─ Optimize image before upload
└─ Retry failed uploads with exponential backoff

State Management
├─ Only store necessary data in workflow state
├─ Clear unused form data on step change
├─ Memoize expensive calculations
└─ Debounce form input handlers
```

---

