# Card Design Unification Plan

## Executive Summary
This plan outlines the strategy to unify card designs across Recipe Cards, Restaurant Cards, and Trim/Video Cards throughout the application. The goal is to create a consistent visual language that improves user experience and makes future color scheme customization easier.

---

## Current State Analysis

### 1. Recipe Cards

#### `src/components/bites/components/RecipeCard.tsx`
- **Heading**: `<h3 className="mb-3">`
  - Color: Default (inherited)
  - Size: Default (base)
  - Weight: Default (normal)
- **Issues**: No explicit styling, relies on defaults

#### `src/components/bites/BitesDesktop.tsx` (RecipeCard component)
- **Heading**: `<h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">`
  - Color: `text-foreground` (theme variable)
  - Size: `text-xl` (1.25rem / 20px)
  - Weight: `font-bold` (700)
- **Issues**: Uses theme variable, different from other cards

#### `src/components/trims/components/Trims.tsx` (RecipeCard in feed)
- **Heading**: `<h2 className="text-white mb-2">`
  - Color: `text-white` (on gradient overlay)
  - Size: Default
  - Weight: Default
- **Issues**: White text on overlay, different context

### 2. Restaurant Cards

#### `src/components/tako/components/RestaurantCard.tsx`
- **Heading**: `<h3 className="text-lg font-bold text-gray-900 line-clamp-1">`
  - Color: `text-gray-900` (hardcoded gray)
  - Size: `text-lg` (1.125rem / 18px)
  - Weight: `font-bold` (700)
- **Issues**: Hardcoded gray color

#### `src/components/feed/components/feed/cards/RestaurantCard.tsx`
- **Heading**: `<h2 className="text-white">`
  - Color: `text-white` (on gradient overlay)
  - Size: Default
  - Weight: Default
- **Issues**: White text on overlay, different context

#### `src/components/plate/PlateDesktop.tsx` (RestaurantCardComponent)
- **Heading**: `<h3 className="font-bold mb-1 line-clamp-1" style={{ fontSize: '18pt', color: '#EA580C' }}>`
  - Color: `#EA580C` (hardcoded orange)
  - Size: `18pt` (24px)
  - Weight: `font-bold` (700)
- **Issues**: Inline styles, hardcoded orange color

### 3. Trim/Video Cards

#### `src/components/trims/TrimsDesktop.tsx` (VideoCard)
- **Heading**: `<h3 className="text-[#1A1A1A] font-semibold text-base line-clamp-2 mb-1.5">`
  - Color: `#1A1A1A` (hardcoded dark gray)
  - Size: `text-base` (1rem / 16px)
  - Weight: `font-semibold` (600)
- **Issues**: Hardcoded color, semibold instead of bold

#### `src/components/trims/TrimsMobile.tsx` (VideoCard)
- **Heading**: `<h3 className="text-[#1A1A1A] font-semibold text-base line-clamp-2 mb-1.5">`
  - Color: `#1A1A1A` (hardcoded dark gray)
  - Size: `text-base` (1rem / 16px)
  - Weight: `font-semibold` (600)
- **Issues**: Same as desktop version

#### `src/components/trims/components/Trims.tsx` (VideoCard)
- **Heading**: `<h3 className="line-clamp-2">`
  - Color: Default (inherited)
  - Size: Default
  - Weight: Default
- **Issues**: No explicit styling

---

## Problems Identified

### 1. **Color Inconsistencies**
- Hardcoded colors: `#EA580C`, `#1A1A1A`, `text-gray-900`
- Theme variables: `text-foreground`
- Context-specific: `text-white` (on overlays)
- Default/inherited colors

### 2. **Font Size Inconsistencies**
- Default sizes (inherited)
- `text-base` (16px)
- `text-lg` (18px)
- `text-xl` (20px)
- `18pt` (24px) - inline style

### 3. **Font Weight Inconsistencies**
- Default (normal/400)
- `font-semibold` (600)
- `font-bold` (700)

### 4. **Implementation Inconsistencies**
- Mix of Tailwind classes and inline styles
- Some use theme variables, others use hardcoded values
- Different approaches for same card types

---

## Proposed Solution

### Phase 1: Create Unified Card Design System

#### 1.1 Define Design Tokens
Create a centralized design token system in `src/styles/card-tokens.css` or extend `tailwind.config.ts`:

```typescript
// Design Tokens for Cards
const cardDesignTokens = {
  heading: {
    color: {
      default: 'text-[#1A1A1A]',        // Primary heading color
      overlay: 'text-white',            // For cards with gradient overlays
      accent: 'text-[#EA580C]',        // Accent color (can be theme variable)
    },
    size: {
      sm: 'text-base',                  // 16px - for compact cards
      md: 'text-lg',                    // 18px - standard cards
      lg: 'text-xl',                    // 20px - featured cards
    },
    weight: {
      normal: 'font-normal',            // 400
      semibold: 'font-semibold',       // 600
      bold: 'font-bold',                // 700
    },
  },
  // Standard heading configuration
  standard: {
    className: 'text-lg font-bold text-[#1A1A1A]',
  },
  // Overlay heading configuration (for cards with gradient overlays)
  overlay: {
    className: 'text-lg font-bold text-white',
  },
}
```

#### 1.2 Create Reusable Card Heading Component
Create `src/components/ui/card-heading.tsx`:

```typescript
interface CardHeadingProps {
  children: React.ReactNode;
  variant?: 'default' | 'overlay' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'semibold' | 'bold';
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
  lineClamp?: 1 | 2 | 3;
}

export function CardHeading({
  children,
  variant = 'default',
  size = 'md',
  weight = 'bold',
  className = '',
  as: Component = 'h3',
  lineClamp,
}: CardHeadingProps) {
  const variantClasses = {
    default: 'text-[#1A1A1A]',
    overlay: 'text-white',
    accent: 'text-[#EA580C]',
  };

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const lineClampClasses = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
  };

  return (
    <Component
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${weightClasses[weight]}
        ${lineClamp ? lineClampClasses[lineClamp] : ''}
        ${className}
      `.trim()}
    >
      {children}
    </Component>
  );
}
```

#### 1.3 Update Tailwind Config
Add custom card heading utilities to `tailwind.config.ts`:

```typescript
extend: {
  // Card heading utilities
  colors: {
    'card-heading': '#1A1A1A',
    'card-heading-accent': '#EA580C',
  },
  fontSize: {
    'card-heading-sm': ['1rem', { lineHeight: '1.5', fontWeight: '700' }],
    'card-heading-md': ['1.125rem', { lineHeight: '1.5', fontWeight: '700' }],
    'card-heading-lg': ['1.25rem', { lineHeight: '1.5', fontWeight: '700' }],
  },
}
```

### Phase 2: Standardize Card Implementations

#### 2.1 Standard Card Heading Configuration
**Standard Cards (white background):**
- Color: `#1A1A1A` (dark gray/black)
- Size: `text-lg` (18px)
- Weight: `font-bold` (700)
- Class: `text-lg font-bold text-[#1A1A1A]`

**Overlay Cards (gradient overlay):**
- Color: `text-white`
- Size: `text-lg` (18px)
- Weight: `font-bold` (700)
- Class: `text-lg font-bold text-white`

**Accent Cards (featured/promoted):**
- Color: `#EA580C` (orange)
- Size: `text-lg` (18px) or `text-xl` (20px) for featured
- Weight: `font-bold` (700)
- Class: `text-lg font-bold text-[#EA580C]` or `text-xl font-bold text-[#EA580C]`

#### 2.2 Implementation Priority

**High Priority (Most Visible):**
1. `src/components/plate/PlateDesktop.tsx` - RestaurantCardComponent
2. `src/components/bites/BitesDesktop.tsx` - RecipeCard
3. `src/components/trims/TrimsDesktop.tsx` - VideoCard
4. `src/components/trims/TrimsMobile.tsx` - VideoCard

**Medium Priority:**
5. `src/components/bites/components/RecipeCard.tsx`
6. `src/components/tako/components/RestaurantCard.tsx`
7. `src/components/trims/components/Trims.tsx` - VideoCard

**Low Priority (Feed Cards - Different Context):**
8. `src/components/feed/components/feed/cards/RestaurantCard.tsx`
9. `src/components/feed/components/feed/cards/RecipeCard.tsx`

### Phase 3: Migration Strategy

#### Step 1: Create Design Tokens
- [ ] Create `src/styles/card-tokens.css` or extend `tailwind.config.ts`
- [ ] Define color variables for card headings
- [ ] Define size and weight standards

#### Step 2: Create CardHeading Component
- [ ] Create `src/components/ui/card-heading.tsx`
- [ ] Add TypeScript types
- [ ] Add Storybook stories (if applicable)
- [ ] Test component with all variants

#### Step 3: Update High Priority Cards
- [ ] Update `PlateDesktop.tsx` RestaurantCardComponent
- [ ] Update `BitesDesktop.tsx` RecipeCard
- [ ] Update `TrimsDesktop.tsx` VideoCard
- [ ] Update `TrimsMobile.tsx` VideoCard

#### Step 4: Update Medium Priority Cards
- [ ] Update `RecipeCard.tsx` (bites/components)
- [ ] Update `RestaurantCard.tsx` (tako/components)
- [ ] Update `Trims.tsx` VideoCard

#### Step 5: Review Feed Cards
- [ ] Decide if feed cards should follow same standard or have separate overlay variant
- [ ] Update feed cards accordingly

#### Step 6: Testing & Validation
- [ ] Visual regression testing
- [ ] Check all card instances across app
- [ ] Verify responsive behavior
- [ ] Test with different color schemes (if applicable)

### Phase 4: Future Customization Support

#### 4.1 Theme Variable Integration
Replace hardcoded colors with CSS variables or Tailwind theme:

```css
:root {
  --card-heading-color: #1A1A1A;
  --card-heading-accent: #EA580C;
  --card-heading-overlay: #FFFFFF;
}
```

#### 4.2 Tailwind Theme Extension
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'card-heading': 'var(--card-heading-color)',
      'card-heading-accent': 'var(--card-heading-accent)',
      'card-heading-overlay': 'var(--card-heading-overlay)',
    },
  },
}
```

#### 4.3 Dark Mode Support
Add dark mode variants:
```typescript
dark: {
  'card-heading': '#FFFFFF',
  'card-heading-accent': '#FF6B35',
}
```

---

## Recommended Standard Configuration

### Standard Card Heading (Most Common)
```tsx
<h3 className="text-lg font-bold text-[#1A1A1A] line-clamp-2">
  {title}
</h3>
```

**Breakdown:**
- **Size**: `text-lg` (18px) - Readable, not too large
- **Weight**: `font-bold` (700) - Clear hierarchy
- **Color**: `#1A1A1A` - High contrast, professional
- **Line Clamp**: `line-clamp-2` - Prevents overflow, maintains layout

### Overlay Card Heading (Gradient Overlays)
```tsx
<h3 className="text-lg font-bold text-white line-clamp-2">
  {title}
</h3>
```

### Accent Card Heading (Featured/Promoted)
```tsx
<h3 className="text-xl font-bold text-[#EA580C] line-clamp-2">
  {title}
</h3>
```

---

## Benefits of Unification

1. **Consistency**: All cards will have the same visual hierarchy
2. **Maintainability**: Single source of truth for card styling
3. **Customization**: Easy to change color scheme globally
4. **Accessibility**: Consistent contrast ratios
5. **Developer Experience**: Clear patterns to follow
6. **Scalability**: Easy to add new card types

---

## Implementation Timeline

### Week 1: Foundation
- Day 1-2: Create design tokens and CardHeading component
- Day 3-4: Update high priority cards
- Day 5: Testing and refinement

### Week 2: Completion
- Day 1-2: Update medium priority cards
- Day 3: Review and update feed cards
- Day 4-5: Final testing, documentation, and cleanup

---

## Success Metrics

1. **Visual Consistency**: All card headings use same size, weight, and color (where applicable)
2. **Code Quality**: No hardcoded colors in card components
3. **Maintainability**: Single component/utility for card headings
4. **Customization**: Color scheme can be changed in one place
5. **Accessibility**: All headings meet WCAG contrast requirements

---

## Notes

- Feed cards (swipe cards) may need special consideration due to overlay design
- Some cards may need size variations (sm/md/lg) based on context
- Consider responsive typography (smaller on mobile)
- Ensure line-clamp is consistent across all cards
- Test with actual content to ensure truncation works properly

---

## Next Steps

1. Review and approve this plan
2. Create design tokens
3. Build CardHeading component
4. Begin migration starting with high priority cards
5. Iterate based on feedback

