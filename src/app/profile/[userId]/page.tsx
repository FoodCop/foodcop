'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHero, { type ProfileNavTarget } from '@/components/profile/ProfileHero';
import ProfileTabs from '@/components/profile/ProfileTabs';
import PrivateProfileNotice from '@/components/profile/PrivateProfileNotice';
import type { DemoProfile } from '@/components/profile/demoProfile';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { UserSettingsService, type ProfileVisibility } from '@/lib/services/userSettingsService';
import { FriendRequestService } from '@/lib/services/friendRequestService';
import { useMyFoodCards } from '@/lib/hooks/useMyFoodCards';
import { TYPE_META } from '@/lib/types/foodCard';
import { PointsService } from '@/lib/services/pointsService';

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
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibility, setVisibility] = useState<ProfileVisibility>('Private');
  const [showFoodDna, setShowFoodDna] = useState(false);
  // Fail closed: nothing about the profile's content is requested until the
  // database says this viewer is allowed to see it.
  const [canView, setCanView] = useState(false);
  // Bumped when a follow/accept changes the relationship, to re-ask the database whether this viewer can now see the profile.
  const [accessNonce, setAccessNonce] = useState(0);

  const isCurrentUser = user?.id === userId;
  const { cards: myCards, isLoading: isLoadingCards, refetch: refetchCards } = useMyFoodCards(canView ? userId : undefined);
  const bitesCount = useMemo(
    () => myCards.filter((c) => TYPE_META[c.card_type].family === 'recipe' && c.status === 'PUBLISHED').length,
    [myCards],
  );
  const postsCount = useMemo(() => myCards.filter((c) => c.status === 'PUBLISHED').length, [myCards]);
  const [navOverride, setNavOverride] = useState<{ target: ProfileNavTarget; nonce: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const { data: userRow } = await supabase
        .from('users')
        .select('display_name, username, bio, profile_type, profile_subtype, avatar_url, banner_url')
        .eq('id', userId)
        .maybeSingle();

      const statsResult = await PointsService.getUserStats(userId);
      const userLevel = statsResult.success && statsResult.data ? statsResult.data.level : 1;

      const friendsResult = await FriendRequestService.getFriendCount(userId);
      const friendCount = friendsResult.success && typeof friendsResult.data === 'number' ? friendsResult.data : 0;

      if (userRow) {
        setProfile({
          name: userRow.display_name || 'FUZO User',
          handle: userRow.username || 'user',
          bio: userRow.bio ?? null,
          role: userRow.profile_subtype || (userRow.profile_type === 'business' ? 'Restaurant' : userRow.profile_type === 'creator' ? 'Creator' : 'Food Explorer'),
          type: userRow.profile_type === 'business' ? 'restaurant' : 'person',
          level: userLevel,
          friends: friendCount,
          bites: 0,
          posts: 0,
          avatarUrl: userRow.avatar_url,
          bannerUrl: userRow.banner_url,
        });
      }

      // Owner: always visible. Everyone else: the database decides (fail-closed).
      const access = user?.id === userId
        ? { canView: true, visibility: 'Public' as ProfileVisibility, showFoodDna: true }
        : await UserSettingsService.getProfileAccess(userId);
      setVisibility(access.visibility);
      setShowFoodDna(access.showFoodDna);
      setCanView(access.canView);

      setIsLoading(false);
    })();
  }, [userId, user?.id, accessNonce]);

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

  // Private profile: like Instagram, the header (photo, name, bio, Follow / Message)
  // stays visible - only posts, highlights and Food DNA are held back.
  if (!canView) {
    return (
      <div className="profile-shell">
        <ProfileHero
          profile={profile}
          userId={userId}
          restricted
          onRelationshipChange={() => setAccessNonce((n) => n + 1)}
        />
        <div className="container">
          <PrivateProfileNotice name={profile.name} />
        </div>
      </div>
    );
  }

  const profileWithBites = { ...profile, bites: bitesCount, posts: postsCount };
  const effectiveInitialTab = navOverride ? (navOverride.target.tab === 'settings' ? 'settings' : 'activity') : undefined;
  const effectiveInitialCategory = navOverride?.target.tab === 'activity' ? navOverride.target.category : undefined;

  return (
    <div className="profile-shell">
      <ProfileHero profile={profileWithBites} userId={userId} onNavigate={(target) => setNavOverride({ target, nonce: Date.now() })} onRelationshipChange={() => setAccessNonce((n) => n + 1)} />
      <ProfileTabs
        key={navOverride?.nonce ?? 'initial'}
        profile={profileWithBites}
        userId={userId}
        isCurrentUser={isCurrentUser}
        showFoodDna={showFoodDna}
        myCards={myCards}
        isLoadingCards={isLoadingCards}
        refetchCards={refetchCards}
        initialTab={effectiveInitialTab}
        initialActivityCategory={effectiveInitialCategory}
      />
    </div>
  );
}
