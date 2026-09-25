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

## Mobile profile hero (`src/scss/_profile-hero-flip.scss`, `ProfileHero.tsx`)
<=768px only. The hero looks the same as desktop's stacked mobile layout (banner photo, avatar, name, stats, buttons). Its stats row is a button with a yellow "Socials" chip: tapping it flips the card (`.fz-hero-flip`, rotateY) to a dark back face listing the user's socials (`users.social_links`: Instagram, Facebook, TikTok, Pinterest - stored as handles, URLs built in `socialLinksService.ts`; edited in Settings > Profile > Social Profiles). Brand badges: `.fz-social-badge--<platform>`. (An Airbnb-style white card layout was tried and rejected by the client.)

## Dashboard (`src/scss/_dashboard.scss`, `DashboardView.tsx`)
Built from the client's sketch, one layout for phone + desktop. Top bar = same solid gold as the site navbar (`$fz-navbar-gold`): profile photo (ink ring) | FUZO logo (tap = opens the Tako AI overlay; slim ~52px bar, no label) | bell menu (Notifications + Messages). Then a paper pill segment Bites | Feed | Trims (links to `/discover?tab=`), then horizontal rails of 3:4 photo cards (dark scrim, frosted chips): Recommended Restaurants (taste match first), Near You (closest first), Your Taste (recipes), Watch & Cook (YouTube, hidden when empty). Each rail is a raised paper panel (like Highlights) showing 4 cards + a "See all" card (fanned stack of 3 photos + "+N more" pill) that expands the rail into a grid in place ("Show less" collapses). Desktop fits 4 + See all exactly, so no arrows/sideways scroll there. Floating paper dock at the bottom: Explore (Scout) | raised yellow + (create card) | Rewards. SiteHeader and the floating Tako button are hidden on /dashboard.

## Profile world map (`ProfileFoodMap.tsx`, `.fz-world-map` in `_profile.scss`)
Client reference: flat world map, light-blue sea (#e6eef8), soft grey land, dark teal dots (#1d4a5c) per pinned place. Opens on exactly one world across the card (fractional zoom = log2(width/256)), 2:1 canvas. Below zoom 5 = labels/roads hidden; from zoom 5 = real Google map detail in the same palette. Frosted "World" / "My places" pills top-right, "N places" pill bottom-left; empty state floats over the world map. gestureHandling cooperative (page scroll isn't hijacked).
