# FUZO V2

FUZO is a food discovery and social platform built with Vite + React + TypeScript and Supabase-backed services.

This repository now runs from the **root** (not `new_UI/`).

## Current Status

- Production app entry is root-level `index.tsx`
- Build and deploy are root-level (`npm run build`, `vercel.json`)
- Legacy `new_UI/` wrapper structure has been removed
- `public/References` has been removed

## Latest Updates (2026-03-04)

- Scout now includes a `My Map` tab that renders user-saved places with coordinates.
- Saved Scout places now persist map coordinates (`lat`, `lng`) so they can reappear on `My Map`.
- `public/UPDATE/` is intentionally ignored to keep design reference snapshots out of git history.
- Landing hero heading (`THE UNDISCOVERED GASTRONOMY`) received an ultra-wide screen fix for better centering on 2160px+ displays.
- Gemini is now proxy-only in production through same-origin `api/gemini-proxy`.
- Gemini production health and generation checks were validated live on `www.fuzo.app`.
- Entry page is `/?view=home` (Undiscovered Gastronomy), and discovery app feed is `/?view=feed`.

## Next Session Focus

- Activate `Trims` AI flow in parity with `Bites` AI flow (generation, save/share card behavior).
- Add `Trims` personalization pipeline using YouTube taste signals to serve user-matched trims.
- Transplant social media profile link support from `public/UPDATE/` into live profile/settings flows.
- Execute implementation plan in `docs/plans/TOMORROW_TRIMS_AI_SOCIAL_PLAN.md`.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend services: Supabase Edge Functions
- APIs: Google Places/Maps, Spoonacular, YouTube, OpenAI (via proxy)
- Animation/UI: Framer Motion, Lucide icons

## Project Structure

```text
.
├── index.tsx                 # Main app entry (currently monolithic)
├── index.html
├── src/
│   └── services/             # API/service clients used by the app
├── public/                   # Static assets (images, ads, trivia, data)
├── supabase/
│   ├── functions/            # Edge functions (proxies, health, onboarding, etc.)
│   └── migrations/
├── scripts/                  # Utility and operational scripts
├── server.ts                 # Dev server/proxy runtime entry
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```

## Getting Started

### 1) Install

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

App runs on `http://localhost:3000`.

### 3) Type-check

```bash
npm run lint
```

### 4) Production build

```bash
npm run build
```

## Environment Variables

Create `.env.local` (or `.env`) at repository root.

Commonly used variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
VITE_GOOGLE_MAPS_API_KEY=
VITE_OPENAI_API_KEY=
VITE_SPOONACULAR_API_KEY=
VITE_YOUTUBE_API_KEY=
```

Notes:
- Gemini is proxy-only and must be configured server-side with `GEMINI_API_KEY` (do not expose it as `VITE_*`).
- Some features use Supabase Edge Function proxies and require Supabase secrets set on the server side.
- Keep client-safe keys in `VITE_*` vars only.

## Deployment

Vercel is configured at root via `vercel.json`:

- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrite: all routes to `index.html`

If your Vercel project is connected to `main`, pushes to `main` trigger deployment.

## Backend / Supabase

Supabase functions are located in `supabase/functions/`.

Key functions include:
- `make-server-5976446e` (maps/places/spoonacular proxy endpoints)
- `openai-proxy`
- `youtube-proxy`
- `openai-health`
- `onboarding-preferences`

Migrations live in `supabase/migrations/`.

## Known Technical Debt

- `index.tsx` is still large and contains multiple feature flows.
- Bundle size warning exists (>500 kB chunk after minification).

Planned refactor direction:
- move to feature-sliced modules under `src/features`
- extract shared UI/types/hooks into `src/shared`
- thin app shell/bootstrap layer under `src/app`
- add lazy-loading boundaries for major views

## Operational Notes

- Root `npm run lint` is scoped to app code (not `scripts/` and `supabase/`), intentionally.
- `scripts/` and `supabase/` have their own tool/runtime needs and are not part of frontend type-check.

## Quick Troubleshooting

- If dev server fails to boot, run:
  - `npm install`
  - `npm run dev`
- If API-backed pages are empty, verify env vars and Supabase function deployment/secrets.
- If routes 404 in hosting, verify SPA rewrite in `vercel.json`.
