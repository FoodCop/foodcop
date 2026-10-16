# Video and URL posts - plan

Client spec rows 2a, 2b, 2c and 3a, received 2026-10-16. It follows the photo Create flow in `docs/CREATE_FLOW_PLAN.md`.
Branch: `ayush/video-url`. The GitHub issue and draft PR track progress.

## What each post is

| # | Type | Steps | Shows in |
|---|---|---|---|
| 2a | **Video → Recipe** | Video → dish name, ingredients, steps (AI suggests later; manual now) → meal type, dietary, cooking style, flavour | Trims, Profile → Videos |
| 2b | **Video → Food review** | Video → place* + food name (AI later) → cuisine, meal type, dietary, price, cooking style, flavour | Trims, Profile → Videos |
| 2c | **Video → Food tour** | Video → several stops, each with a place* and dish (AI later) → cuisine, meal type, dietary, price, cooking style, flavour (optional) | Trims, Profile → Videos |
| 3a | **URL import** | Paste a Facebook / Instagram / Pinterest / TikTok (or recipe website) link → a photo post becomes a Recipe card (photo flow), a video becomes a recipe Trim (2a). Credited to the creator. | As above |

\* required

## Decisions (client, 2026-10-16)

- **Length:** videos are up to **60 seconds**.
- **Capture:** record in FUZO **or** pick from the gallery.
- **AI:** comes later (Google Gemini, once AI credit is topped up). Manual entry always works, and AI answers are editable suggestions.
- **Location:** required for Food review and Food tour.
- **Food tour:** has **several stops**.
- **Trims:** shows **real member videos only**; the 5 demo clips are removed. Videos also show in Profile → Videos.
- **Where videos appear:** only the profile and Trims (not the Feed, not Bites).
- **URL import:** "do the best". Instagram, Facebook and TikTok don't allow downloading their media. We save the link, embed the original post with credit, and fill the recipe from its caption. Pinterest pins and recipe websites can usually be read in full.
- **Drafts, edit, delete, sharing:** same as photo posts.

## How video works

- **Recording:** uses the camera already open in Create. The microphone is added only while recording, and the clip stops itself at 60 s. Recorded at about 2.5 Mbit/s, so 60 s is about 20 MB.
- **Gallery videos:** checked for length (60 s or less). They are then re-encoded in the browser to at most 720p / 2.5 Mbit/s. A 60 s 4K phone clip can be about 400 MB, over the 100 MB storage limit. Re-encoding also removes the file's hidden location and device data, as we do for photos. It runs in the background while the user fills in the details.
- **Cover:** one frame chosen with a slider, saved as a JPEG photo.
- **Storage:** `food-card-media/<user id>/video-<uuid>.mp4|webm`, plus the cover as `post-<uuid>.jpg`.

## What a video post needs before it can be posted (phase 2)

Checked in the app, and again by the database (`20261016000000_video_posts.sql`).

- **Every video:** the clip (up to 60 s) and its cover, both uploaded by the poster. URL imports use the original post's link instead of an upload.
- **Recipe video:** the dish name and at least one ingredient. Steps are optional, because the video shows them.
- **Food review:** the place and the food name.
- **Food tour:** 2 to 10 stops, each with a place on the map (the dish there is optional).
- **Points:** a video post earns 25 points, once per post.
- **Visits:** posting a review video from the place counts a visit. Tours don't count visits.

## URL import (phase 6)

1. Create → **URL** tab: paste a link and tap **Import**.
2. FUZO's server reads what the post shares publicly (`POST /api/import`, `src/lib/import/`). Imports are always recipes (client spec):
   - **Video** (TikTok, Instagram reel, Facebook video, YouTube): becomes a **recipe video** (2a). It is not copied: Trims shows the cover, and **Watch** plays the original post embedded.
   - **Photo post / pin / recipe website:** becomes a **photo Recipe** (1c). Ingredients and steps are filled in when the site publishes them (schema.org Recipe), as are the photo and cuisine.
3. Every imported post shows **"Imported from @creator on TikTok · Open original"**.

**What each platform shares:**
- **YouTube:** title, creator and thumbnail.
- **TikTok:** title, creator and thumbnail. TikTok is blocked in India, so from an Indian server only the link is saved and the user types the rest.
- **Recipe websites:** usually the full recipe.
- **Pinterest:** title, image, and the recipe if the pin links to a recipe site.
- **Instagram / Facebook:** usually nothing to apps without a login. The link and embed are saved, and the user adds the name and photo.

**Safety:**
- Sign-in is required, with a limit of 20 imports per 10 minutes.
- Only `https` links. Private, loopback and cloud-metadata addresses are refused, checked again on every redirect.
- Time and size limits apply.
- Embeds are built only from recognised post IDs, in a sandboxed frame. Nothing from another site is shown as HTML.

## FUZO AI (phase 7)

- **When it runs:** when a video's details screen opens. FUZO AI (Google Gemini, `GEMINI_MODEL` in `src/lib/ai/geminiModel.ts`) looks at **8 small frames** from the video, plus an imported post's caption and cover, and fills in what it sees:
  - **Recipe:** the dish, ingredients and steps.
  - **Review:** the food and the place. The place is matched to a real one through FUZO's place search.
  - **Tour:** the stops, each matched to a real place, with its dish.
  - **Any type:** cuisine, meal type, dietary and cooking style, kept to FUZO's own lists.
- **Only empty fields** are filled. What the user typed is kept, and **Undo** puts back what was there.
- **Turns itself on:** while the Google AI account has no credit, Google answers "credits depleted" (HTTP 402). The server then **pauses AI for 5 minutes** without calling Google, and the forms stay manual. After the pause it tries again. **Once credit is added, AI is on within 5 minutes, with no code change or redeploy.** (`src/lib/ai/geminiServer.ts`)
- **Frames, not the whole video:** Vercel limits uploads to the server to about 4.5 MB, and a 60 s clip is about 20 MB. The voice-over isn't heard.
- **Limits:** sign-in is required, with 30 AI fills per 10 minutes per person. The imported caption is treated as information about the food, never as instructions, and the answer is limited to the fields asked for.

## Phases

- [x] **1. Video capture:** record or pick, 60 s limit, background re-encode, preview, cover frame, the video type picker
- [x] **2. Data model:** video post types, `video_url`, `cover_url`, duration, stops (tours), source link (URL imports), security rules (own uploads only)
- [x] **3. Real Trims:** members' videos (likes, saves, share), Profile → Videos; demo clips removed
- [x] **4. Video Recipe (2a):** manual entry
- [x] **5. Food review (2b) and Food tour (2c):** several stops
- [x] **6. URL import (3a)**
- [x] **7. AI helper:** switches itself on once credit is available
- [x] **8. QA, security review, test cases** (`docs/VIDEO_URL_TEST_CASES.md`; fix: `20261016020000_video_url_security.sql`)
