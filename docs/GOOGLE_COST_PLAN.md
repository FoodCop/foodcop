# Google cost plan

Client budget: **$10 a month**. Bill checked 2026-11-04: $358.36, made of Places Photo
($219.97), Nearby Search ($69.63) and the Atmosphere + Contact add-ons on those
searches ($68.75). Everything else was inside Google's free allowance.

The rule behind every phase: **Google is only called when a person asks for it.**
FUZO's own data loads first and is free.

## Phases

| # | Phase | What changes |
|---|---|---|
| 1 | Protect the server | Google routes need a real account (not a guest). Durable daily limits, overall and per person, shared by every server instance. Gemini output capped. |
| 2 | Photos | List cards show no Google photos. A pop-up loads one photo, the Photos tab a few more. Photos go through `/api/places/photo`, so the key stays on the server. Old saved links with the key in them are ignored and removed. |
| 3 | Explore | Opening Explore costs nothing. "Search this area" runs one 20-place search, and "Load more" fetches the next page. Same search in the same tab is reused for 10 minutes. |
| 4 | Home | FUZO restaurants first, and "Show more nearby" asks Google. Cities and Countries come from FUZO's own list and images. |
| 5 | Smaller calls | Food along the way is one search without photos. Create only looks up the photo's location on request. Place details ask for named fields only. |
| 6 | When Google says no | Clear messages for "map unavailable", "daily limit reached" and "sign in". FUZO places keep working. The fake demo restaurant is gone. |
| 7 | QA | tsc, eslint, sass, build, database tests, and browser tests that count Google calls per action. |

## Daily limits

Set in `src/lib/google/limits.ts`. Override with `GOOGLE_DAILY_LIMIT_<KIND>` and
`GOOGLE_USER_LIMIT_<KIND>`, for example `GOOGLE_DAILY_LIMIT_SEARCH=0` turns searches off.

| Kind | All users, per day | One user, per day |
|---|---|---|
| search | 30 | 8 |
| details | 30 | 10 |
| photo | 40 | 15 |
| route | 50 | 15 |
| gemini | 200 | 40 |
| youtube | 80 | 20 |

Usage is in `public.google_usage_daily`. To see the last two weeks:

```sql
SELECT day, kind, used FROM public.google_usage_daily ORDER BY day DESC, kind LIMIT 84;
```

These limits cover calls made through FUZO's server. Calls made with a stolen key or
directly from the browser (map loads, search suggestions, browser address lookups)
skip them, so **Google's own quotas are still required**.

## Turning Maps back on (owner's steps)

Do these in order, and only if the client wants Maps back:

1. Deploy this code and run `npx supabase db push`.
2. Delete the old key (it is in the public repo's history).
3. Enable Maps JavaScript API, Places API, Places API (New), Geocoding API and Routes API.
4. Set Google's daily quotas on each one.
5. Create restricted keys and add them in Vercel:

| Key | Website restriction | Allowed APIs | Vercel variable |
|---|---|---|---|
| Browser | Live domain only | Maps JavaScript, Places (New), Geocoding | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Server | None | Places, Places (New), Routes | `VITE_GOOGLE_MAPS_API_KEY` |
| YouTube | None | YouTube Data API v3 | `YOUTUBE_API_KEY` |

6. Redeploy. The browser key is built into the pages, so it only changes on a new build.
7. Check the billing report by SKU every week for the first month.
