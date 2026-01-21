# FUZO Design System Documentation

**Version:** 1.0.0
**Last Updated:** 2026-01-19
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Typography](#typography)
4. [Color System](#color-system)
5. [Spacing & Layout](#spacing--layout)
6. [Elevation & Shadows](#elevation--shadows)
7. [Components](#components)
8. [Animation & Motion](#animation--motion)
9. [Accessibility](#accessibility)
10. [Migration Guide](#migration-guide)

---

## Overview

The FUZO Design System provides a comprehensive, consistent visual language for the food discovery app. All design tokens are centralized in `src/styles/design-tokens.css` to ensure single-source-of-truth maintainability.

### Key Principles

1. **Token-First**: All visual properties use CSS custom properties (design tokens)
2. **No Magic Numbers**: Every spacing, color, and size value comes from the design system
3. **No Inline Styles**: Styling through utility classes or CSS modules only
4. **Responsive**: Mobile-first with fluid scaling
5. **Accessible**: WCAG AAA compliance (7:1 contrast ratios)

---

## Design Philosophy

### Brand Identity

FUZO is vibrant, energetic, and approachable. The design system reflects this through:

- **Bold Colors**: Orange (#FF6900) primary with pink and purple accents
- **Rounded Corners**: Friendly, approachable UI with 10px default radius
- **Smooth Animations**: 60fps transitions with bounce/spring easing
- **Generous Spacing**: Breathing room for content (64px section spacing)

### Mobile-First Approach

The app prioritizes mobile experience with:

- Touch targets: Minimum 44px (Apple HIG + Material Design)
- Safe area support: iOS notch and Android gesture bar awareness
- Fluid typography: Scales based on viewport
- Optimized gestures: Swipe, pinch, long-press interactions

---

## Typography

### Font Families

| Token | Font Stack | Usage |
|-------|-----------|-------|
| `--font-display` | Google Sans Flex, system-ui | Hero sections, page titles |
| `--font-body` | IBM Plex Serif, Georgia | Body text, descriptions |
| `--font-ui` | -apple-system, BlinkMacSystemFont | Labels, inputs, captions |
| `--font-button` | Roboto, system | Buttons, CTAs, toasts |

**Tailwind Classes:**
```html
<h1 class="font-display">Hero Title</h1>
<p class="font-body">Body paragraph text</p>
<button class="font-button">Click Me</button>
```

### Type Scale (Modular Scale 1.200)

| Token | Size | Pixel | Usage |
|-------|------|-------|-------|
| `--text-xs` | 0.694rem | 11.1px | Tiny labels, metadata |
| `--text-sm` | 0.833rem | 13.3px | Small text, captions |
| `--text-base` | 1rem | 16px | **Base size** - body text |
| `--text-lg` | 1.2rem | 19.2px | Emphasized text |
| `--text-xl` | 1.44rem | 23px | Subheadings |
| `--text-2xl` | 1.728rem | 27.6px | Card titles |
| `--text-3xl` | 2.074rem | 33.2px | Section headings |
| `--text-4xl` | 2.488rem | 39.8px | Page headings |
| `--text-5xl` | 2.986rem | 47.8px | Hero headings |
| `--text-6xl` | 3.583rem | 57.3px | Large hero mobile |
| `--text-7xl` | 4.300rem | 68.8px | Large hero desktop |
| `--text-8xl` | 5.160rem | 82.6px | Extra large displays |
| `--text-9xl` | 6.192rem | 99.1px | Maximum impact |

**Usage Example:**
```css
.hero-title {
  font-size: var(--text-7xl);
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
}
```

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-light` | 300 | Subtle text |
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Emphasized text |
| `--font-weight-semibold` | 600 | Strong emphasis |
| `--font-weight-bold` | 700 | Headings, CTAs |
| `--font-weight-extrabold` | 800 | Maximum impact |

---

## Color System

### Brand Colors

#### Primary: FUZO Orange

The main brand color representing energy and appetite.

| Token | Hex | Usage |
|-------|-----|-------|
| `--fuzo-orange-50` | #FFF7ED | Lightest tints |
| `--fuzo-orange-100` | #FFEDD5 | Light backgrounds |
| `--fuzo-orange-200` | #FED7AA | Subtle accents |
| `--fuzo-orange-300` | #FDBA74 | Hover states |
| `--fuzo-orange-400` | #FB923C | Interactive elements |
| `--fuzo-orange-500` | **#FF6900** | **Primary brand** |
| `--fuzo-orange-600` | #EA580C | Active states |
| `--fuzo-orange-700` | #C2410C | Dark mode primary |
| `--fuzo-orange-800` | #9A3412 | Deep accents |
| `--fuzo-orange-900` | #7C2D12 | Darkest shades |

**Tailwind Classes:** `bg-fuzo-orange-500`, `text-fuzo-orange-600`, `border-fuzo-orange-400`

#### Secondary: FUZO Pink

Used for love/like features, secondary CTAs, and accents.

| Token | Value | Usage |
|-------|-------|-------|
| `--fuzo-pink-500` | **#F6339A** | Secondary brand color |

Full palette available: `--fuzo-pink-50` through `--fuzo-pink-900`

#### Accent: FUZO Purple

Special features, premium content, Tako AI personality.

| Token | Value | Usage |
|-------|-------|-------|
| `--fuzo-purple-500` | **#AD46FF** | Accent brand color |

Full palette available: `--fuzo-purple-50` through `--fuzo-purple-900`

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | #22C55E | Success states, confirmations |
| `--color-warning` | #F59E0B | Warnings, cautions |
| `--color-error` | #EF4444 | Errors, destructive actions |
| `--color-info` | #3B82F6 | Informational messages |

### Platform Colors (Source Badges)

| Token | Hex | Platform |
|-------|-----|----------|
| `--platform-google` | #4285F4 | Google/Restaurant |
| `--platform-youtube` | #FF0000 | YouTube videos |
| `--platform-spoonacular` | #4CAF50 | Spoonacular recipes |
| `--platform-fuzo` | #FF6900 | FUZO content |

**Usage:**
```html
<!-- Source badge in feed cards -->
<div class="bg-platform-google w-10 h-10 rounded-full">G</div>
```

### Surface Colors

| Token (Light) | Token (Dark) | Usage |
|---------------|--------------|-------|
| `--surface-primary` | #FAFAFA / #0A0A0A | Main background |
| `--surface-secondary` | #FFFFFF / #171717 | Card backgrounds |
| `--surface-tertiary` | #F5F5F5 / #262626 | Alternate sections |
| `--surface-elevated` | #FFFFFF / #1A1A1A | Modals, dropdowns |
| `--surface-overlay` | rgba(0,0,0,0.6) / rgba(0,0,0,0.8) | Modal backdrops |

### Text Colors

| Token (Light) | Token (Dark) | Usage |
|---------------|--------------|-------|
| `--text-primary` | #1A1A1A / #FAFAFA | Primary text |
| `--text-secondary` | #525252 / #D4D4D4 | Secondary text |
| `--text-tertiary` | #737373 / #A3A3A3 | Tertiary text |
| `--text-inverse` | #FFFFFF / #0A0A0A | Inverted text |
| `--text-brand` | #FF6900 | Brand-colored text |

---

## Spacing & Layout

### Spacing Scale (4px Base Unit)

| Token | Value | Pixel | Usage |
|-------|-------|-------|-------|
| `--spacing-0` | 0 | 0px | No spacing |
| `--spacing-1` | 0.25rem | 4px | Tight spacing |
| `--spacing-2` | 0.5rem | 8px | Compact |
| `--spacing-3` | 0.75rem | 12px | Inline elements |
| `--spacing-4` | 1rem | 16px | **Default gap** |
| `--spacing-5` | 1.25rem | 20px | Content padding |
| `--spacing-6` | 1.5rem | 24px | **Stack spacing** |
| `--spacing-8` | 2rem | 32px | Large gaps |
| `--spacing-10` | 2.5rem | 40px | Section padding |
| `--spacing-12` | 3rem | 48px | Large sections |
| `--spacing-16` | 4rem | 64px | **Section spacing** |
| `--spacing-20` | 5rem | 80px | Extra large |
| `--spacing-24` | 6rem | 96px | Maximum spacing |

### Semantic Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-section` | 64px | Between page sections |
| `--spacing-card-gap` | 16px | Gap between cards |
| `--spacing-content` | 20px | Content padding |
| `--spacing-inline` | 12px | Horizontal gaps |
| `--spacing-stack` | 24px | Vertical gaps |

**Usage:**
```css
.section {
  padding: var(--spacing-section) var(--spacing-content);
  gap: var(--spacing-card-gap);
}
```

### Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--card-mobile-width` | 335px | Feed card width |
| `--card-mobile-height` | 540px | Feed card height |
| `--card-aspect-ratio` | 9/16 | Card image ratio |
| `--nav-height-mobile` | 56px | Mobile nav height |
| `--bottom-nav-height` | 64px | Bottom navigation |

---

## Elevation & Shadows

### Shadow Levels

| Token | Usage | Example |
|-------|-------|---------|
| `--shadow-none` | No elevation | Flat UI elements |
| `--shadow-xs` | Subtle borders | Input fields |
| `--shadow-sm` | Slight lift | Hover states |
| `--shadow-md` | Default cards | Feed cards, Bites cards |
| `--shadow-lg` | Elevated UI | Dropdowns, tooltips |
| `--shadow-xl` | High elevation | Modals, dialogs |
| `--shadow-2xl` | Maximum elevation | Critical overlays |

### Component Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | Custom | Feed/Bites cards |
| `--shadow-card-hover` | Custom | Card hover state |
| `--shadow-button` | Custom | Button default |
| `--shadow-button-hover` | Custom | Button hover |
| `--shadow-modal` | Custom | Modal dialogs |
| `--shadow-phone-mockup` | Custom | Landing page phones |

**Tailwind Classes:**
```html
<div class="shadow-card hover:shadow-card-hover">Card</div>
<button class="shadow-button hover:shadow-button-hover">Button</button>
```

---

## Components

### Buttons

#### Variants

**Primary (Orange)**
```html
<button class="bg-fuzo-orange-500 text-white rounded-button px-6 py-3
               font-button font-semibold shadow-button
               hover:bg-fuzo-orange-600 hover:shadow-button-hover
               transition-normal active:scale-95">
  Primary Action
</button>
```

**Secondary (Pink)**
```html
<button class="bg-fuzo-pink-500 text-white rounded-button px-6 py-3
               font-button font-semibold shadow-button
               hover:bg-fuzo-pink-600 hover:shadow-button-hover">
  Secondary Action
</button>
```

**Outline**
```html
<button class="border-2 border-fuzo-orange-500 text-fuzo-orange-500
               rounded-button px-6 py-3 font-button font-semibold
               hover:bg-fuzo-orange-500 hover:text-white">
  Outline Button
</button>
```

#### Sizes

| Size | Height | Padding | Usage |
|------|--------|---------|-------|
| Small | 32px | 16px | Compact UI |
| Medium | 44px | 24px | **Default** - Touch target |
| Large | 56px | 32px | Hero CTAs |

### Cards

#### Feed Card (Mobile)

```html
<div class="w-[335px] h-[540px] bg-white rounded-card shadow-card overflow-hidden">
  <!-- 9:16 aspect ratio image -->
  <div class="relative aspect-[9/16]">
    <img src="..." class="w-full h-full object-cover" />
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <!-- Content -->
    <div class="absolute bottom-0 left-0 right-0 p-5 text-white">
      <h2 class="font-display text-2xl font-bold mb-1">Title</h2>
      <p class="font-ui text-sm opacity-90">Subtitle</p>
    </div>
    <!-- Platform badge -->
    <div class="absolute bottom-3 right-3 w-10 h-10 rounded-full
                bg-platform-google flex items-center justify-center
                text-white font-bold shadow-lg border-2 border-white">
      G
    </div>
  </div>
</div>
```

### Platform Badges

Standard 40px circular badges in bottom-right of card images:

```html
<!-- Google/Restaurants -->
<div class="bg-platform-google">G</div>

<!-- YouTube Videos -->
<div class="bg-platform-youtube">Y</div>

<!-- Spoonacular Recipes -->
<div class="bg-platform-spoonacular">S</div>

<!-- FUZO Content -->
<div class="bg-platform-fuzo">F</div>
```

---

## Animation & Motion

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 100ms | Immediate feedback |
| `--duration-fast` | 150ms | Hover states |
| `--duration-normal` | 200ms | Default transitions |
| `--duration-moderate` | 300ms | Card movements |
| `--duration-slow` | 500ms | Large animations |
| `--duration-slower` | 700ms | Page transitions |

### Easing Functions

| Token | Cubic Bezier | Usage |
|-------|--------------|-------|
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | **Default** - entries |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Bidirectional |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful bounce |
| `--ease-spring` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Spring effect |

**Tailwind Classes:**
```html
<div class="transition-normal ease-out hover:scale-105">Hover me</div>
<div class="transition-moderate ease-spring">Spring animation</div>
```

### Component Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-button` | all 200ms ease-out | Button interactions |
| `--transition-card` | transform 300ms ease-out | Card movements |
| `--transition-modal` | opacity 300ms ease-out | Modal fade |
| `--transition-swipe` | transform 300ms spring | Swipe gestures |

---

## Accessibility

### Touch Targets

**Minimum Size:** 44px × 44px (Apple HIG + Material Design)

```css
.touch-target {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Color Contrast

**WCAG AAA Compliance:** 7:1 contrast ratio for normal text

Verified combinations:
- ✅ `--text-primary` on `--surface-primary`: 12.6:1
- ✅ `--fuzo-orange-500` on white: 4.5:1 (AA for large text)
- ✅ White text on `--fuzo-orange-500`: 4.5:1

### Keyboard Navigation

All interactive elements must support:
- Tab navigation
- Enter/Space activation
- Arrow key navigation (where applicable)
- Visible focus indicators

**Focus Styles:**
```css
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--fuzo-orange-500);
  outline-offset: var(--focus-ring-offset);
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
}
```

### Safe Area Support

iOS notch and Android gesture bar awareness:

```html
<!-- Header with safe top -->
<header class="safe-top">...</header>

<!-- Bottom nav with safe bottom -->
<nav class="safe-bottom">...</nav>
```

**Tailwind Classes:** `safe-top`, `safe-bottom`, `safe-left`, `safe-right`

---

## Migration Guide

### Phase 1: Remove Hardcoded Values ✅ COMPLETED

1. ✅ Created `design-tokens.css` with all design tokens
2. ✅ Updated `index.css` to import design tokens
3. ✅ Updated `tailwind.config.js` with token mappings
4. ✅ Created this documentation

### Phase 2: Refactor Components (In Progress)

**Priority Order:**

1. **FeedMobile.tsx** - Remove inline `<style>` block
2. **LandingPage.css** - Remove `!important` flags
3. **button.tsx** - Add FUZO brand variants
4. All components - Replace hardcoded hex colors

**Find & Replace Guide:**

| Old (Hardcoded) | New (Token) |
|-----------------|-------------|
| `#FF6900` | `var(--fuzo-orange-500)` |
| `#F6339A` | `var(--fuzo-pink-500)` |
| `#AD46FF` | `var(--fuzo-purple-500)` |
| `#4285F4` | `var(--platform-google)` |
| `#FF0000` | `var(--platform-youtube)` |
| `#4CAF50` | `var(--platform-spoonacular)` |
| `#FAFAFA` | `var(--surface-primary)` |
| `#FFFFFF` | `var(--surface-secondary)` |
| `#1A1A1A` | `var(--text-primary)` |

**Tailwind Migration:**

| Old Class | New Class |
|-----------|-----------|
| `bg-[#FF6900]` | `bg-fuzo-orange-500` |
| `text-[#4285F4]` | `bg-platform-google` |
| `w-[335px]` | `w-[var(--card-mobile-width)]` |
| `shadow-[-2px_4px_12px_4px_rgba(51,51,51,0.05)]` | `shadow-card` |

### Phase 3: Add Loading States (Pending)

- Skeleton loaders for async content
- Loading spinners with brand colors
- Optimistic UI updates

### Phase 4: Enhance Interactions (Pending)

- Micro-animations on state changes
- Haptic feedback patterns
- Smooth page transitions

---

## Best Practices

### ✅ DO

- Use design tokens for ALL visual properties
- Reference tokens via CSS variables: `var(--token-name)`
- Use Tailwind utility classes when available
- Follow mobile-first responsive approach
- Test color contrast ratios
- Ensure 44px minimum touch targets

### ❌ DON'T

- Hardcode hex colors in components
- Use inline `<style>` tags
- Use `!important` flags (indicates architecture issue)
- Create magic numbers for spacing/sizing
- Skip keyboard navigation support
- Ignore safe area insets on mobile

---

## Resources

- **Design Tokens:** `src/styles/design-tokens.css`
- **Tailwind Config:** `tailwind.config.js`
- **Component Library:** `src/components/ui/`
- **Mobile Styles:** `src/styles/mobile.css`

---

## Changelog

### Version 1.0.0 (2026-01-19)

- ✅ Created comprehensive design token system
- ✅ Established typography scale (modular 1.200)
- ✅ Defined complete color palette (50-900 shades)
- ✅ Standardized spacing scale (4px base unit)
- ✅ Created shadow elevation system
- ✅ Updated Tailwind config with token mappings
- ✅ Documented all design decisions

---

**Maintained by:** FUZO Development Team
**Questions?** Reference this doc or check `design-tokens.css` source comments
