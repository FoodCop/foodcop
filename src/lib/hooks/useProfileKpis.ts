'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import { computeKpis, type ProfileKpis } from '@/lib/profile/kpi/compute';
import { ProfileKpiService, type ProfileSignals } from '@/lib/services/profileKpiService';

// Fetches the non-card signals once per profile, then derives every KPI from
// them plus the live card list (so publishing/deleting a card updates the
// numbers without refetching saves/events).
export function useProfileKpis(params: {
  userId: string | undefined;
  isOwner: boolean;
  cards: FoodCardRecord[];
  /** taste_profiles values the page already fetched - used only when the owner-only fetch is unavailable. */
  fallbackDnaScores?: ProfileSignals['questionnaire']['dnaScores'];
  fallbackCuisines?: string[] | null;
}): { kpis: ProfileKpis; preferredCuisines: string[] | null; isLoading: boolean } {
  const { userId, isOwner, cards, fallbackDnaScores, fallbackCuisines } = params;
  // Keyed by the profile it was fetched for, so switching profiles reads as
  // "loading" (key mismatch) without a synchronous reset inside the effect.
  const requestKey = userId ? `${userId}:${isOwner}` : null;
  const [loaded, setLoaded] = useState<{ key: string; signals: ProfileSignals } | null>(null);

  useEffect(() => {
    if (!userId || !requestKey) return;
    let cancelled = false;
    ProfileKpiService.getSignals(userId, isOwner)
      .then((s) => { if (!cancelled) setLoaded({ key: requestKey, signals: s }); })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, signals: { saved: null, shares: null, events: [], crewCount: null, rsvpCount: null, questionnaire: { dnaScores: null, flavors: null, cuisines: null } } });
      });
    return () => { cancelled = true; };
  }, [userId, isOwner, requestKey]);

  const signals = loaded && loaded.key === requestKey ? loaded.signals : null;

  const kpis = useMemo(
    () =>
      computeKpis({
        now: new Date(),
        isOwner,
        cards,
        saved: signals?.saved ?? null,
        shares: signals?.shares ?? null,
        events: signals?.events ?? [],
        crewCount: signals?.crewCount ?? null,
        rsvpCount: signals?.rsvpCount ?? null,
        questionnaire: {
          dnaScores: signals?.questionnaire.dnaScores ?? fallbackDnaScores ?? null,
          flavors: signals?.questionnaire.flavors ?? null,
          cuisines: signals?.questionnaire.cuisines ?? fallbackCuisines ?? null,
        },
      }),
    [isOwner, cards, signals, fallbackDnaScores, fallbackCuisines],
  );

  const preferred = signals?.questionnaire.cuisines ?? fallbackCuisines ?? null;
  return { kpis, preferredCuisines: preferred && preferred.length > 0 ? preferred : null, isLoading: !!requestKey && signals === null };
}
