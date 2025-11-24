# Fonts and Typography Analysis

## Overview
This document lists all fonts, font sizes, and typography classes used throughout the FUZO app.

---

## 1. LANDING PAGE TYPOGRAPHY (NewLandingPage.css)

### Heading Classes (All use 'Noto Serif Display', serif, font-weight: 700)

#### Hero Headings
- **`.heading-hero-mobile`**
  - Font: 'Noto Serif Display', serif
  - Size: 4rem (64px)
  - Weight: 700
  - Line-height: 1.1

- **`.heading-hero-desktop`**
  - Font: 'Noto Serif Display', serif
  - Size: 6rem (96px) base
  - Size: 8rem (128px) @ 768px+
  - Size: 9rem (144px) @ 1024px+
  - Weight: 700
  - Line-height: 1.1

#### Section Headings (Mobile)
- **`.heading-pin-food`**
  - Font: 'Noto Serif Display', serif
  - Size: 3.5rem (56px) mobile
  - Size: 5.5rem (88px) @ 768px+
  - Size: 6.5rem (104px) @ 1024px+
  - Weight: 700
  - Line-height: 1.2

- **`.heading-cook-watch-mobile`**
  - Font: 'Noto Serif Display', serif
  - Size: 3.5rem (56px)
  - Weight: 700
  - Line-height: 1.2

- **`.heading-food-storyboard-mobile`**
  - Font: 'Noto Serif Display', serif
  - Size: 3.5rem (56px)
  - Weight: 700
  - Line-height: 1.2

- **`.heading-tako-mobile`**
  - Font: 'Noto Serif Display', serif
  - Size: 3.5rem (56px)
  - Weight: 700
  - Line-height: 1.2

- **`.heading-explore-mobile`**
  - Font: 'Noto Serif Display', serif
  - Size: 3.5rem (56px)
  - Weight: 700
  - Line-height: 1.2

#### Section Headings (Desktop)
- **`.heading-cook-watch-desktop`**
  - Font: 'Noto Serif Display', serif
  - Size: 5rem (80px) base
  - Size: 7rem (112px) @ 768px+
  - Weight: 700
  - Line-height: 1.2

- **`.heading-food-storyboard-desktop`**
  - Font: 'Noto Serif Display', serif
  - Size: 5rem (80px) base
  - Size: 7rem (112px) @ 768px+
  - Weight: 700
  - Line-height: 1.2

- **`.heading-tako-desktop`**
  - Font: 'Noto Serif Display', serif
  - Size: 5rem (80px) base
  - Size: 7rem (112px) @ 768px+
  - Weight: 700
  - Line-height: 1.2

- **`.heading-explore-desktop`**
  - Font: 'Noto Serif Display', serif
  - Size: 5rem (80px) base
  - Size: 7rem (112px) @ 768px+
  - Weight: 700
  - Line-height: 1.2

### Body Text Classes
- **`.body-text-mobile`**
  - Font: 'IBM Plex Serif', serif
  - Size: 1.125rem (18px)
  - Line-height: 1.6

- **`.body-text-desktop`**
  - Font: 'IBM Plex Serif', serif
  - Size: 1.25rem (20px) base
  - Size: 1.5rem (24px) @ 768px+
  - Size: 1.75rem (28px) @ 1024px+
  - Line-height: 1.7

### Button Text
- **`.new-landing-page button`**
  - Font: 'Courier Prime', monospace
  - Background: #F14C35
  - Color: #ffffff

### Base Font
- **`.new-landing-page`**
  - Font: 'IBM Plex Serif', serif

---

## 2. COMPONENT-BASED TYPOGRAPHY

### SectionHeading Component
**File:** `src/components/ui/section-heading.tsx`

- **Font:** Georgia (serif)
- **Size:** text-lg (18px)
- **Weight:** Bold (700)
- **Color:** #1A1A1A (Dark grey)
- **Usage:** All section headings like "My Crew", "Saved Recipes", "Nearby Restaurants"

**Example:**
```tsx
<SectionHeading>My Crew</SectionHeading>
```

### CardHeading Component
**File:** `src/components/ui/card-heading.tsx`

**Font:** Georgia (serif)

**Sizes:**
- **`size="sm"`**: text-sm (14px)
- **`size="md"`**: text-base (16px) - Default
- **`size="lg"`**: text-lg (18px)

**Weights:**
- **`weight="normal"`**: font-normal
- **`weight="semibold"`**: font-semibold
- **`weight="bold"`**: font-bold - Default

**Variants (Colors):**
- **`variant="default"`**: #1A1A1A (Dark grey)
- **`variant="overlay"`**: #FFFFFF (White)
- **`variant="accent"`**: #3D2817 (Dark chocolate brown) - Default for cards

**Line Clamp:**
- **`lineClamp={1}`**: Single line
- **`lineClamp={2}`**: Two lines
- **`lineClamp={3}`**: Three lines

**Example:**
```tsx
<CardHeading variant="accent" size="lg" lineClamp={2}>
  Recipe Title
</CardHeading>
```

---

## 3. GLOBAL TYPOGRAPHY (index.css)

### Base Font Size
- **`--font-size`**: 16px (root level)

### HTML Element Defaults

#### H1 (Page Headings)
- **Font:** 'Noto Serif Display', serif
- **Size:** var(--text-xl) (20px)
- **Weight:** var(--font-weight-medium) (500)
- **Color:** #8B0000 (Deep red)
- **Line-height:** 1.5

#### H2 (Section Headings)
- **Font:** 'Noto Serif Display', serif
- **Size:** var(--text-lg) (18px)
- **Weight:** var(--font-weight-medium) (500)
- **Color:** #1A1A1A (Dark grey)
- **Line-height:** 1.5

#### H3
- **Font:** 'Noto Serif Display', serif
- **Size:** var(--text-base) (16px)
- **Weight:** var(--font-weight-medium) (500)
- **Line-height:** 1.5

#### H4
- **Size:** var(--text-base) (16px)
- **Weight:** var(--font-weight-medium) (500)
- **Line-height:** 1.5

#### Paragraphs (P)
- **Font:** 'IBM Plex Serif', serif
- **Size:** var(--text-base) (16px)
- **Weight:** var(--font-weight-normal) (400)
- **Color:** #1A1A1A
- **Line-height:** 1.5

#### Labels
- **Size:** var(--text-base) (16px)
- **Weight:** var(--font-weight-medium) (500)
- **Line-height:** 1.5

#### Buttons
- **Size:** var(--text-base) (16px)
- **Weight:** var(--font-weight-medium) (500)
- **Line-height:** 1.5

#### Inputs
- **Size:** var(--text-base) (16px)
- **Weight:** var(--font-weight-normal) (400)
- **Line-height:** 1.5

### Body Font
- **Font:** 'IBM Plex Serif', serif

---

## 4. TAILWIND CONFIG TYPOGRAPHY (tailwind.config.ts)

### Font Families
- **`font-sans`**: -apple-system, BlinkMacSystemFont, 'SF Pro', 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif
- **`font-serif`**: 'Noto Serif Display', serif
- **`font-heading`**: 'Noto Serif Display', serif

### Custom Font Sizes
- **`card-heading-sm`**: 1rem (16px), line-height: 1.5, weight: 700
- **`card-heading-md`**: 1.125rem (18px), line-height: 1.5, weight: 700
- **`card-heading-lg`**: 1.25rem (20px), line-height: 1.5, weight: 700

### Typography Colors
- **`card-heading`**: #1A1A1A
- **`card-heading-accent`**: #3D2817 (Dark chocolate brown)
- **`card-heading-overlay`**: #FFFFFF
- **`page-heading`**: #8B0000 (Deep red for H1)
- **`section-heading`**: #1A1A1A (Dark grey for H2)

---

## 5. MOBILE-SPECIFIC TYPOGRAPHY (mobile.css)

### Feed Card Mobile
- **`.feed-card-mobile .card-title`**
  - Size: 18px
  - Weight: 600
  - Line-height: 1.3
  - Color: #1a1a1a

- **`.feed-card-mobile .card-subtitle`**
  - Size: 14px
  - Color: #666

- **`.feed-card-mobile .action-button`**
  - Size: 14px
  - Weight: 500

### Chat Input
- **`.chat-input-container input`**
  - Size: 16px (prevents zoom on iOS)
  - Color: #1f2937
  - Line-height: 1.5

### Badges
- **`.unread-badge`**
  - Size: 11px
  - Weight: 700

- **`.message-reaction`**
  - Size: 12px

### Swipe Overlay
- **`.swipe-overlay`**
  - Size: 48px
  - Weight: bold

---

## 6. TYPOGRAPHY HIERARCHY SUMMARY

### Level 1: Page Heading (H1)
- **Component:** Native H1 or custom
- **Font:** 'Noto Serif Display', serif
- **Size:** 20px (text-xl)
- **Weight:** Medium (500)
- **Color:** Deep Red (#8B0000)
- **Usage:** Main page titles

### Level 2: Section Heading (H2)
- **Component:** `SectionHeading`
- **Font:** 'Noto Serif Display', serif
- **Size:** 18px (text-lg)
- **Weight:** Bold (700)
- **Color:** Dark Grey (#1A1A1A)
- **Usage:** Section titles like "My Crew", "Saved Recipes"

### Level 3: Card Heading (H3)
- **Component:** `CardHeading`
- **Font:** 'Noto Serif Display', serif
- **Size:** 18px (sm) / 20px (md) / 32px (lg)
- **Weight:** Bold (700) by default
- **Color:** Dark Chocolate Brown (#3D2817) for accent variant
- **Usage:** Card titles, recipe names, post titles

### Level 4: Body Text
- **Font:** 'IBM Plex Serif', serif
- **Size:** 16px (text-base)
- **Weight:** Normal (400)
- **Color:** Dark Grey (#1A1A1A)
- **Usage:** Paragraphs, descriptions

### Level 5: Buttons, Toasts, Notifications
- **Font:** 'Courier Prime', monospace
- **Size:** 16px (text-base)
- **Weight:** Medium (500)
- **Usage:** All buttons, toast buttons, notification buttons

---

## 7. FONT FAMILIES USED

1. **Noto Serif Display** (serif) - All headings (H1, H2, H3, H4), Section headings, Card headings
2. **IBM Plex Serif** (serif) - Body text, paragraphs, landing page base
3. **Courier Prime** (monospace) - All buttons, toast buttons, notification buttons

---

## 8. WHERE TYPOGRAPHY IS DEFINED

### CSS Files
- `src/components/home/NewLandingPage.css` - Landing page specific typography
- `src/index.css` - Global typography defaults
- `src/styles/mobile.css` - Mobile-specific typography
- `tailwind.config.ts` - Tailwind typography configuration

### React Components
- `src/components/ui/section-heading.tsx` - SectionHeading component
- `src/components/ui/card-heading.tsx` - CardHeading component

### Usage Locations
- **Landing Page:** `src/components/home/NewLandingPage.tsx`
- **Plate Pages:** `src/components/plate/PlateDesktop.tsx`, `PlateMobile.tsx`
- **Dashboard:** `src/components/dash/components/DashboardNew.tsx`, `Dashboard.tsx`
- **Bites:** `src/components/bites/BitesDesktop.tsx`, `BitesNewMobile.tsx`
- **Trims:** `src/components/trims/TrimsDesktop.tsx`, `TrimsMobile.tsx`
- **Scout:** `src/components/scout/ScoutNew.tsx`
- **Discover:** `src/components/discover/App.tsx`

---

## 9. RESPONSIVE BREAKPOINTS

### Mobile (< 768px)
- Landing page headings: 3.5rem (56px)
- Body text: 1.125rem (18px)
- Card headings: 14-18px

### Tablet (768px+)
- Landing page headings: 5-7rem (80-112px)
- Body text: 1.5rem (24px)
- Card headings: 16-20px

### Desktop (1024px+)
- Landing page headings: 6.5-9rem (104-144px)
- Body text: 1.75rem (28px)
- Card headings: 18-20px

---

## 10. COLOR SCHEME

### Typography Colors
- **Page Heading (H1):** #8B0000 (Deep red)
- **Section Heading (H2):** #1A1A1A (Dark grey)
- **Card Heading (H3):** #3D2817 (Dark chocolate brown)
- **Card Heading Overlay:** #FFFFFF (White)
- **Body Text:** #1A1A1A (Dark grey)
- **Secondary Text:** #808080 (Grey)
- **Accent Text:** #FF6B35, #EA580C (Orange)

---

## Summary

The app uses a consistent typography hierarchy with:
- **Noto Serif Display** (serif) for all headings (H1, H2, H3, H4), section headings, and card headings
- **IBM Plex Serif** (serif) for body text and paragraphs
- **Courier Prime** (monospace) for all buttons, toasts, and notifications
- **Component-based typography** (SectionHeading, CardHeading) for consistency
- **Responsive sizing** that scales appropriately across devices
- **Hardcoded classes** for landing page sections (heading-pin-food, heading-cook-watch-mobile, etc.)

## Recent Updates (Latest)

- ✅ Changed all headings from Georgia to **Noto Serif Display**
- ✅ Changed body text from Roboto/SF Pro to **IBM Plex Serif**
- ✅ Changed all buttons, toasts, and notifications to **Courier Prime**
- ✅ Updated CardHeading font sizes: sm (18px), md (20px), lg (32px)
- ✅ Fixed font-size override issues with global h3 styles

