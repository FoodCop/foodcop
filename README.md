# 🐙 FUZO - Food Discovery App

> **Discover Amazing Food with Tako the Octopus!**

FUZO is a comprehensive food discovery platform featuring Tako the octopus mascot, designed with a complete brand system and powered by modern web technologies. Experience real-world food discovery with persistent user data, seamless navigation, and intelligent AI-powered recommendations.

## ✨ Features

### 🎯 Core Features

- **Real-time Food Discovery**: Find nearby restaurants with Google Maps integration
- **Persistent Saved Items**: Save restaurants to your "Plate" with backend persistence
- **Master Bots System**: 7 specialized food expert AI personalities with curated content
- **Smooth Onboarding**: Google OAuth integration with profile setup
- **Camera Functionality**: Snap and tag food photos
- **Chat System**: Real-time messaging with Stream Chat API
- **Recipe Discovery Hub**: Powered by Spoonacular API with real-time recipe recommendations
- **Today's Recipes**: Dynamic recipe cards with consistent sizing and real-time data
- **AI Assistant**: Tako-powered food recommendations with OpenAI
- **Fresh Profile System**: Users start with clean profiles and build their food journey
- **Visual Feedback**: Interactive save buttons with hover and click effects

### 🤖 Master Bots System

FUZO features 7 specialized Master Bots with curated restaurant content and unique personalities:

| Bot                   | Username         | Specialty                   | Location         | Points | Content Focus                |
| --------------------- | ---------------- | --------------------------- | ---------------- | ------ | ---------------------------- |
| **Aurelia Voss**      | @nomad_aurelia   | Street Food Explorer        | Global Nomad     | 8,470  | Street food gems worldwide   |
| **Sebastian LeClair** | @som_sebastian   | Fine Dining Expert          | Paris, France    | 9,240  | Michelin-starred experiences |
| **Lila Cheng**        | @plantbased_lila | Vegan Specialist            | Los Angeles, USA | 7,180  | Plant-based innovations      |
| **Rafael Mendez**     | @rafa_eats       | Adventure Foodie            | California, USA  | 6,920  | Adventure dining spots       |
| **Anika Kapoor**      | @spice_scholar   | Indian/Asian Cuisine Expert | Mumbai, India    | 8,150  | Authentic spice mastery      |
| **Omar Darzi**        | @coffee_pilgrim  | Coffee Culture Expert       | New York, USA    | 5,670  | Coffee culture documentation |
| **Jun Tanaka**        | @minimal_jun     | Japanese Cuisine Master     | Tokyo, Japan     | 6,780  | Zen culinary artistry        |

#### Bot Posts System

Each Master Bot maintains a curated collection of restaurant posts:

- **Persistent Content**: Real restaurant reviews stored in database
- **Authentic Recommendations**: Each bot's posts match their specialty (street food, fine dining, vegan, etc.)
- **Global Coverage**: Curated from 490 restaurants across 10 countries
- **Quality Curation**: Only 4.0+ star establishments featured
- **Personal Voice**: Unique writing style reflecting each bot's personality and expertise

### 🎨 Design System

- **Brand Colors**: Coral Red (#F14C35), Deep Orange-Brown (#A6471E), Navy (#0B1F3A), Yellow (#FFD74A)
- **Typography**: Red Hat Display + Roboto font system
- **Responsive Design**: Mobile-first with desktop support
- **Component Library**: Comprehensive UI components with Tailwind CSS v4

### 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **APIs**: Google Maps, OpenAI, Spoonacular, Stream Chat
- **Animation**: Motion (Framer Motion)
- **Icons**: Lucide React
- **UI Components**: Radix UI + Custom components
- **State Management**: React Context API with persistent data
- **Authentication**: Supabase Auth with Google OAuth
- **Data Persistence**: Real-time database with user-specific data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fuzo-app.git
cd fuzo-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# See ENVIRONMENT_GUIDE.md for details

# Start development server
npm run dev

# Open http://localhost:5173
```

## 📁 Project Structure

```
fuzo-app/
├── components/           # React components
│   ├── ui/              # Reusable UI components (buttons, cards, etc.)
│   ├── chat/            # Chat system components
│   ├── recipes/         # Recipe-related components
│   ├── snap/            # Camera functionality
│   └── ...
├── contexts/            # React contexts (Auth, etc.)
├── utils/               # Utility functions
├── styles/              # Global CSS and Tailwind config
├── supabase/            # Supabase edge functions
└── public/              # Static assets
```

## 🎨 Design Integration

### Figma Sync Workflow

1. **Dev Mode**: Use Figma Dev Mode to inspect components
2. **Copy Code**: Extract exact measurements and styles
3. **Sync Tokens**: Keep design tokens synchronized
4. **Visual Testing**: Ensure pixel-perfect implementation

See [FIGMA_SYNC_WORKFLOW.md](./FIGMA_SYNC_WORKFLOW.md) for detailed instructions.

### Brand Guidelines

- **Colors**: Use FUZO brand colors consistently
- **Typography**: Red Hat Display for headings, Roboto for body text
- **Spacing**: Follow 8px grid system
- **Components**: Use FUZO design system components

## 🔧 Development

### Available Commands

```bash
# Development
npm run dev              # Start dev server
npm run type-check       # TypeScript checking
npm run lint            # ESLint checking
npm run lint:fix        # Fix linting issues

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Database & Master Bots System
npm run seed:masterbots  # Seed Master Bot profiles to database
npm run seed:bot-posts   # Create curated bot posts from restaurant data
npm run test:bot-posts   # Test bot posts system and feed cards
npm run test:feed        # Test database feed connection
npm run test:restaurants # Analyze restaurant matching system
npm run test:mcp         # Test Supabase MCP connection
npm run setup:env        # Create .env.local template

# Testing
npm run test            # Run tests (when added)
```

See [DEVELOPMENT_COMMANDS.md](./DEVELOPMENT_COMMANDS.md) for comprehensive command reference.

### Environment Variables

Required environment variables (add to `.env.local`):

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ACCESS_TOKEN=your_supabase_access_token

# Google Services
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Food APIs
SPOONACULAR_API_KEY=your_spoonacular_api_key
```

See [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md) for detailed setup instructions.

## 🤖 Master Bots System

FUZO features a sophisticated AI-powered content system with 7 distinct Master Bot personalities that create authentic food content and drive community engagement.

### Master Bot Profiles

| Bot                   | Personality           | Specialties                                    | Location     |
| --------------------- | --------------------- | ---------------------------------------------- | ------------ |
| **Aurelia Voss**      | Street Food Explorer  | Hidden gems, markets, cultural experiences     | Global Nomad |
| **Sebastian LeClair** | Fine Dining Sommelier | Wine pairings, Michelin stars, technique       | Paris        |
| **Lila Cheng**        | Plant Pioneer         | Vegan innovation, sustainability, alternatives | Los Angeles  |
| **Rafael Mendez**     | Adventure Foodie      | Coastal cuisine, mountain dining, outdoor eats | California   |
| **Anika Kapoor**      | Spice Scholar         | Indian cuisine, Asian fusion, spice mastery    | Mumbai       |
| **Omar Darzi**        | Coffee Pilgrim        | Coffee culture, brewing methods, café spaces   | New York     |
| **Jun Tanaka**        | Zen Minimalist        | Japanese cuisine, sushi, traditional craft     | Tokyo        |

### Supabase MCP Integration

The project uses **Model Context Protocol (MCP)** for seamless Supabase integration:

```bash
# Setup MCP connection
npm run setup:env        # Create environment template
# Add your SUPABASE_ACCESS_TOKEN to .env.local

# Seed Master Bots
npm run seed:masterbots   # Populate all 7 Master Bot profiles
npm run test:mcp          # Verify MCP connection and data
```

### MCP Configuration

The MCP server is configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "your-project-ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

### Database Schema

Master Bots are stored in two main tables:

- **`users`** - Master Bot profiles with stats and social data
- **`master_bots`** - AI configurations, specialties, and system prompts

Each bot has a unique personality, system prompt, and specialization for authentic content generation.

## 🏗️ Architecture

### Frontend Architecture

- **React 18**: Modern React with concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Utility-first styling with custom design tokens
- **Motion**: Smooth animations and transitions
- **Component-based**: Modular, reusable components

### Backend Architecture

- **Supabase**: PostgreSQL database with real-time subscriptions
- **Edge Functions**: Serverless API endpoints
- **Authentication**: Supabase Auth with social login support
- **Storage**: File uploads and management

### API Integration

- **Google Maps**: Location services and restaurant discovery
- **OpenAI**: AI-powered food recommendations with Tako personality
- **Spoonacular**: Recipe database and nutritional information
- **Stream Chat**: Real-time messaging infrastructure

## 🔐 Security

- **Environment Variables**: Secure API key management
- **Authentication**: Supabase Auth with JWT tokens
- **CORS**: Proper cross-origin request handling
- **Data Validation**: Input validation on all API endpoints

## 📱 Features Deep Dive

### Navigation System

- **Bottom Navigation**: Feed, Scout, Snap, Bites
- **Top Header**: Chat, Profile, Hamburger menu (in order)
- **Responsive**: Adapts to mobile and desktop
- **Seamless Navigation**: Smooth transitions between pages with persistent state

### Food Discovery & Saving System

- **Real-time Restaurant Search**: Google Places API integration for nearby restaurants
- **Interactive Save Buttons**: Visual feedback with hover and click animations
- **Persistent Saved Items**: Restaurants saved to your "Plate" persist across sessions
- **Cross-page Synchronization**: Saved items appear in both Scout and Profile pages
- **Fresh User Experience**: New users start with clean profiles and build their food journey

### Tako AI Assistant

- **Personality**: Friendly octopus character
- **Food Recommendations**: AI-powered suggestions
- **Chat Integration**: Natural language food conversations
- **Learning**: Adapts to user preferences

### Master Bot League

- **7 AI Food Experts**: Aurelia (Street Food), Sebastian (Sommelier), Lila (Vegan), Rafa (Adventure), Anika (Spice Scholar), Omar (Coffee), Jun (Japanese)
- **Content Population**: Automated content creation with unique personalities
- **AI-Powered Posts**: Each bot generates authentic food discoveries and recommendations
- **Community Engagement**: Bots drive discussions and user interaction

### User Profile System

- **Fresh Start**: New users begin with empty profiles (0 points, no saved items)
- **Real Data Only**: No mock data - everything is user-generated
- **Progressive Building**: Profile grows through actual user interactions
- **Persistent State**: User data persists across sessions and devices

## 🆕 Recent Improvements

### New Features

- **✅ Today's Recipes Section**: Duplicated Recipe Videos section with real-time Spoonacular API integration
- **✅ Dynamic Recipe Cards**: Consistent card sizing with normalized heights for better visual consistency
- **✅ Real-time Recipe Data**: Live recipe recommendations powered by Spoonacular API
- **✅ Custom Recipe Hook**: Created `useSpoonacularRecipes` hook for seamless API integration

### Data Persistence & User Experience

- **✅ Fixed Saved Items Persistence**: Restaurants now properly save to backend and persist across navigation
- **✅ Enhanced Visual Feedback**: Save buttons now have smooth hover and click animations
- **✅ Real Data Integration**: Removed all mock data - users start with fresh profiles
- **✅ Cross-page Synchronization**: Saved items appear in both Scout "Saved Items" and Profile "Plates" tabs
- **✅ Fresh User Experience**: New users start with 0 points and empty profiles, building their food journey organically

### Technical Improvements

- **✅ Backend API Integration**: Proper save/unsave restaurant endpoints with error handling
- **✅ State Management**: React Context API for persistent user data across components
- **✅ Loading States**: Proper loading indicators and empty states throughout the app
- **✅ Error Handling**: Graceful fallbacks and user-friendly error messages
- **✅ Code Quality**: Removed mock data dependencies and improved TypeScript types
- **✅ Recipe API Integration**: Seamless Spoonacular API integration with proper error handling

### User Interface Enhancements

- **✅ Interactive Elements**: Save buttons with scale animations and color transitions
- **✅ Loading Animations**: Tako-themed loading states for better user feedback
- **✅ Empty States**: Helpful messages when no data is available
- **✅ Responsive Design**: Optimized for mobile and desktop experiences
- **✅ Normalized Card Layout**: Consistent recipe card heights with proper content management

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
netlify deploy --prod
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow design system**: Use FUZO brand colors and components
4. **Commit changes**: `git commit -m '✨ Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**

### Development Guidelines

- **Design First**: Always refer to Figma designs
- **Type Safety**: Use TypeScript for all new code
- **Component Reuse**: Utilize existing UI components
- **Brand Consistency**: Follow FUZO design system
- **Performance**: Optimize for mobile-first experience

## 📊 Performance

### Optimization Features

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Image Optimization**: Responsive images with fallbacks
- **Caching**: Efficient asset caching strategy
- **Bundle Analysis**: Monitor bundle size

### Performance Metrics

- **Lighthouse Score**: Maintain 90+ scores
- **Core Web Vitals**: Optimize for user experience
- **Mobile Performance**: Mobile-first optimization

## 🐛 Troubleshooting

### Common Issues

#### Saved Items Not Persisting

```bash
# Check if user is authenticated
# Look for "✅ User is authenticated" in console

# Verify backend API endpoints
curl -X GET https://your-project.supabase.co/functions/v1/make-server-5976446e/profile/saved-restaurants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Check Supabase database for saved restaurants
# Query: SELECT * FROM saved_restaurants WHERE user_id = 'your-user-id';
```

#### Save Button Not Working

```bash
# Check browser console for errors
# Look for "❌ Failed to save/unsave restaurant" messages

# Verify Google Maps API key is set
echo $VITE_GOOGLE_MAPS_API_KEY

# Check if user is authenticated before saving
```

#### Environment Variables Not Loading

```bash
# Check if variables are set
node -e "console.log(process.env.SUPABASE_URL ? '✅' : '❌', 'SUPABASE_URL')"

# Restart dev server after changes
npm run dev
```

#### API Endpoints Failing

```bash
# Check backend status
curl https://your-project.supabase.co/functions/v1/make-server-5976446e/health

# Verify environment variables in Supabase dashboard
```

#### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules .next
npm install
npm run build
```

#### Master Bots Seeding Issues

```bash
# Verify MCP connection
npm run test:mcp

# Check environment variables
node -e "console.log(process.env.SUPABASE_ACCESS_TOKEN ? '✅' : '❌', 'SUPABASE_ACCESS_TOKEN')"

# Re-seed Master Bots
npm run seed:masterbots

# Verify seeding in database
# Check users table: SELECT * FROM users WHERE is_master_bot = true;
```

#### MCP Tools Not Available

1. **Check `.cursor/mcp.json`** - Ensure proper configuration
2. **Restart Cursor** - Reload MCP servers after configuration changes
3. **Verify Access Token** - Ensure `SUPABASE_ACCESS_TOKEN` is valid
4. **Clear NPX Cache** (Windows): `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache\_npx"`

## 📚 Documentation

- [Setup Guide](./LOCAL_SETUP_GUIDE.md) - Complete local development setup
- [Figma Sync](./FIGMA_SYNC_WORKFLOW.md) - Design synchronization workflow
- [Development Commands](./DEVELOPMENT_COMMANDS.md) - Command reference
- [Environment Guide](./ENVIRONMENT_GUIDE.md) - API setup and configuration
- [Supabase Setup](./SUPABASE_SETUP.md) - Backend configuration
- [Master Bot Profiles](./docs/MASTERBOT_PROFILES.md) - Complete Master Bot personality directory
- [Master Bot Seeding Guide](./docs/MASTERBOT_SEEDING_GUIDE.md) - Database seeding with MCP
- [Supabase MCP Guide](./docs/MCP_SUPABASE.md) - Model Context Protocol integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Figma Make**: Rapid prototyping platform
- **Supabase**: Backend-as-a-service platform
- **Tailwind CSS**: Utility-first CSS framework
- **OpenAI**: AI-powered recommendations
- **Google**: Maps and location services
- **Spoonacular**: Food and recipe database

---

**Made with 🐙 and ❤️ by the FUZO team**

For questions or support, please open an issue or contact the development team.
#   f o o d c o p 
 
 
