# Onboarding - manual test cases

Covers every phase of `docs/ONBOARDING_PLAN.md`:
- sign-up with account type, age and consent;
- the individual path and the food profile;
- existing accounts;
- the food business path;
- documents, verification and the admin page;
- "Finish your profile";
- the security rules.

Mark each row ✅ / ❌ and note anything odd in the last column. Screen IDs (I-01, B-05…) are the client's.

## Before you start

1. **Database.** After the boss approves, apply this branch's migrations to the database you test against:

   ```bash
   npx supabase db push
   ```

   This branch adds `20261018000000_onboarding.sql` and `20261018010000_onboarding_hardening.sql`. Existing restaurants become verified, and existing onboarded users become individuals.
2. **Make yourself admin** in the Supabase SQL editor (your user id is in Authentication → Users):

   ```sql
   INSERT INTO public.app_admins (user_id) VALUES ('<your user id>');
   ```

3. **Email addresses:** you need fresh ones for new accounts. Gmail's `you+fuzo1@gmail.com` style works.
4. **Devices:** a phone (camera and location allowed) and a laptop.
5. **Files:** a PDF under 10 MB, a phone photo of a document, a PDF over 10 MB, and a `.txt` file.
6. **Moving time forward** (for the deadline and reminder tests), in the SQL editor:

   ```sql
   -- pretend the business account is 16 days old (deadline passed)
   UPDATE public.business_verification SET account_created_at = now() - interval '16 days', deadline_at = now() - interval '1 day' WHERE business_id = '<id>';
   -- pretend the food profile was skipped 2 days ago
   UPDATE public.user_onboarding SET skipped_at = now() - interval '2 days', nudges_shown = 0, last_nudge_at = null WHERE user_id = '<id>';
   ```

**Where things are:**
- Create account = `/login` → **Create account**.
- Onboarding = `/onboarding`.
- Business status = `/business/verification`.
- Admin = `/admin/verification`.
- Finish your profile = the card on Home and Profile, or `/finish-profile`.

---

## 1. Sign-up (I-01, I-03, I-02)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| S-01 | `/login` → **Create account** | "Welcome to FUZO" with Individual / Food Business tiles and 3 step dots | | |
| S-02 | **Continue** without choosing | "Choose Individual or Food Business." | | |
| S-03 | Individual → Continue | "Confirm your age" with month and year dropdowns and "private" line | | |
| S-04 | Continue with nothing picked | "Choose your birth month and year." | | |
| S-05 | An adult date → Continue | "Create your account": name, email, password, Terms + Privacy boxes | | |
| S-06 | Create account with no boxes ticked | "Tick both boxes to continue." Both boxes outlined red | | |
| S-07 | Tick only Terms | "Tick the Privacy Policy box to continue." | | |
| S-08 | Tap **Terms of Service** / **Privacy Policy** links | Open in a new tab with the yellow "Draft" note | | |
| S-09 | Fill everything → Create account | "Check your email". Open the link **on the same phone** → lands in onboarding at **Your profile** (type, age and consent already saved) | | |
| S-10 | Back on each step | Goes back one step, choices kept | | |
| S-11 | Food Business → Continue | Skips age. "Create your business account" with **3** boxes (adds "I'm 18 or older…") | | |
| S-12 | **Continue with Google** before ticking boxes | Asks for the ticks first. After ticking it goes to Google, then onboarding | | |
| S-13 | "Just looking? Continue as guest" | Straight to Home, no onboarding | | |

## 2. Age rules (Canada)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| G-01 | Birth year making them 12 | "FUZO isn't available for you yet". Nothing is created | | |
| G-02 | Same phone: start Create account again | Goes straight to the "not available" message (one-day wait) | | |
| G-03 | (Other phone or private window) someone turning 13 **this month** | Not available (the birthday counts from next month) | | |
| G-04 | Someone who turned 13 last month | "Do you live in Quebec?" Yes → not available. No → continues | | |
| G-05 | A 15-year-old finishes onboarding | Settings → Privacy: profile **Private** and **Exact location on posts** off. A post with a dropped pin is saved about 1 km off (a listed place is exact). Both can be switched back | | |
| G-06 | 14 or older | No Quebec question | | |

## 3. Individual onboarding (I-04 to I-06)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| I-01 | Arrive at **Your profile** | Name filled in. @username suggested from the name with "is free" | | |
| I-02 | Type another user's username (any capitals) | "@… is taken". Continue explains | | |
| I-03 | Type `Bad Name!` | Lower-cased, spaces removed, the hint explains what's allowed | | |
| I-04 | Tap the photo circle → pick a photo | Shows in the circle | | |
| I-05 | Pick roles → Continue | "Build your food profile" | | |
| I-06 | (New account) **Skip optional profile details** | Saves only name and username, then moves on | | |
| I-07 | **Skip for now** | "You're ready to explore" → Enter FUZO → Home | | |
| I-08 | Refresh during any step | Comes back on the same step | | |
| I-09 | Visit `/dashboard` before finishing | Sent back to onboarding, then on to Home after finishing | | |
| I-10 | **Sign out** pill during onboarding | Signs out to the home page | | |

## 4. Food profile (I-05A)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| P-01 | **Personalise now** | "Flavours you love" with "1 of 9" bar | | |
| P-02 | Pick 6 flavours | The 6th can't be picked: "That's 5 - tap one to swap it." | | |
| P-03 | Cuisines (up to 10) → Diet | "No Restrictions" un-picks diets and the other way round | | |
| P-04 | A Food DNA section, Continue without answering | "Answer the N remaining questions…" | | |
| P-05 | Close the app halfway through, reopen `/onboarding` | Back on the same screen with answers kept | | |
| P-06 | Finish all 5 sections | "Your Food DNA" with a persona and 5 bars → Save → "Food profile saved" | | |
| P-07 | Profile → Food DNA tab | Shows the new persona and scores | | |
| P-08 | Settings → Taste preferences | Same flavour, cuisine and diet lists as onboarding | | |

## 5. Existing accounts

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| E-01 | Sign in with an account made before this branch | Sent to onboarding once: "We now ask everyone for this" (age), then the terms, then roles | | |
| E-02 | Roles → **Not now** | Back to the page you were on, and not asked again | | |
| E-03 | Restaurant account made before this branch | Not locked. **Verified** badge on its profile | | |

## 6. Food business (B-01 to B-10)

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| B-01 | New business account → onboarding | "Choose your business type" with 8 tiles | | |
| B-02 | Restaurant → Business details | Contact email pre-filled. Business name, contact person and email required. A bad website is explained | | |
| B-03 | Location: search your place → pick it | Shown as the main location. If it's already on FUZO, a note says it's checked later | | |
| B-04 | **Add another location** | Location 2 card with its own place search. Remove works | | |
| B-05 | Press Enter in the place search | Searches (doesn't submit the screen) | | |
| B-06 | Operations | Cuisines, Dine-in / Takeaway, price, hours. "Use Monday's hours every day" works. Hours fit one line on most phones | | |
| B-07 | Back from operations to details | Everything filled back in | | |
| B-08 | Table reservations | 4 choices. Continue needs one | | |
| B-09 | Food truck instead | **No** reservations screen. Asks base + "Area you operate in" and regular stops | | |
| B-10 | Cloud kitchen | Kitchen address "not shown publicly" + delivery area. Profile shows the area, not the address | | |
| B-11 | Catering / Meal prep | Area only, no branches | | |
| B-12 | Specialty food with nothing | "Add a location or the area you sell in" | | |
| B-13 | Loyalty, Delivery | Answers only. Delivery says FUZO doesn't deliver | | |
| B-14 | Documents: upload the `.txt` | "use a PDF, JPG or PNG" | | |
| B-15 | Upload the over-10 MB PDF | "is over 10 MB" | | |
| B-16 | Upload the registration PDF | Listed as Submitted. Banner: "Documents received - FUZO will review them" | | |
| B-17 | Upload a photo of a document | Listed. (The stored copy has no location data) | | |
| B-18 | Review → Edit on any row → change → Continue | Back on Review with the change | | |
| B-19 | **Create business profile** | "Your business profile is created": Available, document status, checklist of only what you chose, what's locked | | |
| B-20 | (Other business) **Upload later and continue** | Review shows "Awaiting documents"; created screen shows the due date | | |

## 7. Verification (B-11 to B-14) + admin

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| V-01 | Business with no documents signs in | Pop-up "Complete your business verification" with the due date and days left. **Remind me later** closes it | | |
| V-02 | Browse more pages in the same session | No second pop-up | | |
| V-03 | Move time on 16 days (SQL above), sign in again | Pop-up: "The deadline passed on…" | | |
| V-04 | Unverified business: Profile → Dashboard tab | Business details editable. Menu and gallery replaced by "unlock once FUZO approves your documents" | | |
| V-05 | Unverified business: Create a post | "Business posts unlock once your documents are approved." | | |
| V-06 | Customer posts at the unverified restaurant's place | Works (normal user posts aren't blocked) | | |
| V-07 | `/business/verification` while under review | "Documents under review". More files can be added | | |
| V-08 | Admin: `/admin/verification` | "Needs review" with the business. Expand: contact, address, dates, documents | | |
| V-09 | Admin: **Open** a document | Opens in a new tab (the link expires after 5 minutes) | | |
| V-10 | Admin: **Ask for changes** with no text | "Say what needs to change." | | |
| V-11 | Admin: ask for changes with a reason | Business sees "Action required" + your reason (pop-up and status page) | | |
| V-12 | Business uploads a new file | Back to "under review" | | |
| V-13 | Admin: **Approve** → Yes, approve | Business: "Business verified" + Open business dashboard. Menu and gallery unlocked | | |
| V-14 | Verified business profile and Scout pop-up | Blue **Verified** badge by the name and in "On FUZO" | | |
| V-15 | Non-admin opens `/admin/verification` | "This page is for FUZO admins." | | |

## 8. Finish your profile

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| F-01 | Individual who skipped the food profile and photo | Card on Home (For you) and Profile: "1 of 3 done", chips, **Finish now** | | |
| F-02 | × on the card | Hidden for a week on that phone | | |
| F-03 | Finish now → **Choose your roles** → Save | Back to the list, roles marked done | | |
| F-04 | **Build your food profile** | The questionnaire, resuming where it stopped | | |
| F-05 | Everything done | "Your profile is complete". The card disappears | | |
| F-06 | Set skipped_at to 2 days ago (SQL), new session | Pop-up "Finish your profile". **Not now** closes it | | |
| F-07 | New session the same day | No pop-up (once a day). After 3 showings, only the card | | |

## 9. Look and feel

| ID | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| L-01 | Phone 320-375 px: every screen above | No sideways scrolling, nothing cut off | | |
| L-02 | Settings → Appearance → **Dark** | Black page, near-white cards, everything readable | | |
| L-03 | Laptop, keyboard only | Every control reachable, visible focus ring. Arrow keys move between tiles. Esc closes pop-ups | | |
| L-04 | Phone "reduce motion" on | No sliding; everything works | | |

## 10. Security checks (test database only)

| ID | Check | Expected | ✅/❌ | Notes |
|---|---|---|---|---|
| X-01 | As user A, read another user's `user_private` (birth date) via the API | Nothing returned | | |
| X-02 | Set `is_onboarded = true` without consents / birth date / username | "Finish the required onboarding steps first." | | |
| X-03 | Change `account_type` after it's set | Refused | | |
| X-04 | Individual sets `profile_type = 'business'` | Refused | | |
| X-05 | Business sets its own `business_verification` status or `is_verified` | Refused / ignored | | |
| X-06 | Business calls `admin_review_business` | "Only FUZO admins can review businesses." | | |
| X-07 | Upload into another user's `business-documents` folder | Refused | | |
| X-08 | Read another business's documents or `business_private` | Nothing returned | | |
| X-09 | Unverified business inserts a food card / restaurant post / menu item | Refused | | |
| X-10 | A 21st document file | Refused (20 per business) | | |
| X-11 | Branch with a hidden address, read `business_branches_public` as someone else | Address and pin blank | | |

## Known limits (tell the client)

- **Terms of Service and Privacy Policy** are placeholder text with a "Draft" note. The client must send the final wording; bump the versions in `src/lib/onboarding/policy.ts` and everyone accepts the new version on their next visit.
- **Age rules** follow Canadian practice (13+, 14+ in Quebec, private defaults under 18). Legal should confirm them for each launch country.
- **The exact documents** needed for each category and country are still to be confirmed. Today the business registration starts the review, and food safety is "if applicable".
- **Expired documents** and changed business details aren't handled yet (spec section 14).
- **Uploaded PDFs aren't virus-scanned** before an admin opens them. Add a scanning service before launch.
- **The reminder pop-up shows once per sign-in session.** It isn't an email or push notification.
- **Reservations, loyalty and delivery are answers only.** FUZO Reservations and FUZO Loyalty don't exist yet, and the delivery link editor comes later.
