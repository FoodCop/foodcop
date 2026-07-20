'use client';

import { useState } from 'react';
import type { DemoProfile } from './demoProfile';
import FoodDnaSection, { type FoodDnaRealData } from './FoodDnaSection';
import ActivityTab from './ActivityTab';
import SettingsTab from './SettingsTab';

type PersonTab = 'settings' | 'activity' | 'dna';
type BusinessTab = 'settings' | 'menu' | 'info' | 'gallery';

const EMPTY_STATE: Record<string, { emoji: string; text: string }> = {
  settings: { emoji: '⚙️', text: 'Settings unavailable' },
  menu: { emoji: '📜', text: 'No menu available' },
  info: { emoji: 'ℹ️', text: 'No info available' },
  gallery: { emoji: '🖼️', text: 'No gallery available' },
  activity: { emoji: '💬', text: 'No recent activity to show.' },
};

const TAB_LABEL: Record<string, string> = { dna: 'Food DNA', settings: 'Settings' };

// Tab labels/copy ported verbatim from the old app's profile.html switchTab()
// empty states; switching driven by React state. "Food DNA" tab ports
// dna.html's charts. Re-skinned onto Bootstrap nav-tabs.
export default function ProfileTabs({
  profile,
  tasteProfile,
  userId,
  isCurrentUser = true,
  initialActivityCategory,
}: {
  profile: DemoProfile;
  tasteProfile?: FoodDnaRealData;
  userId?: string;
  isCurrentUser?: boolean;
  initialActivityCategory?: 'places' | 'recipes' | 'videos' | 'posts';
}) {
  const tabs: (PersonTab | BusinessTab)[] = profile.type === 'restaurant'
    ? ['activity', 'menu', 'info', 'gallery']
    : isCurrentUser ? ['activity', 'dna', 'settings'] : ['activity', 'dna'];
  const [active, setActive] = useState<string>('activity');

  return (
    <div className="container">
      <h6 className="mb-2">{profile.type === 'restaurant' ? 'Business' : isCurrentUser ? 'My Posts' : 'Posts'}</h6>

      <ul className="nav nav-tabs">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab}>
            <button type="button" className={`nav-link${active === tab ? ' active' : ''}`} onClick={() => setActive(tab)}>
              {TAB_LABEL[tab] ?? tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {active === 'dna' ? (
        <FoodDnaSection {...tasteProfile} />
      ) : active === 'activity' ? (
        <ActivityTab userId={userId} isCurrentUser={isCurrentUser} initialCategory={initialActivityCategory} />
      ) : active === 'settings' ? (
        <SettingsTab />
      ) : (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: 32 }}>{EMPTY_STATE[active].emoji}</div>
          <div>{EMPTY_STATE[active].text}</div>
        </div>
      )}
    </div>
  );
}
