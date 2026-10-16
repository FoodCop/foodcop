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

## Phases

- [x] **1. Video capture:** record or pick, 60 s limit, background re-encode, preview, cover frame, the video type picker
- [x] **2. Data model:** video post types, `video_url`, `cover_url`, duration, stops (tours), source link (URL imports), security rules (own uploads only)
- [ ] **3. Real Trims:** members' videos (likes, saves, share), Profile → Videos; demo clips removed
- [ ] **4. Video Recipe (2a):** manual entry
- [ ] **5. Food review (2b) and Food tour (2c):** several stops
- [ ] **6. URL import (3a)**
- [ ] **7. AI helper:** once credit is available
- [ ] **8. QA, security review, test cases**
