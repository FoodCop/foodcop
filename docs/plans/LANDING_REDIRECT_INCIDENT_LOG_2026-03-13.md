# Landing Redirect Incident Log (2026-03-13)

## Purpose
Avoid duplicate investigation work on the recurring `/landing` behavior by recording what has already been checked, what is confirmed, and what remains.

## Symptom
- Users still sometimes see `/landing` or old-site behavior after auth flow.
- Expected behavior is app-only routing with canonical entry at `/app?view=feed`.

## Confirmed Code/Runtime State (Local Repo)
- Legacy landing/home runtime paths were removed from active app routing logic.
- Path normalization in app shell redirects non-app paths to `/app?view=feed`.
- OAuth redirect handling is centralized in `src/features/auth/lib/oauthRedirect.ts`.
- `HOME_ENTRY_URL` is `/app?view=feed`.
- Added server-level redirects in `vercel.json` for:
  - `/`
  - `/landing` and `/landing/:path*`
  - `/home` and `/home/:path*`
  -> all redirect to `/app?view=feed`.
- OAuth URL normalization now uses URL origin only (prevents path pollution in configured env URLs).

## Confirmed Platform State

### Vercel Project
- Target project ID: `prj_9xpai7NmFJN463x9LFFUQ0D9LR2b` (`foodcop`).
- Domains attached and verified:
  - `fuzo.app`
  - `www.fuzo.app`
  - `foodcop-kappa.vercel.app`
- Latest production deployments include cleanup commits and redirect hardening commits.
- Environment variables in this project do **not** currently include:
  - `VITE_AUTH_REDIRECT_URL`
  - `VITE_APP_URL`
  (so env-path pollution from those keys is currently unlikely in Vercel prod).

### Supabase Auth Config
- Project URL: `https://lgladnskxmbkhcnrsfxv.supabase.co`.
- `site_url` is `https://www.fuzo.app`.
- Allowed redirect list includes callback and app URLs; no `/landing` URL found.
- Google provider enabled with expected Google client id.

### Google Cloud Project
- Project: `fuzo-24122004`.
- Account context used: `fuzo.foodcop@gmail.com`.
- Project access validated via `gcloud`.
- OAuth redirect URI verification still needs manual UI confirmation in Google Cloud Console Credentials page.

## Live HTTP Observation (Important)
- `https://www.fuzo.app/landing` has returned `200` in checks (not always a 30x redirect).
- `https://www.fuzo.app/` has also returned `200`.
- This behavior is consistent with SPA fallback responses and can still show route-specific behavior depending on client-side timing/state.

## Why This Is Confusing
- There were multiple historical commits toggling landing/home behavior.
- Browser cache + old bundle timing can mask whether latest route normalization has taken effect.
- OAuth callback transitions can briefly preserve legacy path context before app normalization runs.

## Debug Instrumentation Added
Opt-in auth-flow logging is now implemented.

### Enable options
1. URL: `?debugAuth=1`
2. Browser console: `localStorage.setItem('fuzo:debug:auth-flow', 'true')`
3. Build-time env: `VITE_DEBUG_AUTH_FLOW=true`

### Log prefix
- `[FUZO:AUTH_DEBUG]`

### Key events emitted
- `oauth_redirect_url_local`
- `oauth_redirect_url_resolved`
- `google_signin_start`
- `forgot_password_start`
- `path_normalization_start`
- `path_normalization_redirect`
- `path_normalization_noop`
- `auth_callback_route_detected`
- `auth_callback_route_authenticated_redirect`
- `auth_callback_route_unauthenticated_redirect`

## Files Involved
- `index.tsx`
- `src/features/auth/lib/oauthRedirect.ts`
- `vercel.json`
- `vite-env.d.ts`

## Recommended Next Verification Pass (No Rework)
1. Open incognito and enable debug logs with `?debugAuth=1`.
2. Start from root domain and run Google sign-in.
3. Capture ordered console logs for all `FUZO:AUTH_DEBUG` events.
4. Confirm final URL after callback and post-auth route normalization.
5. If `/landing` still appears, capture full network redirect chain and response headers for:
   - `/auth/callback`
   - `/landing`
   - `/`
6. In Google Console (manual), confirm OAuth client redirect URIs are exactly callback URLs only (no `/landing`/`/home`).

## Current Risk Assessment
- High confidence that core app code now targets app-only routing.
- Remaining risk is deployment-edge behavior, cached runtime artifacts, or provider-level redirect chain details not visible from repo code alone.

## Ownership Notes
- If issue persists after current deployment and incognito verification, treat as platform redirect-chain investigation (Vercel edge + OAuth callback chain), not frontend feature regression.
