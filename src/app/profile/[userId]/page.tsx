'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileTabs from '@/components/profile/ProfileTabs';
import type { DemoProfile } from '@/components/profile/demoProfile';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { UserSettingsService, DEFAULT_USER_SETTINGS, type ProfileVisibility } from '@/lib/services/userSettingsService';
import { FriendRequestService } from '@/lib/services/friendRequestService';

// Views any user's (including a masterbot's) profile by id. Mirrors the
// signed-in-user fetch in /profile/page.tsx, but for an arbitrary userId -
// taste_profiles is owner-only RLS, so a non-owner's fetch naturally comes
// back empty and FoodDnaSection falls back to its "Demo preview" state.
//
// Profile Visibility (Settings' Privacy & Social section) is enforced here,
// client-side - Public (default) behaves exactly as before; Followers only
// renders for an accepted-friend relationship (the same mutual-friend model
// Chat already uses); Private only renders for the owner themself.
export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibility, setVisibility] = useState<ProfileVisibility>('Public');
  const [showFoodDna, setShowFoodDna] = useState(true);
  const [canView, setCanView] = useState(true);

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
        .select('display_name, username, profile_type, profile_subtype, avatar_url, banner_url')
        .eq('id', userId)
        .maybeSingle();

      if (userRow) {
        setProfile({
          name: userRow.display_name || 'FUZO User',
          handle: userRow.username || 'user',
          role: userRow.profile_subtype || (userRow.profile_type === 'business' ? 'Restaurant' : userRow.profile_type === 'creator' ? 'Creator' : 'Food Explorer'),
          type: userRow.profile_type === 'business' ? 'restaurant' : 'person',
          bites: 0,
          avatarUrl: userRow.avatar_url,
          bannerUrl: userRow.banner_url,
        });
      }

      if (user?.id === userId) {
        // Owner viewing their own profile: always visible, settings not needed for the gate.
        setCanView(true);
      } else {
        const settingsResult = await UserSettingsService.getForUser(userId);
        const ownerSettings = settingsResult.success && settingsResult.data ? settingsResult.data : DEFAULT_USER_SETTINGS;
        setVisibility(ownerSettings.profileVisibility);
        setShowFoodDna(ownerSettings.showFoodDna);

        if (ownerSettings.profileVisibility === 'Public') {
          setCanView(true);
        } else if (ownerSettings.profileVisibility === 'Private') {
          setCanView(false);
        } else {
          // Followers: only an accepted-friend relationship can view.
          const relResult = user?.id
            ? await FriendRequestService.getRelationship(user.id, userId)
            : { success: true as const, data: { state: 'none' as const, request: null } };
          setCanView(relResult.success && relResult.data?.state === 'accepted');
        }
      }

      setIsLoading(false);
    })();
  }, [userId, user?.id]);

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

  if (!canView) {
    return (
      <div>
        <ProfileHeader title={profile.name} />
        <div className="text-center text-muted py-5">
          <div className="fs-1 mb-2">🔒</div>
          {visibility === 'Private' ? 'This profile is private.' : 'Only followers can view this profile.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProfileHeader title={profile.name} />
      <ProfileHero profile={profile} userId={userId} />
      <ProfileTabs profile={profile} userId={userId} isCurrentUser={isCurrentUser} showFoodDna={showFoodDna} />
    </div>
  );
}
