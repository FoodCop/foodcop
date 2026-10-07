'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getOpenStatus, type OpenStatus } from '../restaurant/hours';
import {
  EMPTY_SUMMARY,
  RestaurantService,
  type MenuItem,
  type RatingSummary,
  type RestaurantProfile,
} from '../services/restaurantService';

// Shared, per-restaurant store so the profile header (rating + open status)
// and the tabs (menu, info, dashboard) read the same data, and a change in one
// place (new review, edited hours, new menu item) shows up everywhere at once.

type RestaurantState = {
  loaded: boolean;
  profile: RestaurantProfile | null;
  menu: MenuItem[];
  summary: RatingSummary;
  /** Set when the restaurant tables don't exist yet (migration not applied). */
  error: string | null;
};

const EMPTY: RestaurantState = { loaded: false, profile: null, menu: [], summary: EMPTY_SUMMARY, error: null };

const states = new Map<string, RestaurantState>();
const listeners = new Map<string, Set<() => void>>();
const inflight = new Map<string, Promise<void>>();

function emit(id: string) {
  listeners.get(id)?.forEach((fn) => fn());
}

function setState(id: string, patch: Partial<RestaurantState>) {
  states.set(id, { ...(states.get(id) ?? EMPTY), ...patch });
  emit(id);
}

async function load(id: string) {
  const existing = inflight.get(id);
  if (existing) return existing;
  const p = (async () => {
    const [profile, menu, summary] = await Promise.all([
      RestaurantService.getProfile(id),
      RestaurantService.listMenu(id),
      RestaurantService.getRatingSummary(id),
    ]);
    setState(id, {
      loaded: true,
      profile: profile.data ?? null,
      menu: menu.data ?? [],
      summary: summary.data ?? EMPTY_SUMMARY,
      error: profile.error || menu.error || summary.error || null,
    });
  })().finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

/** Reload one slice (or everything) for a restaurant after a change. */
export async function refreshRestaurant(id: string, part: 'profile' | 'menu' | 'summary' | 'all' = 'all') {
  if (part === 'all') return load(id);
  if (part === 'profile') {
    const r = await RestaurantService.getProfile(id);
    setState(id, { profile: r.data ?? null });
  } else if (part === 'menu') {
    const r = await RestaurantService.listMenu(id);
    setState(id, { menu: r.data ?? [] });
  } else {
    const r = await RestaurantService.getRatingSummary(id);
    setState(id, { summary: r.data ?? EMPTY_SUMMARY });
  }
}

/** Optimistic local update (e.g. availability toggle) before the server round-trip. */
export function patchRestaurant(id: string, patch: Partial<RestaurantState>) {
  setState(id, patch);
}

export function useRestaurant(restaurantId: string | undefined, enabled = true) {
  const id = enabled ? restaurantId : undefined;

  const subscribe = useCallback(
    (fn: () => void) => {
      if (!id) return () => {};
      if (!listeners.has(id)) listeners.set(id, new Set());
      listeners.get(id)!.add(fn);
      return () => listeners.get(id)?.delete(fn);
    },
    [id],
  );
  const state = useSyncExternalStore(
    subscribe,
    () => (id ? states.get(id) ?? EMPTY : EMPTY),
    () => EMPTY,
  );

  useEffect(() => {
    if (id && !states.get(id)?.loaded) load(id);
  }, [id]);

  return state;
}

/** Live open/closed status; re-evaluated every minute so it ticks over on its own. */
export function useOpenStatus(profile: RestaurantProfile | null): OpenStatus | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (!profile) return null;
  return getOpenStatus(profile.hours, profile.timezone, new Date(now));
}
