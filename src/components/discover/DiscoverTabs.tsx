'use client';

import { useState } from 'react';
import SwipeFeed from './SwipeFeed';
import TrimsReel from '../trims/TrimsReel';
import { BitesView } from '../bites/BitesView';

type DiscoverTab = 'bites' | 'feed' | 'trims';

const TAB_LABEL: Record<DiscoverTab, string> = {
  bites: 'Bites',
  feed: 'Feed',
  trims: 'Trims',
};

export default function DiscoverTabs() {
  const [active, setActive] = useState<DiscoverTab>('feed');
  const tabs: DiscoverTab[] = ['bites', 'feed', 'trims'];

  return (
    <div className="container-fluid p-0 d-flex flex-column" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Tabs Header */}
      <div className="container pt-3">
        <ul className="nav nav-tabs">
          {tabs.map((tab) => (
            <li className="nav-item" key={tab}>
              <button
                type="button"
                className={`nav-link${active === tab ? ' active' : ''}`}
                onClick={() => setActive(tab)}
              >
                {TAB_LABEL[tab]}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className="flex-grow-1 overflow-hidden position-relative pt-3">
        {active === 'bites' ? (
          <div className="h-100 position-relative overflow-auto">
            <BitesView />
          </div>
        ) : active === 'feed' ? (
          <div className="h-100 position-relative">
            <SwipeFeed />
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
