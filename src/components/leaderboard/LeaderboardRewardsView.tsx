'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Award, Trophy } from 'lucide-react';
import LeaderboardView from './LeaderboardView';
import RewardsView from '@/components/rewards/RewardsView';

type Tab = 'leaderboard' | 'rewards';

const TABS: { key: Tab; label: string; icon: typeof Trophy }[] = [
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'rewards', label: 'Rewards', icon: Award },
];

// "Leaderboard & Rewards" (client, 2026-10-06): one page instead of two.
// A shared dark header (title + Leaderboard | Rewards tabs); the Leaderboard
// tab continues the dark band with its filters + podium, Rewards shows your
// level and badge tracks. The tab lives in the URL (?tab=rewards) so links
// and the back button land on the right one; /rewards redirects here.
export default function LeaderboardRewardsView() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'rewards' ? 'rewards' : 'leaderboard');

  const pick = (next: Tab) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'rewards') url.searchParams.set('tab', 'rewards');
    else url.searchParams.delete('tab');
    window.history.replaceState(window.history.state, '', url.toString());
  };

  return (
    <div className="fz-lbr">
      <header className="fz-lbr-head">
        <div className="fz-lb__inner">
          <div className="fz-lb-head">
            <div className="fz-lb-head__icon" aria-hidden>
              <Trophy size={26} />
            </div>
            <div>
              <div className="fz-lb-eyebrow">Community</div>
              <h1 className="fz-lb-title">Leaderboard &amp; Rewards</h1>
            </div>
          </div>
          <p className="fz-lb-sub">Climb the ranks and unlock badges for every card you cook, explore and share.</p>

          <div className="fz-lbr-tabs" role="tablist" aria-label="Leaderboard and rewards">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`lbr-tab-${key}`}
                aria-selected={tab === key}
                aria-controls={`lbr-panel-${key}`}
                className={`fz-lbr-tabs__btn${tab === key ? ' is-active' : ''}`}
                onClick={() => pick(key)}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div role="tabpanel" id={`lbr-panel-${tab}`} aria-labelledby={`lbr-tab-${tab}`}>
        {tab === 'leaderboard' ? (
          <LeaderboardView embedded onShowRewards={() => pick('rewards')} />
        ) : (
          <div className="fz-lb__inner">
            <RewardsView embedded />
          </div>
        )}
      </div>
    </div>
  );
}
