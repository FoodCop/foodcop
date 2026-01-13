# FuzoFoodCop Finesse & Polish Roadmap

**Last Updated:** January 13, 2026  
**Session Focus:** Site refinement, UX improvements, redundancy cleanup, and SNAP feature expansion

---

## Priority 1: Radial Menu Overhaul ✅ COMPLETED

### Current State
- ✅ Radial menu replaced with FloatingActionMenu
- ✅ Simple FAB (Floating Action Button) with upward-expanding menu
- ✅ Cleaner, more ergonomic UX
- ✅ Less screen real estate, better mobile experience

### Completed Tasks
- [x] Audit current radial menu implementation
- [x] Identify UX pain points (touch responsiveness, mobile, accessibility)
- [x] Replaced with FloatingActionMenu component
- [x] Features:
  - Fixed bottom-right position
  - Icons pop upward when expanded
  - Smooth animations with stagger effect
  - Active page highlighting
  - Unread chat badge
  - Backdrop close on tap outside
  - Accessible ARIA labels
- [x] Updated App.tsx to use new component
- [x] Tested collapsible behavior

### Implementation Details
- Location: `/src/components/navigation/FloatingActionMenu.tsx`
- Old component preserved at: `/src/components/navigation/MobileRadialNav.tsx` (can be deleted if not needed)
- Export updated in: `/src/components/navigation/index.ts`

---

## Priority 2: Trims & Bites Page Refinement

### Trims Page (`src/components/trims/`)
- [ ] Review layout consistency with other pages
- [ ] Check for unused imports or dead code
- [ ] Verify image loading and fallbacks
- [ ] Optimize card grid/masonry layout
- [ ] Test responsive design (mobile → tablet → desktop)
- [ ] Add loading states if missing
- [ ] Polish hover effects and animations

### Bites Page (`src/components/bites/`)
- [ ] Same audit as Trims
- [ ] Verify recipe filtering/search works smoothly
- [ ] Check dietary preference integration
- [ ] Review card layouts (`BitesDesktop.tsx`, `BitesMobile.tsx`)
- [ ] Ensure category switching doesn't cause layout shifts
- [ ] Polish sorting/filtering UX

### Common Improvements
- [ ] Align spacing, colors, typography across both pages
- [ ] Consistent loading skeletons
- [ ] Consistent error states and retry logic

---

## Priority 3: Duplicate & Redundant Elements Cleanup

### Search Areas
- [ ] Check for duplicate component definitions
  - Multiple `AdCard.tsx` locations? (seen in audit)
  - Multiple `TriviaCard.tsx` locations?
  - Recipe/Restaurant card variants?
- [ ] Consolidate into single source of truth
- [ ] Check for duplicate utility functions (e.g., `formatters`, `mappers`)
- [ ] Remove unused imports from files
- [ ] Audit CSS/Tailwind for duplicate class definitions
- [ ] Check service layer for duplicate API call logic

### Refactoring
- [ ] Create shared component library structure
- [ ] Establish clear component hierarchy
- [ ] Document which components are used where

---

## Priority 4: Hide Chat Functions

### Scope
- [ ] Identify all chat UI elements (buttons, modals, icons, sidebars)
- [ ] Locations to check:
  - Plate page (Desktop & Mobile): likely has chat icon/button
  - Header/navigation components
  - Individual card actions (Share buttons)
  - DM Chat store and components
  
### Implementation
- [ ] Hide (conditional render) rather than delete
- [ ] Use feature flag or environment variable:
  ```typescript
  const CHAT_ENABLED = false; // or env var
  if (CHAT_ENABLED) { <ChatButton /> }
  ```
- [ ] Comment out or wrap chat-related exports in services
- [ ] Ensure app doesn't break if chat is disabled
- [ ] Document what's hidden so it's easy to re-enable later

### Files to Review
- `src/components/plate/PlateDesktop.tsx` - Remove chat icon from tabs
- `src/components/plate/PlateMobile.tsx` - Remove chat button
- Any share/message buttons on cards
- Chat context/store initialization

---

## Priority 5: SNAP Page Feature Expansion

### Current State
- SNAP page exists (`src/components/snap/Snap.tsx`)
- Likely captures photos only
- No image upload or post creation yet

### Phase 1: Image Upload
- [ ] Add file input for image uploads (JPG, PNG, WebP)
- [ ] Preview selected image before upload
- [ ] Crop/rotate image tools (optional but nice)
- [ ] Size validation (max file size, dimensions)
- [ ] Display uploaded image with metadata overlay

### Phase 2: Post Creation
- [ ] Form to add post details:
  - [ ] Title/caption text
  - [ ] Tags/hashtags
  - [ ] Location (optional, link to place)
  - [ ] Rating/emoji reaction
  - [ ] Category (Food, Drink, Place)
- [ ] Image-text layout preview
- [ ] Save button to publish post

### Phase 3: Backend Integration
- [ ] Create `snapPostService` to handle:
  - [ ] Image upload to storage (Supabase)
  - [ ] Post data save to DB
  - [ ] Return post ID for confirmation
- [ ] Error handling and retry
- [ ] Success confirmation screen with share options

### Phase 4: Polish
- [ ] Loading states during upload
- [ ] Progress indicator for large uploads
- [ ] Toast notifications for success/error
- [ ] Clear form after successful post
- [ ] Link to view posted content

### Files to Create/Update
- `src/components/snap/Snap.tsx` - Main component
- `src/services/snapPostService.ts` - New service for post creation
- `src/types/snap.ts` - Types for snap posts
- Update database schema (if needed)

---

## Technical Debt & Notes

### Known Issues from Audit
- Multiple `AdCard` definitions (need consolidation)
- Multiple `TriviaCard` definitions
- Dynamic imports vs static imports conflict in Supabase
- Unused imports in several components

### Best Practices to Follow
- Use Sonner for all toasts
- Maintain TypeScript strict mode
- Add loading states and error boundaries
- Test responsive design at each step
- Document new services and types
- Use React Query for data fetching patterns
- Keep components under 300 lines (break into sub-components)

---

## Session Checklist

- [ ] Review and prioritize tasks above
- [ ] Start with Priority 1 (radial menu audit)
- [ ] Move through priorities sequentially
- [ ] Build and test after each major change
- [ ] Commit to git at logical breakpoints
- [ ] Update this doc as items are completed

---

## Notes for Next Session

- Build currently passes with no errors
- Git is clean and synced with origin/main
- All icon imports are in place
- Types are consistent across components
- Ready to start UI/UX refinement work
