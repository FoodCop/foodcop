# File Cleanup Analysis Report

**Date**: December 24, 2025  
**Project**: FuzoFoodCop

## Summary

This document analyzes all component files to identify:
- Files actually being used (imported in App.tsx)
- Old versions that should be moved to `/src/unused`
- Files that need renaming (removing "New" suffix)

---

## Active Files Analysis (from App.tsx)

### Currently Imported & Used:
```typescript
// App.tsx imports:
const OnboardingFlow = lazyWithRetry(() => import('./components/onboarding/OnboardingFlow'))
const FeedApp = lazyWithRetry(() => import('./components/feed/FeedNew').then(module => ({ default: module.FeedNew })))
const ScoutApp = lazyWithRetry(() => import('./components/scout/ScoutNew'))
const BitesApp = lazyWithRetry(() => import('./components/bites/BitesNew'))
const TrimsApp = lazyWithRetry(() => import('./components/trims/TrimsNew'))
const DashApp = lazyWithRetry(() => import('./components/plate/PlateNew'))  // Dash merged into Plate
const SnapApp = lazyWithRetry(() => import('./components/snap/SnapNew').then(module => ({ default: module.SnapNew })))
const PlateApp = lazyWithRetry(() => import('./components/plate/PlateNew'))

// Eager loaded:
import { NewLandingPage } from './components/home/NewLandingPage'
```

---

## Component-by-Component Analysis

### 1. **Bites Module** (`/src/components/bites/`)
**Current Files:**
- `BitesNew.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `BitesNewMobile.tsx` ✅ **ACTIVE** (used by BitesNew)
- `BitesDesktop.tsx` ✅ **ACTIVE** (used by BitesNew)
- `components/RecipeCard.tsx` ✅ **ACTIVE**
- `components/FilterBar.tsx` ✅ **ACTIVE**
- `components/RecipeDetailDialog.tsx` ✅ **ACTIVE**
- `components/RecipeDetailView.tsx` ✅ **ACTIVE**
- `components/RecipeModal.tsx` ✅ **ACTIVE**

**Missing Old Files:** ❌ None found (clean module)

**Action Required:**
- Rename `BitesNew.tsx` → `Bites.tsx`
- Rename `BitesNewMobile.tsx` → `BitesMobile.tsx`
- Update imports in App.tsx

---

### 2. **Snap Module** (`/src/components/snap/`)
**Current Files:**
- `SnapNew.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `Snap.tsx` ❌ **UNUSED** (old version)

**Action Required:**
- Move `Snap.tsx` → `/src/unused/Snap.tsx`
- Rename `SnapNew.tsx` → `Snap.tsx`
- Update import in App.tsx

---

### 3. **Feed Module** (`/src/components/feed/`)
**Current Files:**
- `FeedNew.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `FeedDesktop.tsx` ✅ **ACTIVE** (used by FeedNew)
- `FeedMobile.tsx` ✅ **ACTIVE** (used by FeedNew)
- `SharePostButton.tsx` ✅ **ACTIVE**
- `components/` ✅ **ACTIVE**
- `data/` ✅ **ACTIVE**

**Missing Old Files:** ❌ None found (clean module)

**Action Required:**
- Rename `FeedNew.tsx` → `Feed.tsx`
- Update import in App.tsx

---

### 4. **Scout Module** (`/src/components/scout/`)
**Current Files:**
- `ScoutNew.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `ScoutDesktop.tsx` ✅ **ACTIVE** (likely used by ScoutNew)
- `Scout.styles.css` ✅ **ACTIVE**
- `components/` ✅ **ACTIVE**

**Missing Old Files:** ❌ None found (clean module)

**Action Required:**
- Rename `ScoutNew.tsx` → `Scout.tsx`
- Update import in App.tsx

---

### 5. **Trims Module** (`/src/components/trims/`)
**Current Files:**
- `TrimsNew.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `TrimsDesktop.tsx` ✅ **ACTIVE** (used by TrimsNew)
- `TrimsMobile.tsx` ✅ **ACTIVE** (used by TrimsNew)
- `components/Trims.tsx` ⚠️ **INVESTIGATE** (may be old)
- `components/` ✅ **ACTIVE**

**Action Required:**
- Investigate `components/Trims.tsx` - if unused, move to `/src/unused/`
- Rename `TrimsNew.tsx` → `Trims.tsx`
- Update import in App.tsx

---

### 6. **Plate Module** (`/src/components/plate/`)
**Current Files:**
- `PlateNew.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `PlateMobile.tsx` ✅ **ACTIVE** (used by PlateNew)
- `PlateDesktop.tsx` ✅ **ACTIVE** (used by PlateNew)
- `RecentChats.tsx` ✅ **ACTIVE**
- `components/` ✅ **ACTIVE**

**Missing Old Files:** ❌ None found (clean module)

**Action Required:**
- Rename `PlateNew.tsx` → `Plate.tsx`
- Update imports in App.tsx (both PlateApp and DashApp)

---

### 7. **Dash Module** (`/src/components/dash/`)
**Current Files:**
- `components/` only (no main file)

**Status:** 🔄 **MERGED INTO PLATE**  
Dashboard functionality merged into Plate module.

**Action Required:**
- Check if `dash/components/` are still referenced
- If unused, move entire `dash/` folder to `/src/unused/`

---

### 8. **Home Module** (`/src/components/home/`)
**Current Files:**
- `NewLandingPage.tsx` ✅ **ACTIVE** (imported in App.tsx)
- `NewLandingPage.css` ✅ **ACTIVE**
- `components/LandingPage.tsx` ❌ **UNUSED** (old version)
- `components/` ✅ **ACTIVE** (sub-components used by NewLandingPage)

**Action Required:**
- Move `components/LandingPage.tsx` → `/src/unused/LandingPage.tsx`
- Rename `NewLandingPage.tsx` → `LandingPage.tsx`
- Rename `NewLandingPage.css` → `LandingPage.css`
- Update import in App.tsx

---

## Summary of Actions

### Files to Move to `/src/unused/`:
1. ✅ `src/components/snap/Snap.tsx`
2. ✅ `src/components/home/components/LandingPage.tsx`
3. ⚠️ `src/components/trims/components/Trims.tsx` (if confirmed unused)
4. ⚠️ `src/components/dash/` (entire folder if confirmed unused)

### Files to Rename (Remove "New" suffix):
1. ✅ `BitesNew.tsx` → `Bites.tsx`
2. ✅ `BitesNewMobile.tsx` → `BitesMobile.tsx`
3. ✅ `FeedNew.tsx` → `Feed.tsx`
4. ✅ `ScoutNew.tsx` → `Scout.tsx`
5. ✅ `TrimsNew.tsx` → `Trims.tsx`
6. ✅ `SnapNew.tsx` → `Snap.tsx`
7. ✅ `PlateNew.tsx` → `Plate.tsx`
8. ✅ `NewLandingPage.tsx` → `LandingPage.tsx`
9. ✅ `NewLandingPage.css` → `LandingPage.css`

### Imports to Update in App.tsx:
```typescript
// BEFORE:
import { NewLandingPage } from './components/home/NewLandingPage'
const FeedApp = lazyWithRetry(() => import('./components/feed/FeedNew').then(...))
const ScoutApp = lazyWithRetry(() => import('./components/scout/ScoutNew'))
const BitesApp = lazyWithRetry(() => import('./components/bites/BitesNew'))
const TrimsApp = lazyWithRetry(() => import('./components/trims/TrimsNew'))
const SnapApp = lazyWithRetry(() => import('./components/snap/SnapNew').then(...))
const PlateApp = lazyWithRetry(() => import('./components/plate/PlateNew'))
const DashApp = lazyWithRetry(() => import('./components/plate/PlateNew'))

// AFTER:
import { LandingPage } from './components/home/LandingPage'
const FeedApp = lazyWithRetry(() => import('./components/feed/Feed').then(...))
const ScoutApp = lazyWithRetry(() => import('./components/scout/Scout'))
const BitesApp = lazyWithRetry(() => import('./components/bites/Bites'))
const TrimsApp = lazyWithRetry(() => import('./components/trims/Trims'))
const SnapApp = lazyWithRetry(() => import('./components/snap/Snap').then(...))
const PlateApp = lazyWithRetry(() => import('./components/plate/Plate'))
const DashApp = lazyWithRetry(() => import('./components/plate/Plate'))
```

---

## Verification Checklist

After cleanup:
- [ ] Run `npm run build` to check for import errors
- [ ] Test all routes in the application
- [ ] Verify no broken imports
- [ ] Update any component tests
- [ ] Check for references in service files

---

**Next Step**: Begin moving unused files and renaming active files.
