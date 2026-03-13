-- Reset onboarding completion flags for all current users.
-- This forces onboarding to appear again after sign-in.
UPDATE auth.users
SET raw_user_meta_data =
  (
    (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'onboarding_completed' - 'has_completed_onboarding')
    || jsonb_build_object('onboarding_completed', false, 'has_completed_onboarding', false)
  ),
  updated_at = NOW()
WHERE id IS NOT NULL;
