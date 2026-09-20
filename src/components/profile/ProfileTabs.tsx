'use client';

import { useState } from 'react';
import type { DemoProfile } from './demoProfile';
import FoodDnaSection, { type FoodDnaRealData } from './FoodDnaSection';
import ActivityTab from './ActivityTab';
import SettingsTab from './SettingsTab';
import RestaurantMenuTab from './restaurant/RestaurantMenuTab';
import RestaurantInfoTab from './restaurant/RestaurantInfoTab';
import RestaurantGalleryTab from './restaurant/RestaurantGalleryTab';
import type { FoodCardRecord } from '@/lib/types/foodCard';

type PersonTab = 'settings' | 'activity' | 'dna';
type BusinessTab = 'settings' | 'menu' | 'activity' | 'info' | 'gallery';

const EMPTY_STATE: Record<string, { emoji: string; text: string }> = {
  settings: { emoji: '⚙️', text: 'Settings unavailable' },
  menu: { emoji: '📜', text: 'No menu available' },
  info: { emoji: 'ℹ️', text: 'No info available' },
  gallery: { emoji: '🖼️', text: 'No gallery available' },
  activity: { emoji: '💬', text: 'No recent activity to show.' },
};

const TAB_LABEL: Record<string, string> = {
  dna: 'Food DNA',
  settings: 'Settings',
  menu: 'Menu',
  activity: 'Activity',
  info: 'About & Hours',
  gallery: 'Gallery',
};

// Tab labels/copy ported verbatim from the old app's profile.html switchTab()
// empty states; switching driven by React state. "Food DNA" tab ports
// dna.html's charts. Re-skinned onto Bootstrap nav-tabs.
export default function ProfileTabs({
  profile,
  tasteProfile,
  userId,
  isCurrentUser = true,
  initialActivityCategory,
  showFoodDna = true,
  initialTab,
  myCards,
  isLoadingCards,
  refetchCards,
  onProfileUpdate,
}: {
  profile: DemoProfile;
  tasteProfile?: FoodDnaRealData;
  userId?: string;
  isCurrentUser?: boolean;
  initialActivityCategory?: 'places' | 'recipes' | 'videos' | 'posts';
  /** Settings' "Show Food DNA™" toggle - only gates a non-owner's view; the owner always sees their own tab. */
  showFoodDna?: boolean;
  /** Deep-link support, e.g. `/profile?tab=dna` after finishing the Food DNA quiz. */
  initialTab?: string;
  myCards: FoodCardRecord[];
  isLoadingCards: boolean;
  refetchCards: () => void | Promise<void>;
  /** Lets Settings' Edit Profile fields update ProfileHero's name/handle immediately, without a reload. Owner view only. */
  onProfileUpdate?: (patch: Partial<Pick<DemoProfile, 'name' | 'handle'>>) => void;
}) {
  const dnaVisible = isCurrentUser || showFoodDna;
  const tabs: (PersonTab | BusinessTab)[] = profile.type === 'restaurant'
    ? ['menu', 'activity', 'info', 'gallery']
    : isCurrentUser
      ? ['activity', 'dna', 'settings']
      : dnaVisible
        ? ['activity', 'dna']
        : ['activity'];

  const defaultTab = profile.type === 'restaurant' ? 'menu' : 'activity';
  const [active, setActive] = useState<string>(
    initialTab && (tabs as string[]).includes(initialTab) ? initialTab : defaultTab,
  );

  return (
    <div className="container mt-0">
      <div className="fz-profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`fz-profile-tab${active === tab ? ' fz-profile-tab--active' : ''}`}
            onClick={() => setActive(tab)}
          >
            {TAB_LABEL[tab] ?? tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {active === 'dna' ? (
        <FoodDnaSection {...tasteProfile} myCards={myCards} userId={userId} isOwner={isCurrentUser} />
      ) : active === 'activity' ? (
        <ActivityTab
          userId={userId}
          isCurrentUser={isCurrentUser}
          initialCategory={initialActivityCategory}
          myCards={myCards}
          isLoadingCards={isLoadingCards}
          refetchCards={refetchCards}
        />
      ) : active === 'menu' ? (
        <RestaurantMenuTab categories={profile.menuCategories} />
      ) : active === 'info' ? (
        <RestaurantInfoTab info={profile.restaurantInfo} restaurantName={profile.name} />
      ) : active === 'gallery' ? (
        <RestaurantGalleryTab photos={profile.galleryPhotos} />
      ) : active === 'settings' ? (
        <SettingsTab onProfileUpdate={onProfileUpdate} />
      ) : (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: 32 }}>{EMPTY_STATE[active].emoji}</div>
          <div>{EMPTY_STATE[active].text}</div>
        </div>
      )}
    </div>
  );
}
