'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getNearbyRestaurants, type NearbyRestaurant } from '@/lib/services/recommendationService';
import { RestaurantService, type FuzoRestaurantLink } from '@/lib/services/restaurantService';
import { getOpenStatus, type OpenStatus } from '@/lib/restaurant/hours';

// Restaurants for the dashboard rows, from two real sources merged into one
// list: Google Places near the user, and FUZO restaurant accounts (their own
// map location, or a Google place they've linked). A FUZO restaurant opens its
// FUZO profile; a plain Google place opens on Scout, centred with its popup.
//
// Location: the browser's GPS if allowed, otherwise the user's saved home
// area (Settings > Profile), otherwise "unavailable" with a way to fix it.

export type DashPlace = {
  key: string;
  name: string;
  image?: string;
  rating: number | null;
  distanceMeters: number;
  vicinity: string;
  matchesTaste: boolean;
  href: string;
  external: boolean;
  fuzo?: { status: OpenStatus | null; offer: string | null; reviewCount: number };
};

export type LocationState =
  | { status: 'locating' }
  | { status: 'ready'; source: 'gps' | 'home'; lat: number; lng: number }
  | { status: 'unavailable' };

type Options = {
  enabled: boolean;
  topCuisine?: string;
  radiusKm: number;
  hiddenGems: boolean;
  luxury?: number;
};

/** Open the place on FUZO's own map (Scout), centred with its popup open. */
const scoutUrl = (p: NearbyRestaurant) => {
  const q = new URLSearchParams({ name: p.name });
  if (p.placeId) q.set('place', p.placeId);
  if (typeof p.lat === 'number' && typeof p.lng === 'number') {
    q.set('lat', String(p.lat));
    q.set('lng', String(p.lng));
  }
  return `/scout?${q.toString()}`;
};

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** The user's saved home coordinates (owner-only view), if any. */
async function homeCoords(): Promise<{ lat: number; lng: number } | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from('my_private_profile').select('lat, lng').maybeSingle();
  return typeof data?.lat === 'number' && typeof data?.lng === 'number' ? { lat: data.lat, lng: data.lng } : null;
}

export function useNearbyPlaces({ enabled, topCuisine, radiusKm, hiddenGems, luxury }: Options) {
  const [loc, setLoc] = useState<LocationState>({ status: 'locating' });
  const [places, setPlaces] = useState<DashPlace[] | null>(null);

  // GPS first; if refused/unavailable fall back to the saved home area.
  const locate = useCallback(() => {
    const fallback = () =>
      homeCoords().then((home) => setLoc(home ? { status: 'ready', source: 'home', ...home } : { status: 'unavailable' }));
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ status: 'ready', source: 'gps', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => fallback(),
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  /** "Use my location" / "Try again" - re-asks for GPS. */
  const retryGps = useCallback(() => {
    setLoc({ status: 'locating' });
    setPlaces(null);
    locate();
  }, [locate]);

  useEffect(() => {
    if (enabled) locate();
    // Locate once when ready - re-prompting on every render would be hostile.
  }, [enabled, locate]);

  // Fetch + merge whenever we have a location.
  useEffect(() => {
    if (loc.status !== 'ready') return;
    let cancelled = false;
    const here = { lat: loc.lat, lng: loc.lng };
    (async () => {
      const [google, fuzoArea] = await Promise.all([
        getNearbyRestaurants(here.lat, here.lng, topCuisine, { radiusKm, hiddenGems, luxury }),
        RestaurantService.listInArea(here, radiusKm * 1000),
      ]);
      const googleIds = google.map((g) => g.placeId).filter(Boolean);
      const linked = await RestaurantService.findByPlaceIds(googleIds);
      if (cancelled) return;

      // place_id -> FUZO restaurant (from either lookup)
      const byPlace = new Map<string, FuzoRestaurantLink>();
      (fuzoArea.data ?? []).forEach((r) => r.placeId && byPlace.set(r.placeId, r));
      (linked.data ?? new Map()).forEach((r, id) => byPlace.set(id, r));

      const cuisineMatch = (r: FuzoRestaurantLink) =>
        !!topCuisine && r.cuisines.some((c) => c.toLowerCase().includes(topCuisine.toLowerCase()));

      const fromFuzo = (r: FuzoRestaurantLink, g?: NearbyRestaurant): DashPlace => ({
        key: `fuzo-${r.restaurantId}`,
        name: r.name,
        image: r.bannerUrl || g?.image || r.avatarUrl || undefined,
        rating: r.reviewCount > 0 ? r.average : g?.rating ?? null,
        distanceMeters: g?.distanceMeters ?? (r.lat != null && r.lng != null ? haversine(here, { lat: r.lat, lng: r.lng }) : Infinity),
        vicinity: r.address || g?.vicinity || r.cuisines.join(' · '),
        matchesTaste: g?.matchesTaste ?? cuisineMatch(r),
        href: `/profile/${r.restaurantId}`,
        external: false,
        fuzo: { status: getOpenStatus(r.hours, r.timezone), offer: r.offerTitle, reviewCount: r.reviewCount },
      });

      const merged: DashPlace[] = google.map((g) => {
        const r = g.placeId ? byPlace.get(g.placeId) : undefined;
        return r
          ? fromFuzo(r, g)
          : {
              key: g.placeId || g.name,
              name: g.name,
              image: g.image,
              rating: g.rating ?? null,
              distanceMeters: g.distanceMeters,
              vicinity: g.vicinity,
              matchesTaste: g.matchesTaste,
              href: scoutUrl(g),
              external: false,
            };
      });
      // FUZO restaurants Google didn't return (or that aren't on Google at all).
      const seen = new Set(merged.map((p) => p.key));
      (fuzoArea.data ?? []).forEach((r) => {
        const p = fromFuzo(r);
        if (!seen.has(p.key) && Number.isFinite(p.distanceMeters)) merged.push(p);
      });

      setPlaces(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [loc, topCuisine, radiusKm, hiddenGems, luxury]);

  // Two lenses on the same places: on FUZO + taste match first, and closest first.
  const recommended = useMemo(
    () =>
      places
        ? [...places].sort(
            (a, b) =>
              Number(!!b.fuzo) - Number(!!a.fuzo) ||
              Number(b.matchesTaste) - Number(a.matchesTaste) ||
              (b.rating ?? 0) - (a.rating ?? 0),
          )
        : null,
    [places],
  );
  const nearest = useMemo(() => (places ? [...places].sort((a, b) => a.distanceMeters - b.distanceMeters) : null), [places]);

  return { loc, recommended, nearest, retryGps };
}
