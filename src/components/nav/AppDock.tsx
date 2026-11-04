'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Plus, Salad, Trophy } from 'lucide-react';
import { CreateFlow } from '@/components/create/flow/CreateFlow';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';
import { TakoFace } from '@/components/tako/TakoFace';

// The bottom bar shared by Home, Tako, Explore (Scout), My Plate and
// Leaderboard & Rewards (client, 2026-10-06, Feoy reference): a white bar
// along the bottom with Explore · Create · (Tako, raised yellow centre) ·
// My Plate · Rankings. Tako replaced Home in the centre (client, 2026-11-04);
// Home is the navbar's house icon. The current page's item is highlighted.
export default function AppDock({
  compact: compactProp,
}: {
  /** Controlled compact state (Home also folds its tab bar); otherwise follows page scroll. */
  compact?: boolean;
}) {
  const pathname = usePathname();
  const scrollCompact = useScrollCompact();
  const compact = compactProp ?? scrollCompact;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined);

  return (
    <>
      <nav className={`fz-dash-dock${compact ? ' is-compact' : ''}`} aria-label="Main">
        <Link href="/scout" className="fz-dash-dock__item" aria-current={current('/scout')}>
          <Compass size={20} strokeWidth={2.1} />
          <span>Explore</span>
        </Link>
        <button type="button" className="fz-dash-dock__item" onClick={() => setIsCreateOpen(true)} aria-label="Create a post">
          <Plus size={20} strokeWidth={2.2} />
          <span>Create</span>
        </button>
        {/* Tako is the raised yellow button in the notch. */}
        <Link href="/tako" className="fz-dash-dock__fab fz-dash-dock__fab--tako" aria-label="Tako for you" aria-current={current('/tako')}>
          <TakoFace size={56} still />
        </Link>
        <Link href="/my-plate" className="fz-dash-dock__item" aria-current={current('/my-plate')}>
          <Salad size={20} strokeWidth={2.1} />
          <span>My Plate</span>
        </Link>
        <Link href="/leaderboard" className="fz-dash-dock__item" aria-current={current('/leaderboard')} aria-label="Leaderboard and rewards">
          <Trophy size={20} strokeWidth={2.1} />
          <span>Rankings</span>
        </Link>
      </nav>
      {isCreateOpen && <CreateFlow onClose={() => setIsCreateOpen(false)} />}
    </>
  );
}
