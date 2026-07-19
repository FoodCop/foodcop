'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileTabs from '@/components/profile/ProfileTabs';
import type { DemoProfile } from '@/components/profile/demoProfile';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

// Views any user's (including a masterbot's) profile by id. Mirrors the
// signed-in-user fetch in /profile/page.tsx, but for an arbitrary userId -
// taste_profiles is owner-only RLS, so a non-owner's fetch naturally comes
// back empty and FoodDnaSection falls back to its "Demo preview" state.
export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isCurrentUser = user?.id === userId;

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const { data: userRow } = await supabase
        .from('users')
        .select('display_name, username, profile_type, profile_subtype')
        .eq('id', userId)
        .maybeSingle();

      if (userRow) {
        setProfile({
          name: userRow.display_name || 'FUZO User',
          handle: userRow.username || 'user',
          role: userRow.profile_subtype || (userRow.profile_type === 'business' ? 'Restaurant' : userRow.profile_type === 'creator' ? 'Creator' : 'Food Explorer'),
          type: userRow.profile_type === 'business' ? 'restaurant' : 'person',
          bites: 0,
        });
      }
      setIsLoading(false);
    })();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <ProfileHeader />
        <div className="text-center text-muted py-5">User not found.</div>
      </div>
    );
  }

  return (
    <div>
      <ProfileHeader title={profile.name} />
      <ProfileHero profile={profile} userId={userId} />
      <ProfileTabs profile={profile} userId={userId} isCurrentUser={isCurrentUser} />
    </div>
  );
}
