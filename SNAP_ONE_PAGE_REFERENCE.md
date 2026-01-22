# SNAP Feature - One-Page Reference Sheet

## The 5-Phase Implementation Plan

```
PHASE 1: FOUNDATION (2-3 hrs)
Create types + hook + refactor main component
✓ src/types/snap.ts
✓ src/hooks/useSnapWorkflow.ts  
✓ Refactor src/components/snap/Snap.tsx
→ DELIVERABLE: Refactored architecture ready for features


PHASE 2: GALLERY UPLOAD (1-2 hrs)
Add file upload alongside camera capture
✓ src/components/snap/sections/GalleryUpload.tsx
✓ File validation (size, format)
✓ Image preview
→ DELIVERABLE: Camera + Gallery image input working


PHASE 3: CARD FORMATTING (2-3 hrs)
Process image → format → gamify
✓ src/services/snapCardFormatter.ts (image optimization)
✓ src/services/snapGameification.ts (points calculation)
✓ src/components/snap/steps/CardFormattingStep.tsx
→ DELIVERABLE: Raw images formatted into feed-ready cards with points


PHASE 4: PUBLISHING (2-3 hrs)
Implement dual publishing paths
✓ src/services/snapPublishService.ts
✓ src/components/snap/steps/PublishStep.tsx
✓ src/components/snap/dialogs/SuccessDialog.tsx
→ DELIVERABLE: Can publish to Plate (private) or Feed (public)


PHASE 5: POLISH (2-3 hrs)
Loading states, error handling, performance
✓ Add loading indicators
✓ Add error handling + retry
✓ Add toast notifications
✓ Unit & E2E tests
→ DELIVERABLE: Production-quality feature ready for users
```

---

## The Architecture (Simple Version)

```
USER ACTIONS          →  STATE MANAGEMENT   →  SERVICES           →  DATABASE
─────────────────────    ──────────────────     ────────────────     ──────────

Camera/File          →  useSnapWorkflow    →  snapCardFormatter  →  Supabase
                       (manages step,      →  snapGameification  →  storage
                        image, tags,       →  snapPublishService →  feed_posts
                        card, etc)                                  table

Select Tags          →  (updates state)    →  calculatePoints()
                                           
Add Caption          →  (updates state)    →  formatImageToCard()
                                           
Choose Publish       →  (updates state)    →  publishToPlate()
Target                                     →  publishToFeed()

SUCCESS              →  (show dialog)      →  (award points)
```

---

## Data Models (TypeScript)

```typescript
// Image captured/uploaded
ImageMetadata {
  imageData: string        // Base64
  latitude, longitude      // GPS
  timestamp: Date
  accuracy: number
  source: 'camera' | 'gallery'
}

// Tag selected by user
SnapTag {
  id, label
  category: 'cuisine' | 'dish' | 'ambiance' | etc
  pointValue: 5 | 10 | 15
}

// Formatted card ready to publish
SnapCard {
  id: string
  imageUrl: string         // Optimized (600x600, WebP)
  imageData: string        // Original base64
  caption: string
  tags: SnapTag[]
  pointsEarned: number
  author: { userId, displayName, avatar }
  location: { latitude, longitude }
  publishedTo: 'plate' | 'feed'
}
```

---

## Component Hierarchy

```
Snap (ORCHESTRATOR)
├─ DisclaimerDialog
├─ ImageInputStep
│  ├─ CameraCapture
│  └─ GalleryUpload
├─ TaggingStep
│  ├─ CardPreview (photo + tags + points)
│  └─ Tag selector buttons
├─ CardFormattingStep
│  ├─ CardPreview (optimized image)
│  └─ Caption textarea
├─ PublishStep
│  ├─ CardPreview (final)
│  └─ Plate/Feed radio buttons
└─ SuccessDialog
   ├─ Congrats message
   ├─ Points breakdown
   └─ Action buttons
```

---

## Services (Business Logic)

```
snapGameification.ts
├─ calculatePoints(tags: SnapTag[]): number
├─ getPointsForCategory(category): number
└─ createPointsNotification(): object

snapCardFormatter.ts
├─ formatImageToCard(raw, meta, tags, caption, user): SnapCard
├─ optimizeSnapImage(base64): Promise<string>
└─ generateCardId(): string

snapPublishService.ts
├─ publishToPlate(card, userId): Promise<success>
└─ publishToFeed(card, userId): Promise<success>
```

---

## State Hook API

```typescript
const workflow = useSnapWorkflow();

// Current state
workflow.currentStep          // 'input' | 'tag' | 'format' | 'publish' | 'success'
workflow.imageMetadata        // ImageMetadata | null
workflow.tags                 // SnapTag[]
workflow.pointsEarned         // number
workflow.cardPreview          // SnapCard | null
workflow.publishTarget        // 'plate' | 'feed' | null
workflow.isLoading            // boolean
workflow.error                // string | null

// Update methods
workflow.setImageMetadata(metadata)
workflow.setTags(tags)
workflow.setCardPreview(card)
workflow.updateCardCaption(caption)
workflow.setPublishTarget(target)

// Navigation
workflow.nextStep()           // Move to next step
workflow.prevStep()           // Go back
workflow.reset()              // Start over

// Publishing
workflow.publish(userId, target) // Returns Promise<boolean>
```

---

## Key Design Patterns

### 1. Single Responsibility
- Each component handles ONE step
- Each service handles ONE business function
- Easy to test, maintain, modify

### 2. Data Flow
- User action → Hook updates state → Component re-renders
- Services are pure functions (no side effects)
- Predictable, easy to debug

### 3. Error Handling
```
Try operation
  ↓
Success → Update state → Re-render
  ↓
Error → Show toast message → Allow retry
```

### 4. Image Optimization
```
Base64 Input
  ↓
Load into Image object
  ↓
Center-crop to 600x600
  ↓
Compress to WebP
  ↓
Return optimized URL
```

---

## Publishing Workflow

```
PLATE (Private)
├─ Save to user's profile
├─ Visible only to user
├─ Can be reviewed before sharing
└─ No points awarded yet

FEED (Public)
├─ Save to public feed
├─ Visible to all users
├─ Can be liked/commented
├─ Points awarded to user
└─ Drives engagement
```

---

## Gamification

```
Tag Selected      →  Points Awarded
Cuisine          →  +10
Dish name        →  +10
Restaurant       →  +5
Ambiance         →  +5
Custom tag       →  +5

TOTAL CAN BE: 5-50 points per snap
```

---

## File Structure (After Implementation)

```
src/
├── types/snap.ts                              [NEW]
├── hooks/useSnapWorkflow.ts                   [NEW]
├── services/
│   ├── snapCardFormatter.ts                   [NEW]
│   ├── snapGameification.ts                   [NEW]
│   ├── snapPublishService.ts                  [NEW]
│   └── (existing services used)
└── components/snap/
    ├── Snap.tsx                               [REFACTORED]
    ├── steps/                                 [NEW]
    │   ├── ImageInputStep.tsx
    │   ├── TaggingStep.tsx
    │   ├── CardFormattingStep.tsx
    │   └── PublishStep.tsx
    ├── sections/                              [NEW/MOVED]
    │   ├── CameraCapture.tsx
    │   ├── GalleryUpload.tsx
    │   └── CardPreview.tsx
    └── dialogs/                               [NEW]
        ├── DisclaimerDialog.tsx
        └── SuccessDialog.tsx
```

---

## Quick Implementation Order

```
1. Create src/types/snap.ts
   └─ Define all interfaces

2. Create src/hooks/useSnapWorkflow.ts
   └─ Implement state management

3. Refactor src/components/snap/Snap.tsx
   └─ Use hook, add step switching

4. Extract/Create src/components/snap/sections/CameraCapture.tsx
   └─ Move camera logic

5. Create src/components/snap/steps/ImageInputStep.tsx
   └─ Integrate Camera + (future Gallery)

6. Create src/components/snap/sections/GalleryUpload.tsx
   └─ Add file input

7. Create src/components/snap/steps/TaggingStep.tsx
   └─ Move/refactor existing tagging

8. Create src/services/snapGameification.ts
   └─ Point calculation

9. Create src/services/snapCardFormatter.ts
   └─ Image optimization

10. Create src/components/snap/steps/CardFormattingStep.tsx
    └─ Caption input + preview

11. Create src/services/snapPublishService.ts
    └─ Publishing logic

12. Create src/components/snap/steps/PublishStep.tsx
    └─ Choose Plate/Feed

13. Create src/components/snap/dialogs/SuccessDialog.tsx
    └─ Success state

14. Create src/components/snap/dialogs/DisclaimerDialog.tsx
    └─ Guidelines

15. Add error handling, loading states, tests
    └─ Polish
```

---

## Success Indicators

✅ User can select images (camera OR gallery)  
✅ Location metadata captured  
✅ User can add tags  
✅ Points calculated correctly  
✅ Card formatted and previewed  
✅ Caption can be added  
✅ User can choose Plate or Feed  
✅ Publishing works (no errors)  
✅ Success dialog shows  
✅ Works on mobile & desktop  

---

## Testing Checklist

```
UNIT TESTS (Services)
□ calculatePoints() returns correct total
□ optimizeSnapImage() produces WebP
□ generateCardId() is unique
□ publishToPlate() calls gateway correctly
□ publishToFeed() saves to DB correctly

INTEGRATION TESTS
□ Hook state transitions properly
□ Components receive correct props
□ API calls succeed

E2E TESTS (Full flow)
□ Camera capture → Tagging → Card → Publish
□ Gallery upload → Tagging → Card → Publish
□ Error handling works
□ Mobile responsiveness

MANUAL TESTING
□ Test on real phone
□ Test with poor network
□ Test with large images
□ Test permission denials
```

---

## Documentation to Read (In Order)

1. **SNAP_SOLUTION_SUMMARY.md** (10 min)
   - Problem + solution overview
   
2. **SNAP_FEATURE_ARCHITECTURE.md** (20 min)
   - Detailed design
   
3. **SNAP_WORKFLOW_VISUAL.md** (15 min)
   - Diagrams + flows
   
4. **SNAP_IMPLEMENTATION_GUIDE.md** (reference)
   - Code templates

---

## Time Estimate

| Phase | Hours | Status |
|-------|-------|--------|
| 1. Foundation | 2-3 | 📋 PLANNED |
| 2. Gallery | 1-2 | 📋 PLANNED |
| 3. Formatting | 2-3 | 📋 PLANNED |
| 4. Publishing | 2-3 | 📋 PLANNED |
| 5. Polish | 2-3 | 📋 PLANNED |
| **TOTAL** | **11-16** | |

---

## Critical Success Factors

1. **Separate concerns** - Services don't import components
2. **Type safety** - Define types first, implement after
3. **Test early** - Test each phase before moving to next
4. **Mobile first** - Test on device, not just browser
5. **Error resilient** - Every API call needs error handling
6. **User feedback** - Loading + success/error toasts
7. **Performance** - Image optimization before storage

---

## Common Mistakes to Avoid

❌ Putting logic in components  
❌ Skipping error handling  
❌ Testing only on desktop  
❌ Large, unmaintainable components  
❌ Not defining types upfront  
❌ Ignoring loading states  
❌ No validation of user input  
❌ Using setTimeout instead of proper async/await  

---

## Ready to Build?

✅ Architecture designed  
✅ Data models defined  
✅ Services specified  
✅ Component structure clear  
✅ Roadmap created  
✅ Documentation written  

**Next step:** Start Phase 1 using SNAP_IMPLEMENTATION_GUIDE.md

