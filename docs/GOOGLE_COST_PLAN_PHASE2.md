# Google cost plan, phase 2

Follows `docs/GOOGLE_COST_PLAN.md` (phases 1-7, already shipped). Goal is unchanged:
**$10 a month**. This plan covers what that work left behind. Estimates below come from the
2026-11-04 bill ($358.36: Photo $219.97, Nearby Search $69.63, Atmosphere+Contact add-ons
$68.75) and recalled Google pricing, so **check SKU prices on the billing page before
relying on any number**.

## Prerequisites (owner)

- `.env` with `VITE_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `YOUTUBE_API_KEY`,
  `GEMINI_API_KEY`, Supabase keys.
- Places API (New) enabled on the server key (needed for step 1).
- A way to count Google calls per action (browser network tab is enough for QA).

## Steps, in order

Each step is one commit. Run `tsc`, `eslint` and `build` after each.

### 1. Nearby / text search: move to Places API (New) with a field mask  (largest saving)

- **Problem:** `nearby` and `textsearch` in `src/app/api/places/[action]/route.ts` use the legacy
  endpoints (no field mask), so every search also bills Contact + Atmosphere add-ons.
- **Change:** call `places:searchNearby` and `places:searchText` with `X-Goog-FieldMask`, the way
  `search-along-route` already does. Map the response back to the legacy shape
  (`place_id`, `geometry.location`, `vicinity`, `rating`, `user_ratings_total`, `photos`,
  `types`) so `toScoutPlace()` and every caller keep working.
- **Paging:** the New API's `nextPageToken` replaces `next_page_token`. Update `nextPage()` in
  `placesService.ts` and the token check (`TOKEN`) if the format differs.
- **Mask:** start with id, displayName, location, types, formattedAddress/shortFormattedAddress.
  Adding `rating` and `userRatingCount` moves the call to a higher tier: decide once
  by comparing SKU prices. Photos stay out of search results (already the rule).
- **Done when:** one "Search this area" = one request, no Atmosphere/Contact line in billing,
  Explore and Home lists look the same as before.

### 2. Place Details: ask for less

- **Problem:** `DETAIL_FIELDS` requests reviews, `editorial_summary`, `serves_*`, `dine_in`,
  `takeout`, `delivery`, phone, website and hours on every pop-up open.
- **Change:** default fetch = `name, formatted_address, photos, geometry` plus the hours/phone/
  website the pop-up always shows. Move reviews and `serves_*` behind a "Show reviews" tap
  (second `details` call, counted against the same `details` limit). Drop `rating` and
  `user_ratings_total` from details; the search result already has them.
- **Touches:** route `DETAIL_FIELDS`, `mergePlaceDetails`, the pop-up in `ScoutView.tsx`
  (`Detail Fetching` effect, around line 977).
- **Done when:** opening a pop-up requests only the reduced fields; reviews load on demand.

### 3. Create flow: stop the extra searches

- **Problem:** `LocationStep.tsx` runs `searchNearby` at 150 m and 300 m, and
  `CommunityPlacesService.findDuplicates` runs another 150 m. The cache key includes radius,
  so none are shared.
- **Change:** one search per picked spot at a single radius, reused by the duplicate check; or
  make the duplicate check FUZO-database only (the `find_place_duplicates` RPC already exists).
  Read `src/components/create/flow/useAiFill.ts` too (it imports `PlacesService`; not reviewed yet).
- **Done when:** creating a post with a location costs at most one Google search.

### 4. Lower daily limits and set Google-side quotas

- Change defaults in `src/lib/google/limits.ts`. Suggested starting point (all users / one user
  per day): search 10 / 4, details 10 / 5, photo 25 / 8, route 20 / 8. Keep gemini and youtube.
  Update the table in `GOOGLE_COST_PLAN.md` to match.
- In Google Cloud, set a per-API daily quota on every enabled API and a budget alert at $5 and
  $10. These are the only limit on browser-side calls (steps 5-7).
- Re-check the numbers after step 1-2 land; the per-call cost will have dropped, so the
  limits can be raised later if the bill allows.

### 5. Autocomplete: session token, longer debounce

- `ScoutView.tsx` (`fetchSuggestions`, ~line 192) and `usePlaceSearch.ts`: create one
  `AutocompleteSessionToken` per typing session, pass it to `fetchAutocompleteSuggestions`,
  and reuse it on the follow-up details/selection. Minimum 3 characters, debounce 500 ms.
- Cap shown suggestions at 4 in `usePlaceSearch` as well (ScoutView already does).

### 6. Reverse geocoding: cache the label

- `LocationChip.tsx` (`reverseLabel`): cache label by coordinates rounded to ~3 decimals in
  `localStorage` (wrap in try/catch), and reuse the saved home-area label when the point matches.
- Share the cache with `useScoutDirections.ts` (~line 196) and `ScoutAddPinModal.tsx`.

### 7. Load the Maps script only where needed

- `src/app/layout.tsx` loads `maps/api/js` on every page. Move it behind the pages that draw a
  map or use autocomplete/geocoding (Scout, Profile food map, location picker, Add Pin, Create
  location). Keep `loading=async`; check `useMapsFailed` / `MAPS_HEALTH_SCRIPT` still work.
- Riskiest step: several components poll for `google.maps` after load (`LocationChip` retries 10
  times). Test each of those pages cold.

### 8. Smaller changes

- Photo redirect cache in `GET /api/places/photo`: 1 hour private -> 24 hours private.
  **Decision for owner:** shared CDN caching saves more but lets signed-out users load cached
  photos without the sign-in check. Default: keep private.
- Show 1-2 photos in the pop-up Photos tab instead of up to 4 (`MAX_PLACE_PHOTOS`).
- Cap "Load more" at 2 pages (40 places) instead of 3.
- Routes: cache identical origin/destination/mode answers for 10 minutes (same `reused()`
  pattern as `placesService.ts`); use `TRAFFIC_UNAWARE` for short routes.
- Gemini: optional short cache for identical prompts. YouTube: no change.

## QA

- `npx tsc --noEmit`, `npx eslint .`, `npm run build`.
- Browser test, counting requests to `/api/places/*`, `/api/directions` and Google hosts:
  - open Explore: 0 calls
  - "Search this area": 1 search, no Atmosphere/Contact data
  - open a pop-up: 1 details call (reduced fields), 1 photo
  - "Show reviews": 1 more details call
  - Create a post with a location: at most 1 search
  - type in Scout search: calls carry a session token, nothing under 3 characters
  - reload Home twice at the same spot: 1 geocode total
  - a page with no map makes no Maps script request (after step 7)
- A week after deploy, compare the billing report by SKU with the 2026-11-04 bill.

## Rollback

Steps 1, 2 and 7 change behavior most. Ship each separately so one can be reverted without the
others. Step 4 limits can be overridden with `GOOGLE_DAILY_LIMIT_<KIND>` env vars without a deploy
of code.

## Open questions

- Keep `rating` in search results (higher SKU tier) or drop it from list cards?
- Shared CDN photo caching: yes or no (step 8)?
- Are the proposed new limits acceptable to the client?
