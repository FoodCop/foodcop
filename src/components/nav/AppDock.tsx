'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, House, Plus, Salad, Trophy } from 'lucide-react';
import { CreateCardModal } from '@/components/create/CreateCardModal';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';

// The bottom bar shared by Home, Explore (Scout), My Plate and Leaderboard &
// Rewards (client, 2026-10-06, Feoy reference): a white bar along the bottom
// with Explore · Create · (Home, raised yellow centre) · My Plate · Rankings.
// The current page's item is highlighted.
export default function AppDock({
  compact: compactProp,
  onHome,
  homeActive,
}: {
  /** Controlled compact state (Home also folds its tab bar); otherwise follows page scroll. */
  compact?: boolean;
  /** Home's own handler (back to "For you" + top); elsewhere Home links to /dashboard. */
  onHome?: () => void;
  homeActive?: boolean;
}) {
  const pathname = usePathname();
  const scrollCompact = useScrollCompact();
  const compact = compactProp ?? scrollCompact;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined);
  const onDashboard = pathname === '/dashboard';

  return (
    <>
      <nav className={`fz-dash-dock${compact ? ' is-compact' : ''}`} aria-label="Main">
        <Link href="/scout" className="fz-dash-dock__item" aria-current={current('/scout')}>
          <Compass size={20} strokeWidth={2.1} />
          <span>Explore</span>
        </Link>
        <button type="button" className="fz-dash-dock__item" onClick={() => setIsCreateOpen(true)} aria-label="Create a food card">
          <Plus size={20} strokeWidth={2.2} />
          <span>Create</span>
        </button>
        {/* Home is the raised yellow button in the notch (client, 2026-10-07). */}
        {onHome ? (
          <button type="button" className="fz-dash-dock__fab" onClick={onHome} aria-label="Home" aria-current={homeActive ? 'page' : undefined}>
            <House size={24} strokeWidth={2.3} />
          </button>
        ) : (
          <Link href="/dashboard" className="fz-dash-dock__fab" aria-label="Home" aria-current={onDashboard ? 'page' : undefined}>
            <House size={24} strokeWidth={2.3} />
          </Link>
        )}
        <Link href="/my-plate" className="fz-dash-dock__item" aria-current={current('/my-plate')}>
          <Salad size={20} strokeWidth={2.1} />
          <span>My Plate</span>
        </Link>
        <Link href="/leaderboard" className="fz-dash-dock__item" aria-current={current('/leaderboard')} aria-label="Leaderboard and rewards">
          <Trophy size={20} strokeWidth={2.1} />
          <span>Rankings</span>
        </Link>
      </nav>
      {isCreateOpen && <CreateCardModal onClose={() => setIsCreateOpen(false)} />}
    </>
  );
}
