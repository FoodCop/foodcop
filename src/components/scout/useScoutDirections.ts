'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { PlacesService, type TravelMode } from '@/lib/services/placesService';
import { isGooglePlaceId } from '@/lib/maps/placeLinks';
import { toScoutPlace } from '@/lib/scout/scoutLogic';
import type { ScoutPlace } from '@/types/scout';

// Directions on Scout, like Google Maps (this replaced the old Route Planner):
// From (your location by default, or any searched place) -> To (a place),
// Car / Bike / Walk, the route drawn on FUZO's map, trip summary + steps, and
// "Food along the way" - restaurants close to the route line.
// Opened by /scout?...&dir=1 (Directions buttons on Home, My Plate, place
// pages), the place popup's Directions, or the arrow button by Scout's search.

export type DirTarget = { name: string; lat?: number; lng?: number; placeId?: string };
export type DirFrom =
  | { kind: 'gps' }
  | { kind: 'place'; name: string; placeId: string }
  /** A spot pinned on the map. */
  | { kind: 'point'; name: string; lat: number; lng: number };

/** Choosing From / To by moving the map under a centre pin. */
export type PickState = { which: 'from' | 'to'; address: string | null; loading: boolean };
export type LatLng = { lat: number; lng: number };

export type DirStep = { text: string; maneuver: string; distance: string; meters: number; end?: LatLng };
export type DirRoute = { duration: string; distance: string; seconds: number; meters: number; steps: DirStep[]; path: LatLng[] };

export type DirStatus =
  | { status: 'idle' }
  | { status: 'pick' }
  | { status: 'locating' }
  | { status: 'no-location'; denied: boolean }
  | { status: 'routing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; route: DirRoute };

export type AlongStatus = { status: 'off' } | { status: 'loading' } | { status: 'error' } | { status: 'ready'; places: ScoutPlace[] };

// Just the bits of the Maps JS API used here.
type MapsOverlay = { setMap: (map: unknown) => void };
type MapsPoint = { lat: () => number; lng: () => number };
type MapsApi = {
  Polyline: new (opts: object) => MapsOverlay;
  Geocoder: new () => Geocoder;
  Marker: new (opts: object) => MapsOverlay;
  LatLngBounds: new () => { extend: (p: unknown) => void };
  SymbolPath: { CIRCLE: number };
  geometry: { encoding: { decodePath: (encoded: string) => MapsPoint[] } };
};
type MapLike = {
  fitBounds: (bounds: unknown, padding?: object) => void;
  getCenter: () => MapsPoint;
  panTo: (p: unknown) => void;
  addListener: (event: string, fn: (e: { latLng?: unknown }) => void) => { remove: () => void };
};
type Geocoder = { geocode: (req: { location: LatLng }) => Promise<{ results?: Array<{ formatted_address?: string }> }> };

/** Fit a route on the map, clear of the panel (its real height on phones) and the desktop card. */
function fitRoute(map: MapLike, g: MapsApi, path: unknown[]) {
  const bounds = new g.LatLngBounds();
  path.forEach((p) => bounds.extend(p));
  const phone = window.innerWidth < 768;
  const sheet = document.querySelector<HTMLElement>('.scout-dir')?.offsetHeight ?? 330;
  map.fitBounds(bounds, phone ? { top: 90, right: 40, bottom: sheet + 24, left: 40 } : { top: 90, right: 90, bottom: 60, left: 450 });
}

const mapsApi = () => (window as unknown as { google?: { maps?: MapsApi } }).google?.maps ?? null;
const PUBLIC_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

type RawRoute = {
  duration?: string;
  distanceMeters?: number;
  polyline?: { encodedPolyline?: string };
  localizedValues?: { duration?: { text?: string }; distance?: { text?: string } };
  legs?: Array<{
    steps?: Array<{
      navigationInstruction?: { instructions?: string; maneuver?: string };
      localizedValues?: { distance?: { text?: string } };
      distanceMeters?: number;
      endLocation?: { latLng?: { latitude: number; longitude: number } };
    }>;
  }>;
};

const MODE_LABEL: Record<TravelMode, string> = { DRIVE: 'car', TWO_WHEELER: 'bike', WALK: 'walking' };

type Result = { key: string; route?: DirRoute; polyline?: string; error?: string };
type Along = { key: string; places?: ScoutPlace[]; error?: boolean };

export function useScoutDirections(mapRef: RefObject<unknown>, isMapReady: boolean) {
  const [open, setOpen] = useState(false);
  const [target, setTargetState] = useState<DirTarget | null>(null);
  const [from, setFromState] = useState<DirFrom>({ kind: 'gps' });
  const [mode, setMode] = useState<TravelMode>('DRIVE');
  const [gps, setGps] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<'idle' | 'locating' | 'denied' | 'unavailable'>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [alongWay, setAlongWay] = useState(false);
  const [along, setAlong] = useState<Along | null>(null);
  const [pick, setPick] = useState<PickState | null>(null);
  const overlays = useRef<MapsOverlay[]>([]);
  const lastPath = useRef<MapsPoint[]>([]);
  // The route's start dot - hidden while navigating (the live "you" dot takes over).
  const startDot = useRef<MapsOverlay | null>(null);
  // While navigating the map follows the user, so a reroute mustn't zoom out to the whole trip.
  const navigating = useRef(false);

  const clearDrawing = useCallback(() => {
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocating('unavailable');
      return;
    }
    setLocating('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating('idle');
      },
      (err) => setLocating(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, []);

  /** Directions to a place, from your location (Directions buttons / place popup). */
  const start = useCallback(
    (t: DirTarget) => {
      setOpen(true);
      setTargetState(t);
      setFromState({ kind: 'gps' });
      if (!gps) locate();
    },
    [gps, locate],
  );

  /** The panel with no destination yet (the arrow button by Scout's search). */
  const openPlanner = useCallback(() => {
    clearDrawing();
    setOpen(true);
    setTargetState(null);
    setFromState({ kind: 'gps' });
    if (!gps) locate();
  }, [gps, locate, clearDrawing]);

  const setTarget = useCallback((t: DirTarget) => setTargetState(t), []);

  const setFrom = useCallback(
    (f: DirFrom) => {
      setFromState(f);
      if (f.kind === 'gps' && !gps) locate();
    },
    [gps, locate],
  );

  const close = useCallback(() => {
    clearDrawing();
    setOpen(false);
    setTargetState(null);
    setAlongWay(false);
  }, [clearDrawing]);

  /** Re-fit the route (after the panel folds or unfolds). */
  const refit = useCallback(() => {
    const g = mapsApi();
    const map = mapRef.current as MapLike | null;
    if (g && map && lastPath.current.length) fitRoute(map, g, lastPath.current);
  }, [mapRef]);

  /** Navigation went off route: plan again from where the user is now. */
  const rerouteFrom = useCallback((pos: LatLng) => {
    setFromState({ kind: 'gps' });
    setGps(pos);
  }, []);

  const setNavigating = useCallback(
    (on: boolean) => {
      navigating.current = on;
      startDot.current?.setMap(on ? null : (mapRef.current as unknown));
    },
    [mapRef],
  );

  // ---- Choose on map: the user moves the map under a fixed centre pin ----
  const geocodeSeq = useRef(0);
  const reverseGeocode = useCallback(async (p: LatLng): Promise<string | null> => {
    const g = mapsApi();
    if (!g?.Geocoder) return null;
    try {
      const res = await new g.Geocoder().geocode({ location: p });
      return res.results?.[0]?.formatted_address ?? null;
    } catch {
      return null;
    }
  }, []);
  const centre = useCallback((): LatLng | null => {
    const c = (mapRef.current as MapLike | null)?.getCenter();
    return c ? { lat: c.lat(), lng: c.lng() } : null;
  }, [mapRef]);

  const startPick = useCallback((which: 'from' | 'to') => setPick({ which, address: null, loading: true }), []);
  const cancelPick = useCallback(() => setPick(null), []);

  /** Use the spot under the pin as the start or the destination. */
  const confirmPick = useCallback(async () => {
    if (!pick) return;
    const p = centre();
    if (!p) return;
    const name = pick.address || (await reverseGeocode(p)) || `Pinned spot (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`;
    if (pick.which === 'from') setFromState({ kind: 'point', name, lat: p.lat, lng: p.lng });
    else setTargetState({ name, lat: p.lat, lng: p.lng });
    setPick(null);
  }, [pick, centre, reverseGeocode]);

  // While picking: show the address under the pin each time the map settles,
  // and a tap on the map moves the pin there.
  const picking = !!pick;
  useEffect(() => {
    const map = mapRef.current as MapLike | null;
    if (!picking || !map) return;
    const update = () => {
      const p = centre();
      if (!p) return;
      const id = ++geocodeSeq.current;
      setPick((cur) => (cur ? { ...cur, loading: true } : cur));
      reverseGeocode(p).then((address) => {
        if (id === geocodeSeq.current) setPick((cur) => (cur ? { ...cur, address, loading: false } : cur));
      });
    };
    const idle = map.addListener('idle', update);
    const click = map.addListener('click', (e) => e.latLng && map.panTo(e.latLng));
    const first = window.setTimeout(update, 0); // the address for where the map already is
    return () => {
      window.clearTimeout(first);
      idle.remove();
      click.remove();
    };
  }, [picking, mapRef, centre, reverseGeocode]);

  const retry = useCallback(() => {
    if (from.kind === 'gps' && !gps) locate();
    else setAttempt((a) => a + 1);
  }, [from.kind, gps, locate]);

  const originParam: LatLng | string | null =
    from.kind === 'gps' ? gps : from.kind === 'point' ? { lat: from.lat, lng: from.lng } : `place_id:${from.placeId}`;
  const destParam: LatLng | string | null = !target
    ? null
    : isGooglePlaceId(target.placeId)
      ? `place_id:${target.placeId}`
      : typeof target.lat === 'number' && typeof target.lng === 'number'
        ? { lat: target.lat, lng: target.lng }
        : null;
  const key =
    open && originParam && destParam ? `${mode}|${JSON.stringify(originParam)}|${JSON.stringify(destParam)}|${attempt}` : null;

  // Latest trip values for the fetch effect, which re-runs only when `key` changes.
  const trip = useRef({ originParam, destParam, target, from, mode });
  useEffect(() => {
    trip.current = { originParam, destParam, target, from, mode };
  });

  // Fetch + draw the route whenever the trip (mode, from, to) changes.
  useEffect(() => {
    if (!key || !isMapReady) return;
    const { originParam: o, destParam: d, target: t, from: f, mode: m } = trip.current;
    if (!o || !d || !t) return;
    let cancelled = false;

    PlacesService.getDirections(o, d, m).then((res) => {
      if (cancelled) return;
      const raw = (res.success ? res.data?.routes?.[0] : undefined) as RawRoute | undefined;
      const encoded = raw?.polyline?.encodedPolyline;
      if (!raw || !encoded) {
        clearDrawing();
        setResult({ key, error: `No ${MODE_LABEL[m]} route found to ${t.name}. Try another way to travel.` });
        return;
      }

      const g = mapsApi();
      const decoded = g ? g.geometry.encoding.decodePath(encoded) : [];
      const route: DirRoute = {
        duration: raw.localizedValues?.duration?.text || '',
        distance: raw.localizedValues?.distance?.text || '',
        seconds: parseInt(raw.duration || '0', 10) || 0,
        meters: raw.distanceMeters ?? 0,
        steps: (raw.legs?.[0]?.steps ?? [])
          .map((s) => {
            const e = s.endLocation?.latLng;
            return {
              text: s.navigationInstruction?.instructions || '',
              maneuver: s.navigationInstruction?.maneuver || '',
              distance: s.localizedValues?.distance?.text || '',
              meters: s.distanceMeters ?? 0,
              end: e ? { lat: e.latitude, lng: e.longitude } : undefined,
            };
          })
          .filter((s) => s.text),
        path: decoded.map((p) => ({ lat: p.lat(), lng: p.lng() })),
      };

      // Draw: a dark casing under a bright line, a white-ringed blue dot at the
      // start and a pin at the end (ends come from the route itself, so a
      // searched place with no coordinates still gets them).
      const map = mapRef.current as MapLike | null;
      clearDrawing();
      if (g && map) {
        const path = decoded;
        lastPath.current = path;
        const first = path[0];
        const last = path[path.length - 1] ?? first;
        startDot.current = new g.Marker({
          position: first,
          map: navigating.current ? null : map,
          zIndex: 1001,
          title: f.kind === 'gps' ? 'Your location' : f.name,
          icon: { path: g.SymbolPath.CIRCLE, scale: 8, fillColor: '#2f7de1', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 },
        });
        overlays.current = [
          new g.Polyline({ path, map, strokeColor: '#241f16', strokeOpacity: 0.35, strokeWeight: 10, zIndex: 1 }),
          new g.Polyline({ path, map, strokeColor: '#2f7de1', strokeOpacity: 1, strokeWeight: 6, zIndex: 2 }),
          startDot.current,
          new g.Marker({ position: last, map, zIndex: 1002, title: t.name }),
        ];
        if (!navigating.current) fitRoute(map, g, path);
      }
      setResult({ key, route, polyline: encoded });
    });

    return () => {
      cancelled = true;
    };
  }, [key, isMapReady, mapRef, clearDrawing]);

  // "Food along the way": restaurants close to the route line.
  const readyPolyline = result && result.key === key ? result.polyline : undefined;
  useEffect(() => {
    if (!alongWay || !readyPolyline || !key) return;
    let cancelled = false;
    PlacesService.searchAlongRoute(readyPolyline).then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setAlong({ key, error: true });
        return;
      }
      const places = (res.data?.results ?? []).map((r, i) => {
        const place = toScoutPlace(r, i);
        return r.photo_name && PUBLIC_MAPS_KEY
          ? { ...place, img: `https://places.googleapis.com/v1/${r.photo_name}/media?maxWidthPx=400&key=${PUBLIC_MAPS_KEY}` }
          : place;
      });
      setAlong({ key, places });
    });
    return () => {
      cancelled = true;
    };
  }, [alongWay, readyPolyline, key]);

  // Closing (or leaving a route) takes the drawing off the map.
  useEffect(() => {
    if (!open || !target) clearDrawing();
  }, [open, target, clearDrawing]);
  useEffect(() => clearDrawing, [clearDrawing]);

  let status: DirStatus;
  if (!open) status = { status: 'idle' };
  else if (!target) status = { status: 'pick' };
  else if (from.kind === 'gps' && !gps) {
    status = locating === 'denied' || locating === 'unavailable' ? { status: 'no-location', denied: locating === 'denied' } : { status: 'locating' };
  } else if (!result || result.key !== key) status = { status: 'routing' };
  else if (result.error || !result.route) status = { status: 'error', message: result.error || 'Could not find a route.' };
  else status = { status: 'ready', route: result.route };

  let alongStatus: AlongStatus = { status: 'off' };
  if (alongWay && status.status === 'ready') {
    if (!along || along.key !== key) alongStatus = { status: 'loading' };
    else if (along.error) alongStatus = { status: 'error' };
    else alongStatus = { status: 'ready', places: along.places ?? [] };
  }

  return {
    open,
    target,
    from,
    gps,
    mode,
    setMode,
    status,
    alongWay,
    setAlongWay,
    alongStatus,
    start,
    openPlanner,
    setTarget,
    setFrom,
    close,
    retry,
    refit,
    rerouteFrom,
    setNavigating,
    pick,
    startPick,
    cancelPick,
    confirmPick,
  };
}
