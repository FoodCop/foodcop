-- ==========================================
-- Real per-user app settings
-- ==========================================
-- Discovery Radius / Match Sensitivity / Show Hidden Gems / Prioritise
-- Trending / Profile Visibility / Show Food DNA / AI Card Generation / Use
-- Activity for ML - SettingsTab.tsx's Discovery & Matching, Privacy &
-- Social, and AI & Personalisation sections were all uncontrolled native
-- inputs (defaultValue/defaultChecked), nothing read or written anywhere.
-- One new 1:1 table, matching this project's existing convention
-- (taste_profiles/user_stats are already separate 1:1 tables keyed on
-- user_id rather than growing users further). Defaults below match the
-- mockup's previous hardcoded values exactly, so a fresh user's displayed
-- state doesn't change - it just becomes real.
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  discovery_radius_km INT NOT NULL DEFAULT 25,
  match_sensitivity TEXT NOT NULL DEFAULT 'Balanced' CHECK (match_sensitivity IN ('Broad', 'Balanced', 'Exact')),
  show_hidden_gems BOOLEAN NOT NULL DEFAULT true,
  prioritize_trending BOOLEAN NOT NULL DEFAULT false,
  profile_visibility TEXT NOT NULL DEFAULT 'Public' CHECK (profile_visibility IN ('Public', 'Followers', 'Private')),
  show_food_dna BOOLEAN NOT NULL DEFAULT true,
  ai_card_generation BOOLEAN NOT NULL DEFAULT true,
  use_activity_for_ml BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings." ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings." ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings." ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.user_settings TO anon, authenticated, service_role;
