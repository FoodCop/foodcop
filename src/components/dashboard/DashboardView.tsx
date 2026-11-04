'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, Flame, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import AppDock from '@/components/nav/AppDock';
import GuidedTour from './GuidedTour';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';
import HomeTabs, { type HomeTab } from './HomeTabs';

// Dashboard = the post-login home (same structure on phone and desktop):
//   top bar     the app-wide SiteHeader: profile photo | FUZO logo (Tako) | home + bell
//   tabs        Bites · Feed · Trims - switch in place (no navigation), URL ?tab= kept in sync.
//               Feed opens by default (client, 2026-11-04). The old "For you"
//               sections live on the Tako page (/tako, the dock's centre button).
//   bottom dock Explore · Create · Tako (raised centre) · My Plate · Rankings
// Styles: _dashboard.scss (top bar: _header.scss).

type TabKey = 'bites' | 'feed' | 'trims';
const TABS: HomeTab<TabKey>[] = [
  { key: 'bites', label: 'Bites', icon: UtensilsCrossed },
  { key: 'feed', label: 'Feed', icon: Flame },
  { key: 'trims', label: 'Trims', icon: Film },
];
const DEFAULT_TAB: TabKey = 'feed';
const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.key === v);

// Each section's code only loads the first time its tab is opened.
function PanelLoading({ label }: { label: string }) {
  return (
    <div className="fz-dash-panel__loading" role="status">
      <span className="spinner-border spinner-border-sm text-warning" aria-hidden="true" /> Loading {label}…
    </div>
  );
}
const BitesView = dynamic(() => import('@/components/bites/BitesView').then((m) => m.BitesView), { loading: () => <PanelLoading label="Bites" /> });
const FoodCardFeed = dynamic(() => import('@/components/discover/FoodCardFeed'), { loading: () => <PanelLoading label="Feed" /> });
const TrimsReel = dynamic(() => import('@/components/trims/TrimsReel'), { ssr: false, loading: () => <PanelLoading label="Trims" /> });

export default function DashboardView() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const active: TabKey = isTab(tabParam) ? tabParam : DEFAULT_TAB;
  const tabsAnchorRef = useRef<HTMLDivElement>(null);

  // Old links to "For you" (shares, bookmarks) now belong to the Tako page.
  useEffect(() => {
    if (tabParam === 'foryou') router.replace('/tako');
  }, [tabParam, router]);

  // Keep Bites/Feed mounted once opened, so switching back is instant and keeps
  // their scroll/filter state. (Trims unmounts when you leave so videos stop.)
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set([active]));
  if (!visited.has(active)) setVisited(new Set(visited).add(active));

  const selectTab = (key: TabKey) => {
    if (key === active) return;
    window.history.pushState(null, '', key === DEFAULT_TAB ? window.location.pathname : `?tab=${key}`);
    // If the tab bar has scrolled under the top bar, bring the new section into view from its start.
    const anchor = tabsAnchorRef.current;
    if (anchor && anchor.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: window.scrollY + anchor.getBoundingClientRect().top - 60, behavior: 'smooth' });
    }
  };

  // Scrolling down shrinks the tab bar to icons only; scrolling up (or
  // reaching the top) brings the labels back.
  const compact = useScrollCompact();

  if (!user) {
    return (
      <div className="fz-dash">
        <div className="fz-dash__signin">Sign in to see your recommendations.</div>
      </div>
    );
  }

  return (
    <div className="fz-dash">
      {/* The top bar is the app-wide SiteHeader (same on every page). */}
      <main className="fz-dash__body">
        {/* ── Bites · Feed · Trims (switch in place) ─────────── */}
        <div ref={tabsAnchorRef} className="fz-dash-tabs-wrap">
          <HomeTabs tabs={TABS} active={active} onChange={selectTab} compact={compact} />
        </div>

        {/* Bites / Feed stay mounted once opened; Trims only while active. */}
        {visited.has('bites') && (
          <div role="tabpanel" id="home-panel-bites" aria-labelledby="home-tab-bites" hidden={active !== 'bites'} className="fz-dash-panel fz-dash-panel--bites">
            <BitesView />
          </div>
        )}
        {visited.has('feed') && (
          <div role="tabpanel" id="home-panel-feed" aria-labelledby="home-tab-feed" hidden={active !== 'feed'} className="fz-dash-panel fz-dash-panel--feed">
            <FoodCardFeed />
          </div>
        )}
        {active === 'trims' && (
          <div role="tabpanel" id="home-panel-trims" aria-labelledby="home-tab-trims" className="fz-dash-panel fz-dash-panel--trims">
            <div className="fz-dash-reel">
              <TrimsReel />
            </div>
          </div>
        )}
      </main>

      <AppDock compact={compact} />
      <GuidedTour />
    </div>
  );
}
