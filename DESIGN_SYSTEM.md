# FoodCop / FUZO Design System ("Direction B – Soft Citrus")

Reference for all UI work. Source of truth = the `/profile` page. Derived from
`src/scss/_profile.scss`, `_variables.scss`, `_components.scss`, `src/components/profile/*`.
When in doubt, open those files and copy the pattern instead of inventing a new one.

## Principles
1. **Warm, not cold.** Cream/paper backgrounds, warm near-black ink. No cold greys/navy, no claymorphism.
2. **Yellow with restraint.** `$fuzo-yellow` (#f1c74d) is for CTAs, active tabs/pills, progress, level badges, focus/hover accents. Never a full-page flood fill.
3. **Dark text on yellow.** Yellow is light: always `#241f16` / `$fuzo-yellow-ink` on it.
4. **Pills + soft rounding.** Buttons, tabs, badges = fully round (`9999px`). Cards 16–22px radius.
5. **Photo-first, moody hero cards.** Content cards are full-bleed photos with dark gradient overlays and white text; frosted-glass badges on top.
6. **Quiet motion.** Ease `cubic-bezier(0.16, 1, 0.3, 1)`, 0.15–0.4s. Hover = small lift (`translateY(-1px…-4px)`) + slightly bigger shadow; photo zoom `scale(1.04)`; active = press back.
7. **Use Sass tokens, not hex,** for new code. (The profile partial has some legacy literals; don't copy those.)
8. **Mobile-first.** Breakpoints used: 768px, 600px. Tab rows scroll horizontally with hidden scrollbar.

## Tokens (`src/scss/_variables.scss`)
| Token | Value | Use |
|---|---|---|
| `$fuzo-yellow` | #f1c74d | Brand/primary (`$primary`) |
| `$fuzo-yellow-ink` | 75% black mix | Text/icons ON solid yellow |
| `$fuzo-yellow-tint` | 85% white mix | Pale wash: badge/highlight bg |
| `$fuzo-yellow-deep` | 15% black mix | Borders, hover, text on tint |
| `$fuzo-yellow-pale` | 30% white mix | Yellow text on dark chrome |
| `$fz-ink` | #241f16 | Primary text, dark card surface |
| `$fz-ink-soft` | #837a68 | Secondary text |
| `$fz-paper` | #fffefb | Card / control surface |
| `$fz-cream` | #fbf7ec | Page/section base, bars |
| `$fz-border` | #ece4d0 | All 1px borders/dividers |
| `$fz-ink-card` / `-soft` | ink / 55% white mix | Dark hero card + its secondary text |
| `$chili $turmeric $lime $sky $rose` | + `-tint` versions | Category tiles/badges only |
| Page bg (profile shell) | #f6f5f2 | Page background |
| Inactive tab | #eae5dc → hover #ded7cb, text #443e35 | Pills |

Bootstrap overrides: `$primary` = yellow, `$border-radius` .75rem / sm .5rem / lg 1rem, `$enable-shadows: false`, headings weight 800.
Bootstrap's `.btn-primary`, `.badge`, `.rounded-pill` already look right – use them before writing custom classes.

## Typography (`src/lib/font.ts`)
- Headings: **Barlow Condensed** via `var(--heading-font)` / `$headings-font-family`, weight 700–800, `letter-spacing: -0.01em…-0.02em`, tight line-height (~1.1).
- Body: **Hanken Grotesk** via `var(--body-font)`. (Barlow is only for the `.fz-industry` scope.)
- Sizes: hero name 1.95rem · section title 1rem/800 · body 0.88–0.9rem · small meta 0.68–0.82rem.
- Small uppercase labels/badges: `0.62–0.68rem`, weight 800, `letter-spacing 0.04–0.06em`, uppercase.

## Components (class patterns)
- **Hero banner** `.fz-hero-full-banner`: full-bleed cover photo, 420px min, dark top→bottom gradient overlay (rgba(10,8,6) .72→.3→.7→.94), centered white logo, frosted circular back button (yellow on hover), 92px avatar with yellow gradient ring + `#141210` inner border, name (white, 800/1.95rem) + yellow level pill, stats as `<strong>` white numbers + 72%-white labels. Bottom-aligned on desktop, stacked on mobile.
- **Buttons:** primary/follow = yellow pill, `#18181b` text, weight 700, yellow glow shadow `0 4px 14px rgba(241,199,77,.3)`, hover lighter `#f7d36b` + lift. Secondary on dark = `rgba(24,22,20,.85)` pill, 1px `rgba(255,255,255,.2)` border, white text.
- **Tabs** `.fz-profile-tab`: pill, padding `.55rem 1.4rem`, 600 weight. Active = yellow bg + `#241f16` + 700 + soft yellow shadow.
- **Activity/food card** `.fz-activity-card`: 3:3.8 aspect, 22px radius, full-bleed photo, dark gradient fallback, frosted top-left category badge (blur 10px, `rgba(30,26,22,.52)`, white 800 uppercase), hover lift -4px.
- **Light card** `.fz-card` (`_components.scss`): paper bg, 1px `$fz-border`, 16px radius, yellow-tint badge.
- **Points/progress banner** `.fz-points-banner`: cream→yellow-tint gradient, 1.25rem radius, 7px pill progress bar (`$fuzo-yellow` → `$fuzo-yellow-deep`).
- **Section title** `.fz-section-title`: heading font, 800, 1rem, ink.
- **Empty state** `.fz-empty-state`: centered, 2.5rem emoji, 800 title, `$fz-ink-soft` sub (max 260px).
- **Settings** `.fz-settings-group/-row`, top bar `.profile-topbar` (sticky, cream 92% + blur 12px, `$fz-border` bottom).
- **Loading:** yellow/warning spinner (`spinner-border text-warning`).
- **Dark surfaces** (personality / next-bite cards): `$fz-ink-card` bg, `$fz-ink-card-soft` secondary text, `$fuzo-yellow-pale` accents.

## Rules for new pages
- Add a new `src/scss/_<page>.scss` partial using the tokens above; reuse `_components.scss` before adding new classes. BEM naming, `fz-` prefix.
- Don't introduce new brand colors, fonts, or hard-coded hex where a token exists.
- Verify contrast on every yellow surface (dark text) – see the comments in `_variables.scss`.
- Check both desktop and ≤768px.

## Food DNA tab (`src/scss/_food-dna.scss`, `FoodDnaSection.tsx`)
Layout = the KPI spec's three stories: **Identity** (personality hero + 3D fingerprint globe `DnaGlobe.tsx` - canvas, rotating geodesic mesh (dots joined by lines), emoji nodes sit on mesh junctions sized by score, nothing drawn outside the sphere, drag to spin; Food DNA, Flavor DNA, Top Cuisines) → **Activity** (Exploration Score, Food Stats) → **Achievements** (badges). Pattern: one dark `.fz-dna-hero`, KPI tiles `.fz-dna-tile`, cream/paper `.fz-dna-card`s, yellow-gradient `.fz-dna-fill` bars (flavours use their own food colour), earned badges outlined yellow / locked badges greyscale with progress.
All numbers come from `src/lib/profile/kpi/compute.ts` (pure, tunable constants at the top) - UI never computes KPIs itself.

## Leaderboard (`src/scss/_leaderboard.scss`, `LeaderboardView.tsx`)
Owner-approved palette: dark ink hero + brand yellow accents on a cream page (`$lb-page-bg`; an orange variant was tried and rejected). Desktop fills the screen: a full-width dark hero band (title + `.fz-profile-tab` scope pills + period segmented control | `.fz-lb-podium` with yellow gradient avatar rings, leader raised with a crown), then a two-column body - paper `.fz-lb-row`s (your row = yellow tint + yellow border) beside a sticky sidebar (dark `.fz-lb-you-card` with yellow rank chip + level progress, and `.fz-lb-recent` = your own recent point awards). Below 992px it stacks and "Your rank" becomes a sticky bottom bar. Avatars are the user's photo or a tinted-initials circle - never a placeholder image service. Data: `LeaderboardService` -> `get_leaderboard()` RPC (real users only, no seeded bots, honours profile privacy).

## Messages (`src/scss/_chat-app.scss`, `src/components/chat/*`)
Cream page, one rounded paper card split into inbox | conversation (single pane on mobile). Yellow = your bubbles, active tab/row tint, unread badges, primary actions (dark text on it); pills for every control; `.fz-profile-tab` look for filter tabs. Lock motif on purpose - every chat is end-to-end encrypted (see `src/lib/chat/e2ee.ts`, `supabase/migrations/20260919040000_secure_chat.sql`). Avatars: photo or tinted initials (`ChatAvatar`), never a placeholder-photo service. Secure-messaging setup/unlock is `SecureMessagingGate` (`.fz-chat-gate`).

## Elevation (`src/scss/_profile-elevation.scss`)
Client-requested: every Profile block reads as a raised card popping off the page. Use the `$fz-shadow-*` tokens in `_variables.scss` (warm, ink-tinted, layered) - never hand-written shadows:
`$fz-shadow-sm` (pills, nested blocks) · `$fz-shadow-card` / `-hover` (paper cards, with inset top highlight) · `$fz-shadow-dark` / `-hover` (photo + dark ink cards). Hover = lift (-2px content cards, -5/-6px photo cards) + the `-hover` shadow, eased with `$fz-ease`. Scroll rows/grids get extra bottom padding so shadows aren't clipped. Respect `prefers-reduced-motion`.

## Profile first glance (`_profile.scss` hero + highlights, `ProfileHero.tsx`, `ActivityTab.tsx`)
Client requirement: the banner and the Highlights reel are visible together on first load: 1366×768 laptops through 1920×1080, and 375×667 phones and up (320×568 shows the banner plus most of the reel).
- **First screen = profile card + Highlights only (client, 2026-10-06):**
  - `.fz-profile-top` (ProfileHero's root) fills `100dvh` when the Highlights panel is present, and the banner flexes to take the spare height. So the Activity tabs start right below the fold at every size from 375×812 up; 320×568 is too short for both.
  - Side margins there are computed (`max(side, (100% - 1440px) / 2)`), because auto margins would shrink the flex items.
- **Hero card:** `.fz-phero`, built from the client's mockup (2026-10-06); see "Profile hero card" below. Banner height ≤ 22vh, so the reel still fits.
- **Highlights:** one size variable, `--hl-h: clamp(190px, 29vh, 310px)` (phones `clamp(150px, 26vh, 240px)`). Card width, fan offsets and stage height all derive from it. Header = label + "2 of 5 · Title" (an aria-live region, visually hidden under 576px) + Add / arrows. Swipe left/right on touch (Framer Motion pan; `touch-action: pan-y`). Only the front card is focusable (Enter/Space opens it).
- **Highlights states:** a loading skeleton with the same footprint (no layout shift). A one-row empty state ("Create your first highlight reel").
- **Phone "All" view (≤768px, client, 2026-10-06):** each Activity section is just its title + a `SectionStack`, not a card grid.
  - The stack is up to 4 of its photos fanned like a hand of playing cards (rotated around a point below the pile), with "See all", an item-count pill and a round arrow.
  - Tapping it opens that section's own tab (Places / Recipes / Videos / Posts) and scrolls the sub-tabs into view.
  - Tablet and desktop keep the card grids.
- **Activity cards:** exactly the size of a Highlights card. `--hl-h` / `--hl-w` live on `.profile-shell` and are shared by both.
  - Phones cap the height at `min(26vh, 54vw)` so two cards always fit a row.
  - The grid is `repeat(auto-fill, var(--hl-w))` with `justify-content: center` (leftover width becomes equal side padding, never a gap in the middle), so each row holds as many cards as the width allows: 2 on phones, 3 at 768, 5 at 1024, 6–7 on laptops.
  - ActivityTab reads the column count back from the rendered grid (ResizeObserver + window resize; a first guess avoids a flash), so "Show more" adds whole rows and the owner's "+ New" card fills a row's last slot.
  - Card text sizes scale with the card (`container-type: inline-size`, `cqi` clamps).
- **Page and panel style (client, 2026-10-06):**
  - **Page:** a warm off-white page (`#f6f4ef`) with a light wash of the navbar gold (`#ffc909` at 16%) fading out over the top 320px.
  - **Panels:** the card sections and Highlights are crisp solid white panels (`@mixin fz-clean-panel`: fine ink hairline + soft layered shadow).
  - **Rejected and removed:** glassmorphism, a heavy yellow background and a glass caption strip. Photo-card captions use the dark fade.

## Profile hero card (`.fz-phero` in `_profile.scss`, flip in `_profile-hero-flip.scss`, `ProfileHero.tsx`)
Client mockup, the same design on phone and desktop. It's a white card holding:
- **Banner:** a rounded banner photo with a frosted round **back** button (top-left) and a **change banner** camera (bottom-right, own profile only).
- **Avatar:** a gold-ring avatar mostly overlapping the banner, with a dark camera badge on it.
- **Name row:** the name (Hanken Grotesk 700), a pale-yellow **LEVEL** pill with a crown, and a square **pencil** button (Edit profile). Other people's profiles show Follow (yellow pill) + a Message square button (+ a Rate square button for restaurants) instead.
- **Handle line:** `@handle • role` in grey, then the bio (2 lines max).
- **Stat tiles:** white, with colored icons: Bites (burger, turmeric), Posts (file, chili), Friends (users, sky), **Meetups** (calendar-check, lime). Meetups is the user's "going" RSVPs (`RSVPService.countGoing`), shown on your own profile only because RSVPs are private to each chat. Restaurants show Rating / Reviews / Open status instead.
- **SOCIALS:** a yellow pill that flips the card (rotateY) to the dark back face listing the user's socials.
  - Back face: 2 tiles per row, 3 at 700px+.
  - The owner gets a pencil to edit them.

Layout: **one stacked layout at every size**, exactly like the mockup (client, 2026-10-06), which is also what lets the Highlights reel fit the first screen:
- Banner height = `clamp(130px, min(56cqi, 22vh), 260px)`.
- Tiles and SOCIALS always share one line, with SOCIALS as tall as the tiles.
- Under 520px card width (phones), each tile is just icon + count side by side; the label stays for screen readers only. SOCIALS becomes an icon-only yellow button (named by its aria-label). From 520px up, tiles show the icon beside the number/label, and SOCIALS is the yellow pill.

Avatar overlap is capped (`min(0.86 × avatar, banner − 4.5rem)`), so it never reaches the back button. From 520px the pencil sits right after the name/LEVEL (proximity), not across the card.

**Desktop (card 1100px+, client feedback 2026-10-06):** the stacked layout left big empty gaps on wide screens, so desktop uses one row: avatar half over the banner | name + LEVEL + pencil, with the handle under it | compact tiles (108px+) + SOCIALS on the right.

Measured fits: 375×667 and up on phones, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080.
Every control is 44px+. The previous dark full-bleed banner hero (and the earlier Airbnb-style card) are gone.

## Dashboard (`src/scss/_dashboard.scss`, `DashboardView.tsx`)
Built from the client's sketch, one layout for phone + desktop. Top bar = the app-wide navbar (see Navbar below). Then a sticky frosted tab bar `HomeTabs` (For you · Bites · Feed · Trims, yellow sliding thumb, ARIA tabs + arrow keys) that switches sections IN PLACE - URL `?tab=` synced via history.pushState, sections lazy-loaded with next/dynamic, Bites/Feed kept mounted once opened, Trims unmounted on leave. For you = horizontal rails of 3:4 photo cards (dark scrim, frosted chips): Recommended Restaurants (FUZO restaurants first, then taste match), Near You (closest first) - both merge Google places with FUZO restaurant accounts via `useNearbyPlaces` (FUZO cards: gold "On FUZO" chip + yellow ring, real offer tag, live open status; tapping any card (Google place or FUZO restaurant, client 2026-10-06) opens it on Scout with its pop-up, and a FUZO restaurant's pop-up has "View on FUZO" for its full profile. There is no separate place page: `/place/<id>` was built and then removed at the client's request. FUZO cards pass `rid=<restaurantId>` so the pop-up recognises them. Every card also has a round frosted **Directions** button (top-right, 38px + 44px hit area; the offer tag moves under it) that opens Scout's in-app directions (`/scout?...&dir=1`, see Scout directions below). `/scout?place=<place_id>&lat=&lng=&name=` without `dir` still centres on the place and opens its popup. The card is a div with a stretched map link + the button, so they're never nested (links built by `src/lib/maps/placeLinks.ts`); location = GPS, else saved home area, else a notice with Use my location / Set home area), **Location chip** (`LocationChip.tsx`, top of For you): "📍 Near <area, city>" + where it came from (current location · home area · chosen on the map; a GPS fix coarser than ~3 km is flagged "Approximate - not right? Change it" in turmeric), with a Change menu: Use my current location (fresh high-accuracy fix), Use my home area, Pick on map (`LocationPickerModal`; the pick is kept for the browser session). Shown as "Location not set" when nothing is known. Every For you row follows it. **Explore <country>’s cities** (top of For you, `NearbyCities.tsx`): round city photos (white ring, raised) with name + distance, nearest first, "You're here" chip on the closest; data from `/api/places/cities` (reverse-geocoded country + Google `locality` results at the user's spot and two rings ~60/200 km out, other-country towns dropped, cached 12h per ~10 km area); tap = Scout centred on that city (`/scout?view=area&lat=&lng=&name=`, no single-place popup). A yellow pill **Cities | Countries** switch (top-right of the panel, under the title on phones) flips it to **Explore countries**: other countries nearest first from the built-in list `src/lib/geo/countries.ts` (ISO code, name, best-known food city + coords), the user's own country left out, Google Places photo per country (`/api/places/countries`, cached per country) with a small flag chip (flagcdn image - Windows can't draw flag emoji); tap = Scout centred on that country's food city. Hidden when location is unavailable. Your Taste (recipes - open `RecipeDetailModal`, shared with Bites), Watch & Cook (YouTube, hidden when empty). Each rail is a raised paper panel (like Highlights) showing 4 cards + a "See all" card (fanned stack of 3 photos + "+N more" pill) that expands the rail into a grid in place ("Show less" collapses). Desktop fits 4 + See all exactly, so no arrows/sideways scroll there. Compact floating glass dock at the bottom (≤390×52, 55% paper + blur, content shows through), with five slots (client, 2026-10-06):
- **Explore** (Scout).
- **Create:** a plain + icon like the other items; opens CreateCardModal.
- **Home:** the raised yellow centre button. It goes to "For you" and scrolls to the top.
- **My Plate:** salad icon; opens `/my-plate` (see My Plate below).

**One dock on four pages (client, 2026-10-06):** the dock is the shared `AppDock` (`src/components/nav/AppDock.tsx`) on Home, Explore (/scout), My Plate and Leaderboard & Rewards. The page you're on gets a soft yellow pill behind its item (`aria-current="page"`). Home's centre button scrolls Home back to For you; elsewhere it links to /dashboard. Create opens CreateCardModal anywhere. Each page leaves bottom room for it: My Plate pads 7rem; Scout's phone bottom sheets (discovery + directions) pad `$scout-dock-clearance` (4.5rem); toasts sit above it. Scroll-compact comes from the shared `useScrollCompact()`.
- **Rankings** (trophy): opens Leaderboard & Rewards (`/leaderboard`).

The navbar hides its house icon on /dashboard, since the dock's Home covers it there. Every other page keeps it as the way home.

**Scroll-compact (client, 2026-10-06):**
- While the page scrolls down, the HomeTabs bar (`compact` prop, `.is-compact`) and the dock fold to icons only: the bar to a ~240px pill, the dock to 300×44 with a smaller Home.
- Scrolling up, or being within 80px of the top, brings the labels back.
- The labels stay in the DOM, so screen readers still read them. The thumb re-measures as tabs resize.

## My Plate (`/my-plate`, `MyPlateView.tsx`, `src/scss/_plate.scss`)
Everything the user has saved anywhere (saved_items: places from Home/Scout, dishes from restaurant menus, recipes from Bites, Feed likes, Trims, chat cards), in the Profile page style (off-white page + light gold wash, white clean panels).
- **Header (launch cleanup, client 2026-10-06):** back to Home + "My Plate" + one short line ("20 saved"). No eyebrow, no count tiles: they duplicated the chips.
- **Search + sort (client, 2026-10-06):** two round icon buttons on the right of the header.
  - **Search:** tapping 🔍 expands a search field across the header row (the title fades out, the field grows from the right, autofocus). × or Esc closes it and clears the search. It matches title + subtitle.
  - **Sort:** a pill (⇅ Newest / Oldest / A-Z, native select). Below 440px it is icon-only, like search.
  - The title never wraps.
- **Filter chips:** native buttons with `aria-pressed` and counts, on one row. Only kinds you have saved something in show (no "Trims 0"). On phones the row runs edge to edge and scrolls sideways with a fade at the end. The pressed chip is ink with a yellow count.
- **Looks like Home (client, 2026-10-06):** same page colour, and the sections and cards are Home's own `Rail` panels and `fz-dash-card` dark photo cards.
- **All view:** one Home `Rail` per kind (title + "N saved"): 4 cards, then the fanned "See all" stack that expands the section into a grid in place.
- **Filtered view / search:** one rail panel already expanded into Home's grid.
- **Card:** Home's dark full-bleed photo card (or a kind-tinted gradient with the kind icon; Trims get Home's yellow play button). It shows the title, a rating chip (places), the subtitle (address / time + serves / author + cuisine) and "Saved 3d ago". The kind chip appears only in mixed search results, since a section already names its kind. Round frosted buttons sit top-right, side by side (shared `dash-card-fab` mixin). The whole card opens the item via a stretched link or button:
  - places: Scout with the place's pop-up (FUZO restaurants: `rid`, so "View on FUZO" shows);
  - recipes / feed / other: `SavedItemDetailModal`;
  - trims: `/trims`.
- **Card actions:** places get a **Directions** button (Scout directions). Every card has a **Remove** button (turns chili on hover), which removes optimistically and shows a toast with **Undo** (re-saves the same metadata).
- **States:** loading (a rail panel of Home's skeleton cards), an error with Try again, a signed-out prompt, an empty state with Explore / Browse recipes, and a no-match state with Show everything.

## Scout directions (`useScoutDirections.ts`, `ScoutDirectionsPanel.tsx`, `usePlaceSearch.ts`, `.scout-dir` in `_scout.scss`)
Client decisions (2026-10-06): Directions shows the route on FUZO's own map, like Google Maps. It **replaced the old Route Planner** (removed, along with its red route line and fake along-route search).
- **Opened by:** `/scout?...&dir=1` (Home cards, My Plate), the place popup's Directions (filled in), or the arrow button by Scout's search (empty, cursor in "To").
- **From / To fields:** From is "Your location" by default; tap it to search any place (with a "Your location" option to go back). To is tap-to-search. Both lists end with **Choose on map** (client, 2026-10-06), which works like this:
  - A pin is fixed at the map centre (`ScoutPickOverlay.tsx`, `.scout-pick`): blue for the start, red for the destination.
  - Drag the map under it, or tap a spot to move it there.
  - The card shows the address under the pin, reverse-geocoded each time the map settles, with "Set as starting point / destination" and Cancel.
  - A pinned start is a `{ kind: 'point' }` origin.
  - The search bar, map buttons and food pins hide while picking. Both use Google autocomplete biased to the user's area (debounced 300ms; Enter picks the first result, Esc cancels).
- **Route:** the Routes API via `/api/directions` (the field mask includes steps + localized texts; `languageCode` comes from the browser). Car / Bike (TWO_WHEELER) / Walk.
- **Map:** a blue route line (#2f7de1) on a dark casing, a white-ringed blue dot at the start and a red pin at the end (both taken from the route, so searched places need no coordinates). The route is fitted above the sheet's real height on phones and right of the card on desktop. The usual food pins, legend and discovery panel hide while it's open and come back on close, which also drops `dir=1` from the URL.
- **Panel:** a bottom sheet on phones (≤60dvh, scrolls) and a 380px card top-left on desktop. It shows the time (big) + distance + arrival time, **Start** (yellow, in-app navigation below), a small round Google Maps hand-off next to it, **Food along the way**, and collapsible Steps with maneuver icons.
- **Fold (phones, client 2026-10-06):** a grip handle on top of the sheet folds it to one line (time · distance · to <place> + Start + close), so the whole route shows. The route re-fits to the new sheet height. Tap the line or the handle to unfold.
- **Navigation (Start, client 2026-10-06):** turn-by-turn inside FUZO (`useScoutNavigation.ts`, `ScoutNavigation.tsx`).
  - **Map:** follows the live position (`watchPosition`, zoom 17). Dragging the map stops following and shows "Re-centre".
  - **Top banner:** road-sign green (#1f6f43), with the turn arrow, the distance to the turn **measured along the route line**, the instruction, and "Then: …".
  - **Bottom bar:** time left, distance, arrival time, Mute, a Google Maps hand-off, and red Exit.
  - **Progress:** steps advance when the route position passes each turn point.
  - **Voice:** speaks each next instruction (`speechSynthesis`, the user's language).
  - **Off route:** more than 60 m off the line for 2 fixes → "Recalculating", then a new route from here (15 s cooldown).
  - **Arrival:** within 30 m of the end, the banner switches to "You've arrived".
  - **While navigating:** the screen is kept awake (Wake Lock). The search bar, map buttons, app dock (`body.fz-navigating`) and the route's start dot hide.
  - **Start from a chosen place** switches From to your location first, since navigation needs where you really are.
- **Food along the way:** a switch (`role="switch"`). On = real along-the-route search: Places API (New) `searchText` + `searchAlongRouteParameters`, via `/api/places/search-along-route`. Google gives 20 per page, so the endpoint merges "restaurants" (3 pages) + "cafes" + "street food" and de-duplicates them: about 70 spots on a 4–5 km city route. These show near the route line as map pins plus a list (photo, rating, address); tapping either opens the place popup.
- **States:** pick a destination, finding your location, location blocked (suggests choosing a start place), finding the route, and no route for this mode.

## Scout map counts + legend (client, 2026-10-06)
- **Origin badge on place cards (client, 2026-10-06):** a round white 20px badge in the bottom-right corner of each card photo (`SourceBadge.tsx`, `.scout-source-badge`), on the places list and the Directions "Food along the way" list.
  - **Google's multicolour "G":** places from Google.
  - **The FUZO "F" mark** (`public/images/brand/fuzo-mark.png`, trimmed to a 96px square): places created on FUZO, i.e. restaurant accounts and community pins.
  - Saved places count as Google when they have a Google place id.
  - The badge is labelled for screen readers ("From Google" / "On FUZO").
- **More places:** Google's nearby / text search returns 20 per page. Scout shows page 1 immediately, then loads pages 2–3 in the background via `next_page_token` (≈2s wait per page, one retry), up to 60, de-duplicated.
- **Legend:** the legend (Nearby / FUZO / Saved) no longer covers the places panel's radius slider:
  - from 1100px it sits beside the search bar;
  - from 768–1099px the desktop panel starts lower (8.5rem).
- **Dock:** the desktop panel and Directions card stop above the app dock.

## Leaderboard & Rewards (`/leaderboard`, `LeaderboardRewardsView.tsx`, client 2026-10-06)
The Leaderboard and Rewards pages are merged into one page. `/rewards` redirects to `/leaderboard?tab=rewards`.
- **Header:** a dark band (the leaderboard hero colour) with "Community", the title "Leaderboard & Rewards", a one-line intro, and a big two-way tab switch (🏆 Leaderboard | 🏅 Rewards; yellow active pill, `role="tablist"`). The tab is kept in the URL (`?tab=rewards`).
- **Leaderboard tab:** `LeaderboardView embedded`. Its own title is dropped, and the dark band continues with the Global / Friends + period filters and the podium. "See how to earn points" switches tabs. On phones the sticky "Your rank" bar sits above the app dock.
- **Rewards tab:** `RewardsView embedded`. Its own header and "See where you rank" link are dropped (it's the other tab). The level card title is white on the dark card (it was dark-on-dark).
- **Links:** Notifications and the Food DNA "View all rewards" point to `?tab=rewards`.
- **Navbar:** the profile photo opens your profile directly. The old Profile / Leaderboard / Sign out menu is removed, and Sign out is in Profile → Settings.

## Profile world map (`ProfileFoodMap.tsx`, `.fz-world-map` in `_profile.scss`)
Client reference: flat world map, light-blue sea (#e6eef8), soft grey land, dark teal dots (#1d4a5c) per pinned place. Opens on exactly one world across the card (fractional zoom = log2(width/256)), 2:1 canvas. Below zoom 5 = labels/roads hidden; from zoom 5 = real Google map detail in the same palette. Frosted "World" / "My places" pills top-right, "N places" pill bottom-left; empty state floats over the world map. gestureHandling cooperative (page scroll isn't hijacked).

## Restaurant view (`src/components/profile/restaurant/*`, `_restaurant.scss`)
**Same buttons as a person's profile (client, 2026-10-06):** a restaurant profile shares the hero and the main tab bar with person profiles, and the controls inside its tabs match too.
- **Section pills:** Menu sections ("Full Menu (n)"), diet filters and post types use the person profile's Activity section pills (`fz-activity-subtab`: white pill, ink when pressed, `aria-pressed`).
  - Inline variant: `fz-activity-subtabs--inline`.
  - Smaller secondary filters: `--sm`.
- **Other Bootstrap buttons:** everything else inside the restaurant tabs is re-skinned by the `.fz-rtabs` wrapper (from ProfileTabs).
  - `btn-primary`: FUZO yellow pill, like Follow (never Bootstrap blue).
  - Outline buttons: white pill with a yellow-tint hover.
  - Inputs: rounded, with a yellow focus ring.

**Restaurant fixes (client, 2026-10-06):**
- **Saving works after a remove (fix, 2026-10-06):** `PlateService.saveToPlate` is a plain upsert. The old 24h idempotency cache (`idempotencyService.ts`, now deleted) skipped any re-save of an item removed within a day, so the button said Saved but nothing reached My Plate.
- **Save to Plate on a dish is real.** It writes `saved_items` with `item_type: 'dish'` (metadata: name, photo, price + currency, veg, restaurantId / name).
  - The saved state loads from the user's plate.
  - Signed out, it says to sign in.
  - My Plate has a **Dishes** section ("at <restaurant> · price"); tapping one opens the restaurant.
  - Profile Activity counts dishes as food (Recipes).
- **Get Directions** (About & Hours) opens FUZO's in-app directions. Google Maps is used only when the restaurant has no map position.
- **Gallery filters** use the section pills.
- **About + service options (client, 2026-10-06; migration `20261006000000_restaurant_about_services.sql`):** `restaurant_profiles.description` (≤1500 characters) and `services` (dine_in / takeaway / delivery / reservations).
  - **Dashboard:** the owner fills them under Tagline (About textarea with a counter; service options as toggle pills).
  - **Before the migration:** saving keeps everything else and says About / services need `npx supabase db push`.
  - **Profile:** About & Hours shows the description and green service chips.
- **Scout pop-up for FUZO restaurants reads FUZO first** (Google only fills gaps), via `useRestaurant` + `listReviews`:
  - Name, banner/avatar, cuisines, FUZO rating + count, price tier.
  - About text (description or tagline), address, phone, website, live open/closed from FUZO hours.
  - Service options (incl. Reservations).
  - Photos: the owner's gallery → banner → diners' review photos → Google's. Menu dish photos stay in the Menu tab; they are not place photos.
  - Reviews: "On FUZO" reviews with author, time, stars and photos, then "From Google".
  - About tab: Amenities + Cuisines.
- **Photo gallery (client, 2026-10-06; migration `20261006010000_restaurant_gallery.sql`):** `restaurant_profiles.gallery` holds up to 40 `{ url, category: Food | Ambience | Interior | Bar, caption? }`.
  - **Dashboard → Photo gallery:** the owner uploads several photos at once and sets each one's category and caption, or removes it. Changes save immediately. Before the migration it says the gallery needs `npx supabase db push`.
  - **Profile Gallery tab:** reads this gallery (it was never connected before and was always empty). Only categories with photos get a filter pill. When the owner has no photos yet, it offers an "Add photos in Dashboard" button.
- **"Reserve a Table" is hidden** (client decision). The old form showed "Reservation Requested… confirm via SMS" without sending anything. About & Hours now uses the full width (Hours, Location, Amenities, Reviews). Bring it back only with real booking requests the restaurant can accept or decline.
- **Phone hero for other people / restaurants:**
  - Follow / Message / Rate move to their own full-width row under the name (Follow stretches).
  - The handle line never wraps, so no orphan "•".
  - The open / closed tile reads as a dot + bold text like the other tiles, not a pill in a box.
Business profiles (`users.profile_type = 'business'`). Data: `restaurantService.ts` + shared store `useRestaurant(id)` (header and tabs stay in sync) over `supabase/migrations/20261001000000_restaurant_features.sql` (restaurant_profiles, menu_items, restaurant_reviews + restaurant_rating_summary view, restaurant_posts). Header: rating (★ avg + stars), review count and live `StatusPill` replace Bites/Posts/Friends; visitors get "★ Rate". Open/closed is computed in `src/lib/restaurant/hours.ts` from the saved hours in the restaurant's timezone (overnight + 24h supported), re-evaluated every minute. Tabs: Menu (real items, Veg/Non-veg/Available filters) · Activity (Restaurant Posts | Mentions & Tags = customers' food_cards at the linked Google place_id + written reviews) · About & Hours (+ Ratings & Reviews) · Gallery · Dashboard (owner only: details, Google listing link, hours, currency/timezone, menu manager with live `MenuItemCard` preview). Existing markup/look kept; only small additions (`.fz-stars`, `.fz-open-pill`, `.fz-veg-mark`, unavailable dish state).
Discovery on Scout: `RestaurantService.findByPlaceIds()` checks which visible Google places are linked (restaurant_profiles.place_id) to a FUZO restaurant. Those get a yellow pin with an ink star (drawn above other pins) and, in `ScoutPlaceModal`, a `.scout-modal__fuzo` strip: "★ On FUZO" badge, FUZO rating + review count, live `StatusPill`, yellow "View on FUZO" → `/profile/<id>`.
Restaurants also set their own map location in the Dashboard ("Location on map": taken from the linked Google listing, or dropped with `LocationPickerModal`) -> `restaurant_profiles.lat/lng` (migration 20261002000000). Scout loads FUZO restaurants inside its search area via `RestaurantService.listInArea()` and shows them with the FUZO pin even if Google doesn't list them. Community pins (`fuzo_locations`) load for the current search area (not a global 50), carry `place_id` (linking them to a FUZO restaurant at the same place), and never show an invented rating ("No ratings yet" / "New").

## Scout map pins (`src/lib/scout/mapPins.ts`, `_scout-pins.scss`)
Client reference: food-app pickup map. HTML markers (google.maps.OverlayView, not image icons): white pill + food icon; places that would overlap at the current zoom merge into one pill with a count and "Lead name / +N more" underneath (white-halo label); tapping a group zooms into it (or opens the lead if it's one spot), tapping a single opens the place popup. Single pins show a category icon (food / coffee / cake / bar). FUZO restaurants lead their group and use the brand-yellow pill (★ on a single); a red `$chili` tag above shows the restaurant's real latest Offer post (last 30 days) - never invented promos. User location + dropped pin keep the old Google markers.

## Bites / Feed / Trims (dashboard tabs)
- **Bites** (`BitesView.tsx`, `_bites.scss`): recipe tiles ARE the For you card (`.fz-dash-card` + `.bites-tile`): full-bleed photo, dark scrim, frosted time chip top-left, frosted save button top-right (yellow when saved), title + servings on the photo. Grid `auto-fill minmax(190px,1fr)`, 2 columns <=600px. Skeleton = `.fz-dash-card--skeleton`. Tap opens the shared `RecipeDetailModal` (portalled to <body> so the tab bar/dock never cover it): phone = bottom sheet, desktop = photo column (chips + heading-font title on the photo) + paper panel with yellow pill tabs (Ingredients n / Steps n / Nutrition), tick-off ingredients, numbered step timeline, nutrient tiles, sticky footer (yellow Save + round Share). `?tab=bites&recipe=<id>` opens a recipe directly.
- **Feed** (`FoodCardFeed.tsx`, `_feed.scss`): swipe stack of 22px photo cards (`$fz-shadow-dark`), cards behind peek out below; frosted type badge with colour dot, author avatar/initial, heading-font title, caption, frosted chips (match reason in gold); SKIP / SAVE stamps fade in while dragging. Frosted Share button top-right. Compact glass pill action bar (36px Skip · 42px Save, same glass as the dock) overlapping the card's bottom edge (so it stays above the dock on short screens): Skip (paper) · "n / N" · Save (big yellow). End state "You're all caught up" + Start over.
- **Trims** (`TrimsReel.tsx`, `_trims.scss`): vertical reel, only the visible clip plays; top/bottom scrims, frosted HUD ("n / N" + mute), tap to pause (big yellow play button), author row + yellow Follow + 2-line caption, frosted round action rail (Like · Save · Share · More; yellow when active), thin yellow progress bar. In the dashboard it sits in a rounded dark player (`.fz-dash-reel`).

## Share sheet (`src/components/share/ShareSheet.tsx`, `_share.scss`)
Every Share button opens the same sheet (portal, bottom sheet on phones / centred card on desktop) that asks where to share: preview row, **Send on FUZO** (accepted friends + groups as avatars; tap = sends the item into that chat end-to-end encrypted, yellow check when sent; if secure messaging is locked on the device it links to Messages to unlock) and **Share to apps** (the device's own share menu as "More apps" when available, WhatsApp, Telegram, X, Facebook, Email, Copy link). Links open the item inside FUZO (recipe -> Bites deep link, place -> Scout deep link, trim -> `/dashboard?tab=trims&trim=<id>` (old `/trims#<id>` still works), feed card -> author profile). `sharePayloadFromItem()` builds the payload for saved items/chat cards. Used by Bites recipes, Feed, Trims, Scout places, Profile saved items and forwarding in Messages.
Item links live in `src/lib/share/itemLinks.ts` (`fuzoLinkForItem`) - the share sheet and chat ("tap a shared card") both use it. Shared links use query params, never `#hash` (the server can't see a hash, so it would be lost through the login redirect). Logged-out visitors are sent to `/login?next=<link>` and land back on the link after email or Google sign-in (`safeNextPath` only accepts same-site paths).

## Notifications (`NotificationsView.tsx`, `_notifications.scss`)
Profile language on the #f6f5f2 page: heading-font title, `.fz-profile-tab` filter pills (All · Friends (red count of pending requests) · Points), a cream→yellow-tint "+N points this week" card linking to Rewards, then raised paper lists: Friend requests first (avatar via `ChatAvatar`, yellow Accept / paper Decline), then day groups New (since `notifications_seen_at`, yellow-tint rows + yellow dot) / Today / Yesterday / This week / Earlier. Point rows = yellow-tint icon tile per action + yellow "+N" chip; repeated awards for the same action on the same day merge ("Shared 3 cards with friends · +30"). Friend rows link to the profile.

## Navbar (`src/components/header/SiteHeader.tsx`, `_header.scss`)
ONE navbar on every main-app page (Profile has NO navbar - client, 2026-10-06; its hero back arrow is a link to the home screen (/dashboard); onboarding/DNA quiz stay chrome-free too) - exactly the home bar from the client sketch: slim ~52px solid gold (`$fz-navbar-gold`), ink-ringed profile photo | FUZO logo | home + bell. No hamburger. Home (house icon) = back to the dashboard from any page (hidden on /dashboard itself, where the dock has Home). Photo = your profile (no menu; Sign out is in Profile → Settings); logo = opens Tako (the only Tako entry point - the floating FAB is gone); bell = Notifications + Messages with real unread state (`NotificationsService.hasUnread`, `ChatService.unreadTotal`). Logged out: logo -> home, "Sign in" pill. Leaderboard & Rewards is the dock's Rankings item. Create a card = the dock's +.
Removed routes: `/discover` and `/ai-chef` (Bites/Feed/Trims are dashboard tabs; Tako opens from the logo). `/trims` only redirects old links to `/dashboard?tab=trims&trim=<id>`.

## Social profiles (`socialLinksService.ts`, `SocialLinksEditor.tsx`, `SocialLinksSheet.tsx`)
Instagram, TikTok, YouTube, X, Facebook, Pinterest. Linking = paste your profile link (or @username): the link must be for that site, it's reduced to the bare handle (URLs are always rebuilt by the app, never stored), a "✓ @handle" confirmation shows, and "Open ↗" checks it's really you before saving. Shown on the Profile: desktop = row of round brand badges under the bio (`.fz-hero-socials`, + "Add/Edit socials" on your own); mobile = the flip card. Editing from the profile opens the "Your socials" sheet (no trip to Settings); Settings > Profile has the same editor. (Real OAuth "connect" isn't used: Instagram's personal-account API was shut down and the others need app review - verified-by-link is the reliable option.)

## Login / Sign up (`src/app/(auth)/login/page.tsx`, `.fz-auth` in `_auth.scss`)
Desktop: split screen - dark brand panel (moody food photo `public/images/hero-cards/noodles-wine.jpg` under a dark scrim, white FUZO logo, heading-font "Find food you'll love.", sub line, 3 reasons with yellow round icons) beside a cream column with a raised paper card. ≤900px: the panel becomes a 240px photo header (logo + title only) and the card overlaps it. Card: cream "← Home" pill, yellow pill **Sign in | Create account** switch, heading-font title, pill inputs with leading icons (cream, yellow focus ring, autofill kept cream), "Forgot password?" beside the password label, 4-bar strength meter when creating a password (chili → turmeric → yellow → lime), styled error/notice boxes, yellow CTA with arrow, "or", Google button, quiet "Just looking? Continue as guest". Confirmation / reset-sent states = yellow-tint mail icon + message + CTA. `AuthBackHeader` (onboarding, reset password, DNA quiz) uses the same "← Home" pill. Sign-in logic is unchanged.
Motion: entrance is CSS (card rises, brand text + points stagger) so nothing waits on hydration; Framer Motion handles interactions - the switch's yellow pill slides (`layoutId`), views cross-fade (`AnimatePresence`), errors fade in; all reduced-motion aware (`MotionConfig reducedMotion="user"` + media query). Desktop brand panel is sticky (100dvh) so its text stays visible on short screens. Images via `next/image` (hero photo `loading="eager"` + `fetchPriority="high"`). A11y: labels on every input, errors `role=alert` + linked by `aria-describedby`, tab order email → password → show → "Forgot password?" (DOM after the input, positioned beside the label), ≥44px touch targets.
