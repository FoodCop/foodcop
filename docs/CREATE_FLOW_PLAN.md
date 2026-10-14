# Create flow: plan (normal users)

Branch: `ayush/create-studio`. Agreed with the client on 2026-10-14. Video and URL come later.

## The flow

1. **Create opens the camera** (full screen) with **Photo · Video · URL**. Video and URL say "coming soon" for now.
   - Take photos, or pick from the gallery. **Up to 5 photos** per post.
   - If camera permission is refused, or on a desktop without a camera, the gallery opens instead.
2. **"What is this?"** with 4 buttons: **Vibe · Food · Recipe · Restaurant**.
3. The steps for that type (below), with **Back** on every step, **Save draft**, and "Discard post?" on close.
4. **Post** publishes it. Posts can be **edited and deleted** afterwards.

**Location rule:** required for everything except **home food**.

| Type | Steps | Appears in |
|---|---|---|
| **Vibe** (people / ambience) | Location (Scout search or map pin) → Meal type\*, Dietary\*, Business identity\* (several; the 10 onboarding options plus custom) | Feed, Profile Posts |
| **Food** | "At home" or a place: restaurant / location (gallery photos: suggest places from the photo's GPS) → Food name (pick from the restaurant's FUZO menu if it has one, else custom; always custom at home) → Meal, Dietary, Price, Cooking style, Flavour meter → Tags (Must-Try Dish, Must-Try Spot, Weird Combo, Kitchen Trick, or the user's own) | Feed, Profile Posts |
| **Recipe** | Food name, Cuisine, Ingredients, Steps → Meal, Dietary, Cooking style, Flavour meter | Feed, **Bites**, Profile → Recipes |
| **Restaurant, existing** | Pick the restaurant (FUZO map or Google) → photos → optional caption / tags | Feed, Profile; photos join the **restaurant's gallery**; visit count +1 |
| **Restaurant, new** (undiscovered) | Duplicate check → name, pin, category, business identity, cuisine, price, hours, contact, photos | New **Community Added** place on the map; Feed, Profile; visit count starts at 1 |

The Flavour meter is the existing 10 flavour sliders.

### Rules

- **Visit count:** +1 when a user posts about a restaurant while their phone's GPS shows them within about 150 m of it. Once per person per day.
- **Duplicate check:** a new restaurant is refused if FUZO or Google already has a place with a similar name within about 150 m. The user is sent to the existing place instead.
- **Community check:**
  - Every user, the creator included, can vote once: **"Yes, it's real"** or **"Not real"**.
  - The decision is made at **100 votes**:
    - at least 2/3 "Yes" → **Verified by Community**;
    - at least 2/3 "Not real" → removed from the map;
    - otherwise it stays Community Added.
- **Restaurant owners** can remove community photos from their gallery.
- **Sharing:** inside FUZO through Chat (the existing share sheet), or as a link. Someone without an account gets a prompt to sign up, then sees the post.
- **Old card types** (Food Review, Collection, Home Cooking, Bite Video…) are no longer offered, but existing posts keep showing.

## Build phases (one draft PR, small commits)

- [ ] **1. Camera entry**
  - [ ] Full-screen camera with Photo · Video · URL tabs.
  - [ ] Shutter, front/back switch, gallery picker, up to 5 photos.
  - [ ] Permission fallback.
  - [ ] "What is this?" step.
  - [ ] Shared studio frame: progress, Back, keeps answers, discard check, drafts.
- [ ] **2. Data model** (migration): post type (vibe / food / recipe / restaurant), multiple photos, business identity, custom tags, home flag, food name. Old cards keep working.
- [ ] **3. Vibe post**
- [ ] **4. Food post**, including place suggestions from photo GPS and food name from the restaurant menu.
- [ ] **5. Recipe post**, including user recipes in Bites.
- [ ] **6. Restaurant photo, existing restaurant**: community gallery photos (owner can remove) and the visit count rule.
- [ ] **7. Undiscovered restaurant**: duplicate check, Community Added status, voting (100 votes, 2/3).
- [ ] **8. Edit / delete posts and drafts list.**
- [ ] **9. Sharing**: chat plus a link with a sign-up prompt for people without an account.
- [ ] **10. QA**: phones and desktop, dark mode, security review (database rules for votes, gallery, visits).
- [ ] **Later**: Video and URL (requirements to come); restaurant ownership claim.
