-- ==========================================
-- Fix: profile_visibility/show_food_dna couldn't actually be enforced
-- ==========================================
-- user_settings' original SELECT policy was owner-only (auth.uid() = user_id),
-- copying taste_profiles' convention - but profile_visibility and
-- show_food_dna specifically need to be readable by *other* users, since
-- they're the whole mechanism /profile/[userId]/page.tsx uses to decide
-- whether to show a profile to a non-owner at all. Under the owner-only
-- policy, a non-owner's read silently came back empty (not an error) and
-- fell through to the client's DEFAULT_USER_SETTINGS (Public/true) - so
-- Private profiles were never actually private. Found via a real two-account
-- Playwright check (scout-tester set Private, scout-friend could still see
-- everything), not assumed. None of the 8 settings are sensitive/PII, so
-- making the whole row publicly readable (matching public.users' own
-- "viewable by everyone" SELECT policy) is the simplest correct fix, rather
-- than splitting into a public-columns view for just two fields.
DROP POLICY IF EXISTS "Users can view own settings." ON public.user_settings;
CREATE POLICY "User settings are viewable by everyone." ON public.user_settings FOR SELECT USING (true);
