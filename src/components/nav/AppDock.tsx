'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, House, Plus, Salad, Trophy } from 'lucide-react';
import { CreateCardModal } from '@/components/create/CreateCardModal';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';

// The floating glass dock shared by Home, Explore (Scout), My Plate and
// Leaderboard & Rewards: Explore · Create · Home (raised yellow centre) · My Plate · Leaderboard.
// The current page's item is highlighted. Scrolling down folds it to icons only.
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
      <nav className={`fz-dash-dock${compact ? ' is-compact' : ''}`} aria-label="Quick actions">
        <Link href="/scout" className="fz-dash-dock__item" aria-current={current('/scout')}>
          <Compass size={18} strokeWidth={2.1} />
          <span>Explore</span>
        </Link>
        <button type="button" className="fz-dash-dock__item" onClick={() => setIsCreateOpen(true)} aria-label="Create a food card">
          <Plus size={19} strokeWidth={2.3} />
          <span>Create</span>
        </button>
        {onHome ? (
          <button type="button" className="fz-dash-dock__home" onClick={onHome} aria-label="Home" aria-current={homeActive ? 'page' : undefined}>
            <House size={21} strokeWidth={2.3} />
          </button>
        ) : (
          <Link href="/dashboard" className="fz-dash-dock__home" aria-label="Home" aria-current={onDashboard ? 'page' : undefined}>
            <House size={21} strokeWidth={2.3} />
          </Link>
        )}
        <Link href="/my-plate" className="fz-dash-dock__item" aria-current={current('/my-plate')}>
          <Salad size={18} strokeWidth={2.1} />
          <span>My Plate</span>
        </Link>
        <Link href="/leaderboard" className="fz-dash-dock__item" aria-current={current('/leaderboard')} aria-label="Leaderboard and rewards">
          <Trophy size={18} strokeWidth={2.2} />
          <span>Rankings</span>
        </Link>
      </nav>
      {isCreateOpen && <CreateCardModal onClose={() => setIsCreateOpen(false)} />}
    </>
  );
}
