'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { getDistance } from '@/lib/scout/geometryUtils';
import type { DirRoute, LatLng } from './useScoutDirections';

// In-app turn-by-turn navigation on Scout (Directions' Start). Follows the
// user's live location, moves through the route's steps as each turn point is
// reached, speaks the next instruction (can be muted), re-plans when the user
// leaves the route, keeps the screen awake, and says when they've arrived.

const STEP_REACHED_M = 20; // this close (along the route) to a turn point = that turn is done
const ARRIVED_M = 30;
const OFF_ROUTE_M = 60; // further than this from the line...
const OFF_ROUTE_FIXES = 2; // ...for this many fixes in a row = reroute
const REROUTE_COOLDOWN_MS = 15000;

/**
 * Distances measured ALONG the route line (a straight line to the next turn
 * is wrong whenever the road curves): metres from the start to each path
 * point, and to each step's end.
 */
type RouteGeo = { cum: number[]; stepEndAt: number[]; total: number };

function buildGeo(r: DirRoute): RouteGeo {
  const cum = [0];
  for (let i = 1; i < r.path.length; i++) cum.push(cum[i - 1] + getDistance(r.path[i - 1], r.path[i]));
  // Each step ends at the path point nearest its end location (searching forward).
  let from = 0;
  const stepEndAt = r.steps.map((s) => {
    if (!s.end) return cum[cum.length - 1] ?? 0;
    let best = from;
    let bestD = Infinity;
    for (let i = from; i < r.path.length; i++) {
      const d = getDistance(r.path[i], s.end);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    from = best;
    return cum[best] ?? 0;
  });
  return { cum, stepEndAt, total: cum[cum.length - 1] ?? 0 };
}

/** Where the user is along the route (metres from its start) and how far off the line they are. */
function locateOnRoute(r: DirRoute, geo: RouteGeo, p: LatLng): { along: number; off: number } {
  let best = { along: 0, off: Infinity };
  const kx = 111320 * Math.cos((p.lat * Math.PI) / 180);
  const ky = 111320;
  for (let i = 1; i < r.path.length; i++) {
    const a = r.path[i - 1];
    const b = r.path[i];
    const ax = (a.lng - p.lng) * kx;
    const ay = (a.lat - p.lat) * ky;
    const bx = (b.lng - p.lng) * kx;
    const by = (b.lat - p.lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const off = Math.hypot(ax + t * dx, ay + t * dy);
    if (off < best.off) best = { along: geo.cum[i - 1] + t * (geo.cum[i] - geo.cum[i - 1]), off };
  }
  return best;
}

type MapsOverlay = { setMap: (map: unknown) => void; setPosition?: (p: LatLng) => void };
type MapsApi = { Marker: new (opts: object) => MapsOverlay; SymbolPath: { CIRCLE: number } };
type Listener = { remove: () => void };
type MapLike = {
  panTo: (p: LatLng) => void;
  setZoom: (z: number) => void;
  addListener: (event: string, fn: () => void) => Listener;
};
type WakeLock = { release: () => Promise<void> };

const mapsApi = () => (window as unknown as { google?: { maps?: MapsApi } }).google?.maps ?? null;
const firstLine = (text: string) => text.split('\n')[0];
/** What to do at the end of step i: the next step's instruction, or arrive. */
const nextAction = (r: DirRoute, i: number, destName: string) => (r.steps[i + 1] ? firstLine(r.steps[i + 1].text) : `Arrive at ${destName}`);

export function useScoutNavigation({
  route,
  mapRef,
  destName,
  onReroute,
}: {
  route: DirRoute | null;
  mapRef: RefObject<unknown>;
  destName: string;
  onReroute: (pos: LatLng) => void;
}) {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [muted, setMuted] = useState(false);
  const [following, setFollowing] = useState(true);
  const [gpsError, setGpsError] = useState(false);

  const watchId = useRef<number | null>(null);
  const marker = useRef<MapsOverlay | null>(null);
  const dragListener = useRef<Listener | null>(null);
  const wakeLock = useRef<WakeLock | null>(null);
  const offFixes = useRef(0);
  const lastReroute = useRef(0);
  // Live values for the position callback (it outlives renders).
  const geo = useMemo(() => (route && route.path.length > 1 ? buildGeo(route) : null), [route]);
  const live = useRef({ route, geo, stepIndex, arrived, muted, following, destName, onReroute });
  useEffect(() => {
    live.current = { route, geo, stepIndex, arrived, muted, following, destName, onReroute };
  });

  // A new route (a reroute) starts again from its first step.
  const [seenRoute, setSeenRoute] = useState(route);
  if (route !== seenRoute) {
    setSeenRoute(route);
    setStepIndex(0);
  }

  const speak = useCallback((text: string) => {
    if (live.current.muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = navigator.language || 'en';
    window.speechSynthesis.speak(u);
  }, []);


  const onPosition = useCallback(
    (p: GeolocationPosition) => {
      const here = { lat: p.coords.latitude, lng: p.coords.longitude };
      setPos(here);
      setGpsError(false);
      const { route: r, geo: rg, stepIndex: i, arrived: done, following: follow } = live.current;

      const map = mapRef.current as MapLike | null;
      const g = mapsApi();
      if (g && map) {
        if (!marker.current) {
          marker.current = new g.Marker({
            position: here,
            map,
            zIndex: 2000,
            title: 'You',
            icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: '#2f7de1', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 },
          });
        } else marker.current.setPosition?.(here);
        if (follow) map.panTo(here);
      }

      if (!r || !rg || done) return;
      const { along, off } = locateOnRoute(r, rg, here);

      // Arrived?
      const end = r.path[r.path.length - 1];
      if (rg.total - along < ARRIVED_M || (end && getDistance(here, end) < ARRIVED_M)) {
        setArrived(true);
        speak(`You have arrived at ${live.current.destName}`);
        return;
      }

      // Passed the current turn point? Move on (maybe several at once).
      let next = i;
      while (next < r.steps.length - 1 && along >= rg.stepEndAt[next] - STEP_REACHED_M) next += 1;
      if (next !== i) {
        setStepIndex(next);
        speak(nextAction(r, next, live.current.destName));
      }

      // Off the route for a couple of fixes in a row: plan again from here.
      if (off > OFF_ROUTE_M) {
        offFixes.current += 1;
        if (offFixes.current >= OFF_ROUTE_FIXES && Date.now() - lastReroute.current > REROUTE_COOLDOWN_MS) {
          offFixes.current = 0;
          lastReroute.current = Date.now();
          speak('Recalculating');
          live.current.onReroute(here);
        }
      } else offFixes.current = 0;
    },
    [mapRef, speak],
  );

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    marker.current?.setMap(null);
    marker.current = null;
    dragListener.current?.remove();
    dragListener.current = null;
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError(true);
      return;
    }
    setActive(true);
    setArrived(false);
    setStepIndex(0);
    setFollowing(true);
    offFixes.current = 0;

    const map = mapRef.current as MapLike | null;
    if (map) {
      map.setZoom(17);
      // Dragging the map stops following until "Re-centre".
      dragListener.current = map.addListener('dragstart', () => setFollowing(false));
    }
    watchId.current = navigator.geolocation.watchPosition(onPosition, () => setGpsError(true), {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 20000,
    });
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLock> } };
    nav.wakeLock?.request('screen').then((l) => (wakeLock.current = l)).catch(() => {});
    const r = live.current.route;
    if (r?.steps[0]) speak(firstLine(r.steps[0].text));
  }, [mapRef, onPosition, speak]);

  const stop = useCallback(() => {
    stopWatching();
    setActive(false);
  }, [stopWatching]);

  const recenter = useCallback(() => {
    setFollowing(true);
    const map = mapRef.current as MapLike | null;
    if (map && pos) {
      map.panTo(pos);
      map.setZoom(17);
    }
  }, [mapRef, pos]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return !m;
    });
  }, []);

  // Hide the app dock while navigating (full-screen map), and clean up on unmount.
  useEffect(() => {
    document.body.classList.toggle('fz-navigating', active);
    return () => document.body.classList.remove('fz-navigating');
  }, [active]);
  useEffect(() => stopWatching, [stopWatching]);

  // Progress numbers for the banner / bottom bar, measured along the route.
  const progress = useMemo(() => {
    if (!route || !geo) return { toTurn: null as number | null, remainingM: route?.meters ?? 0 };
    if (!pos) return { toTurn: null, remainingM: route.meters || geo.total };
    const { along } = locateOnRoute(route, geo, pos);
    const scale = route.meters && geo.total ? route.meters / geo.total : 1; // line length vs the API's road distance
    return {
      toTurn: Math.max(0, (geo.stepEndAt[stepIndex] ?? geo.total) - along) * scale,
      remainingM: Math.max(0, geo.total - along) * scale,
    };
  }, [route, geo, pos, stepIndex]);
  const { toTurn, remainingM } = progress;
  const remainingS = route && route.meters > 0 ? Math.round((route.seconds * remainingM) / route.meters) : route?.seconds ?? 0;

  return {
    active,
    start,
    stop,
    pos,
    stepIndex,
    nextManeuver: route?.steps[stepIndex + 1]?.maneuver ?? 'ARRIVE',
    nextText: route ? nextAction(route, stepIndex, destName) : '',
    thenText: route?.steps[stepIndex + 2] ? firstLine(route.steps[stepIndex + 2].text) : null,
    toTurn,
    remainingM,
    remainingS,
    arrived,
    muted,
    toggleMute,
    following,
    recenter,
    gpsError,
  };
}
