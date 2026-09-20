'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHero, { type ProfileNavTarget } from '@/components/profile/ProfileHero';
import ProfileTabs from '@/components/profile/ProfileTabs';
import type { UserProfile } from '@/components/profile/demoProfile';
import type { FoodDnaRealData } from '@/components/profile/FoodDnaSection';
import { createClient } from '@/lib/supabase/client';
import { useMyFoodCards } from '@/lib/hooks/useMyFoodCards';
import { TYPE_META } from '@/lib/types/foodCard';
import { PointsService } from '@/lib/services/pointsService';
import { FriendRequestService } from '@/lib/services/friendRequestService';

const ACTIVITY_CATEGORIES = ['places', 'recipes', 'videos', 'posts'] as const;
type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityParam = searchParams.get('activity');
  const initialActivityCategory = ACTIVITY_CATEGORIES.includes(activityParam as ActivityCategory)
    ? (activityParam as ActivityCategory)
    : undefined;
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'dna' ? 'dna' : tabParam === 'settings' ? 'settings' : undefined;

  const [realProfile, setRealProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [tasteProfile, setTasteProfile] = useState<FoodDnaRealData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const { cards: myCards, isLoading: isLoadingCards, refetch: refetchCards } = useMyFoodCards(currentUserId);

  const bitesCount = useMemo(
    () => myCards.filter((c) => TYPE_META[c.card_type].family === 'recipe' && c.status === 'PUBLISHED').length,
    [myCards],
  );

  const postsCount = useMemo(
    () => myCards.filter((c) => TYPE_META[c.card_type].family === 'discovery' && c.status === 'PUBLISHED').length,
    [myCards],
  );

  const [navOverride, setNavOverride] = useState<{ target: ProfileNavTarget; nonce: number } | null>(null);
  const handleNavigate = (target: ProfileNavTarget) => setNavOverride({ target, nonce: Date.now() });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in -> redirect to login
        router.replace('/login');
        return;
      }

      setCurrentUserId(user.id);

      const [{ data: pubRow }, { data: privRow }] = await Promise.all([
        supabase.from('users').select('display_name, username, bio, profile_type, avatar_url, banner_url').eq('id', user.id).maybeSingle(),
        // Home coordinates are owner-only - read through my_private_profile, never from users.
        supabase.from('my_private_profile').select('lat, lng').maybeSingle(),
      ]);
      const userRow = pubRow ? { ...pubRow, lat: privRow?.lat ?? null, lng: privRow?.lng ?? null } : null;

      // Fetch real gamification level
      const statsResult = await PointsService.getUserStats(user.id);
      const userLevel = statsResult.success && statsResult.data ? statsResult.data.level : 1;

      // Fetch real accepted friend count
      const friendsResult = await FriendRequestService.listAcceptedFriendIds(user.id);
      const userFriends = friendsResult.success && friendsResult.data ? friendsResult.data.length : 0;

      if (userRow) {
        setRealProfile({
          name: userRow.display_name || user.email?.split('@')[0] || 'FUZO Member',
          handle: userRow.username || user.email?.split('@')[0] || 'user',
          bio: userRow.bio ?? null,
          role: userRow.profile_type === 'business' ? 'Restaurant' : userRow.profile_type === 'creator' ? 'Creator' : 'Food Explorer',
          type: userRow.profile_type === 'business' ? 'restaurant' : 'person',
          level: userLevel,
          friends: userFriends,
          bites: 0,
          posts: 0,
          avatarUrl: userRow.avatar_url ?? user.user_metadata?.avatar_url ?? null,
          bannerUrl: userRow.banner_url,
        });

        if (typeof userRow.lat === 'number' && typeof userRow.lng === 'number') {
          setTasteProfile((prev) => ({ ...prev, homeLocation: { lat: userRow.lat as number, lng: userRow.lng as number } }));
        }
      } else {
        // Fallback for new user with auth session but no users table row yet
        setRealProfile({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'FUZO Member',
          handle: user.email?.split('@')[0] || 'user',
          role: 'Food Explorer',
          type: 'person',
          level: 1,
          friends: 0,
          bites: 0,
          posts: 0,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
          bannerUrl: null,
        });
      }

      if (statsResult.success && statsResult.data) {
        setTasteProfile((prev) => ({ ...prev, gamification: statsResult.data }));
      }

      const { data: taste } = await supabase
        .from('taste_profiles')
        .select('cuisines, dietary, result_emoji, result_title, result_desc, dna_scores')
        .eq('user_id', user.id)
        .maybeSingle();

      if (taste) {
        setTasteProfile((prev) => ({
          ...prev,
          cuisines: taste.cuisines ?? undefined,
          dietary: taste.dietary ?? undefined,
          personality: taste.result_title ? { icon: taste.result_emoji, title: taste.result_title, desc: taste.result_desc } : null,
          dnaScores: taste.dna_scores ?? null,
        }));
      }

      setIsLoading(false);
    })();
  }, [router]);

  if (isLoading || !realProfile) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    );
  }

  const profile: UserProfile = { ...realProfile, bites: bitesCount, posts: postsCount };

  const effectiveInitialTab = navOverride ? (navOverride.target.tab === 'settings' ? 'settings' : 'activity') : initialTab;
  const effectiveInitialCategory =
    navOverride?.target.tab === 'activity' ? navOverride.target.category : initialActivityCategory;

  return (
    <div className="profile-shell">
      <ProfileHero profile={profile} userId={currentUserId} onNavigate={handleNavigate} />
      <ProfileTabs
        key={navOverride?.nonce ?? 'real-profile'}
        userId={currentUserId}
        profile={profile}
        tasteProfile={tasteProfile}
        initialActivityCategory={effectiveInitialCategory}
        initialTab={effectiveInitialTab}
        myCards={myCards}
        isLoadingCards={isLoadingCards}
        refetchCards={refetchCards}
        onProfileUpdate={(patch) => setRealProfile((prev) => (prev ? { ...prev, ...patch } : prev))}
      />
    </div>
  );
}
