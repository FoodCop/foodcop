# FuzoFoodCop - Food Discovery & Social Platform

A comprehensive food application built with Vite + React + TypeScript featuring a unique **seed-based content delivery system** that provides diverse, engaging content through multiple APIs and services.

## Recent Updates (Jan 26, 2026)

### 🎨 Design System Overhaul
- **Unified Color Theme**: Standardized all pages to use `bg-page-profile` (#951A21) for easy future theme changes
- **Navigation Styling**: Menu bar updated to golden yellow (#f8b44a) with profile red hover states
- **Scout Sidebar**: Changed to vibrant pink (#ac0039) for better visual hierarchy
- **Tako AI Chat Widget**: Full styling refresh with custom frame color (#bb6155), white input boxes, and profile red buttons
- **CSS Cleanup**: Removed 78+ lines of unused tokens and font definitions

### �️ Bites & Trims Styling
- **Recipe Cards**: Menu-bar yellow background (#FFC909), brown outline (#a36027), and black text for readability
- **Section Headings**: "Recommended for You" and "You Might Also Like" now match Scout title treatment (white, larger)
- **Trims Cards**: Deep burgundy outlines (#500200) with neon pink info panels (#ac0039) and white titles
- **Type Safety**: Recipe shape tightened (required fields, `extendedIngredients.original` enforced) to keep builds clean

### �🎬 Animation & Motion Improvements
- **Smooth Card Dealing**: Optimized Framer Motion spring physics with higher damping (28) for jerk-free animations
- **Sequential Batch Transitions**: Cards now exit smoothly before new batch enters, preventing layout thrashing
- **Feed Desktop**: Full bleed images for ads/trivia with overlaid Fuzo badges

### 🖼️ Feed System Enhancements
- **Ad/Trivia Cards**: Full bleed `object-cover` with badge positioning
- **Image Loading**: Debug logging for network diagnostics
- **Responsive Design**: Maintained mobile/desktop parity

## Project Overview

FuzoFoodCop is a food-focused social application featuring:
- **Seed-Based Feed System**: Deterministic card dealing algorithm ensures balanced content distribution
- **Restaurant Discovery**: Google Places API + Local JSON data with 206 generated images
- **Video Content**: YouTube cooking videos and tutorials
- **Recipe Integration**: Spoonacular API for diverse recipes
- **Ads & Trivia**: Vertical format cards for engagement and monetization (now with full-bleed images)
- **Real-time Chat**: Direct messaging with friend system
- **Location Services**: Geocoding and map integration

## Tech Stack

- **Frontend**: Vite, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Styling**: Tailwind CSS, Radix UI components, Framer Motion
- **Animation**: Framer Motion with optimized spring physics
- **APIs**: 
  - Google Places API (Maps & Locations)
  - OpenAI API (Smart recommendations)
  - Spoonacular API (Recipes)
  - YouTube API (Cooking videos)
- **Deployment**: Vercel (Frontend), Supabase Functions (Backend)

## Key Features

### 🎲 Seed-Based Content Delivery System
- **Deterministic Dealing**: Each session generates a unique seed that determines card order
- **Balanced Distribution**: Every 6-card cycle contains:
  - 1 Restaurant (from local JSON/generated images)
  - 1 Recipe (Spoonacular)
  - 1 Video (YouTube)
  - 1 Maps Location (Google Places)
  - 1 Ad (vertical format, full-bleed)
  - 1 Trivia (vertical format, full-bleed)
- **Shuffled Pattern**: Seed shuffles the order for variety while maintaining balance
- **Fallback Logic**: Graceful handling when APIs fail (falls back to restaurants)

### 🍽️ Restaurant Discovery
- **Local Data First**: 49 Mumbai locations with 206 AI-generated images
- **Google Maps Integration**: Real-time location data with "maps-" prefix distinction
- **Advanced Filtering**: Cuisine, price range, distance
- **Interactive Views**: Desktop card flip mechanic, mobile swipe interface

### 📺 Content Variety
- **Video Cards**: YouTube cooking tutorials with creator info
- **Recipe Cards**: Detailed recipes with prep time, difficulty, servings
- **Trivia Cards**: 59 food trivia images (full vertical display)
- **Ad Cards**: 75 monetization-ready vertical ads (full vertical display)

### 👥 Social Features
- Friend system with requests
- Real-time direct messaging
- Activity feed
- User profiles with location

### 💬 Chat System
- Direct messaging between friends
- Message retention (30 days)
- Conversation management
- Unread badges and notifications

## Known Issues & In Progress

### Content Delivery
- **Spoonacular API**: Experiencing timeouts (6000ms limit) - recipes currently fall back to restaurant cards
- **Recipe Caching**: 24-hour cache helps reduce API calls when available
- **Video Integration**: YouTube API working correctly with 5 videos per batch

### Feed System
- **Seed Dealer**: Successfully implemented in both FeedDesktop and FeedMobile
- **Card Distribution**: Balanced 6-card cycle pattern operational
- **Fallback Logic**: Recipes/videos gracefully fall back to restaurants when APIs fail

### UI/UX
- **Ads & Trivia**: Display as full vertical images (object-contain) without details
- **Desktop Cards**: Flip mechanic with face-down dealing animation
- **Mobile Cards**: Swipe interface with hint overlays

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── chat/          # Messaging components
│   ├── friends/       # Friend management
│   ├── feed/          # Social feed (FeedMobile, FeedDesktop, TriviaCard)
│   ├── common/        # AdBanner, BottomAdBanner
│   └── ui/            # Base UI components (buttons, dialogs, etc.)
├── services/          # API integration services
│   ├── feedService.ts # Feed generation with parallel API orchestration
│   ├── spoonacular.ts # Recipe API
│   ├── youtube.ts     # Video API
│   └── googlePlaces.ts# Maps & locations
├── utils/             # Utility functions
│   └── seedDealer.ts  # Seed-based card dealing algorithm
├── config/            # Configuration files
│   ├── adsConfig.ts   # 75 vertical ads
│   └── triviaConfig.ts# 59 vertical trivia cards
├── stores/            # State management (Zustand)
├── hooks/             # Custom React hooks
├── types/             # TypeScript definitions
│   ├── trivia.ts      # TriviaItem interface
│   └── feed-content.ts# FeedCard union types
└── data/              # Local JSON data
    └── MasterSet_*.json # Restaurant data by city

public/
├── generated-images/  # 206 AI-generated restaurant images (v2)
├── ads/
│   └── Vertical/      # 55 vertical ad images (F_V_*.png)
└── trivia/
    └── vertical/      # 59 trivia images (TRIV_V_*.png)
```

## Architecture

### Seed-Based Content Delivery

**Core Algorithm** (`src/utils/seedDealer.ts`):
```typescript
// Generates balanced seed: [1,2,3,4,5,6] then shuffles
generateSeed(): string

// Maps seed digits to card types:
// 1=restaurant, 2=recipe, 3=video, 4=maps, 5=ad, 6=trivia
parseSeedPattern(seed: string): string[]

// Deals cards following seed pattern with wraparound
dealCardsWithSeed(feedCards, seed, totalCards): DealerContent[]
```

**Feed Service Flow** (`src/services/feedService.ts`):
1. Parallel API calls (restaurants, recipes, videos, maps)
2. Returns raw FeedCard[] without shuffling
3. Seed dealer handles mixing with ads/trivia
4. Desktop & mobile both use seed system

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- API keys for Google Places, OpenAI, Spoonacular, YouTube

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_PLACES_API_KEY=your_google_api_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_SPOONACULAR_API_KEY=your_spoonacular_key
VITE_YOUTUBE_API_KEY=your_youtube_key
```

### Running Locally
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

## Database Schema

### Key Tables
- `users` - User profiles and authentication
- `friend_requests` - Friend relationships
- `dm_conversations` - Direct message conversations
- `dm_messages` - Chat messages
- `saved_recipes` - User recipe collections
- `posts` - Social feed content

## Contributing

When making changes:
1. Follow TypeScript best practices
2. Use proper error handling for all API calls
3. Maintain responsive design patterns
4. Update this README with significant changes
5. Test chat and social features thoroughly

## Recent Updates

### January 2026 - Seed-Based Feed System
- ✅ Implemented deterministic seed dealer algorithm
- ✅ Removed masterbot feature (consolidated into generated images)
- ✅ Added Google Maps cards (maps- prefix for distinction)
- ✅ Integrated 59 trivia cards from vertical folder
- ✅ Ads display as full vertical images (object-contain)
- ✅ FeedDesktop now uses seed dealer (was filtering restaurants only)
- ✅ Recipe/video fallback logic when APIs timeout
- ✅ Parallel API orchestration with timeout management
- ✅ 206 generated restaurant images loaded from v2 metadata

### UI/UX Improvements
- Fixed chat drawer background transparency issues
- Updated all dialog components to solid white backgrounds
- Desktop: Card flip mechanic with deal animation
- Mobile: Swipe interface with directional hints
- Ads & Trivia: Full vertical display without text overlays

## License

This project is proprietary.

---

## Technical Notes

### ESLint Configuration

For production applications, you can enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
