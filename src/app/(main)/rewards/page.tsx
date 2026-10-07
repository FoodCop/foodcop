import { redirect } from 'next/navigation';

// Rewards now lives on the Leaderboard & Rewards page.
export default function RewardsPage() {
  redirect('/leaderboard?tab=rewards');
}
