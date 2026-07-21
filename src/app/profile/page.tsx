'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { DEMO_PROFILES, type DemoProfile } from '@/components/profile/demoProfile';
import type { FoodDnaRealData } from '@/components/profile/FoodDnaSection';
import { createClient } from '@/lib/supabase/client';

const ACTIVITY_CATEGORIES = ['places', 'recipes', 'videos', 'posts'] as const;
type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

// Real signed-in users get their actual users/taste_profiles row (name,
// role, top cuisines, dietary prefs, quiz personality); the demo
// person/restaurant toggle below is the design-preview fallback for when
// there's no session (Supabase not configured, or logged out).
export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const activityParam = searchParams.get('activity');
  const initialActivityCategory = ACTIVITY_CATEGORIES.includes(activityParam as ActivityCategory)
    ? (activityParam as ActivityCategory)
    : undefined;
  const initialTab = searchParams.get('tab') === 'dna' ? 'dna' : undefined;

  const [demoType, setDemoType] = useState<'person' | 'restaurant'>('person');
  const [realProfile, setRealProfile] = useState<DemoProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [tasteProfile, setTasteProfile] = useState<FoodDnaRealData | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: userRow } = await supabase
        .from('users')
        .select('display_name, username, profile_type, avatar_url, banner_url')
        .eq('id', user.id)
        .maybeSingle();
      if (userRow) {
        setRealProfile({
          name: userRow.display_name || 'FUZO User',
          handle: userRow.username || user.email?.split('@')[0] || 'user',
          role: userRow.profile_type === 'business' ? 'Restaurant' : userRow.profile_type === 'creator' ? 'Creator' : 'Food Explorer',
          type: userRow.profile_type === 'business' ? 'restaurant' : 'person',
          bites: 0,
          avatarUrl: userRow.avatar_url ?? user.user_metadata?.avatar_url ?? null,
          bannerUrl: userRow.banner_url,
        });
      }

      const { data: taste } = await supabase
        .from('taste_profiles')
        .select('cuisines, dietary, result_emoji, result_title, result_desc, dna_scores')
        .eq('user_id', user.id)
        .maybeSingle();
      if (taste) {
        setTasteProfile({
          cuisines: taste.cuisines ?? undefined,
          dietary: taste.dietary ?? undefined,
          personality: taste.result_title ? { icon: taste.result_emoji, title: taste.result_title, desc: taste.result_desc } : null,
          dnaScores: taste.dna_scores ?? null,
        });
      }
    })();
  }, []);

  const profile = realProfile ?? DEMO_PROFILES[demoType];

  return (
    <div>
      <ProfileHeader />
      <ProfileHero profile={profile} userId={currentUserId} />
      <ProfileTabs profile={profile} tasteProfile={tasteProfile} initialActivityCategory={initialActivityCategory} initialTab={initialTab} />

      {!realProfile && (
        <div className="container text-center py-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setDemoType((t) => (t === 'person' ? 'restaurant' : 'person'))}
          >
            Preview as: {demoType === 'person' ? 'Person' : 'Restaurant'} (tap to switch)
          </button>
        </div>
      )}
    </div>
  );
}
