# Video and URL posts - manual test cases

Covers phases 1-8 of `docs/VIDEO_URL_PLAN.md`: recording / picking videos, Recipe / Food review / Food tour videos, real Trims, URL import, FUZO AI, and the security rules.
Mark each row ✅ / ❌ and note anything odd in the last column.

## Before you start

1. **Database.** Apply this branch's migrations on the database you test against (after the boss approves):

   ```bash
   npx supabase db push
   ```

   This branch adds:
   - `20261016000000_video_posts.sql`
   - `20261016010000_card_like_counts.sql`
   - `20261016020000_video_url_security.sql`

   The Create flow migrations from the last branch (`20261014…`) must be applied too. Without them, posting a video says "Video posts need the latest database update."
2. **Accounts:** **User A** and **User B** (normal users). **Restaurant R** (a FUZO restaurant with a menu and a verified Google listing) for the review tests.
3. **Devices:** a phone (camera, microphone and location allowed for the site), an iPhone if possible, and a laptop.
4. **Videos on the phone:**
   - one clip under 60 s;
   - one clip over 60 s;
   - one high-quality clip (e.g. 4K, under 60 s).
5. **Links to import** (use public posts):
   - a recipe website page (e.g. a BBC Good Food recipe);
   - a YouTube Short or video;
   - a TikTok video;
   - an Instagram reel and an Instagram photo post;
   - a Pinterest pin of a recipe.

**Where things are:** Create = the **+** in the bottom bar. Trims = Home → **Trims**. Your videos = Profile → Activity → **Videos**.

---

## 1. Recording and picking videos (Phase 1)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| V-01 | **+** → **Video** tab | Live camera; red record button; timer "0:00 / 1:00" | | |
| V-02 | Tap record | Browser asks for the microphone (first time). Button becomes a square; timer counts; a red bar runs along the top; Photo/URL tabs are disabled | | |
| V-03 | Refuse the microphone, record | Notice "Recording without sound…"; recording still works | | |
| V-04 | Record ~10 s, tap stop | "Your video" preview plays **with sound**; length shows 0:10 | | |
| V-05 | Let a recording run past a minute | Stops by itself at 1:00 | | |
| V-06 | Slide the **Cover** slider | The picture changes to that moment; time shows next to "Cover" | | |
| V-07 | **Retake** | Back to the camera, clip gone | | |
| V-08 | Gallery button → pick the **over-60 s** clip | Notice "Videos can be up to 1:00 - this one is 1:24…" | | |
| V-09 | Pick the short clip | Preview + "Getting your video ready… N% - you can carry on" until it finishes | | |
| V-10 | iPhone: if a **Prepare video** button appears, tap it | Preparing starts | | |
| V-11 | Take a photo, then switch to **Video** | "A post is either photos or one video…" + Back to photos | | |
| V-12 | **Next** on the preview | "What is this video?" with your cover + Recipe / Food review / Food tour | | |
| V-13 | Close (×) with a video | "Discard post? Your video and anything…" | | |

## 2. Recipe video (Phase 4)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| R-01 | Choose **Recipe**, tap **Post** | "Add the dish name." | | |
| R-02 | Add a name, Post | "Add at least one ingredient." | | |
| R-03 | Add an ingredient, Post | Posts (steps and cuisine are optional) → "Posted!" with **Share / Watch in Trims / Done** | | |
| R-04 | Pick a gallery clip, go straight to details, tap **Post** while it's preparing | Button shows "Getting video ready… N%", then posts by itself | | |
| R-05 | **Watch in Trims** | Trims opens on your new video, playing | | |
| R-06 | **Save draft** on a recipe video, open **+** → **Drafts** | Draft listed as "Recipe video"; opening it shows everything filled in | | |
| R-07 | Profile → Videos → your video → **Edit** → Back | Goes to the video to change the cover; Next returns to the details; **Save changes** | | |

## 3. Food review and Food tour (Phase 5)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| F-01 | **Food review** → Post | "Add the place." then "Add the food name." | | |
| F-02 | Pick Restaurant R as the place | Its FUZO menu shows as dish chips; tapping one fills the food name | | |
| F-03 | Post **while at the restaurant** | "Posted!" + "Visit counted at R" | | |
| F-04 | **Food tour** → Post with 0 / 1 stop | "Add at least 2 stops." | | |
| F-05 | Add 3 stops (search / Places near me / pin) | Listed 1-2-3 with addresses; "3 of 10" | | |
| F-06 | Type a dish at stop 1, move it down, remove stop 3 | Dish moves with its stop; 2 stops left | | |
| F-07 | Leave Tour name empty | Placeholder "Food tour: <stop>, <stop>"; post title uses it | | |
| F-08 | Open **Flavour DNA (optional)** | 10 sliders appear | | |
| F-09 | Post the tour, open it in Trims | Tag "2 stops" opens the list of stops with dishes | | |

## 4. Trims (Phase 3)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| T-01 | Home → **Trims** with no videos | "No videos yet" + **Post the first video** (opens Create on Video) | | |
| T-02 | With videos | Newest first; only the visible one plays; sound button; tap pauses | | |
| T-03 | Poster row | Name links to their profile; **Follow** → Requested (hidden on your own / friends) | | |
| T-04 | **Like** | Count goes up; liking again un-likes; User B sees the count | | |
| T-05 | **Save** | "Saved to My Plate"; My Plate → Trims opens that video | | |
| T-06 | **Share** → Copy link | `/post/<id>`; the post page plays the video + **Watch in Trims** | | |
| T-07 | ⋮ → **Hide this video** | It disappears for now | | |
| T-08 | Scroll through 12+ videos | More load near the end | | |
| T-09 | Recipe video → **See the recipe** | Post page with ingredients | | |

## 5. URL import (Phase 6)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| U-01 | **+** → **URL** tab | "Import a recipe" + link box + Import (+ Paste link) | | |
| U-02 | Type "hello" → Import | "Paste a full link starting with https://" | | |
| U-03 | Recipe website link | Recipe details filled: name, ingredients (name / amount / unit), steps, cuisine, photo; "Imported from <site> · by <author>" | | |
| U-04 | YouTube link | Recipe **video** with title + cover; credit "… on YouTube" | | |
| U-05 | TikTok link | Same as U-04 - **unless the server is in India** (TikTok blocked): then "didn't share its details" and you type them | | |
| U-06 | Instagram reel / photo | "The post didn't share its details - add them below"; photo posts show **Add a photo** | | |
| U-07 | Pinterest pin of a recipe | Title + image (+ recipe if the pin links to a recipe site) | | |
| U-08 | Post an imported video, open Trims | Cover + **Watch** → the original plays inside FUZO; ✕ closes it; tag "From @creator on TikTok" | | |
| U-09 | **Open original** on an imported post | Opens the original post in a new tab | | |
| U-10 | Back from an import's details | Returns to the URL tab | | |
| U-11 | Imported post earns points? | **No** create points for imports; your own videos/photos still do | | |

## 6. FUZO AI (Phase 7)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| A-01 | **Now (no AI credit):** record a recipe video → details | No AI banner; everything typed by hand; nothing breaks | | |
| A-02 | **After adding Google AI credit** (wait up to 5 minutes), record a cooking video → **Recipe** | "FUZO AI is looking at your video…" then "FUZO AI filled in the dish name, …" - check name, ingredients, steps, chips | | |
| A-03 | Tap **Undo** | The AI's answers are removed; fields are empty again | | |
| A-04 | Start typing the name while AI is working | Your name is kept; AI only fills empty fields | | |
| A-05 | Review video with a clear shop sign | AI fills the food and **picks the real place** (check it) | | |
| A-06 | Tour video | AI adds the stops (real places) with dishes | | |
| A-07 | Import an Instagram/TikTok link that shared little | AI reads the caption/cover and fills what it can | | |
| A-08 | Credit runs out again | AI quietly stops (no banner); forms stay manual; comes back by itself after a top-up | | |

## 7. Look and feel

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| L-01 | Phone 320-375 px: all video screens, URL tab, Trims, post page | No sideways scrolling; nothing cut off | | |
| L-02 | Profile → Settings → Appearance → **Dark** | Readable everywhere (titles, URL tab, AI banner, stops) | | |
| L-03 | Keyboard only (laptop): Tab through the video forms | Every control reachable with a visible focus ring | | |
| L-04 | Phone "reduce motion" on | No sliding/bouncing; everything works | | |

## 8. Security checks (test database only)

| ID | Check | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| X-01 | As User A, set a video post's `media_url` to `https://example.com/v.mp4` | Refused: "The video must be uploaded with the post." | | |
| X-02 | As User A, use User B's video URL in a post | Refused | | |
| X-03 | Publish a tour with 1 stop / a stop without lat-lng | Refused | | |
| X-04 | Signed out: `POST /api/import` and `POST /api/ai/fill` | 401 "Please sign in" | | |
| X-05 | Import `https://192.168.1.1/`, `https://localhost/`, `https://169.254.169.254/` | "That address cannot be imported." | | |
| X-06 | Import 21 links within 10 minutes | 21st: "Too many imports. Try again in a few minutes." | | |
| X-07 | Call `get_card_like_counts` for a private profile's post as someone else | No count returned | | |

## Known limits (tell the client)

- **Instagram / Facebook imports** usually share nothing to apps without a login. Filling these in automatically needs a free **Meta developer app** ("oEmbed Read"), which can be added later.
- **TikTok is blocked in India.** If FUZO's server runs in India, TikTok imports only keep the link.
- **Imported videos are not copied.** They play embedded from the original. If the creator deletes the post, it stops playing there.
- **FUZO AI looks at 8 frames, not the sound.** Hosting limits uploads to about 4.5 MB per request, so it can miss things that are only said aloud.
- **AI switch-on** happens within 5 minutes of adding credit, with no code change.
