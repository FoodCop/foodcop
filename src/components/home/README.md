# 🐙 FUZO - Food Discovery App

> **Discover Amazing Food with Tako the Octopus!**

FUZO is a comprehensive food discovery platform featuring Tako the octopus mascot, designed with a complete brand system and powered by modern web technologies.

## ✨ Features

### 🎯 Core Features
- **Tinder-style Food Discovery**: Swipe through restaurants and dishes
- **8-Screen Onboarding Flow**: Smooth user introduction experience
- **Camera Functionality**: Snap and tag food photos
- **Chat System**: Real-time messaging with Stream Chat API
- **Recipe Discovery Hub**: Powered by Spoonacular API
- **AI Assistant**: Tako-powered food recommendations with OpenAI
- **Profile System**: User profiles, rewards, and social features
- **Geolocation**: Find nearby restaurants with Google Maps API

### 🔐 Authentication
- **Google OAuth**: Secure sign-in with Google (PKCE flow)
- **Email/Password**: Traditional authentication option
- **Dev Auth Panel**: Mock authentication for testing in Figma Make preview
- **Session Management**: Automatic token refresh via Supabase

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

## 🧪 Testing in Figma Make

### Dev Auth Panel (Preview Testing)

When testing in Figma Make's preview, you'll see a **floating authentication panel** in the bottom-right corner.

**Quick Start:**
1. Click the floating red button (👤)
2. Choose a mock user (Jun Cando, New User, Sarah Foodie, or Chef Marco)
3. Instantly authenticated - test all features!

**Why?** Google OAuth is blocked in iframes (security feature), but the Dev Auth Panel lets you test all authenticated features instantly.

📖 **Full Guide**: See `/DEV_AUTH_QUICK_START.md`

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

### Tako AI Assistant
- **Personality**: Friendly octopus character
- **Food Recommendations**: AI-powered suggestions
- **Chat Integration**: Natural language food conversations
- **Learning**: Adapts to user preferences

### Master Bot League
- **Content Population**: Automated content creation
- **Food Personalities**: Different cooking style bots
- **Community Content**: Engaging food discussions

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

## 📚 Documentation

- [Setup Guide](./LOCAL_SETUP_GUIDE.md) - Complete local development setup
- [Figma Sync](./FIGMA_SYNC_WORKFLOW.md) - Design synchronization workflow  
- [Development Commands](./DEVELOPMENT_COMMANDS.md) - Command reference
- [Environment Guide](./ENVIRONMENT_GUIDE.md) - API setup and configuration
- [Supabase Setup](./SUPABASE_SETUP.md) - Backend configuration

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