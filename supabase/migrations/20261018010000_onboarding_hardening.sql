-- ============================================================================
-- Onboarding, phase 8: security review fixes (docs/ONBOARDING_PLAN.md)
-- ============================================================================
-- 1. "Onboarded" now also needs what the screens require, so it can't be
--    skipped by calling the API directly: individuals need a username (I-04);
--    food businesses need a contact person + contact email (B-02).
-- 2. Business documents are capped at 20 files per business (each is already
--    limited to 10 MB), so the private bucket can't be filled up.
-- Accounts that were already onboarded are not affected (the check runs only
-- when an account becomes onboarded).
-- ============================================================================

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
       OR (NEW.account_type = 'individual' AND (
            NEW.username IS NULL
            OR NOT EXISTS (SELECT 1 FROM public.user_private p WHERE p.user_id = NEW.id)))
       OR (NEW.account_type = 'food_business' AND (
            NOT EXISTS (SELECT 1 FROM public.restaurant_profiles r WHERE r.user_id = NEW.id AND r.business_category IS NOT NULL)
            OR NOT EXISTS (
              SELECT 1 FROM public.business_private b
              WHERE b.user_id = NEW.id AND coalesce(btrim(b.contact_name), '') <> '' AND coalesce(btrim(b.contact_email), '') <> '')))
    THEN
      RAISE EXCEPTION 'Finish the required onboarding steps first.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
  IF (SELECT count(*) FROM public.business_documents d WHERE d.business_id = NEW.business_id) >= 20 THEN
    RAISE EXCEPTION 'A business can upload up to 20 documents. Contact FUZO support if you need to replace more.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.business_documents_check() FROM PUBLIC, anon, authenticated;

-- The same cap on the files themselves.
DROP POLICY IF EXISTS "Businesses upload their own documents" ON storage.objects;
CREATE POLICY "Businesses upload their own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-documents'
    AND name ~ '^[0-9a-f-]{36}/doc-[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND public.is_food_business(auth.uid())
    AND (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = 'business-documents' AND split_part(o.name, '/', 1) = auth.uid()::text) < 20
  );
