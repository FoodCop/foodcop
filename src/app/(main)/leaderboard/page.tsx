import { Suspense } from 'react';
import LeaderboardRewardsView from '@/components/leaderboard/LeaderboardRewardsView';
import AppDock from '@/components/nav/AppDock';

// Leaderboard & Rewards - one page with two tabs (?tab=rewards).
export default function LeaderboardPage() {
  return (
    <>
      <Suspense>
        <LeaderboardRewardsView />
      </Suspense>
      <AppDock />
    </>
  );
}
