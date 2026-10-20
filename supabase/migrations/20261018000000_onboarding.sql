-- ============================================================================
-- Onboarding, phase 1: data and security rules (docs/ONBOARDING_PLAN.md)
-- ============================================================================
-- Client spec: "FUZO Onboarding Specification v1" (13 Oct 2026). The spec asks
-- that account creation, onboarding, profile visibility, verification and
-- what a business may do are kept apart, not folded into one boolean:
--
--  Individual
--   - users.account_type ('individual' | 'food_business'), set once.
--   - users.roles: profile labels (Food Explorer, Recipe Creator...), public.
--   - user_private: birth month/year - private, owner only, never public.
--     Age rules (Canada, client 2026-10-18): 13+, 14+ in Quebec (Law 25);
--     under-18s start with a private profile and no exact post location.
--   - user_consents: Terms / Privacy acceptance with version + time.
--   - user_onboarding: saved progress (resume), food-profile status, and the
--     "finish your profile" reminders for skipped questions.
--  Food Business
--   - restaurant_profiles: category, operations, reservations / loyalty /
--     delivery answers, and a public is_verified flag (badge).
--   - business_private: contact person, email, phone (owner + admins).
--   - business_branches: every location / service area; the main one is
--     copied onto restaurant_profiles so Scout and the profile keep working.
--   - business_documents + private storage bucket 'business-documents'.
--   - business_verification: awaiting_documents / pending_review /
--     action_required / verified. "Submission overdue" is worked out from the
--     deadline (account creation + 15 x 24 h), never stored.
--   - business_audit_log: every submission, review and status change.
--   - app_admins + admin_review_business(): approve / ask for changes.
--  Until a business is verified the DATABASE refuses (not just the app):
--   its food cards, restaurant posts, moments and highlights; menu changes;
--   gallery changes. The public profile stays visible, and normal users can
--   still tag the place in their own posts.
--  Businesses that existed before this migration are test data (client,
--  2026-10-18) and are marked verified, so nothing of theirs is locked.
--
-- "App users" below = requests running as anon / authenticated
-- (current_user). SECURITY DEFINER functions and the service role are not
-- affected by the guards. The guard triggers themselves run as the caller
-- (not SECURITY DEFINER), otherwise current_user would be the owner.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Admins
-- ---------------------------------------------------------------------------
-- Add an admin in the Supabase SQL editor:
--   INSERT INTO public.app_admins (user_id) VALUES ('<user id>');
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_admins FROM anon, authenticated;
GRANT SELECT ON public.app_admins TO authenticated;
DROP POLICY IF EXISTS "Admins see their own admin row" ON public.app_admins;
CREATE POLICY "Admins see their own admin row" ON public.app_admins FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 1. users: account type + roles
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('individual', 'food_business')),
  ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_roles_check;
ALTER TABLE public.users ADD CONSTRAINT users_roles_check CHECK (
  roles <@ ARRAY['food_explorer', 'food_reviewer', 'food_blogger', 'food_travel_explorer', 'recipe_creator', 'cooking_instructor', 'chef']::TEXT[]
);

-- public.users has column-level grants (20260919010000_privacy_hardening):
-- new columns get nothing until granted here.
GRANT SELECT (account_type, roles) ON public.users TO anon, authenticated;
GRANT INSERT (account_type, roles), UPDATE (account_type, roles) ON public.users TO authenticated;

-- Usernames: lower case, 3-30 letters / numbers / . or _ (checked when set or
-- changed, so older rows aren't touched), unique ignoring case.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE username IS NOT NULL GROUP BY lower(username) HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON public.users (lower(username)) WHERE username IS NOT NULL;
  END IF;
END $$;

-- Is this username free? (Live check while typing; only answers yes/no.)
CREATE OR REPLACE FUNCTION public.username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_username ~ '^[a-z0-9._]{3,30}$'
    AND NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE lower(username) = lower(p_username) AND id IS DISTINCT FROM auth.uid()
    );
$$;
REVOKE ALL ON FUNCTION public.username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.username_available(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Private birth date + age rules
-- ---------------------------------------------------------------------------
-- Minimum age (Canada: OPC treats under-13s as unable to consent; Quebec's
-- Law 25 needs a parent's consent under 14). Change here if legal says so.
CREATE OR REPLACE FUNCTION public.onboarding_min_age(p_quebec BOOLEAN)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_quebec THEN 14 ELSE 13 END;
$$;

-- Whole years from a birth month/year. Only the month is known, so a
-- birthday counts from the month AFTER the birth month (never over-counts).
CREATE OR REPLACE FUNCTION public.age_from_birth(p_year INT, p_month INT, p_on DATE DEFAULT CURRENT_DATE)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ((EXTRACT(YEAR FROM p_on)::INT * 12 + EXTRACT(MONTH FROM p_on)::INT) - (p_year * 12 + p_month) - 1) / 12;
$$;

CREATE TABLE IF NOT EXISTS public.user_private (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  birth_month SMALLINT NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_year SMALLINT NOT NULL CHECK (birth_year >= 1900),
  lives_in_quebec BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_private ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_private FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_private TO authenticated;
DROP POLICY IF EXISTS "Own birth date only" ON public.user_private;
CREATE POLICY "Own birth date only" ON public.user_private FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.user_private_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_age INT;
BEGIN
  IF current_user IN ('anon', 'authenticated') AND TG_OP = 'UPDATE'
     AND (NEW.birth_month IS DISTINCT FROM OLD.birth_month OR NEW.birth_year IS DISTINCT FROM OLD.birth_year) THEN
    RAISE EXCEPTION 'Your birth date can''t be changed here. Contact FUZO support to correct it.' USING ERRCODE = '42501';
  END IF;
  IF NEW.birth_year > EXTRACT(YEAR FROM CURRENT_DATE) THEN
    RAISE EXCEPTION 'Enter a real birth year.' USING ERRCODE = '22023';
  END IF;
  v_age := public.age_from_birth(NEW.birth_year, NEW.birth_month);
  IF v_age < public.onboarding_min_age(COALESCE(NEW.lives_in_quebec, false)) THEN
    RAISE EXCEPTION 'not_eligible' USING ERRCODE = '22023', DETAIL = 'Under the minimum age for FUZO.';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_private_check ON public.user_private;
CREATE TRIGGER user_private_check BEFORE INSERT OR UPDATE ON public.user_private
  FOR EACH ROW EXECUTE FUNCTION public.user_private_check();

-- Under-18s: private profile and no exact location on posts, by default
-- (set once when the birth date is first saved; they can change it later).
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS post_exact_location BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.user_private_teen_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.age_from_birth(NEW.birth_year, NEW.birth_month) < 18 THEN
    INSERT INTO public.user_settings (user_id, profile_visibility, post_exact_location)
    VALUES (NEW.user_id, 'Private', false)
    ON CONFLICT (user_id) DO UPDATE SET profile_visibility = 'Private', post_exact_location = false;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.user_private_teen_defaults() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS user_private_teen_defaults ON public.user_private;
CREATE TRIGGER user_private_teen_defaults AFTER INSERT ON public.user_private
  FOR EACH ROW EXECUTE FUNCTION public.user_private_teen_defaults();

-- ---------------------------------------------------------------------------
-- 3. Consents (Terms of Service, Privacy Policy)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_consents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  document TEXT NOT NULL CHECK (document IN ('terms', 'privacy')),
  version TEXT NOT NULL CHECK (char_length(version) BETWEEN 1 AND 40),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, document, version)
);
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_consents FROM anon, authenticated;
GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT USAGE ON SEQUENCE public.user_consents_id_seq TO authenticated;
DROP POLICY IF EXISTS "Own consents" ON public.user_consents;
CREATE POLICY "Own consents" ON public.user_consents FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Record own consent" ON public.user_consents;
CREATE POLICY "Record own consent" ON public.user_consents FOR INSERT WITH CHECK (user_id = auth.uid());

-- The time is the server's, never the client's.
CREATE OR REPLACE FUNCTION public.user_consents_stamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.accepted_at := NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_consents_stamp ON public.user_consents;
CREATE TRIGGER user_consents_stamp BEFORE INSERT ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.user_consents_stamp();

-- ---------------------------------------------------------------------------
-- 4. Onboarding progress + "finish your profile" reminders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  step TEXT CHECK (char_length(step) <= 40),
  data JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object' AND pg_column_size(data) <= 32768),
  food_prefs_status TEXT NOT NULL DEFAULT 'not_started' CHECK (food_prefs_status IN ('not_started', 'skipped', 'in_progress', 'completed')),
  skipped_at TIMESTAMPTZ,
  nudges_shown SMALLINT NOT NULL DEFAULT 0 CHECK (nudges_shown BETWEEN 0 AND 20),
  last_nudge_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_onboarding FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO authenticated;
DROP POLICY IF EXISTS "Own onboarding progress" ON public.user_onboarding;
CREATE POLICY "Own onboarding progress" ON public.user_onboarding FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Business: category, operations, preferences, public verified flag
-- ---------------------------------------------------------------------------
ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS business_category TEXT CHECK (business_category IN (
    'restaurant', 'cafe', 'bakery', 'food_truck', 'cloud_kitchen', 'catering_company', 'meal_prep', 'specialty_food')),
  ADD COLUMN IF NOT EXISTS operations JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(operations) = 'object' AND pg_column_size(operations) <= 8192),
  -- Reservations / loyalty: existing, FUZO's, both or neither = two yes/no answers each.
  ADD COLUMN IF NOT EXISTS reservations_existing BOOLEAN,
  ADD COLUMN IF NOT EXISTS reservations_wants_fuzo BOOLEAN,
  ADD COLUMN IF NOT EXISTS loyalty_existing BOOLEAN,
  ADD COLUMN IF NOT EXISTS loyalty_wants_fuzo BOOLEAN,
  -- FUZO never delivers; this is only whether they're on delivery apps.
  ADD COLUMN IF NOT EXISTS delivery_status TEXT CHECK (delivery_status IN ('listed', 'interested', 'not_offered')),
  -- Shown as the FUZO Verified badge; set only from business_verification.
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Contact details the public profile doesn't show.
CREATE TABLE IF NOT EXISTS public.business_private (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  contact_name TEXT CHECK (char_length(contact_name) <= 120),
  contact_email TEXT CHECK (char_length(contact_email) <= 200 AND (contact_email IS NULL OR contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  contact_phone TEXT CHECK (char_length(contact_phone) <= 40),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.business_private ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_private FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.business_private TO authenticated;
DROP POLICY IF EXISTS "Owner manages business contact" ON public.business_private;
CREATE POLICY "Owner manages business contact" ON public.business_private FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins read business contact" ON public.business_private;
CREATE POLICY "Admins read business contact" ON public.business_private FOR SELECT USING (public.is_app_admin());

-- ---------------------------------------------------------------------------
-- 6. Verification state + audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_verification (
  business_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'awaiting_documents'
    CHECK (status IN ('awaiting_documents', 'pending_review', 'action_required', 'verified')),
  -- The 15-day clock starts at account creation (spec section 8).
  account_created_at TIMESTAMPTZ NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  reviewer_note TEXT CHECK (char_length(reviewer_note) <= 500),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.business_verification ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_verification FROM anon, authenticated;
GRANT SELECT ON public.business_verification TO authenticated;
DROP POLICY IF EXISTS "Owner sees own verification" ON public.business_verification;
CREATE POLICY "Owner sees own verification" ON public.business_verification FOR SELECT
  USING (business_id = auth.uid() OR public.is_app_admin());

CREATE TABLE IF NOT EXISTS public.business_audit_log (
  id BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS business_audit_log_business_idx ON public.business_audit_log (business_id, created_at DESC);
ALTER TABLE public.business_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_audit_log FROM anon, authenticated;
GRANT SELECT ON public.business_audit_log TO authenticated;
DROP POLICY IF EXISTS "Owner and admins read the audit log" ON public.business_audit_log;
CREATE POLICY "Owner and admins read the audit log" ON public.business_audit_log FOR SELECT
  USING (business_id = auth.uid() OR public.is_app_admin());

CREATE OR REPLACE FUNCTION public.business_log(p_business UUID, p_action TEXT, p_details JSONB DEFAULT '{}'::jsonb)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.business_audit_log (business_id, actor_id, action, details) VALUES (p_business, auth.uid(), p_action, p_details);
$$;
REVOKE ALL ON FUNCTION public.business_log(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- Verified = documents approved. Accounts with no verification row are not
-- businesses under the new rules.
CREATE OR REPLACE FUNCTION public.business_is_verified(p_business UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.business_verification WHERE business_id = p_business AND status = 'verified');
$$;
GRANT EXECUTE ON FUNCTION public.business_is_verified(UUID) TO anon, authenticated;

-- Has this account signed up as a food business (verification row exists)?
CREATE OR REPLACE FUNCTION public.is_food_business(p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.business_verification WHERE business_id = p_user);
$$;
GRANT EXECUTE ON FUNCTION public.is_food_business(UUID) TO anon, authenticated;

-- The owner's status as shown in the app, incl. the worked-out "overdue".
CREATE OR REPLACE FUNCTION public.my_business_status()
RETURNS TABLE (status TEXT, deadline_at TIMESTAMPTZ, reviewer_note TEXT, submitted_at TIMESTAMPTZ, verified_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN v.status = 'awaiting_documents' AND NOW() > v.deadline_at THEN 'submission_overdue' ELSE v.status END,
    v.deadline_at, v.reviewer_note, v.submitted_at, v.verified_at
  FROM public.business_verification v
  WHERE v.business_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_business_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_business_status() TO authenticated;

-- Keep the public badge in step with the status; log every change.
CREATE OR REPLACE FUNCTION public.business_verification_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.restaurant_profiles SET is_verified = (NEW.status = 'verified') WHERE user_id = NEW.business_id;
    PERFORM public.business_log(NEW.business_id, 'status_changed', jsonb_build_object(
      'from', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END, 'to', NEW.status, 'note', NEW.reviewer_note));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.business_verification_changed() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS business_verification_changed ON public.business_verification;
CREATE TRIGGER business_verification_changed AFTER INSERT OR UPDATE ON public.business_verification
  FOR EACH ROW EXECUTE FUNCTION public.business_verification_changed();

-- ---------------------------------------------------------------------------
-- 7. users guard: account type set once, required steps before "onboarded"
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.users_onboarding_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_type TEXT := CASE WHEN TG_OP = 'UPDATE' THEN OLD.account_type END;
  v_old_profile TEXT := CASE WHEN TG_OP = 'UPDATE' THEN OLD.profile_type END;
  v_was_onboarded BOOLEAN := CASE WHEN TG_OP = 'UPDATE' THEN OLD.is_onboarded ELSE false END;
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Account type: chosen once.
  IF v_old_type IS NOT NULL AND NEW.account_type IS DISTINCT FROM v_old_type THEN
    RAISE EXCEPTION 'The account type can''t be changed.' USING ERRCODE = '42501';
  END IF;
  -- profile_type follows it ('business' only for food businesses).
  IF NEW.account_type = 'food_business' THEN
    NEW.profile_type := 'business';
  ELSIF NEW.account_type = 'individual' THEN
    NEW.profile_type := CASE WHEN NEW.profile_type IN ('foodlover', 'creator') THEN NEW.profile_type ELSE 'foodlover' END;
  ELSIF NEW.profile_type = 'business' AND v_old_profile IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Sign up as a food business to get a business profile.' USING ERRCODE = '42501';
  END IF;

  -- Usernames: lower case, 3-30 of a-z 0-9 . _
  IF NEW.username IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.username IS DISTINCT FROM OLD.username) THEN
    NEW.username := lower(NEW.username);
    IF NEW.username !~ '^[a-z0-9._]{3,30}$' THEN
      RAISE EXCEPTION 'Usernames are 3-30 letters, numbers, dots or underscores.' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- "Onboarded" = the required registration steps are done (spec section 13).
  IF NEW.is_onboarded AND NOT v_was_onboarded THEN
    IF NEW.account_type IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.user_consents c WHERE c.user_id = NEW.id AND c.document = 'terms')
       OR NOT EXISTS (SELECT 1 FROM public.user_consents c WHERE c.user_id = NEW.id AND c.document = 'privacy')
       OR coalesce(btrim(NEW.display_name), '') = ''
       OR (NEW.account_type = 'individual' AND NOT EXISTS (SELECT 1 FROM public.user_private p WHERE p.user_id = NEW.id))
       OR (NEW.account_type = 'food_business' AND NOT EXISTS (
            SELECT 1 FROM public.restaurant_profiles r WHERE r.user_id = NEW.id AND r.business_category IS NOT NULL))
    THEN
      RAISE EXCEPTION 'Finish the required onboarding steps first.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.users_onboarding_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS users_onboarding_guard ON public.users;
CREATE TRIGGER users_onboarding_guard BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_onboarding_guard();

-- Choosing "Food Business" starts the 15-day document clock (from account creation).
CREATE OR REPLACE FUNCTION public.users_start_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_created TIMESTAMPTZ := COALESCE(NEW.created_at, NOW());
BEGIN
  IF NEW.account_type = 'food_business' AND (TG_OP = 'INSERT' OR OLD.account_type IS DISTINCT FROM 'food_business') THEN
    INSERT INTO public.business_verification (business_id, account_created_at, deadline_at)
    VALUES (NEW.id, v_created, v_created + INTERVAL '15 days')
    ON CONFLICT (business_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.users_start_business() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS users_start_business ON public.users;
CREATE TRIGGER users_start_business AFTER INSERT OR UPDATE OF account_type ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_start_business();

-- ---------------------------------------------------------------------------
-- 8. restaurant_profiles guard: badge is server-set; gallery needs verified
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restaurant_profiles_business_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.is_verified := public.business_is_verified(NEW.user_id);
  IF current_user IN ('anon', 'authenticated') AND NOT NEW.is_verified
     AND NEW.gallery IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.gallery ELSE '[]'::jsonb END) THEN
    RAISE EXCEPTION 'The photo gallery unlocks once your documents are approved.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.restaurant_profiles_business_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS restaurant_profiles_business_guard ON public.restaurant_profiles;
CREATE TRIGGER restaurant_profiles_business_guard BEFORE INSERT OR UPDATE ON public.restaurant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.restaurant_profiles_business_guard();

-- ---------------------------------------------------------------------------
-- 9. Branches / operating locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT CHECK (char_length(name) <= 120),
  is_main BOOLEAN NOT NULL DEFAULT false,
  -- Fixed address, a service area (caterers, meal prep, cloud kitchens), or
  -- a base + area for mobile businesses (food trucks).
  location_kind TEXT NOT NULL DEFAULT 'address' CHECK (location_kind IN ('address', 'service_area', 'mobile')),
  address TEXT CHECK (char_length(address) <= 300),
  service_area TEXT CHECK (char_length(service_area) <= 300),
  lat DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180),
  -- A cloud kitchen's address isn't shown publicly.
  address_public BOOLEAN NOT NULL DEFAULT true,
  hours JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(hours) = 'object' AND pg_column_size(hours) <= 4096),
  active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_branches_location_check CHECK (
    (location_kind = 'address' AND coalesce(btrim(address), '') <> '')
    OR (location_kind = 'service_area' AND coalesce(btrim(service_area), '') <> '')
    OR (location_kind = 'mobile' AND (coalesce(btrim(address), '') <> '' OR coalesce(btrim(service_area), '') <> ''))
  )
);
CREATE INDEX IF NOT EXISTS business_branches_business_idx ON public.business_branches (business_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS business_branches_one_main ON public.business_branches (business_id) WHERE is_main;
ALTER TABLE public.business_branches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_branches FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_branches TO authenticated;
-- The table itself: owner and admins. Everyone else reads the view below.
DROP POLICY IF EXISTS "Owner and admins read branches" ON public.business_branches;
CREATE POLICY "Owner and admins read branches" ON public.business_branches FOR SELECT
  USING (business_id = auth.uid() OR public.is_app_admin());
DROP POLICY IF EXISTS "Owners manage their branches" ON public.business_branches;
CREATE POLICY "Owners manage their branches" ON public.business_branches FOR ALL
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid() AND public.is_food_business(business_id));

-- Public list of active locations. A hidden address (cloud kitchens) is
-- blanked for everyone but the owner. Runs as the view owner, so it filters
-- itself.
CREATE OR REPLACE VIEW public.business_branches_public AS
  SELECT id, business_id, name, is_main, location_kind,
    CASE WHEN address_public OR business_id = auth.uid() THEN address END AS address,
    service_area,
    CASE WHEN address_public OR business_id = auth.uid() THEN lat END AS lat,
    CASE WHEN address_public OR business_id = auth.uid() THEN lng END AS lng,
    hours, position
  FROM public.business_branches
  WHERE active;
REVOKE ALL ON public.business_branches_public FROM anon, authenticated;
GRANT SELECT ON public.business_branches_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.business_branches_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND (SELECT count(*) FROM public.business_branches WHERE business_id = NEW.business_id) >= 50 THEN
    RAISE EXCEPTION 'A business can have up to 50 locations.' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'A location can''t move to another business.' USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS business_branches_check ON public.business_branches;
CREATE TRIGGER business_branches_check BEFORE INSERT OR UPDATE ON public.business_branches
  FOR EACH ROW EXECUTE FUNCTION public.business_branches_check();

-- The main location is copied onto restaurant_profiles (Scout pins, the
-- profile's address and open/closed status read it from there). A hidden
-- address isn't copied, so it never shows publicly.
CREATE OR REPLACE FUNCTION public.business_branches_sync_main()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.business_log(OLD.business_id, 'branch_removed', jsonb_build_object('branch', OLD.id, 'name', OLD.name));
    RETURN OLD;
  END IF;
  IF NEW.is_main THEN
    UPDATE public.restaurant_profiles SET
      address = CASE WHEN NEW.address_public THEN NEW.address END,
      lat = CASE WHEN NEW.address_public THEN NEW.lat END,
      lng = CASE WHEN NEW.address_public THEN NEW.lng END,
      hours = CASE WHEN NEW.hours = '{}'::jsonb THEN hours ELSE NEW.hours END,
      updated_at = NOW()
    WHERE user_id = NEW.business_id;
  END IF;
  PERFORM public.business_log(NEW.business_id, CASE WHEN TG_OP = 'INSERT' THEN 'branch_added' ELSE 'branch_changed' END,
    jsonb_build_object('branch', NEW.id, 'name', NEW.name, 'main', NEW.is_main, 'active', NEW.active));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.business_branches_sync_main() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS business_branches_sync_main ON public.business_branches;
CREATE TRIGGER business_branches_sync_main AFTER INSERT OR UPDATE OR DELETE ON public.business_branches
  FOR EACH ROW EXECUTE FUNCTION public.business_branches_sync_main();

-- ---------------------------------------------------------------------------
-- 10. Documents (private bucket) + review
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('business-documents', 'business-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Files go in the owner's folder: <user id>/doc-<uuid>.pdf|jpg|jpeg|png
DROP POLICY IF EXISTS "Businesses upload their own documents" ON storage.objects;
CREATE POLICY "Businesses upload their own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-documents'
    AND name ~ '^[0-9a-f-]{36}/doc-[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND public.is_food_business(auth.uid())
  );
DROP POLICY IF EXISTS "Owner and admins read business documents" ON storage.objects;
CREATE POLICY "Owner and admins read business documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-documents' AND (split_part(name, '/', 1) = auth.uid()::text OR public.is_app_admin()));
-- No update / delete policies: a document is replaced by uploading a new one,
-- so the review history stays intact.

CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('business_registration', 'food_safety', 'other')),
  storage_path TEXT NOT NULL UNIQUE CHECK (storage_path ~ '^[0-9a-f-]{36}/doc-[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$'),
  file_name TEXT CHECK (char_length(file_name) <= 200),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes INT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  review_status TEXT NOT NULL DEFAULT 'submitted' CHECK (review_status IN ('submitted', 'approved', 'rejected')),
  reviewer_note TEXT CHECK (char_length(reviewer_note) <= 500),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  expires_on DATE
);
CREATE INDEX IF NOT EXISTS business_documents_business_idx ON public.business_documents (business_id, submitted_at DESC);
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_documents FROM anon, authenticated;
GRANT SELECT, INSERT ON public.business_documents TO authenticated;
DROP POLICY IF EXISTS "Owner and admins see documents" ON public.business_documents;
CREATE POLICY "Owner and admins see documents" ON public.business_documents FOR SELECT
  USING (business_id = auth.uid() OR public.is_app_admin());
DROP POLICY IF EXISTS "Businesses add their own documents" ON public.business_documents;
CREATE POLICY "Businesses add their own documents" ON public.business_documents FOR INSERT
  WITH CHECK (business_id = auth.uid() AND public.is_food_business(business_id));

CREATE OR REPLACE FUNCTION public.business_documents_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
BEGIN
  -- Review fields are the reviewer's; the file must be the owner's own upload.
  NEW.review_status := 'submitted';
  NEW.reviewer_note := NULL;
  NEW.reviewed_at := NULL;
  NEW.reviewed_by := NULL;
  NEW.submitted_at := NOW();
  IF split_part(NEW.storage_path, '/', 1) <> NEW.business_id::text
     OR NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'business-documents' AND o.name = NEW.storage_path) THEN
    RAISE EXCEPTION 'Upload the file first.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.business_documents_check() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS business_documents_check ON public.business_documents;
CREATE TRIGGER business_documents_check BEFORE INSERT ON public.business_documents
  FOR EACH ROW EXECUTE FUNCTION public.business_documents_check();

-- Submitting moves the business to review: the business registration is
-- needed the first time (food safety documents are "if applicable" in the
-- spec); after "action required", any new document re-submits. Approval is
-- always a person's decision.
CREATE OR REPLACE FUNCTION public.business_documents_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.business_log(NEW.business_id, 'document_submitted',
    jsonb_build_object('document', NEW.id, 'type', NEW.document_type, 'file', NEW.file_name));
  UPDATE public.business_verification SET status = 'pending_review', submitted_at = NOW(), updated_at = NOW()
  WHERE business_id = NEW.business_id
    AND (status = 'action_required' OR (status = 'awaiting_documents' AND NEW.document_type = 'business_registration'));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.business_documents_submitted() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS business_documents_submitted ON public.business_documents;
CREATE TRIGGER business_documents_submitted AFTER INSERT ON public.business_documents
  FOR EACH ROW EXECUTE FUNCTION public.business_documents_submitted();

-- Admin decision: approve, or ask for changes (a reason is required).
CREATE OR REPLACE FUNCTION public.admin_review_business(p_business UUID, p_approve BOOLEAN, p_note TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_note TEXT := NULLIF(btrim(p_note), '');
  v_status TEXT;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Only FUZO admins can review businesses.' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO v_status FROM public.business_verification WHERE business_id = p_business FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'That account is not a food business.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_approve AND v_note IS NULL THEN
    RAISE EXCEPTION 'Say what needs to change.' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'Keep the note under 500 characters.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.business_documents
  SET review_status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewer_note = v_note, reviewed_at = NOW(), reviewed_by = auth.uid()
  WHERE business_id = p_business AND review_status = 'submitted';

  UPDATE public.business_verification
  SET status = CASE WHEN p_approve THEN 'verified' ELSE 'action_required' END,
      reviewer_note = v_note,
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      verified_at = CASE WHEN p_approve THEN NOW() ELSE NULL END,
      updated_at = NOW()
  WHERE business_id = p_business;

  PERFORM public.business_log(p_business, CASE WHEN p_approve THEN 'approved' ELSE 'changes_requested' END,
    jsonb_build_object('note', v_note));
  RETURN CASE WHEN p_approve THEN 'verified' ELSE 'action_required' END;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_review_business(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_business(UUID, BOOLEAN, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 11. Lock business content until verified
-- ---------------------------------------------------------------------------
-- Posts BY a food business account. Normal users' posts that tag the place
-- are untouched.
CREATE OR REPLACE FUNCTION public.guard_unverified_business_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner UUID := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND public.is_food_business(v_owner) AND NOT public.business_is_verified(v_owner) THEN
    RAISE EXCEPTION 'Business posts unlock once your documents are approved.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_unverified_business_content() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_unverified_business_content ON public.food_cards;
CREATE TRIGGER guard_unverified_business_content BEFORE INSERT OR UPDATE ON public.food_cards
  FOR EACH ROW EXECUTE FUNCTION public.guard_unverified_business_content('user_id');
DROP TRIGGER IF EXISTS guard_unverified_business_content ON public.restaurant_posts;
CREATE TRIGGER guard_unverified_business_content BEFORE INSERT OR UPDATE ON public.restaurant_posts
  FOR EACH ROW EXECUTE FUNCTION public.guard_unverified_business_content('restaurant_id');
DROP TRIGGER IF EXISTS guard_unverified_business_content ON public.food_moments;
CREATE TRIGGER guard_unverified_business_content BEFORE INSERT OR UPDATE ON public.food_moments
  FOR EACH ROW EXECUTE FUNCTION public.guard_unverified_business_content('user_id');
DROP TRIGGER IF EXISTS guard_unverified_business_content ON public.profile_highlights;
CREATE TRIGGER guard_unverified_business_content BEFORE INSERT OR UPDATE ON public.profile_highlights
  FOR EACH ROW EXECUTE FUNCTION public.guard_unverified_business_content('user_id');

-- The Restaurant Dashboard's menu: verified businesses only.
DROP POLICY IF EXISTS "Owners manage their menu" ON public.menu_items;
CREATE POLICY "Owners manage their menu" ON public.menu_items
  FOR ALL
  USING (auth.uid() = restaurant_id)
  WITH CHECK (auth.uid() = restaurant_id AND public.is_business(restaurant_id) AND public.business_is_verified(restaurant_id));

-- ---------------------------------------------------------------------------
-- 12. Existing accounts
-- ---------------------------------------------------------------------------
-- Existing businesses are test data: verified, with their address as the
-- main location. Other existing accounts become individuals. (Their birth
-- date and roles are asked for on next sign-in, in the app.)
UPDATE public.users SET account_type = 'food_business' WHERE account_type IS NULL AND profile_type = 'business';
UPDATE public.users SET account_type = 'individual' WHERE account_type IS NULL AND is_onboarded;

INSERT INTO public.business_verification (business_id, status, account_created_at, deadline_at, verified_at, reviewer_note)
SELECT u.id, 'verified', COALESCE(u.created_at, NOW()), COALESCE(u.created_at, NOW()) + INTERVAL '15 days', NOW(),
       'Existing business before verification started (2026-10-18).'
FROM public.users u
WHERE u.profile_type = 'business'
ON CONFLICT (business_id) DO UPDATE SET status = 'verified', verified_at = COALESCE(public.business_verification.verified_at, NOW());

UPDATE public.restaurant_profiles rp SET business_category = 'restaurant' WHERE business_category IS NULL;

INSERT INTO public.business_branches (business_id, name, is_main, location_kind, address, lat, lng, hours)
SELECT rp.user_id, NULL, true, 'address', rp.address, rp.lat, rp.lng, rp.hours
FROM public.restaurant_profiles rp
WHERE coalesce(btrim(rp.address), '') <> ''
  AND NOT EXISTS (SELECT 1 FROM public.business_branches b WHERE b.business_id = rp.user_id);
