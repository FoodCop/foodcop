# Typography Hierarchy Analysis & Proposal

## Current State - The Problem

### Confusion Identified:
1. **Semantic HTML (h1, h2, h3) is being overridden with inline styles**
2. **No clear separation between Card Headings and Section Headings**
3. **Inconsistent sizing across similar elements**
4. **Inline styles prevent global changes**

---

## Current Typography Usage

### 1. CARD HEADINGS (Titles on Cards)
**What they are:** Recipe titles, restaurant names, video titles on cards

**Current Implementation:**
- Component: `CardHeading` (renders as `<h3>`)
- Font: Georgia (serif) ✅
- Color: Orange (#EA580C) ✅
- Sizes:
  - `sm`: 18px (text-lg)
  - `md`: 20px (text-xl) - **Most common**
  - `lg`: 24px (text-2xl) - **For featured cards**
- Weight: Bold (700) ✅
- Usage: Recipe cards, restaurant cards, video/trim cards

**Examples:**
- "Sausage & Pepperoni Stromboli" (recipe card)
- "Cafe Lumière" (restaurant card)
- "How to make donuts differently" (video card)

---

### 2. SECTION HEADINGS (Page Section Titles)
**What they are:** "My Crew", "Saved Recipes", "Nearby Restaurants", "Recommended For You"

**Current Implementation - INCONSISTENT:**
- Semantic: `<h2>` tags
- Font: Georgia (serif) ✅ (from h2 default)
- Color: **MIXED** ❌
  - Orange (#EA580C) with inline styles in Plate components
  - Dark grey (#1A1A1A) in Dashboard components
  - text-foreground in Bites components
- Sizes: **HIGHLY INCONSISTENT** ❌
  - `16pt` (inline) in PlateDesktop/Mobile
  - `text-xl` (18px) in DashboardNew
  - `text-2xl` (24px) in DashboardNew desktop
  - `text-xl md:text-3xl` (responsive) in DashboardNew
  - `text-2xl` (24px) in BitesDesktop
  - `text-lg` (18px) in BitesNewMobile
- Weight: Bold (700) ✅
- **Problem:** All using inline styles or different Tailwind classes

**Examples:**
- "My Crew" - 16pt inline style (Plate) vs text-xl (Dashboard)
- "Saved Recipes" - 16pt inline style (Plate) vs text-xl md:text-3xl (Dashboard)
- "Recommended For You" - text-2xl (BitesDesktop) vs text-lg (BitesNewMobile)

---

### 3. PAGE HEADINGS (Main Page Titles)
**What they are:** User name at top, page titles

**Current Implementation:**
- Semantic: `<h1>` tags
- Font: Georgia (serif) ✅
- Color: Orange (#EA580C) with inline styles
- Size: 14pt (inline) - **Very inconsistent**
- Weight: Bold ✅

**Examples:**
- User display name at top of Plate page
- "Sign In Required" message

---

## Proposed Typography Hierarchy

### Level 1: Page Heading (H1)
- **Use Case:** Main page title, user name at top
- **Font:** Georgia (serif)
- **Size:** 24px (text-2xl) - Desktop, 20px (text-xl) - Mobile
- **Weight:** Bold (700)
- **Color:** Orange (#EA580C) - **Brand color for primary headings**
- **Component:** Use `<h1>` with standardized classes

### Level 2: Section Heading (H2)
- **Use Case:** "My Crew", "Saved Recipes", "Nearby Restaurants", "Recommended For You"
- **Font:** Georgia (serif)
- **Size:** 20px (text-xl) - Desktop, 18px (text-lg) - Mobile
- **Weight:** Bold (700)
- **Color:** Dark Grey (#1A1A1A) - **Consistent across all sections**
- **Component:** Create `SectionHeading` component

### Level 3: Card Heading (H3)
- **Use Case:** Recipe titles, restaurant names, video titles on cards
- **Font:** Georgia (serif)
- **Size:** 
  - Standard: 20px (text-xl) - `md` variant
  - Featured: 24px (text-2xl) - `lg` variant
  - Compact: 18px (text-lg) - `sm` variant
- **Weight:** Bold (700)
- **Color:** Orange (#EA580C) - **Brand color for card titles**
- **Component:** `CardHeading` (already exists) ✅

### Level 4: Subheading (H4)
- **Use Case:** Sub-sections, filter labels
- **Font:** Georgia (serif)
- **Size:** 16px (text-base)
- **Weight:** Semibold (600)
- **Color:** Dark Grey (#1A1A1A)

### Body Text (P)
- **Font:** SF Pro (system font stack)
- **Size:** 16px (text-base)
- **Weight:** Normal (400)
- **Color:** Inherits from foreground

---

## Implementation Plan

### Step 1: Create SectionHeading Component
```typescript
// src/components/ui/section-heading.tsx
interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}

export function SectionHeading({
  children,
  className = '',
  as: Component = 'h2',
}: SectionHeadingProps) {
  return (
    <Component className={cn(
      'font-serif',           // Georgia
      'font-bold',            // Bold (700)
      'text-xl',              // 20px desktop
      'md:text-xl',           // Keep 20px on larger screens
      'text-[#1A1A1A]',       // Dark grey
      className
    )}>
      {children}
    </Component>
  );
}
```

### Step 2: Update All Section Headings
Replace all section headings with `SectionHeading` component:
- "My Crew"
- "Saved Recipes"
- "Nearby Restaurants"
- "Trending Posts"
- "Recommended For You"
- "Filters"
- etc.

### Step 3: Standardize Page Headings (H1)
Create utility classes or component for H1:
- User name at top
- Page titles
- Main headings

### Step 4: Remove All Inline Styles
- Remove `style={{ fontSize: '16pt', color: '#EA580C' }}`
- Remove `style={{ color: '#EA580C' }}`
- Use components/classes instead

---

## Size Comparison Table

| Element Type | Current Sizes Found | Proposed Standard |
|-------------|-------------------|-------------------|
| **Page Heading (H1)** | 14pt inline, various | 24px (text-2xl) |
| **Section Heading (H2)** | 16pt, text-xl, text-2xl, text-3xl | 20px (text-xl) |
| **Card Heading (H3)** | 18px, 20px, 24px | 20px (md), 24px (lg) |
| **Subheading (H4)** | Various | 16px (text-base) |

---

## Benefits of This System

1. **Clear Hierarchy:** Each level has a distinct purpose
2. **Consistency:** Same element type = same styling
3. **Maintainability:** Change one component, affects all instances
4. **No Inline Styles:** All styling through components/classes
5. **Easy Global Changes:** Update component, all change
6. **Semantic HTML:** Proper use of h1, h2, h3, h4

---

## Migration Checklist

- [ ] Create `SectionHeading` component
- [ ] Update PlateDesktop section headings
- [ ] Update PlateMobile section headings
- [ ] Update DashboardNew section headings
- [ ] Update Dashboard section headings
- [ ] Update BitesDesktop section headings
- [ ] Update BitesNewMobile section headings
- [ ] Update all other components with section headings
- [ ] Remove all inline styles from headings
- [ ] Test all pages for consistency
- [ ] Document final hierarchy

---

## Current Font Settings Summary

### Card Headings (CardHeading Component)
- **Font:** Georgia (serif) ✅
- **Color:** Orange (#EA580C) ✅
- **Sizes:** sm=18px, md=20px, lg=24px ✅
- **Weight:** Bold (700) ✅

### Section Headings (Currently Inconsistent)
- **Font:** Georgia (serif) ✅
- **Color:** Mixed (orange inline, dark grey, text-foreground) ❌
- **Sizes:** 16pt, 18px, 20px, 24px, 30px ❌
- **Weight:** Bold (700) ✅

### Page Headings (Currently Inconsistent)
- **Font:** Georgia (serif) ✅
- **Color:** Orange (#EA580C) ✅
- **Sizes:** 14pt inline, various ❌
- **Weight:** Bold (700) ✅

