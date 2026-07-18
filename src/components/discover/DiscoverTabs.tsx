'use client';

import { useState } from 'react';
import { UtensilsCrossed, Flame, Film } from 'lucide-react';
import FoodCardFeed from './FoodCardFeed';
import TrimsReel from '../trims/TrimsReel';
import { BitesView } from '../bites/BitesView';

type DiscoverTab = 'bites' | 'feed' | 'trims';

const TAB_META: Record<DiscoverTab, { label: string; icon: typeof UtensilsCrossed }> = {
  bites: { label: 'Bites', icon: UtensilsCrossed },
  feed: { label: 'Feed', icon: Flame },
  trims: { label: 'Trims', icon: Film },
};

export default function DiscoverTabs() {
  const [active, setActive] = useState<DiscoverTab>('feed');
  const tabs: DiscoverTab[] = ['bites', 'feed', 'trims'];

  return (
    <div className="container-fluid p-0 d-flex flex-column" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Tabs Header - folder-tab shape, see _discover.scss */}
      <div className="discover-tabband">
        {tabs.map((tab) => {
          const { label, icon: Icon } = TAB_META[tab];
          return (
            <button
              key={tab}
              type="button"
              className={`discover-tab${active === tab ? ' is-active' : ''}`}
              onClick={() => setActive(tab)}
            >
              <Icon size={18} />
              <span className="discover-tab__label">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-grow-1 overflow-hidden position-relative pt-3">
        {active === 'bites' ? (
          <div className="h-100 position-relative overflow-auto">
            <BitesView />
          </div>
        ) : active === 'feed' ? (
          <div className="h-100 position-relative">
            <FoodCardFeed />
          </div>
        ) : active === 'trims' ? (
          <div className="h-100 bg-black">
            <TrimsReel />
          </div>
        ) : null}
      </div>
    </div>
  );
}
