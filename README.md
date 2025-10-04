# FUZO Next.js MVP

A minimal, server-first Next.js implementation of FUZO with the core functionality.

## Features

- **Auth**: Basic Supabase authentication (placeholder)
- **Feed**: Server-side rendered feed with JSON fallback
- **Save to Plate**: Save items to user's plate
- **Scout**: Google Directions API integration for routes
- **Bites**: Video content page
- **Snap**: Camera capture and upload
- **Chat**: Native React chat with Supabase Realtime

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env.local`:

```bash
# Copy from root env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SPOONACULAR_API_KEY=your_spoonacular_api_key
OPENAI_API_KEY=your_openai_api_key
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run Playwright tests
- `npm run lint` - Run ESLint

## Project Structure

```
apps/web-next/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── feed/              # Feed page
│   ├── scout/             # Scout page
│   ├── bites/             # Bites page
│   ├── snap/              # Snap page
│   └── profile/           # Profile page
├── lib/                   # Utilities
│   ├── supabase/          # Supabase clients
│   ├── feed.ts            # Feed logic
│   ├── bites.ts           # Bites logic
│   ├── saveToPlate.ts     # Save functionality
│   └── routes.ts          # Directions API
├── tests/                 # Playwright tests
└── middleware.ts          # Auth middleware
```

## Architecture Notes

### Chat System Migration
**⚠️ Stream Chat Deprecated**: The chat system has been migrated from Stream Chat to a native React implementation using Supabase Realtime. This provides:
- Real-time messaging via Supabase subscriptions
- Simplified architecture without third-party dependencies
- Better integration with existing Supabase infrastructure
- Cost-effective solution for real-time features

### Bot Intelligence
Masterbot AI functionality is preserved through the refactored `supabase/functions/bots-chat` function, which now integrates directly with Supabase Realtime instead of Stream Chat webhooks.

## TODOs

- [ ] Implement real authentication with cookies/sessions
- [ ] Add real map rendering for Scout page
- [ ] Implement idempotency persistence for routes
- [ ] Add proper error handling and loading states
- [ ] Create storage bucket for Snap uploads
- [ ] Add proper TypeScript types for all data
- [ ] Implement user profile and saved items display
- [ ] Complete native React chat component implementation

## Deployment

This app can be deployed to Vercel alongside the existing Vite app. The Vite app will continue to work independently.
