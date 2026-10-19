# Onboarding - plan

Source: the client's "FUZO Onboarding Specification v1", "Onboarding Mock Screens & Workflow v1" and the onboarding flowchart (all 13 Oct 2026). Screen IDs (I-01…, B-01…) are the client's and are used in code, tickets and test cases.
Branch: `ayush/onboarding`. The GitHub issue and draft PR track progress.

## The flow

```
Welcome: Individual or Food Business (I-01)
├─ Individual: age (I-03) → create account + consent (I-02) → profile (I-04)
│    → "Personalise now / Skip for now" (I-05) → Food DNA, flavours, cuisines, diet (I-05A) → ready (I-06)
└─ Food Business: create account + consent → category (B-01) → details (B-02) → location and branches (B-03)
     → operations (B-04) → reservations (B-05) → loyalty (B-06) → delivery (B-07)
     → documents, optional now (B-08) → review (B-09) → profile created (B-10)
     → verification: reminder on each login (B-11), under review (B-12), action required (B-13), verified (B-14)
```

The old three-path wizard (Discover / Create / Business) is replaced. "Creator" becomes a **role** on an Individual account.

## Decisions (client, 2026-10-18)

- **Document review:** an admin page. Admins are listed in an `app_admins` table; Ayush's account is added first.
- **Restaurants that already exist** are test data: they are marked verified, so nothing of theirs gets locked.
- **Age rules:** Canadian best practice (see below).
- **People who already have accounts** are asked for their birth month/year and roles on their next sign-in.
- **Look:** the app's current clean style (white page, FUZO yellow for selected options and main buttons, pastel chips, Framer Motion). The mock's brown/red palette is not used, since the mock says it is low-fidelity and the styling is ours.
- **No setup screens after onboarding** in this branch. Reservations, loyalty and delivery are saved as answers only; FUZO Reservations / Loyalty don't exist yet.
- **Documents:** PDF, JPG or PNG, up to 10 MB each. The 15-day rule applies to all 8 categories.
- **Roles:** the spec's list: Food Explorer, Food Reviewer, Food Blogger / Creator, Food Travel Explorer, Recipe Creator, Cooking Instructor, Chef / Private Chef / Catering. Several can be picked and changed later.
- **Skipped questions get asked again:** anything optional that was skipped (food profile, photo, roles) is brought back later; see "Finish your profile" below.

## Age (Canadian best practice)

Canada's privacy regulator (OPC, under PIPEDA) treats children **under 13** as unable to give meaningful consent; Quebec's Law 25 needs a parent's consent **under 14**. FUZO has no parental-consent process, so:

- **Minimum age:** 13; 14 in Quebec. Only someone who turns out to be 13 sees one extra question, "Do you live in Quebec?". The limits are constants in one file, so legal can change them.
- **Age comes first, before the account is created.** If someone is too young, nothing about them is stored, and the device remembers it for a day so the date can't just be changed and retried. The client's screen order puts the account first; asking age first is the standard practice, so no data is collected from a child.
- **Neutral question:** month and year dropdowns, with nothing that hints at the minimum age.
- **Teens (under 18) get private defaults:** a private profile, and no exact location on their posts by default. They can change these later.
- **Birth month/year is private:** it is kept in its own table that only the owner can read, and is never shown on the profile.
- The spec says legal must confirm this before launch; it is listed under "Still to confirm".

## Consent

The Create account step has two boxes: **Terms of Service** and **Privacy Policy**. Each acceptance is stored with the document's version and the time (`user_consents`). FUZO has no Terms or Privacy page yet. This branch adds `/terms` and `/privacy` pages with placeholder text, and **the client needs to send the real text**.

## Food Business

**Categories and what each one is asked (B-03 / B-04):**

| Category | Location | Operations |
|---|---|---|
| Restaurant | Address(es) + branches | Hours, dine-in / takeaway, cuisines |
| Café | Address(es) | Hours, food and drinks offered |
| Bakery | Address(es) | Hours, baked-goods categories |
| Food Truck | Base location + area it operates in | Usual hours, regular stops (optional) |
| Cloud Kitchen | Kitchen location (not public) + delivery area | Hours, how people order |
| Catering Company | Service area | Catering types, events, delivers or not |
| Meal Prep | Service area | Meal offerings, ordering and delivery |
| Specialty Food | Address(es) or service area | Product categories, where it's sold |

- **Branches:** one business, many locations. Shared details live on the business; each branch has its own name, address or area, map pin and hours.
- **Reservations and loyalty:** four choices each: existing / FUZO / both / neither. Stored as two separate yes/no answers.
- **Delivery:** listed / interested / not offered. FUZO never delivers.
- **Documents:** business registration and food safety. Kept in a **private** store that only the owner and admins can open (short-lived links).

**Verification:**

| State | When |
|---|---|
| Awaiting documents | Created less than 15 days ago (15 × 24 h from account creation), nothing submitted |
| Submission overdue | 15 days passed, nothing submitted |
| Pending review | Documents submitted |
| Action required | An admin asked for changes (reason shown) |
| Verified | An admin approved them |

"Awaiting" and "overdue" are worked out from the creation time, not stored. Every submission, approval, rejection and status change is written to an audit log.

**Until verified, the database refuses** (not just the app):
- business posts (restaurant posts, and food cards posted by the business account);
- the Restaurant Dashboard's menu, gallery and offers.

The Verified badge and Verified location tag are also hidden. The public profile stays visible, and normal users can still tag the place in their own posts. Ads and FUZO Loyalty don't exist yet; they will follow the same check when built.

**Reminder (B-11):** a pop-up on every business sign-in while documents are missing. It shows the deadline in the owner's time zone, the days left (or that the deadline has passed), the reviewer's reason if any, **Upload documents**, and **Remind me later**. It never hides the profile.

**Admin review page:** a list of businesses waiting, their documents, and Approve / Ask for changes (with a reason).

## "Finish your profile" (client, 2026-10-18)

When someone skips optional questions (food profile, photo, roles), FUZO asks again:
- A **"Finish your profile"** card on Home and on their Profile shows what's left and how far along they are. It stays until everything is done.
- A short pop-up after sign-in 1, 3 and 7 days after skipping. After that, only the card.
- It stops as soon as everything is filled in. Food DNA answers are saved as people go, so they continue where they stopped.

## Rules for everyone

- Progress is saved on every step (resume after a refresh or on another device).
- Anyone signed in who hasn't finished the required steps is sent back to onboarding.
- Back on every screen, one main button per screen, errors shown next to the field, and the main button explains what's missing instead of just being greyed out.
- Usernames are checked live for duplicates.

## Phases

- [x] **1. Data and security rules:** account type, private birth date, roles, food-profile status, consents; businesses, branches, preferences, documents (private bucket), verification + audit log, `app_admins`; database rules that lock business posts and the Dashboard; existing restaurants marked verified. Database tests.
- [x] **2. Start and sign-up:** Welcome (I-01), age check, Create account with consent (email and Google), `/terms` and `/privacy`, save/resume, send unfinished people back to onboarding, the new onboarding look.
- [x] **3. Individual (I-04 to I-06):** profile (name, live @username check, photo, roles), Personalise / Skip, Food DNA + flavours + cuisines + diet (saved as you go), Ready; existing users asked for birth date and roles.
- [ ] **4. Business part 1 (B-01 to B-04):** category, details, location and branches (map pin or service area), operations by category.
- [ ] **5. Business part 2 (B-05 to B-10):** reservations, loyalty, delivery, document upload, review, profile created.
- [ ] **6. Verification (B-11 to B-14):** reminder on sign-in, under review / action required / verified screens, the admin review page, Verified badge on the profile and Scout.
- [ ] **7. "Finish your profile":** Home and Profile card, the 1 / 3 / 7-day pop-up.
- [ ] **8. Clean-up and QA:** remove the old wizard, security review, test cases (`docs/ONBOARDING_TEST_CASES.md`).

## Phase 1 notes (`20261018000000_onboarding.sql`, rules mirrored in `src/lib/onboarding/policy.ts`)

- **Tables:**
  - `user_private`: birth month/year, owner only.
  - `user_consents`: document, version, server time.
  - `user_onboarding`: progress, food-profile status, reminders.
  - `business_private`: contact, owner and admins.
  - `business_branches`: everyone reads the public view `business_branches_public`, which blanks a hidden cloud-kitchen address.
  - `business_documents` + the private `business-documents` bucket.
  - `business_verification`, `business_audit_log`, `app_admins`.
  - `users` gets `account_type` and `roles`; `restaurant_profiles` gets category, operations, the reservations / loyalty / delivery answers and `is_verified`.
- **Age by month only:** a birthday counts from the month after the birth month, so someone turning 13 this month gets in next month. The database refuses an under-age birth date even if the app is bypassed, and a birth date can't be changed afterwards (support fixes typos).
- **When a review starts:** the first submission needs the **business registration**; food safety documents are optional ("if applicable" in the spec). After "action required", any new document re-submits. Only an admin can approve.
- **Two kinds of verified:** document verification is new and separate from `place_verified`, which only confirms the restaurant's Google listing link.
- **"Onboarded" is checked by the database:** account type, both consents and a name, plus the birth date (individuals) or a business profile with a category (businesses).
- **Making an admin:** in the Supabase SQL editor run `INSERT INTO public.app_admins (user_id) VALUES ('<your user id>');`
- **The old wizard stops working** against this database, since it doesn't record consent. Phase 2 replaces it. The migration is only pushed after the branch is merged, so nothing live breaks.
- **Tests:** 104 database checks (PGlite) and 23 checks of the app rules, all passing.

## Phase 2 notes

- **Create account (/login, `SignupSteps.tsx`):** Welcome (Individual / Food Business), then age (individuals), then name, email and password or Google, with the Terms and Privacy ticks. Food businesses tick a third box: "I'm 18 or older and allowed to set up this business on FUZO".
- **Before the account exists,** the choices wait in the browser for a day (`lib/onboarding/intent.ts`, never sent to the sign-in service). `/onboarding` saves them as soon as the person is signed in, which also covers email confirmation and the Google redirect. Confirming on another device means onboarding just asks again.
- **`/onboarding` (`OnboardingFlow.tsx`)** asks only for what the database doesn't have yet (account type, age, the current Terms / Privacy versions), so it resumes anywhere. Individuals end on "You're ready to explore". Businesses stop at a placeholder until phases 4-5.
- **The age gate is neutral:** month and year dropdowns, with "Do you live in Quebec?" only when the person is exactly 13. Too young: a friendly message, nothing kept, and the device waits a day. If the database refuses an age, the same screen shows with Sign out.
- **Sent back to onboarding:** the middleware redirects signed-in people who haven't finished from every app page, then returns them to that page. It skips guests, `/`, sign-in, `/terms`, `/privacy` and the API. A cookie remembers "finished" so most requests don't query the database; it never grants anything.
- **Guests** ("Just looking?") go straight to Home, since they have no account to onboard.
- **`/terms` and `/privacy`:** placeholder text with a "Draft" notice. It describes what FUZO actually does, but the client must send the real wording. Bump `TERMS_VERSION` / `PRIVACY_VERSION` in `policy.ts` when it changes, and everyone accepts the new version on their next visit to onboarding.
- **Tests:** 117 browser checks, passing, with Supabase faked in the browser:
  - every step and branch: Quebec, too young, the one-day wait, business;
  - saving the browser choices after sign-in, and resuming at the age step;
  - keyboard use, reduced motion, light and dark, 320-1600 px with no sideways scroll, accessibility and the console.
- **Not tested in the browser:** the middleware redirect, since it needs a real signed-in session. Check it on the phone after the migration is pushed.

## Phase 3 notes

- **Order for a new individual:** type → age → consent → **Your profile** (I-04) → **Build your food profile** (I-05) → the food profile (I-05A, optional) → **You're ready** (I-06).
- **Profile:**
  - **Name and @username are required.** The username is suggested from the name ("Asha Patel" → `asha.patel`) and checked live (free / taken / bad characters). The database also refuses duplicates in other capitals.
  - **Photo and roles are optional.** "Skip optional profile details" saves just the name and username.
  - **The photo is re-saved as a JPEG of at most 800px,** which removes its hidden location data. This now applies to every avatar and banner upload, including Settings.
- **Food profile:** 9 screens.
  - **Flavours:** up to 5, from the 10 Flavour DNA axes, the same list as the client's mock.
  - **Cuisines and diet:** up to 10 cuisines, plus diets from FUZO's taxonomy; "No restrictions" can't be combined with a diet.
  - **Food DNA:** the 5 sections of FUZO's real quiz.
  - **The result:** a persona and the 5 scores.
- **Saving and skipping:**
  - **Saved as you go:** each screen saves when you leave it (`taste_profiles`, plus the quiz answers in `user_onboarding.data`), so it resumes on the same screen.
  - **Skipping:** "Skip for now" works on every screen. It records `skipped` (or `in_progress` if something was saved) with the time, for the phase 7 reminders. Skipping never blocks anything.
- **Shared taste lists:** Settings → Taste preferences now uses the same lists (`lib/onboarding/taste.ts`). Older saved values that aren't in these lists still show in the summary.
- **Existing accounts (client, 2026-10-18):** `OnboardingCatchUp` checks once per browser session. If an account that is already onboarded lacks a birth date, the current Terms / Privacy, or roles (asked once, and "Not now" is fine), it sends them to `/onboarding` for just those steps, then back to the page they were on.
- **Tests:**
  - **103 browser checks:** profile, username states, photo, roles, skip, the full questionnaire, resume, skipping halfway, catch-up, an up-to-date account not being sent anywhere, 320-1600 px in light and dark, and accessibility.
  - **Phase 2's 117 checks** still pass.

## Still to confirm (client / legal, from the spec)

- Age rules for each launch country (Canada handled as above).
- The exact documents required for each category and country.
- What happens when approved documents expire, or the business changes its details.
- Terms of Service and Privacy Policy text.
