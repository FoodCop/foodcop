# Fonts and Font Sizes Documentation

## Global Font Configuration

### Primary Font
- **Font Family**: `Roboto` (weights: 300, 400, 500, 700, 900)
- **Source**: Google Fonts (loaded in `index.html`)
- **Usage**: Default font for all text elements (body, headings, buttons, inputs)
- **Fallback**: `system-ui, sans-serif`

### Secondary Fonts
- **Poppins**: Used in specific components (Snap, Feed, Discover)
- **Be Vietnam Pro**: Used in Toasts.html
- **Georgia, serif**: Defined but not actively used
- **JetBrains Mono, monospace**: Defined but not actively used

### Base Font Size
- **Desktop/Mobile**: `16px` (defined in `index.css` as `--font-size`)
- **App.css Override**: `10pt` (applied globally via `*` selector)

---

## Page-by-Page Font Sizes

### 1. Landing Page (`/landing`)

#### Desktop Version
- **Hero Title**: `text-5xl md:text-7xl` (48px / 72px) - Bold
- **Hero Subtitle**: `text-xl md:text-2xl` (20px / 24px)
- **Section Headings**: `text-3xl md:text-5xl lg:text-6xl` (30px / 48px / 60px) - Bold
- **Section Descriptions**: `text-lg md:text-xl lg:text-2xl` (18px / 20px / 24px)
- **Buttons**: `text-lg` (18px) - Bold
- **Navigation Icons**: `text-xl` (20px)

#### Mobile Version
- **Hero Title**: `text-4xl` (36px) - Bold
- **Section Headings**: `text-3xl` (30px) - Bold
- **Section Descriptions**: `text-lg` (18px)
- **Buttons**: `text-lg` (18px) - Bold

**Font**: Roboto (default)

---

### 2. Authentication Page (`/auth`)

#### Desktop & Mobile
- **Base Font Size**: `10pt` (via inline style)
- **Logo**: Image-based (no text)
- **Form Labels**: Default (inherits 10pt)
- **Form Inputs**: Default (inherits 10pt)
- **Buttons**: Default (inherits 10pt)
- **Error Messages**: `text-[8pt]` (8pt) - Gray

**Font**: Roboto (default)

---

### 3. Feed Page (`/feed`)

#### Desktop Version (`FeedDesktop.tsx`)
- **Card Title**: `text-2xl` (24px) - Bold
- **Card Price**: `text-sm` (14px) - Semibold
- **Card Location**: `text-sm` (14px)
- **Card Tags**: `text-sm` (14px)

#### Mobile Version (`FeedMobile.tsx`)
- **Card Title**: `text-2xl` (24px) - Bold
- **Card Location**: `text-sm` (14px)
- **Card Badge**: `text-sm` (14px) - Semibold
- **Action Buttons**: `text-lg` (18px) - Semibold
- **Card Description**: `text-sm` (14px)
- **Card Tags**: `text-xs` (12px) - Medium

**Font**: Roboto (default)

---

### 4. Scout Page (`/scout`)

#### Desktop Version (`ScoutDesktop.tsx`)
- **Page Title**: `text-2xl` (24px) - Bold
- **Distance Display**: `text-sm` (14px) - Semibold
- **Distance Labels**: `text-xs` (12px)
- **Restaurant Name**: `text-lg` (18px) - Bold
- **Restaurant Rating**: `text-sm` (14px) - Medium
- **Restaurant Details**: `text-xs` (12px)
- **Filter Buttons**: `text-sm` (14px) - Medium
- **Error Messages**: `text-base` (16px) - Semibold
- **Empty State**: `text-base` (16px) - Semibold

#### Mobile Version (`ScoutNew.tsx`)
- **Page Title**: `text-2xl` (24px) - Bold
- **Distance Display**: `text-sm` (14px) - Bold
- **Distance Labels**: `text-xs` (12px)
- **Restaurant Name**: `text-lg` (18px) - Bold
- **Restaurant Rating**: `text-sm` (14px) - Medium
- **Restaurant Details**: `text-xs` (12px)
- **Filter Buttons**: `text-sm` (14px) - Medium
- **Error Messages**: `text-base` (16px) - Semibold
- **Empty State**: `text-base` (16px) - Semibold
- **Location Label**: `text-xs` (12px) - Medium
- **Restaurant Count**: `text-sm` (14px)

**Font**: Roboto (default)

---

### 5. Plate/Dashboard Page (`/plate`)

#### Desktop Version (`PlateDesktop.tsx`)
- **User Name**: `text-2xl` (24px) - Bold
- **User Bio**: Default (inherits base)
- **Points/Stats Numbers**: `text-2xl` (24px) - Bold
- **Points/Stats Labels**: `text-xs` (12px)
- **Level Name**: `text-sm` (14px) - Semibold
- **Level Number**: `text-xs` (12px)
- **Tab Labels**: `text-sm` (14px) - Medium
- **Card Titles**: `text-xl` (20px) - Bold
- **Card Content**: `text-sm` (14px)
- **Card Metadata**: `text-xs` (12px)
- **Buttons**: `text-sm` (14px) - Medium
- **Empty State**: `text-xl` (20px) - Bold
- **Empty State Description**: `text-sm` (14px)
- **Video Duration**: `text-xs` (12px) - Bold
- **Post Content**: Default (inherits base)
- **Post Metadata**: `text-sm` (14px)

#### Mobile Version (`PlateMobile.tsx`)
- **User Name**: `text-xl md:text-2xl` (20px / 24px) - Bold
- **User Bio**: `text-sm md:text-base` (14px / 16px)
- **Points/Stats Numbers**: `text-xl md:text-2xl` (20px / 24px) - Bold
- **Points/Stats Labels**: `text-xs` (12px)
- **Level Name**: `text-sm` (14px) - Semibold
- **Level Number**: `text-xs` (12px)
- **Tab Labels**: `text-sm` (14px) - Medium
- **Card Titles**: `text-xl` (20px) - Bold
- **Card Content**: `text-sm` (14px)
- **Card Metadata**: `text-xs` (12px)
- **Buttons**: `text-sm` (14px) - Medium
- **Empty State**: `text-xl` (20px) - Bold
- **Empty State Description**: `text-sm` (14px)
- **Video Duration**: `text-xs` (12px) - Bold
- **Post Content**: Default (inherits base)
- **Post Metadata**: `text-sm` (14px)

**Font**: Roboto (default)

---

### 6. Bites Page (`/bites`)

#### Desktop Version (`BitesDesktop.tsx`)
- **Section Headings**: `text-2xl` (24px) - Bold
- **Filter Buttons**: `text-sm` (14px) - Medium
- **Recipe Title**: Default (inherits base)
- **Recipe Metadata**: `text-xs` (12px) - Medium
- **Recipe Time**: `text-xs` (12px) - Medium
- **Empty State**: `text-lg` (18px)

#### Mobile Version (`BitesNewMobile.tsx`)
- **Search Input**: `text-sm` (14px)
- **Search Results Count**: `text-sm` (14px)
- **Recipe Title**: `text-base` (16px) - Bold
- **Recipe Rating**: `text-sm` (14px) - Semibold
- **Recipe Description**: `text-sm` (14px)
- **Recipe Time**: `text-xs` (12px)
- **Recipe Calories**: `text-xs` (12px)
- **Dietary Tags**: `text-xs` (12px) - Medium
- **Action Buttons**: `text-sm` (14px) - Medium
- **Filter Headings**: `text-sm` (14px) - Semibold
- **Category Labels**: `text-xs` (12px) - Medium
- **Section Headings**: `text-lg` (18px) - Bold
- **See All Links**: `text-sm` (14px) - Medium
- **Trending Recipe Title**: `text-sm` (14px) - Bold

#### Recipe Modal (`RecipeModal.tsx`)
- **Recipe Title**: `text-3xl` (30px) - Bold
- **Recipe Badge**: `text-sm` (14px) - Medium
- **Stat Numbers**: `text-2xl` (24px) - Bold
- **Stat Labels**: `text-sm` (14px)
- **Section Headings**: `text-xl` (20px) - Bold
- **Ingredient Text**: Default (inherits base)
- **Step Number**: Default (inherits base) - Bold
- **Step Text**: Default (inherits base)
- **Nutrition Headings**: `text-lg` (18px) - Bold
- **Nutrition Labels**: `text-sm` (14px)
- **Nutrition Values**: Default (inherits base) - Bold

**Font**: Roboto (default)

---

### 7. Trims Page (`/trims`)

#### Desktop Version (`TrimsDesktop.tsx`)
- **Filter Heading**: `text-lg` (18px) - Bold
- **Filter Labels**: `text-sm` (14px) - Semibold
- **Filter Options**: `text-sm` (14px)
- **Search Input**: Default (inherits base)
- **Category Buttons**: `text-sm` (14px) - Medium
- **Video Title**: `text-base` (16px) - Semibold
- **Channel Name**: `text-sm` (14px)
- **Video Duration**: `text-xs` (12px) - Medium
- **Modal Title**: `text-xl` (20px) - Bold
- **Modal Channel**: `text-base` (16px)
- **Modal Views**: `text-sm` (14px)

#### Mobile Version (`TrimsMobile.tsx`)
- **Search Input**: `text-sm` (14px)
- **Category Buttons**: `text-sm` (14px) - Medium
- **Error Icon**: `text-2xl` (24px)
- **Error Heading**: `text-lg` (18px) - Bold
- **Error Message**: `text-sm` (14px)
- **Empty State Heading**: `text-lg` (18px) - Bold
- **Empty State Message**: `text-sm` (14px)
- **Video Title**: `text-base` (16px) - Semibold
- **Channel Name**: `text-sm` (14px)
- **Video Duration**: `text-xs` (12px) - Medium
- **Modal Title**: `text-lg` (18px) - Bold
- **Modal Channel**: `text-sm` (14px)
- **Modal Views**: `text-xs` (12px)

**Font**: Roboto (default)

---

### 8. Snap Page (`/snap`)

#### Mobile Version (`SnapNew.tsx`)
- **Welcome Title**: `text-xl` (20px) - Bold (Poppins font)
- **Welcome Description**: `text-sm` (14px)
- **Content Text**: `text-sm` (14px)
- **List Items**: Default (inherits base)
- **Button Text**: Default (inherits base) - Semibold
- **Saved Title**: `text-2xl` (24px) - Bold (Poppins font)
- **Form Labels**: `text-sm` (14px) - Semibold
- **Form Inputs**: Default (inherits base)
- **Cuisine Buttons**: `text-sm` (14px) - Medium
- **Rating Label**: `text-sm` (14px) - Semibold
- **Description Label**: `text-sm` (14px) - Semibold
- **Error Messages**: `text-sm` (14px)
- **Success Messages**: `text-sm` (14px)
- **Ready Title**: `text-xl` (20px) - Bold (Poppins font)
- **Badge Text**: `text-xs` (12px) - Semibold

**Font**: Poppins (for headings), Roboto (for body text)

---

### 9. Onboarding Page (`/onboarding`)

**Font**: Roboto (default)
- Uses standard Tailwind text size classes
- Sizes vary by component (typically `text-base`, `text-lg`, `text-xl`)

---

## Component-Specific Font Sizes

### Cards

#### Feed Cards
- **Title**: `text-2xl` (24px) - Bold
- **Subtitle**: `text-sm` (14px)
- **Tags**: `text-xs` (12px) - Medium
- **Actions**: `text-sm` (14px) - Semibold

#### Restaurant Cards (Scout)
- **Name**: `text-lg` (18px) - Bold
- **Rating**: `text-sm` (14px) - Medium
- **Distance**: `text-xs` (12px)
- **Price Level**: `text-xs` (12px)
- **Cuisine Tags**: `text-xs` (12px) - Medium

#### Recipe Cards (Bites)
- **Title**: `text-base` (16px) - Bold (mobile) / Default (desktop)
- **Rating**: `text-sm` (14px) - Semibold
- **Description**: `text-sm` (14px)
- **Metadata**: `text-xs` (12px)
- **Tags**: `text-xs` (12px) - Medium

#### Video Cards (Trims)
- **Title**: `text-base` (16px) - Semibold
- **Channel**: `text-sm` (14px)
- **Duration**: `text-xs` (12px) - Medium

#### Post Cards (Plate)
- **Content**: Default (inherits base)
- **Metadata**: `text-sm` (14px)
- **Author**: `text-sm` (14px)

### Buttons

#### Primary Buttons
- **Standard**: `text-sm` (14px) - Medium
- **Large**: `text-lg` (18px) - Bold/Semibold
- **Small**: `text-xs` (12px) - Medium

#### Secondary Buttons
- **Standard**: `text-sm` (14px) - Medium
- **Small**: `text-xs` (12px) - Medium

### Navigation

#### Desktop Navigation
- **Nav Links**: `text-sm` (14px) - Medium
- **Logo**: Image-based

#### Mobile Navigation
- **Icons**: Image-based
- **Labels**: `text-xs` (12px) (if present)

### Forms

#### Input Fields
- **Standard**: Default (inherits base, typically 16px)
- **Small**: `text-sm` (14px)
- **Labels**: `text-sm` (14px) - Semibold
- **Placeholders**: Default (inherits base)
- **Error Messages**: `text-sm` (14px) or `text-[8pt]` (8pt)

### Modals/Dialogs

#### Titles
- **Large**: `text-2xl` (24px) - Bold
- **Medium**: `text-xl` (20px) - Bold
- **Small**: `text-lg` (18px) - Bold

#### Content
- **Standard**: Default (inherits base)
- **Small**: `text-sm` (14px)
- **Metadata**: `text-xs` (12px)

### Toast Notifications

#### Desktop/Mobile
- **Title**: `text-base` (16px) - Semibold
- **Message**: `text-sm` (14px)
- **Button**: `text-sm` (14px) - Medium

**Font**: Be Vietnam Pro (in Toasts.html)

---

## Mobile-Specific Font Sizes

### Mobile Feed Cards (`mobile.css`)
- **Card Title**: `18px` (1.125rem) - Weight: 600
- **Card Subtitle**: `14px` (0.875rem)
- **Action Buttons**: `14px` (0.875rem) - Weight: 500

### Mobile Chat (`mobile.css`)
- **Input**: `16px` (prevents iOS zoom)
- **Message Text**: Default (inherits base)
- **Unread Badge**: `11px` - Weight: 700
- **Reaction Text**: `12px`

---

## Tailwind Font Size Reference

| Class | Size (px) | Size (rem) | Usage |
|-------|-----------|------------|-------|
| `text-xs` | 12px | 0.75rem | Small labels, metadata, tags |
| `text-sm` | 14px | 0.875rem | Body text, buttons, descriptions |
| `text-base` | 16px | 1rem | Default body text, inputs |
| `text-lg` | 18px | 1.125rem | Section headings, large buttons |
| `text-xl` | 20px | 1.25rem | Page titles, card titles |
| `text-2xl` | 24px | 1.5rem | Major headings, large titles |
| `text-3xl` | 30px | 1.875rem | Hero titles, modal titles |
| `text-4xl` | 36px | 2.25rem | Large hero titles (mobile) |
| `text-5xl` | 48px | 3rem | Large hero titles (desktop) |
| `text-6xl` | 60px | 3.75rem | Extra large headings |
| `text-7xl` | 72px | 4.5rem | Maximum hero titles |

### Custom Sizes
- `text-[8pt]`: 8pt (used in auth error messages)
- `text-[10pt]`: 10pt (used in App.css override)

---

## Font Weights

| Weight | Class | Usage |
|--------|-------|-------|
| 300 | `font-light` | Light text (rarely used) |
| 400 | `font-normal` | Normal body text |
| 500 | `font-medium` | Buttons, labels, medium emphasis |
| 600 | `font-semibold` | Headings, important text |
| 700 | `font-bold` | Major headings, titles |
| 900 | `font-black` | Extra bold (rarely used) |

---

## Responsive Font Sizes

Many components use responsive font sizes with Tailwind's breakpoint prefixes:

- `md:text-*`: Medium screens (768px+)
- `lg:text-*`: Large screens (1024px+)

**Example**: `text-4xl md:text-5xl lg:text-6xl`
- Mobile: 36px
- Tablet: 48px
- Desktop: 60px

---

## Notes

1. **Base Font Size**: The app uses `10pt` as a global override in `App.css`, but most components use Tailwind classes which default to `16px` (1rem).

2. **Font Loading**: Roboto is loaded from Google Fonts in `index.html` with weights 300, 400, 500, 700, 900.

3. **Poppins Usage**: Poppins is used in specific components (Snap, Feed, Discover) but is not globally loaded. It's applied via `font-[Poppins]` class.

4. **Be Vietnam Pro**: Only used in `Toasts.html` standalone file, loaded via CDN.

5. **Mobile Optimization**: Chat inputs use `16px` minimum to prevent iOS zoom on focus.

6. **Accessibility**: Most interactive elements meet minimum touch target sizes (44px) with appropriate font sizes for readability.

