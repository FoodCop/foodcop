'use client';

/**
 * ============================================================================
 * SCOUT VIEW — Full-Bleed Spatial Intelligence (Next.js Port)
 * ============================================================================
 *
 * Ported from legacy/fuzoapp/src/features/scout/components/ScoutView.tsx
 * Key changes:
 *   - Removed Vite imports (API_KEYS, supabase legacy client)
 *   - Uses process.env for API key
 *   - Uses createClient() from @/lib/supabase/client
 *   - Uses useAuth() from AuthProvider instead of prop-based authUser
 *   - SnapStudio integration stubbed (not yet ported)
 *   - Google Maps script loaded via <Script> tag in layout.tsx
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, RefreshCw, Navigation, Locate, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlacesService } from '@/lib/services/placesService';
import { PlateService } from '@/lib/services/plateService';
import { normalizeItemForPlateSave } from '@/lib/services/savedItems';
import { UserSettingsService } from '@/lib/services/userSettingsService';
import { useAuth } from '../auth/AuthProvider';
import ShareSheet, { type SharePayload } from '../share/ShareSheet';
import type { AppItem } from '@/types/appItem';
import type { ScoutPlace, ScoutFilter, MapLike } from '@/types/scout';
import { getGoogleMaps } from '@/types/scout';
import {
  toScoutPlace,
  toSavedScoutPlace,
  SCOUT_FALLBACK_PLACES,
  calculateNeuralMatch,
  sortPlaces,
  filterPlaces,
  chipSort,
  mergePlaceDetails,
  shouldApplyLatestRequest,
  getDistanceInMeters,
  extractSuggestionText
} from '@/lib/scout/scoutLogic';
import { ScoutDiscoveryPanel } from './ScoutDiscoveryPanel';
import { ScoutPlaceModal } from './ScoutPlaceModal';
import { ScoutDirectionsPanel } from './ScoutDirectionsPanel';
import { useScoutDirections, type DirRoute } from './useScoutDirections';
import { useScoutNavigation } from './useScoutNavigation';
import { ScoutNavigation } from './ScoutNavigation';
import { ScoutPickOverlay } from './ScoutPickOverlay';
import { googleDirectionsUrl } from '@/lib/maps/placeLinks';
import { ScoutAddPinModal } from './ScoutAddPinModal';
import { ActivityEventService } from '@/lib/services/activityEventService';
import { RestaurantService, type FuzoRestaurantLink } from '@/lib/services/restaurantService';
import { getOpenStatus, hasAnyHours } from '@/lib/restaurant/hours';
import { buildPinElement, createHtmlMarker, groupPlaces } from '@/lib/scout/mapPins';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default function ScoutView() {
  const { user } = useAuth();

  // --- State ---
  const [mainMapPlaces, setMainMapPlaces] = useState<ScoutPlace[]>([]);
  const [communitySnapPlaces, setCommunitySnapPlaces] = useState<ScoutPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<ScoutPlace | null>(null);
  const [modalTab, setModalTab] = useState('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  // Current zoom - pins regroup as it changes.
  const [mapZoom, setMapZoom] = useState(13);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  // The user's saved places, rebuilt from saved_items metadata (so "Saved"
  // shows all of them, even ones outside the current search area).
  const [savedPlaces, setSavedPlaces] = useState<ScoutPlace[]>([]);
  // Legend filter: which group the list + map show. Tapping the active one again = all.
  const [sourceView, setSourceView] = useState<'all' | 'google' | 'fuzo' | 'saved'>('all');
  // Bumped to open the mobile list sheet when a legend item is tapped.
  const [panelOpenSignal, setPanelOpenSignal] = useState(0);
  // Deep link from the dashboard: open this place once its area has loaded.
  const [pendingPlace, setPendingPlace] = useState<{ placeId?: string; restaurantId?: string; name: string; lat: number; lng: number } | null>(null);
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const [isAddPinModalOpen, setIsAddPinModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{ text: string; placeId: string }>>([]);
  const searchTimerRef = useRef<any>(null);

  const [filter, setFilter] = useState<ScoutFilter>({
    type: 'all',
    rating: 0,
    openNow: false,
    maxDistance: 5000,
    sortBy: 'match'
  });
  const [pinnedPlace, setPinnedPlace] = useState<ScoutPlace | null>(null);
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | undefined>();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // --- Refs ---
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLike | null>(null);
  // In-app directions (route from the user's location, like Google Maps).
  const directions = useScoutDirections(mapInstanceRef, isMapReady);
  const startDirectionsRef = useRef(directions.start);
  useEffect(() => {
    startDirectionsRef.current = directions.start;
  }, [directions.start]);
  // Restaurants along the route (a stable array from state - the status object is rebuilt every render).
  const alongPlaces = directions.alongStatus.status === 'ready' ? directions.alongStatus.places : null;
  const picking = !!directions.pick;

  // Phones: the panel folds to one line so the whole route shows.
  const [dirCollapsed, setDirCollapsed] = useState(false);
  const toggleDirCollapsed = () => {
    setDirCollapsed((c) => !c);
    // Re-fit once the sheet has its new height.
    requestAnimationFrame(() => requestAnimationFrame(directions.refit));
  };

  // In-app turn-by-turn (Directions' Start). Keeps the last ready route so the
  // banner doesn't blank while a reroute is being fetched.
  const readyRoute = directions.status.status === 'ready' ? directions.status.route : null;
  const [navRoute, setNavRoute] = useState<DirRoute | null>(null);
  if (readyRoute && readyRoute !== navRoute) setNavRoute(readyRoute);
  const nav = useScoutNavigation({
    route: navRoute,
    mapRef: mapInstanceRef,
    destName: directions.target?.name ?? 'your destination',
    onReroute: directions.rerouteFrom,
  });
  const startNav = () => {
    directions.setNavigating(true);
    nav.start();
  };
  // Start from a chosen place: navigation needs the user's own position, so
  // switch From to "Your location" and start once that route is ready.
  const pendingNav = useRef(false);
  const onStartDirections = () => {
    if (directions.from.kind !== 'gps') {
      pendingNav.current = true;
      directions.setFrom({ kind: 'gps' });
    } else startNav();
  };
  const routeReadyFromGps = directions.status.status === 'ready' && directions.from.kind === 'gps';
  const startDirectionsNav = useRef(startNav);
  useEffect(() => {
    startDirectionsNav.current = startNav;
  });
  useEffect(() => {
    if (pendingNav.current && routeReadyFromGps) {
      pendingNav.current = false;
      startDirectionsNav.current();
    }
  }, [routeReadyFromGps]);
  const exitNav = () => {
    nav.stop();
    directions.setNavigating(false);
    requestAnimationFrame(directions.refit);
  };

  const closeDirections = () => {
    if (nav.active) exitNav();
    setDirCollapsed(false);
    directions.close();
    // Drop dir=1 so a refresh doesn't reopen it.
    const url = new URL(window.location.href);
    if (url.searchParams.has('dir')) {
      url.searchParams.delete('dir');
      window.history.replaceState(window.history.state, '', url.toString());
    }
  };
  const activeMarkersRef = useRef<any[]>([]);
  const requestSeq = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // --- Autocomplete ---
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setPlaceSuggestions([]);
      return;
    }
    const google = getGoogleMaps();
    if (!google) return;
    try {
      if (typeof (google as any).importLibrary === 'function') {
        const placesLib = await (google as any).importLibrary('places') as any;
        if (placesLib?.AutocompleteSuggestion) {
          const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input });
          if (response?.suggestions) {
            const parsed = response.suggestions
              .map(extractSuggestionText)
              .filter((s: any): s is { text: string; placeId: string } => s !== null)
              .slice(0, 4);
            setPlaceSuggestions(parsed);
          } else {
            setPlaceSuggestions([]);
          }
        }
      }
    } catch (err) {
      console.error('ScoutView autocomplete error:', err);
    }
  }, []);

  const suggestions = useMemo(() => {
    return placeSuggestions.map(p => ({ text: p.text, placeId: p.placeId, type: 'place' as const }));
  }, [placeSuggestions]);

  // --- Data Fetching: Source A (Google Places) ---
  const fetchPlaces = useCallback(async (map: MapLike, query?: string) => {
    setIsLoading(true);
    const seq = ++requestSeq.current;

    try {
      const center = (map as any).getCenter();
      const lat = typeof center.lat === 'function' ? center.lat() : center.lat;
      const lng = typeof center.lng === 'function' ? center.lng() : center.lng;
      setMapCenter({ lat, lng });

      const result = query
        ? await PlacesService.searchByText(query, lat, lng, filter.maxDistance)
        : await PlacesService.searchNearby(lat, lng, filter.maxDistance);

      if (!shouldApplyLatestRequest(mounted, seq, requestSeq)) return;
      setIsLoading(false);

      if (result.success && result.data?.results && result.data.results.length > 0) {
        const transformed = result.data.results.map((r, i) => toScoutPlace(r, i, MAPS_API_KEY));
        setMainMapPlaces(transformed);

        // Google sends 20 per page: load pages 2-3 in the background (up to 60).
        // A token is only valid ~2s after it's issued, so wait and retry once.
        let token = result.data.next_page_token;
        const kind = query ? 'textsearch' : 'nearby';
        for (let page = 2; token && page <= 3; page++) {
          await new Promise((r) => setTimeout(r, 2000));
          if (!shouldApplyLatestRequest(mounted, seq, requestSeq)) return;
          let more = await PlacesService.nextPage(kind, token);
          if (more.success && more.data?.status === 'INVALID_REQUEST') {
            await new Promise((r) => setTimeout(r, 1500));
            more = await PlacesService.nextPage(kind, token);
          }
          if (!shouldApplyLatestRequest(mounted, seq, requestSeq)) return;
          if (!more.success || !more.data?.results?.length) break;
          const extra = more.data.results.map((r, i) => toScoutPlace(r, i + page * 20, MAPS_API_KEY));
          setMainMapPlaces((prev) => {
            const ids = new Set(prev.map((p) => p.placeId || p.id));
            return [...prev, ...extra.filter((p) => !ids.has(p.placeId || p.id))];
          });
          token = more.data.next_page_token;
        }
      } else {
        if (result.data?.status === 'ZERO_RESULTS') {
          setMainMapPlaces([]);
        } else {
          setMainMapPlaces(SCOUT_FALLBACK_PLACES);
        }
      }
    } catch (err) {
      console.error('Scout fetch error:', err);
      if (shouldApplyLatestRequest(mounted, seq, requestSeq)) {
        setIsLoading(false);
        setMainMapPlaces(SCOUT_FALLBACK_PLACES);
      }
    }
  }, [filter.maxDistance]);

  // --- Data Fetching: Source B (Community FUZO Pins) ---
  // Community pins (fuzo_locations) inside the current search area - not a
  // random global 50. No invented ratings: a pin only carries what its author saved.
  const loadFuzo = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !mapCenter) return;
    const radius = filter.maxDistance;
    const dLat = radius / 111320;
    const dLng = radius / (111320 * Math.max(0.01, Math.cos((mapCenter.lat * Math.PI) / 180)));
    const { data } = await supabase
      .from('fuzo_locations')
      .select('*')
      .gte('latitude', mapCenter.lat - dLat)
      .lte('latitude', mapCenter.lat + dLat)
      .gte('longitude', mapCenter.lng - dLng)
      .lte('longitude', mapCenter.lng + dLng)
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) {
      setCommunitySnapPlaces(data.map((row, i) => ({
        id: `fuzo-${row.id || i}`,
        placeId: row.place_id || undefined,
        markerSource: 'fuzo' as const,
        name: row.location_name || row.restaurant_name || 'FUZO Discovery',
        cat: row.cuisine || 'Community pin',
        rating: Number(row.rating) > 0 ? Number(row.rating) : 0,
        reviews: 0,
        address: row.address || '',
        phone: '',
        website: '',
        img: row.photos?.[0] || '',
        lat: Number(row.latitude),
        lng: Number(row.longitude),
        vibe: row.tags || [],
        timings: {},
        menu: [],
        userReviews: [],
        photos: row.photos || []
      })));
    }
  }, [mapCenter, filter.maxDistance]);

  // ── A: FUZO restaurants with their own map location in the search area ──
  // Shown even when Google doesn't return them (or they aren't on Google).
  const [areaRestaurants, setAreaRestaurants] = useState<FuzoRestaurantLink[]>([]);
  useEffect(() => {
    if (!mapCenter) return;
    let cancelled = false;
    RestaurantService.listInArea(mapCenter, filter.maxDistance).then((res) => {
      if (!cancelled) setAreaRestaurants(res.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [mapCenter, filter.maxDistance]);

  const restaurantPlaces = useMemo<ScoutPlace[]>(
    () =>
      areaRestaurants
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => ({
          id: `fuzo-rest-${r.restaurantId}`,
          placeId: r.placeId ?? undefined,
          markerSource: 'fuzo' as const,
          name: r.name,
          cat: r.cuisines.length ? r.cuisines.join(' · ') : 'Restaurant',
          rating: r.average,
          reviews: r.reviewCount,
          address: r.address || '',
          phone: '',
          website: '',
          img: r.bannerUrl || r.avatarUrl || '',
          lat: r.lat as number,
          lng: r.lng as number,
          ...(hasAnyHours(r.hours) ? { currentOpeningHours: { open_now: !!getOpenStatus(r.hours, r.timezone)?.isOpen } } : {}),
          vibe: [],
          timings: {},
          menu: [],
          userReviews: [],
          photos: [],
        })),
    [areaRestaurants],
  );

  useEffect(() => {
    loadFuzo();
  }, [loadFuzo]);

  // --- Merged Places ---
  const activePlaces = useMemo(() => {
    const seen = new Set<string>();
    const merged: ScoutPlace[] = [];

    const addUnique = (places: ScoutPlace[], checkDistance: boolean = false) => {
      for (const p of places) {
        let distStr = '';
        let distMeters: number | undefined;
        if (mapCenter) {
          const dist = getDistanceInMeters(mapCenter.lat, mapCenter.lng, p.lat, p.lng);
          if (checkDistance && dist > filter.maxDistance) continue;
          distStr = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
          distMeters = dist;
        }
        const key = p.placeId || p.id;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ ...p, matchPercentage: calculateNeuralMatch(p), distanceText: distStr, distanceMeters: distMeters });
        }
      }
    };

    addUnique(mainMapPlaces, true);
    addUnique(restaurantPlaces, true);
    addUnique(communitySnapPlaces, true);

    return sortPlaces(filterPlaces(merged, filter), chipSort(filter));
  }, [mainMapPlaces, restaurantPlaces, communitySnapPlaces, filter, mapCenter]);

  // --- FUZO restaurants on the map ---
  // Google places whose place_id is linked to a FUZO restaurant account (the
  // restaurant links it in its Dashboard) get a FUZO pin and a "View on FUZO"
  // button in the place popup. Looked up in batches, cached per place_id.
  const [fuzoByPlace, setFuzoByPlace] = useState<Map<string, FuzoRestaurantLink>>(() => new Map());
  const restaurantById = useMemo(() => new Map(areaRestaurants.map((r) => [`fuzo-rest-${r.restaurantId}`, r])), [areaRestaurants]);
  const fuzoLinkFor = useCallback(
    (place: ScoutPlace): FuzoRestaurantLink | undefined =>
      restaurantById.get(place.id) ?? (place.placeId ? fuzoByPlace.get(place.placeId) ?? areaRestaurants.find((r) => r.placeId === place.placeId) : undefined),
    [restaurantById, fuzoByPlace, areaRestaurants],
  );

  const sourceCounts = useMemo(() => {
    const counts = { google: 0, fuzo: 0, saved: savedPlaces.length };
    activePlaces.forEach(p => {
      const src = p.markerSource || 'google';
      if (src === 'google' || src === 'fuzo') counts[src]++;
    });
    return counts;
  }, [activePlaces, savedPlaces]);

  // What the list + map show for the selected legend group.
  const shownPlaces = useMemo(() => {
    if (sourceView === 'all') return activePlaces;
    if (sourceView === 'saved') {
      return savedPlaces.map((p) => {
        if (!mapCenter) return p;
        const dist = getDistanceInMeters(mapCenter.lat, mapCenter.lng, p.lat, p.lng);
        return { ...p, distanceMeters: dist, distanceText: dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km` };
      });
    }
    return activePlaces.filter((p) => (p.markerSource || 'google') === sourceView);
  }, [sourceView, activePlaces, savedPlaces, mapCenter]);

  const pickSource = (src: 'google' | 'fuzo' | 'saved') => {
    setSourceView((cur) => (cur === src ? 'all' : src));
    setPanelOpenSignal((n) => n + 1);
  };
  const checkedPlaceIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = activePlaces
      .map((p) => p.placeId)
      .filter((id): id is string => !!id && !checkedPlaceIdsRef.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => checkedPlaceIdsRef.current.add(id));
    let cancelled = false;
    RestaurantService.findByPlaceIds(fresh).then((res) => {
      if (cancelled || !res.data || res.data.size === 0) return;
      setFuzoByPlace((prev) => new Map([...prev, ...res.data!]));
    });
    return () => {
      cancelled = true;
    };
  }, [activePlaces]);

  // --- Spatial Callbacks ---
  const handleMapClick = useCallback((e: any) => {
    if (isPinningMode) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setAddPinCoords({ lat, lng });
      setIsAddPinModalOpen(true);
      setIsPinningMode(false);
    }
  }, [isPinningMode]);

  const handleRecenterMap = useCallback(() => {
    navigator.geolocation.getCurrentPosition((p) => {
      const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
      setUserLocation(pos);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(pos);
        (mapInstanceRef.current as any).setZoom(14);
        fetchPlaces(mapInstanceRef.current);
      }
    });
  }, [fetchPlaces]);

  const handleSearch = (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = explicitQuery || searchQuery;
    if (queryToUse.trim()) ActivityEventService.track({ type: 'search', metadata: { query: queryToUse.trim() } });
    if (mapInstanceRef.current) {
      fetchPlaces(mapInstanceRef.current, queryToUse);
    }
    setShowSuggestions(false);
  };

  const handlePlaceSelect = (place: ScoutPlace) => {
    setSelectedPlace(place);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: place.lat, lng: place.lng });
      (mapInstanceRef.current as any).setZoom(16);
      if (window.innerWidth >= 768) {
        (mapInstanceRef.current as any).panBy(-350, 0);
      }
    }
  };


  const showActionToast = (message: string) => {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 3000);
  };

  // Load which places the signed-in user has already saved, so the modal's
  // Save button can reflect real state (filled/labeled "Saved") instead of
  // always looking unsaved.
  const loadSaved = useCallback(async () => {
    const result = await PlateService.listSavedItems();
    if (!result.success || !result.data) return;
    const items = result.data.filter((i) => i.item_type === 'restaurant');
    setSavedPlaceIds(new Set(items.map((i) => i.item_id)));
    setSavedPlaces(
      items
        .map((i, idx) => {
          const m = i.metadata as Record<string, unknown>;
          const lat = Number(m.lat);
          const lng = Number(m.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return toSavedScoutPlace(
            {
              id: i.item_id,
              name: String(m.name || m.title || 'Saved place'),
              cat: typeof m.cat === 'string' ? m.cat : 'Restaurant',
              img: typeof m.image === 'string' ? m.image : '',
              lat,
              lng,
              placeId: typeof m.placeId === 'string' ? m.placeId : undefined,
              address: typeof m.address === 'string' ? m.address : '',
              rating: Number(m.rating) || 0,
              reviews: Number(m.reviews) || 0,
              phone: typeof m.phone === 'string' ? m.phone : '',
              website: typeof m.website === 'string' ? m.website : '',
              vibe: Array.isArray(m.vibe) ? (m.vibe as string[]) : [],
            } as AppItem,
            idx,
          );
        })
        .filter((p): p is ScoutPlace => p !== null),
    );
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after the request resolves
    loadSaved();
  }, [user?.id, loadSaved]);

  // Seed the distance filter's default from Settings' Discovery Radius
  // (previously always a hardcoded 5km) - only on initial load, so it
  // doesn't fight a distance the user has since changed via the filter UI.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const result = await UserSettingsService.get();
      if (result.success && result.data) {
        setFilter((prev) => ({ ...prev, maxDistance: result.data!.discoveryRadiusKm * 1000 }));
      }
    })();
  }, [user?.id]);

  const toAppItem = (place: ScoutPlace): AppItem => ({
    id: place.id,
    itemType: 'restaurant',
    name: place.name,
    cat: place.cat,
    img: place.img,
    lat: place.lat,
    lng: place.lng,
    placeId: place.placeId,
    address: place.address,
    rating: place.rating,
    reviews: place.reviews,
    phone: place.phone,
    website: place.website,
    vibe: place.vibe,
  });

  const handleAction = async (place: ScoutPlace, action: 'save' | 'share') => {
    if (action === 'share') {
      // Asks where: FUZO friends/groups or other apps. The link opens Scout on this place.
      const params = new URLSearchParams({ name: place.name, lat: String(place.lat), lng: String(place.lng) });
      if (place.placeId) params.set('place', place.placeId);
      setSharing({
        title: place.name,
        subtitle: place.address || place.cat,
        image: place.img || undefined,
        url: `/scout?${params.toString()}`,
        text: `Check out ${place.name} on FUZO`,
        item: toAppItem(place),
      });
      return;
    }

    // Save/unsave, via the same saved_items pipeline the Activity tab's
    // Places grid already reads from - real persistence, not a console.log.
    const isSaved = savedPlaceIds.has(place.id);
    if (isSaved) {
      const result = await PlateService.removeFromPlate({ itemId: place.id, itemType: 'restaurant' });
      if (result.success) {
        setSavedPlaceIds((prev) => {
          const next = new Set(prev);
          next.delete(place.id);
          return next;
        });
        showActionToast(`Removed ${place.name} from your saved places`);
        loadSaved();
      } else {
        showActionToast(result.error || 'Could not remove from saved places');
      }
      return;
    }

    const normalized = normalizeItemForPlateSave(toAppItem(place));
    const result = await PlateService.saveToPlate({
      itemId: normalized.itemId,
      itemType: normalized.itemType,
      metadata: normalized.metadata,
    });
    if (result.success) {
      setSavedPlaceIds((prev) => new Set(prev).add(place.id));
      showActionToast(`Saved ${place.name} to your places`);
      loadSaved();
    } else {
      showActionToast(result.error === 'User not authenticated' ? 'Sign in to save places' : (result.error || 'Could not save this place'));
    }
  };

  // --- Map Initialization ---
  useEffect(() => {
    if (!mapRef.current || !MAPS_API_KEY) return;

    let cancelled = false;
    let attempts = 0;
    // ~10s of retrying at 500ms apart before giving up for real.
    const MAX_ATTEMPTS = 20;

    const initMap = async () => {
      if (cancelled) return;
      const google = getGoogleMaps();
      if (!google) {
        // Retry if Maps script hasn't loaded yet
        setTimeout(initMap, 500);
        return;
      }

      let MapClass = google.Map;
      if (!MapClass && typeof google.importLibrary === 'function') {
        try {
          const mapsLib = await google.importLibrary("maps") as any;
          if (cancelled) return;
          MapClass = mapsLib.Map;
        } catch {
          // importLibrary can reject transiently while the rest of the
          // bootstrap script is still loading - fall through to the retry
          // below instead of treating one failed attempt as fatal.
        }
      }

      if (!MapClass) {
        // google.maps exists as an empty stub the instant the bootstrap
        // script's first line runs (`google.maps = google.maps || {}`),
        // well before the script that actually defines importLibrary/Map
        // has finished loading - so "google is truthy" doesn't mean "Map is
        // ready yet". Keep retrying (bounded) instead of giving up on what's
        // usually just a premature first check - this was a real race that
        // made the map fail to render on a coin-flip basis.
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          console.error("Failed to load Google Maps Map class after retrying.");
          return;
        }
        setTimeout(initMap, 500);
        return;
      }

      const map = new MapClass(mapRef.current!, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13,
        disableDefaultUI: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { featureType: 'road' as any, elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road' as any, elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
          { featureType: 'water' as any, elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
          { featureType: 'poi' as any, stylers: [{ visibility: 'off' }] },
          { featureType: 'transit' as any, stylers: [{ visibility: 'off' }] },
        ]
      });

      mapInstanceRef.current = map;
      setIsMapReady(true);

      // /scout?place=<google place_id>&lat=&lng=&name= (from the dashboard).
      const params = new URLSearchParams(window.location.search);
      const linkLat = Number(params.get('lat'));
      const linkLng = Number(params.get('lng'));
      const deepLink = params.has('lat') && Number.isFinite(linkLat) && Number.isFinite(linkLng)
        ? { placeId: params.get('place') || undefined, restaurantId: params.get('rid') || undefined, name: params.get('name') || 'Place', lat: linkLat, lng: linkLng }
        : null;
      // view=area (e.g. a city from the dashboard): just centre on it and show
      // its food spots - no single-place popup.
      const areaOnly = params.get('view') === 'area';
      // dir=1 (a Directions button): draw the route from the user's location instead of the popup.
      const wantsDirections = params.get('dir') === '1';
      if (deepLink) {
        map.setCenter({ lat: deepLink.lat, lng: deepLink.lng });
        map.setZoom(areaOnly ? 14 : 16);
        setMapZoom(areaOnly ? 14 : 16);
        if (wantsDirections && !areaOnly) startDirectionsRef.current(deepLink);
        else if (!areaOnly) setPendingPlace(deepLink);
      }

      fetchPlaces(map);
      map.addListener('click', handleMapClick);
      map.addListener('zoom_changed', () => {
        const z = map.getZoom();
        if (typeof z === 'number') setMapZoom(Math.round(z));
      });

      navigator.geolocation.getCurrentPosition((p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserLocation(pos);
        // Opened on a specific place? Show the blue dot, but stay on that place.
        if (deepLink) return;
        map.setCenter(pos);
        fetchPlaces(map);
      }, () => {});
    };

    initMap();

    // No cleanup previously existed here at all - navigating away (e.g. to
    // /discover) left the Maps instance's own listeners and every marker
    // still alive and still referencing this DOM node after React had
    // already unmounted it. A later window resize (e.g. toggling a
    // browser's device-emulation mode) can make the Maps SDK's own internal
    // resize-repaint logic try to touch that now-detached node, which
    // surfaces as a generic, hard-to-trace React "Failed to execute
    // 'removeChild'" error with no application code in the stack (the crash
    // is inside React-DOM's own reconciler, not this file).
    return () => {
      cancelled = true;
      const google = getGoogleMaps();
      activeMarkersRef.current.forEach((m) => m.setMap(null));
      activeMarkersRef.current = [];
      if (mapInstanceRef.current && google?.event) {
        google.event.clearInstanceListeners(mapInstanceRef.current);
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // Re-bind click handler when pinning mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.addListener('click', handleMapClick);
  }, [handleMapClick]);

  // --- Marker Rendering ---
  // Place pins are HTML pills (src/lib/scout/mapPins.ts); this teardrop icon
  // is only used for the user's own location marker.
  const getPinIcon = (google: any, color: string, isUser = false) => {
    const width = isUser ? 36 : 28;
    const height = isUser ? 48 : 38;
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="12" cy="12" r="${isUser ? 5 : 4}" fill="#ffffff" opacity="${isUser ? '1' : '0.9'}" />
    </svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.Size(width, height),
      anchor: new google.Point(width / 2, height)
    };
  };

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;
    const google = getGoogleMaps();
    if (!google) return;

    activeMarkersRef.current.forEach(m => m.setMap(null));
    activeMarkersRef.current = [];

    // Food-app style pins: nearby places merge into one pill with a count and
    // "Name +N more"; FUZO restaurants lead their group and show any real offer.
    const map = mapInstanceRef.current;
    // While directions are open only the route shows (like Google Maps) - plus
    // the restaurants along it when "Food along the way" is on.
    // (No pins at all while choosing a spot on the map - just the centre pin.)
    const pinPlaces = directions.open ? (picking ? [] : alongPlaces ?? []) : shownPlaces;
    const groups = groupPlaces(pinPlaces, mapZoom, (p) => !!fuzoLinkFor(p));
    const markers: { setMap: (m: unknown) => void }[] = groups.map((group) => {
      const leadFuzo = fuzoLinkFor(group.lead);
      const tag = group.places.map((p) => fuzoLinkFor(p)?.offerTitle).find(Boolean) ?? null;
      const el = buildPinElement(group, { isFuzo: !!leadFuzo, tag });
      return createHtmlMarker(
        google,
        map,
        { lat: group.lat, lng: group.lng },
        el,
        () => {
          if (group.places.length === 1) {
            setSelectedPlace(group.lead);
            return;
          }
          // Zoom into the group; if it's all one spot (or already zoomed in), open the lead.
          const lats = group.places.map((p) => p.lat);
          const lngs = group.places.map((p) => p.lng);
          const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
          if (spread < 0.0003 || mapZoom >= 18) {
            setSelectedPlace(group.lead);
            return;
          }
          const bounds = new google.LatLngBounds();
          group.places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
          map.fitBounds(bounds, 80);
        },
        leadFuzo ? 500 : tag ? 400 : 100 + group.places.length,
      );
    });

    // While directions are open the route draws its own blue "you are here" dot.
    if (userLocation && !directions.open) {
      const userMarker = new google.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        zIndex: 1000,
        icon: getPinIcon(google, '#d64545', true)
      });
      markers.push(userMarker);
    }

    activeMarkersRef.current = markers as typeof activeMarkersRef.current;

    if (pinnedPlace) {
      const pinnedMarker = new google.Marker({
        position: { lat: pinnedPlace.lat, lng: pinnedPlace.lng },
        animation: google.Animation.DROP,
        icon: {
          path: google.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 8,
          fillColor: '#f06292',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        map: mapInstanceRef.current,
        zIndex: 999
      });
      pinnedMarker.addListener('click', () => setSelectedPlace(pinnedPlace));
      // Track it alongside the other markers - previously untracked, so it
      // was never cleared on the next re-render (leaking one stray marker
      // per pinnedPlace change) or on unmount.
      activeMarkersRef.current.push(pinnedMarker);
    }
  }, [isMapReady, shownPlaces, pinnedPlace, userLocation, fuzoLinkFor, mapZoom, directions.open, alongPlaces, picking]);

  // --- Deep link: open the linked place once its area has loaded ---
  // (adjust-state-during-render, so it runs exactly once after the first fetch
  // around the linked spot finishes). If Google didn't return it in the nearby
  // results, open it from its place_id - the detail fetch below fills it in.
  if (
    pendingPlace &&
    isMapReady &&
    !isLoading &&
    mapCenter &&
    Math.abs(mapCenter.lat - pendingPlace.lat) < 0.0005 &&
    Math.abs(mapCenter.lng - pendingPlace.lng) < 0.0005
  ) {
    // A FUZO restaurant (rid) keeps its marker id, so its pop-up shows "View on FUZO".
    const fuzoId = pendingPlace.restaurantId ? `fuzo-rest-${pendingPlace.restaurantId}` : null;
    const found =
      (fuzoId ? activePlaces.find((p) => p.id === fuzoId) : undefined) ??
      (pendingPlace.placeId ? activePlaces.find((p) => p.placeId === pendingPlace.placeId) : undefined);
    setSelectedPlace(
      found ?? {
        id: fuzoId || pendingPlace.placeId || `link-${pendingPlace.lat},${pendingPlace.lng}`,
        placeId: pendingPlace.placeId,
        markerSource: fuzoId ? 'fuzo' : 'google',
        name: pendingPlace.name,
        cat: 'Restaurant',
        rating: 0,
        reviews: 0,
        address: '',
        phone: '',
        website: '',
        vibe: [],
        img: '',
        lat: pendingPlace.lat,
        lng: pendingPlace.lng,
        timings: {},
        menu: [],
        userReviews: [],
        photos: [],
      },
    );
    setPendingPlace(null);
  }

  // --- Detail Fetching ---
  useEffect(() => {
    if (!selectedPlace || selectedPlace.isNewFind) return;
    if (selectedPlace.phone || (selectedPlace.userReviews && selectedPlace.userReviews.length > 0)) return;

    if (selectedPlace.markerSource === 'google' && selectedPlace.placeId) {
      const fetchDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const result = await PlacesService.getPlaceDetails(selectedPlace.placeId as string);
          if (result.success && result.data?.result) {
            const detailedPlace = mergePlaceDetails(selectedPlace, result.data.result, MAPS_API_KEY);
            setSelectedPlace(detailedPlace);
            setMainMapPlaces(prev => prev.map(p => p.id === selectedPlace.id ? detailedPlace : p));
          }
        } catch (err) {
          console.error('Failed to fetch place details:', err);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [selectedPlace?.id]);

  // --- Legend Counts ---

  return (
    <div className={`scout-root${nav.active ? ' is-navigating' : ''}${directions.pick ? ' is-picking' : ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map canvas */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} id="scout-map" />

      {/* Search bar */}
      <div className="scout-search">
        <div style={{ position: 'relative' }}>
          <div className="scout-search__bar">
            <form onSubmit={handleSearch} className="scout-search__form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  setShowSuggestions(true);
                  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                  searchTimerRef.current = setTimeout(() => { fetchSuggestions(val); }, 300);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search food territory..."
                className="scout-search__input"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setShowSuggestions(false); if (mapInstanceRef.current) fetchPlaces(mapInstanceRef.current); }} className="scout-search__clear">
                  <X size={18} />
                </button>
              )}
              <button type="submit" className="scout-search__submit">
                <Search size={18} strokeWidth={2.5} />
              </button>
            </form>
            <div className="scout-search__divider" />
            <button type="button" onClick={directions.openPlanner} className="scout-search__route-btn" aria-label="Directions" title="Directions">
              <div className="scout-search__route-icon">
                <Navigation size={16} />
              </div>
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="scout-suggestions">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSearchQuery(sug.text); handleSearch(undefined, sug.text); }}
                  className="scout-suggestions__item"
                >
                  <MapPin size={14} style={{ color: '#a8a29e', flexShrink: 0 }} />
                  <span>{sug.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legend (hidden while directions are open - the panel takes that spot) */}
        {!directions.open && (
        <div className="scout-legend">
          {(
            [
              ['google', 'Nearby'],
              ['fuzo', 'FUZO'],
              ['saved', 'Saved'],
            ] as const
          ).map(([src, label]) => (
            <button
              key={src}
              type="button"
              className={`scout-legend__item${sourceView === src ? ' is-active' : ''}`}
              aria-pressed={sourceView === src}
              onClick={() => pickSource(src)}
              title={sourceView === src ? 'Show all places' : `Show only ${label}`}
            >
              <span className={`scout-legend__dot scout-legend__dot--${src}`} />
              <span>{label} ({sourceCounts[src]})</span>
            </button>
          ))}
        </div>
        )}
      </div>

      {/* FAB cluster */}
      <div className="scout-fabs">
        <button
          onClick={() => mapInstanceRef.current && fetchPlaces(mapInstanceRef.current)}
          className={`scout-fab${isLoading ? ' scout-fab--busy' : ''}`}
        >
          <RefreshCw size={18} className={isLoading ? 'scout-spin' : ''} />
        </button>
        <button
          onClick={handleRecenterMap}
          className="scout-fab"
        >
          <Locate size={18} />
        </button>
        <button
          onClick={() => setIsPinningMode(!isPinningMode)}
          className={`scout-fab scout-fab--pin${isPinningMode ? ' is-active' : ''}`}
          title="Drop a Pin"
        >
          <MapPin size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Overlay panels */}
      {nav.active && directions.target ? (
        <ScoutNavigation
          destName={directions.target.name}
          nextManeuver={nav.nextManeuver}
          nextText={nav.nextText}
          thenText={nav.thenText}
          toTurn={nav.toTurn}
          remainingM={nav.remainingM}
          remainingS={nav.remainingS}
          hasFix={!!nav.pos}
          gpsError={nav.gpsError}
          arrived={nav.arrived}
          muted={nav.muted}
          following={nav.following}
          googleHref={googleDirectionsUrl(directions.target, { mode: directions.mode, navigate: true })}
          onToggleMute={nav.toggleMute}
          onRecenter={nav.recenter}
          onExit={exitNav}
        />
      ) : directions.pick ? (
        <ScoutPickOverlay pick={directions.pick} onConfirm={directions.confirmPick} onCancel={directions.cancelPick} />
      ) : directions.open ? (
        <ScoutDirectionsPanel
          target={directions.target}
          from={directions.from}
          gps={directions.gps}
          mode={directions.mode}
          onModeChange={directions.setMode}
          onTargetChange={directions.setTarget}
          onFromChange={directions.setFrom}
          status={directions.status}
          alongWay={directions.alongWay}
          onAlongWayChange={directions.setAlongWay}
          alongStatus={directions.alongStatus}
          onSelectPlace={setSelectedPlace}
          onRetry={directions.retry}
          onClose={closeDirections}
          onStart={onStartDirections}
          collapsed={dirCollapsed}
          onToggleCollapsed={toggleDirCollapsed}
          onPickOnMap={directions.startPick}
        />
      ) : (
      <ScoutDiscoveryPanel
        places={shownPlaces}
        openSignal={panelOpenSignal}
        sourceLabel={sourceView === 'all' ? undefined : sourceView === 'google' ? 'Nearby' : sourceView === 'fuzo' ? 'FUZO' : 'Saved'}
        onClearSource={() => setSourceView('all')}
        onPlaceSelect={handlePlaceSelect}
        filter={filter}
        onFilterChange={setFilter}
        onDistanceChangeEnd={() => { if (mapInstanceRef.current) fetchPlaces(mapInstanceRef.current, searchQuery); }}
        onClose={() => { }}
      />
      )}

      {selectedPlace && (
        <ScoutPlaceModal
          place={selectedPlace}
          modalTab={modalTab}
          setModalTab={setModalTab}
          isLoadingDetails={isLoadingDetails}
          isSaved={savedPlaceIds.has(selectedPlace.id)}
          fuzoRestaurant={fuzoLinkFor(selectedPlace)}
          onClose={() => setSelectedPlace(null)}
          onAction={handleAction}
          onDirections={(p) => {
            setSelectedPlace(null);
            directions.start({ name: p.name, lat: p.lat, lng: p.lng, placeId: p.placeId });
          }}
        />
      )}

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      {actionToast && (
        <div className="toast show position-fixed start-50 translate-middle-x bg-dark text-white rounded-pill px-3 py-2 shadow" style={{ zIndex: 1050, bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
          {actionToast}
        </div>
      )}

      {isAddPinModalOpen && (
        <ScoutAddPinModal
          initialCoordinates={addPinCoords}
          onClose={() => { setIsAddPinModalOpen(false); setAddPinCoords(undefined); }}
          onSuccess={() => { if (mapInstanceRef.current) fetchPlaces(mapInstanceRef.current); loadFuzo(); }}
        />
      )}
    </div>
  );
}
