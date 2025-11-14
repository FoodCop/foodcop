# Landing Page (Home) - Complete Image Inventory

## Overview
This document catalogs all images, placeholders, and visual assets used in the FUZO Landing Page located in `src/components/home/`.

---

## Hero Section
Location: `HeroSection.tsx`

### 1. Tako Mascot Image
- **Current Source**: `/api/placeholder/400/400`
- **Usage**: Main hero illustration
- **Alt Text**: "Tako mascot illustration"
- **Component**: `<ImageWithFallback>`
- **Status**: ⚠️ PLACEHOLDER - Needs real asset

### 2. Hero Background Image
- **Current Source**: `/api/placeholder/1200/800`
- **Usage**: Background with overlay (white/85% opacity + backdrop blur)
- **Component**: Inline style with backgroundImage
- **Status**: ⚠️ PLACEHOLDER - Needs real asset

---

## Pin Food Section
Location: `PinFoodSection.tsx`  
Background: Yellow (#FFD74A)

### PhoneFan Component (3 phones):

#### 3. Left Phone - Saved Recipes/Bookmarks
- **URL**: `https://images.unsplash.com/photo-1668644437036-acd445abab3e`
- **Query**: saved recipes bookmark
- **Alt Text**: "Saved food favorites - left"
- **Status**: ✅ Unsplash image

#### 4. Center Phone - Favorite Dishes Collection
- **URL**: `https://images.unsplash.com/photo-1606226459865-be58c137453e`
- **Query**: favorite dishes collection
- **Alt Text**: "Saved food favorites - center"
- **Status**: ✅ Unsplash image

#### 5. Right Phone - Food Wishlist Planning
- **URL**: `https://images.unsplash.com/photo-1578960281840-cb36759fb109`
- **Query**: food wishlist planning
- **Alt Text**: "Saved food favorites - right"
- **Status**: ✅ Unsplash image

---

## Cook Watch Section
Location: `CookWatchSection.tsx`  
Background: Dark overlay on kitchen image

### 6. Section Background Image
- **URL**: `https://images.unsplash.com/photo-1654064755996-80036b6e6984`
- **Query**: cooking kitchen utensils background
- **Usage**: Full section background with dark overlay (rgba(11, 31, 58, 0.7))
- **Status**: ✅ Unsplash image

### PhoneFan Component (3 phones):

#### 7. Left Phone - Cooking Video Recipe
- **URL**: `https://images.unsplash.com/photo-1758522488003-f48d8b40ea82`
- **Query**: cooking video recipe
- **Alt Text**: "FUZO cooking recipes - left"
- **Status**: ✅ Unsplash image

#### 8. Center Phone - Food Plating Chef
- **URL**: `https://images.unsplash.com/photo-1731007530051-42866cac7e80`
- **Query**: food plating chef
- **Alt Text**: "FUZO cooking recipes - center"
- **Status**: ✅ Unsplash image

#### 9. Right Phone - Kitchen Cooking Steps
- **URL**: `https://images.unsplash.com/photo-1760383710574-73f43fd3370d`
- **Query**: kitchen cooking steps
- **Alt Text**: "FUZO cooking recipes - right"
- **Status**: ✅ Unsplash image

---

## Food Storyboard Section
Location: `FoodStoryboardSection.tsx`  
Background: Dark overlay on colorful food dishes

### 10. Section Background Image
- **URL**: `https://images.unsplash.com/photo-1552166539-2ec8888dd801`
- **Query**: food flat lay colorful dishes
- **Usage**: Full section background with dark overlay (rgba(0, 0, 0, 0.5))
- **Status**: ✅ Unsplash image

### PhoneFan Component (3 phones):

#### 11. Left Phone - Social Media Food
- **URL**: `https://images.unsplash.com/photo-1548809685-e3831a2aaa5f`
- **Query**: social media food
- **Alt Text**: "Food stories - left"
- **Status**: ✅ Unsplash image

#### 12. Center Phone - Food Photography Share
- **URL**: `https://images.unsplash.com/photo-1708335583165-57aa131a4969`
- **Query**: food photography share
- **Alt Text**: "Food stories - center"
- **Status**: ✅ Unsplash image

#### 13. Right Phone - Food Blogger Story
- **URL**: `https://images.unsplash.com/photo-1665110180279-ee5372bb96bb`
- **Query**: food blogger story
- **Alt Text**: "Food stories - right"
- **Status**: ✅ Unsplash image

---

## Tako Buddy Section
Location: `TakoBuddySection.tsx`  
Background: White

### PhoneFan Component (3 phones):

#### 14. Left Phone - AI Chatbot Assistant
- **URL**: `https://images.unsplash.com/photo-1757310998437-b2e8a7bd2e97`
- **Query**: AI chatbot assistant
- **Alt Text**: "Tako AI assistant - left"
- **Status**: ✅ Unsplash image

#### 15. Center Phone - Mobile Chat App
- **URL**: `https://images.unsplash.com/photo-1646766677899-9c1750e28b0f`
- **Query**: mobile chat app
- **Alt Text**: "Tako AI assistant - center"
- **Status**: ✅ Unsplash image

#### 16. Right Phone - Octopus Cute Illustration
- **URL**: `https://images.unsplash.com/photo-1753778367032-2ee16109a430`
- **Query**: octopus cute illustration
- **Alt Text**: "Tako AI assistant - right"
- **Status**: ✅ Unsplash image

---

## Explore Food Section
Location: `ExploreFoodSection.tsx`  
Background: Gradient (yellow #FFD74A to red #F14C35)

### PhoneFan Component (3 phones):

#### 17. Left Phone - Restaurant Food Discovery
- **URL**: `https://images.unsplash.com/photo-1760985174940-8ab7c193aba5`
- **Query**: restaurant food discovery
- **Alt Text**: "Food exploration - left"
- **Status**: ✅ Unsplash image

#### 18. Center Phone - Street Food Market
- **URL**: `https://images.unsplash.com/photo-1524584830732-b69165ddba9a`
- **Query**: street food market
- **Alt Text**: "Food exploration - center"
- **Status**: ✅ Unsplash image

#### 19. Right Phone - Food Menu Variety
- **URL**: `https://images.unsplash.com/photo-1553701275-1d6118df60bf`
- **Query**: food menu variety
- **Alt Text**: "Food exploration - right"
- **Status**: ✅ Unsplash image

---

## Phone Mockup Specifications
Component: `PhoneFan.tsx` → `PhoneMockup` sub-component

### Frame Properties:
- **Background Color**: `#0B1F3A` (Dark blue)
- **Border**: 4px solid `#0B1F3A`
- **Border Radius**: `rounded-4xl` (40px on medium+)
- **Padding**: 2-3 responsive units
- **Shadow**: `shadow-2xl` + custom inset shadow

### Screen Properties:
- **Background**: White
- **Border Radius**: `rounded-3xl` / `rounded-4xl`
- **Content**: `<ImageWithFallback>` with `object-cover`

### Notch:
- **Position**: Absolute top center
- **Size**: 80-96px width × 20-24px height
- **Shape**: Rounded bottom (`rounded-b-2xl`)
- **Color**: `#0B1F3A`

### Home Indicator:
- **Position**: Absolute bottom center
- **Size**: 64-80px width × 4-6px height
- **Shape**: Fully rounded (`rounded-full`)
- **Color**: Gray-300

### Responsive Sizes:
| Breakpoint | Width | Height |
|------------|-------|--------|
| Small      | 160px | 320px  |
| Medium     | 200px | 400px  |
| Large      | 240px | 480px  |

### Animations:
- **Left Phone**: Rotates -15° (counterclockwise) on scroll
- **Center Phone**: Moves up 100px on scroll
- **Right Phone**: Rotates +15° (clockwise) on scroll
- **Transform Origin**: Bottom center
- **Scroll Trigger**: Uses Framer Motion `useScroll` and `useTransform`

---

## Color Palette Used

### Primary Colors:
- **FUZO Orange**: `#F14C35`
- **FUZO Yellow**: `#FFD74A`
- **Navy Blue**: `#0B1F3A`

### Neutral Colors:
- **White**: `#FFFFFF`
- **Gray-600**: Text secondary
- **Gray-300**: UI elements
- **Black**: Text overlays with opacity

### Gradients:
- **Explore Section**: `from-[#FFD74A] to-[#F14C35]`

---

## Image Summary

### Total Assets:
- **2 Placeholders** (Need replacement)
  - Tako mascot
  - Hero background
- **15 Unsplash Images** (Phone screens)
- **2 Unsplash Backgrounds** (Section backgrounds)

### All Images Use:
- `<ImageWithFallback>` component for error handling
- Proper alt text for accessibility
- `object-cover` for consistent aspect ratios
- Unsplash referral parameters

---

## Action Items for Styling Streamline:

### High Priority:
1. ⚠️ Replace Tako mascot placeholder with real asset
2. ⚠️ Replace hero background placeholder with real asset
3. Consider creating optimized versions of Unsplash images (current are full-size)
4. Add loading states for images
5. Consider lazy loading for phone mockup images

### Medium Priority:
6. Ensure all Unsplash images have proper licensing/attribution
7. Create fallback images for ImageWithFallback component
8. Optimize image sizes for mobile (currently using 1080px width)
9. Consider using WebP format for better performance

### Low Priority:
10. Add skeleton loaders for image placeholders
11. Consider adding blur-up loading technique
12. Evaluate CDN usage for faster image delivery

---

## File Structure:
```
src/components/home/
├── App.tsx
└── components/
    ├── CookWatchSection.tsx (3 phone images + 1 background)
    ├── ExploreFoodSection.tsx (3 phone images)
    ├── FoodStoryboardSection.tsx (3 phone images + 1 background)
    ├── FuzoButton.tsx
    ├── FuzoCard.tsx
    ├── FuzoFooter.tsx
    ├── FuzoNavigation.tsx
    ├── HeroSection.tsx (1 mascot + 1 background)
    ├── LandingPage.tsx (Main orchestrator)
    ├── PhoneFan.tsx (Reusable phone mockup component)
    ├── PinFoodSection.tsx (3 phone images)
    └── TakoBuddySection.tsx (3 phone images)
```

---

## Notes:
- All phone mockup images are displayed in a fan layout with scroll-based animations
- Each section uses the PhoneFan component which displays 3 phones simultaneously
- Background images use gradient overlays for text readability
- Color scheme is consistent across all sections (Orange, Yellow, Navy Blue)
- All components are responsive with mobile-first design
