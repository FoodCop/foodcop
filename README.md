# FuzoFoodCop - Food Discovery & Social Platform

A comprehensive food application built with Vite + React + TypeScript that integrates with multiple APIs and services for restaurant discovery, social features, and real-time chat.

## Project Overview

FuzoFoodCop is a food-focused social application featuring:
- **Restaurant Discovery**: Google Places API integration for finding nearby restaurants
- **AI-Powered Features**: OpenAI integration for smart recommendations
- **Real-time Chat**: Direct messaging with friend system
- **Social Feed**: Share and discover food experiences
- **Recipe Management**: Save and explore recipes
- **Location Services**: Geocoding and map integration

## Tech Stack

- **Frontend**: Vite, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Styling**: Tailwind CSS, Radix UI components
- **APIs**: 
  - Google Places API
  - OpenAI API
  - Spoonacular API
  - YouTube API
- **Deployment**: Vercel (Frontend), Supabase Functions (Backend)

## Key Features

### 🍽️ Restaurant Discovery
- Nearby restaurant recommendations
- Advanced filtering and search
- Interactive map view
- Restaurant details and reviews

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

### 🎯 Additional Features
- Recipe saving and management
- Dietary preferences
- Location-based content
- Responsive design (mobile-first)

## Known Issues & In Progress

### Chat & Social Features
- **User Discovery**: Currently debugging the "Find Friends" feature where users list may not load properly
  - Issue: Query may be executing but returning no results
  - Debugging logs added to track fetch process
- **Friend Requests**: Loading state improvements added with error handling

### UI Improvements
- Recently updated all modal/dialog backgrounds from transparent (`bg-background`) to solid white (`bg-white`) for consistency
- Chat message area background updated to match component design system

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── auth/      # Authentication components
│   ├── chat/      # Messaging components
│   ├── friends/   # Friend management
│   ├── feed/      # Social feed
│   └── ui/        # Base UI components (buttons, dialogs, etc.)
├── services/      # API integration services
├── stores/        # State management (Zustand)
├── hooks/         # Custom React hooks
├── types/         # TypeScript definitions
└── utils/         # Utility functions
```

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

- Fixed chat drawer background transparency issues
- Added error handling to friend request loading
- Improved user discovery modal with authentication checks
- Updated all dialog components to use solid white backgrounds

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
