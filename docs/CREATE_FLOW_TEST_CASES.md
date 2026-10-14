# Create flow - manual test cases

Covers phases 1-10 of `docs/CREATE_FLOW_PLAN.md`: camera, the four post types, restaurant photos and visits, new restaurants and voting, edit / delete / drafts, sharing, and the security rules.
Mark each row ✅ / ❌ and note anything odd in the last column.

## Before you start

1. **Database.** Apply the migrations on the database you test against (after the boss approves):

   ```bash
   npx supabase db push
   ```

   The Create flow needs these four:
   - `20261014000000_create_flow_posts.sql`
   - `20261014010000_restaurant_photos_visits.sql`
   - `20261014020000_community_places.sql`
   - `20261014030000_create_flow_hardening.sql`

   Without them, posting, visits, new restaurants and voting show "needs the latest database update" errors.
2. **Accounts** (normal sign-up; use test emails):
   - **User A** and **User B**: normal users.
   - **Restaurant R**: a business account whose Dashboard has its Google listing linked **and verified** (`place_verified = true`) and a map pin set.
3. **Devices.** A phone (camera + GPS, location allowed for the site) and a laptop. Test on the phone unless a row says otherwise.
4. **Photos.**
   - One photo taken on the phone **at a restaurant** (it has GPS inside).
   - One screenshot (no GPS).
   - One large photo (over 5 MB).

**Where things are:** Create = the **+** in the bottom bar. Your posts = Profile → Activity. Scout = Explore in the bottom bar.

---

## 1. Camera (Phase 1)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| C-01 | Tap **+** | Full-screen camera opens; Photo / Video / URL tabs at the bottom; counter "0/5" top-right | | |
| C-02 | First time: browser asks for camera | Allow → live camera. Block → "Camera access is off…" message + **Choose from gallery** | | |
| C-03 | Take 1 photo with the shutter | Flash effect; thumbnail appears in the tray; counter "1/5"; **Next** appears | | |
| C-04 | Switch to the front camera, take a photo | Preview and the saved photo are mirrored like a selfie | | |
| C-05 | Tap the flash icon (phones that support it) | Torch turns on/off | | |
| C-06 | Gallery button → pick 6 photos | Only 5 are added; notice "Added the first 5. Up to 5 photos per post." | | |
| C-07 | Tap × on a thumbnail | That photo is removed; counter goes down | | |
| C-08 | Tap the **Video** or **URL** tab | "…coming soon" + **Take photos instead** | | |
| C-09 | Take a photo, then tap × (top-left) | "Discard post?" sheet. **Keep editing** stays; **Discard** closes | | |
| C-10 | Laptop without a camera | "We couldn't find a camera on this device…" + **Choose from gallery** works | | |

## 2. "What is this?" (type picker)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| T-01 | After photos tap **Next** | 2×2 cards: Vibe, Food, Recipe, Restaurant (illustrations); your photos shown above | | |
| T-02 | Tap a card, then **Back** | Returns to the picker; your photos are still there | | |
| T-03 | Back again | Returns to the camera with the same photos | | |

## 3. Vibe post (Phase 3)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| V-01 | Choose **Vibe**, tap **Post** with nothing filled | Error "Add the location." | | |
| V-02 | Location: search a café by name → pick it | Place card shows name + address; "On FUZO" badge if it's a FUZO restaurant | | |
| V-03 | **Places near me** | Places around you listed; tap one to pick it | | |
| V-04 | **Drop a pin** | Map opens; confirming sets the location | | |
| V-05 | Post without Meal type / Dietary / Business identity | Errors in that order: "Pick a meal type.", "Pick a dietary type.", "Pick at least one business identity." | | |
| V-06 | Add a custom business identity ("Rooftop") | It appears selected | | |
| V-07 | Fill everything + caption → **Post** | "Posted!" screen; post shows on your profile and the Feed | | |
| V-08 | Post a Vibe **while at the place** | Done screen also shows "Visit counted at <place>" | | |

## 4. Food post (Phase 4)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| F-01 | Pick the restaurant photo (with GPS) from the gallery → **Food** | "From your photo's location" lists places where the photo was taken | | |
| F-02 | Use the screenshot instead | No "From your photo's location" box | | |
| F-03 | Pick a FUZO restaurant that has a menu | "Pick it from <restaurant> menu" chips; tapping one fills the food name | | |
| F-04 | Pick a place without a FUZO menu | Only the typed food name field | | |
| F-05 | Switch to **At home** | Location and Price level disappear; food name kept | | |
| F-06 | Post without a food name | "Add the food name." | | |
| F-07 | Choose tags (Must-Try Dish + your own) and move some flavour sliders | Chips selected; slider numbers change | | |
| F-08 | **Post** | "Posted!"; post on profile + Feed with its tags | | |
| F-09 | Big photo (> 5 MB) | Uploads fine (it's shrunk to max 1600 px) | | |
| F-10 | Open a posted photo's URL and check its info (EXIF) | No GPS / phone details left in the posted photo | | |

## 5. Recipe post (Phase 5)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| R-01 | **Recipe** → Post with nothing | Errors: food name → cuisine → ingredient → step | | |
| R-02 | Add 3 ingredients (name, qty, unit), remove one | Rows add/remove correctly | | |
| R-03 | Add 3 steps, move step 3 up, remove one | Order changes; numbering stays 1, 2, … | | |
| R-04 | Custom cuisine "Awadhi" | Appears selected | | |
| R-05 | **Post** | "Posted!"; recipe appears in **Bites** (labelled FUZO community, "By <you>"), the Feed and Profile → Recipes | | |
| R-06 | Open it in Bites | Ingredients, numbered steps and your name show | | |

## 6. Restaurant photo - existing restaurant (Phase 6)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| RP-01 | **Restaurant** → "Is it on the map?" = **Find it** | Search / Places near me / photo's location. **No** "Drop a pin" | | |
| RP-02 | Post without picking a restaurant | "Pick the restaurant." | | |
| RP-03 | User A, standing **at Restaurant R**: post 2 photos of R | "Posted!" + "Visit counted at R" | | |
| RP-04 | Same user, same day, post again at R | Posts fine, but **no** "Visit counted" (once per day) | | |
| RP-05 | User B, **far away** (other side of town): post a photo of R | Posts fine, no "Visit counted" | | |
| RP-06 | Open R's profile → **Gallery** | "Visitors" filter; User A's photos with "by User A" | | |
| RP-07 | R's About & Hours | "N visits on FUZO" (N = 1 after RP-03) | | |
| RP-08 | Scout → tap R | Pop-up shows "N visits on FUZO"; visitor photos in its Photos tab | | |
| RP-09 | Log in as **R** → Gallery → open a visitor photo → **Hide from gallery** | Photo dimmed with "Hidden"; message says it stays on the visitor's profile | | |
| RP-10 | Log in as User B → R's Gallery | Hidden photo is **not** shown | | |
| RP-11 | As R: **Show in gallery** | Photo back for everyone | | |
| RP-12 | Phone location turned off, post at R | Posts fine, no visit (needs location) | | |

## 7. New restaurant + community voting (Phase 7)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| N-01 | **Restaurant** → **Add a new one** → Post with nothing | Errors: name → "Set the restaurant on the map." → "Pick a category." | | |
| N-02 | Name = a restaurant that **is** on Google right where you stand (e.g. "Subway") + **I'm here now** | "Already on the map?" lists it within a second or two | | |
| N-03 | Tap **Use this place** | Switches to **Find it** with that place picked | | |
| N-04 | Name = Restaurant R's name, pin next to R | Shows R as "On FUZO" | | |
| N-05 | A real new name ("Test Chaat Corner"), pin, category Street food, cuisine, price, hours, website `testchaat.com` → **Post** | "Posted!" + "<name> is on the map as Community Added" | | |
| N-06 | Website `javascript:alert(1)` | Refused: "That website doesn't look right." | | |
| N-07 | Add 5 new places in one day, then a 6th | 6th: "You can add up to 5 new places a day…" | | |
| N-08 | User B: same name next to N-05's place | "Already on the map?" shows it as Community Added | | |
| N-09 | Scout near N-05's place | Pin appears; pop-up shows **Community Added**, votes, hours, **Yes, it's real / Not real** | | |
| N-10 | User B votes **Yes** | Count goes up; buttons replaced by "You voted: Yes, it's real" | | |
| N-11 | User B reloads and tries to vote again | Still "You voted…" (one vote each, can't change) | | |
| N-12 | Signed out → vote | "Sign in to vote." | | |
| N-13 | In "Find it" search, type the new place's name | It appears with a "Community Added" badge; posting there works | | |
| N-14 | (SQL editor, test DB only) set a place to 66 yes / 33 no, then vote Yes | Becomes **Verified by Community** (2/3 of 100) | | |
| N-15 | (SQL editor, test DB only) 30 yes / 69 no, then vote Not real | Removed from the map for everyone except its creator | | |

## 8. Edit, delete, drafts (Phase 8)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| E-01 | Start a Food post, fill a bit, **Save draft** | "Draft saved" | | |
| E-02 | Open **+** again | Camera shows **Drafts 1** (top bar) | | |
| E-03 | Tap **Drafts** → tap the draft | Opens on its details, everything filled in | | |
| E-04 | Finish it → **Post** | "Posted!"; Drafts count goes down | | |
| E-05 | Drafts → bin icon → **Delete** | Draft removed from the list and your profile | | |
| E-06 | Profile → open your published post | **Edit** and a bin button; Share | | |
| E-07 | **Edit** → change the caption → **Save changes** | "Changes saved"; profile shows the new caption | | |
| E-08 | Edit → **Back** → remove a photo, add one → Next | Goes straight to details (type kept); Save works | | |
| E-09 | Edit, change something, close (×) | "Discard changes?" - your post stays as it was | | |
| E-10 | Profile → your post → bin → **Delete** | Post gone from profile, Feed, Bites (recipes), restaurant gallery | | |
| E-11 | Open someone else's post | No Edit / Delete | | |
| E-12 | A draft new restaurant (Add a new one → Save draft), reopen it | Name, pin and category still there; the place is **not** on the map until you Post | | |

## 9. Sharing (Phase 9)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| S-01 | After posting tap **Share** on "Posted!" | Share sheet: Send on FUZO (friends/groups) + apps + Copy link | | |
| S-02 | **Send on FUZO** to User B | B gets the post card in Messages; tapping it opens the post | | |
| S-03 | **Copy link** | Link is `…/post/<id>` | | |
| S-04 | Open the link signed in (User B) | Full post: photos (swipe), author, place, caption, tags; **Share** | | |
| S-05 | Recipe link | Ingredients, numbered steps, **Open in Bites** | | |
| S-06 | Open the link in a private window (signed out) | "Someone shared a post with you" + **Sign up to see it** / **I already have an account** | | |
| S-07 | **Sign up to see it** → create a new account → finish onboarding | Lands **on the shared post** (not the dashboard) | | |
| S-08 | **I already have an account** → sign in | Lands on the shared post | | |
| S-09 | Paste the link into WhatsApp | Preview card "A post on FUZO" (or the post's title/photo if public) | | |
| S-10 | Feed: swipe a card up → Copy link | Link is `/post/<id>` | | |
| S-11 | Open `/post/<deleted post id>` signed in | "This post isn't available" + Go home | | |

## 10. Look and feel (Phase 10)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| L-01 | Phone 320-375 px wide: every Create screen, drafts, post page | No sideways scrolling; nothing cut off | | |
| L-02 | Tablet and desktop | Forms centred; post page one centred card | | |
| L-03 | Profile → Settings → Appearance → **Dark**; repeat a Food post | Black page, readable titles (e.g. "Food details"), light cards with dark text | | |
| L-04 | Phone "reduce motion" setting on | No sliding/bouncing animations; everything still works | | |
| L-05 | Keyboard only (laptop): Tab through a post form | Every button/chip/slider reachable with a visible focus ring; Esc closes sheets | | |

## 11. Security checks

Run these on the **test** database only. Use the Supabase SQL editor, or the browser console while signed in as User A.

| ID | Check | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| X-01 | As User A, update your post's `photos` to `["https://example.com/x.jpg"]` | Refused: "Photos must be uploaded with the post." | | |
| X-02 | As User A, put User B's photo URL in your post | Refused (photos must be in your own folder) | | |
| X-03 | Insert into `community_places` / `community_place_votes` / `place_visits` directly | Permission denied (only through the app's functions) | | |
| X-04 | As User B, insert into `restaurant_gallery_hidden` for R | Refused (only R can hide R's photos) | | |
| X-05 | Signed out, call `add_community_place` / `vote_community_place` / `record_post_visit` | Permission denied | | |
| X-06 | As User B, select from `place_visits` | Only B's own rows | | |
| X-07 | Visit `/login?next=//evil.com` and sign in | Ends on the dashboard, not evil.com | | |
| X-08 | Post 21 posts at different places in a day from the same spot | At most 20 count visits | | |

## Known limits (tell the client)

- **Visit counts can't be fully proven.** They use the phone's location, which the browser reports. FUZO checks the place's own pin, 150 m and once a day, and caps each person at 20 counted posts a day.
- **Community voting assumes real people.** One account = one vote. Someone with many fake accounts could still tip a vote.
- **Links shared with people outside FUZO show a generic preview.** Signed-out visitors currently can't see any post (privacy), so previews show "A post on FUZO" rather than the photo.
- **Video and URL posts** are not built yet (client to send requirements).
