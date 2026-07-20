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
import { ChatService } from '@/lib/services/chatService';
import { PointsService } from '@/lib/services/pointsService';
import { normalizeItemForPlateSave } from '@/lib/services/savedItems';
import { UserSettingsService } from '@/lib/services/userSettingsService';
import { useAuth } from '../auth/AuthProvider';
import FriendPickerModal, { type ShareTarget } from '../chat/FriendPickerModal';
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
  mergePlaceDetails,
  shouldApplyLatestRequest,
  getDistanceInMeters,
  extractSuggestionText
} from '@/lib/scout/scoutLogic';
import { getDistanceToPolyline } from '@/lib/scout/geometryUtils';
import { ScoutDiscoveryPanel } from './ScoutDiscoveryPanel';
import { ScoutPlaceModal } from './ScoutPlaceModal';
import { ScoutRoutePlanner } from './ScoutRoutePlanner';
import { ScoutAddPinModal } from './ScoutAddPinModal';

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
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [shareTargetPlace, setShareTargetPlace] = useState<ScoutPlace | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState(false);
  const [isAddPinModalOpen, setIsAddPinModalOpen] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any | null>(null);
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
  const routePolylineRef = useRef<any>(null);
  const routeMarkersRef = useRef<any[]>([]);
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
  const loadFuzo = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from('fuzo_locations').select('*').limit(50);
    if (data) {
      setCommunitySnapPlaces(data.map((row, i) => ({
        id: `fuzo-${row.id || i}`,
        markerSource: 'fuzo' as const,
        name: row.location_name || row.restaurant_name || 'FUZO Discovery',
        cat: row.cuisine || 'Spot',
        rating: 4.5,
        reviews: 12,
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
  }, []);

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
        if (mapCenter) {
          const dist = getDistanceInMeters(mapCenter.lat, mapCenter.lng, p.lat, p.lng);
          if (checkDistance && dist > filter.maxDistance) continue;
          distStr = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
        }
        const key = p.placeId || p.id;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ ...p, matchPercentage: calculateNeuralMatch(p), distanceText: distStr });
        }
      }
    };

    addUnique(mainMapPlaces, true);
    addUnique(communitySnapPlaces, true);

    return sortPlaces(filterPlaces(merged, filter), filter.sortBy);
  }, [mainMapPlaces, communitySnapPlaces, filter, mapCenter]);

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

  const handleCalculateRoute = async (origin: string, destination: string) => {
    setIsCalculatingRoute(true);
    try {
      const result = await PlacesService.getDirections(origin, destination);
      if (result.success && result.data?.routes?.[0]) {
        const route = result.data.routes[0];
        setCurrentRoute(route);

        const google = getGoogleMaps();
        if (google && mapInstanceRef.current) {
          if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
            routePolylineRef.current = null;
          }
          routeMarkersRef.current.forEach(m => m.setMap(null));
          routeMarkersRef.current = [];

          const polylinePath = (google as any).geometry.encoding.decodePath(route.polyline.encodedPolyline);
          const pathPoints = polylinePath.map((p: any) => ({
            lat: typeof p.lat === 'function' ? p.lat() : p.lat,
            lng: typeof p.lng === 'function' ? p.lng() : p.lng
          }));

          routePolylineRef.current = new google.Polyline({
            path: polylinePath,
            geodesic: true,
            strokeColor: '#e8472b',
            strokeOpacity: 0.9,
            strokeWeight: 6,
            map: mapInstanceRef.current
          });

          const bounds = new google.LatLngBounds();
          pathPoints.forEach((pt: any) => bounds.extend(pt));
          mapInstanceRef.current.fitBounds(bounds);

          const searchResult = await PlacesService.searchAlongRoute(route.polyline.encodedPolyline, 'restaurants');
          let combinedResults: ScoutPlace[] = [];

          if (searchResult.success && searchResult.data?.results) {
            combinedResults = searchResult.data.results.map((r, i) => toScoutPlace(r, i, MAPS_API_KEY));
          }

          const MAX_DETOUR_METERS = 500;
          const localAlongRoute = mainMapPlaces.filter(p => {
            if (!p.lat || !p.lng) return false;
            return getDistanceToPolyline({ lat: p.lat, lng: p.lng }, pathPoints) <= MAX_DETOUR_METERS;
          });

          const seen = new Set();
          const finalPlaces = [...combinedResults, ...localAlongRoute].filter(p => {
            const id = p.placeId || p.id || p.name;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          setMainMapPlaces(finalPlaces);
          setIsRoutePlannerOpen(false);
        }
      } else {
        const errorMsg = result.error || 'No route found between these points.';
        alert(`Route Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleClearRoute = () => {
    setCurrentRoute(null);
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    routeMarkersRef.current.forEach(m => m.setMap(null));
    routeMarkersRef.current = [];
    if (mapInstanceRef.current) fetchPlaces(mapInstanceRef.current);
  };

  const showActionToast = (message: string) => {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 3000);
  };

  // Load which places the signed-in user has already saved, so the modal's
  // Save button can reflect real state (filled/labeled "Saved") instead of
  // always looking unsaved.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const result = await PlateService.listSavedItems();
      if (result.success && result.data) {
        const ids = new Set(result.data.filter((i) => i.item_type === 'restaurant').map((i) => i.item_id));
        setSavedPlaceIds(ids);
      }
    })();
  }, [user?.id]);

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
      setShareTargetPlace(place);
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
    } else {
      showActionToast(result.error === 'User not authenticated' ? 'Sign in to save places' : (result.error || 'Could not save this place'));
    }
  };

  const handlePickShareTarget = async (target: ShareTarget) => {
    const place = shareTargetPlace;
    setShareTargetPlace(null);
    if (!place || !user?.id) return;

    const item = toAppItem(place);
    const sent =
      target.type === 'group'
        ? await ChatService.sendGroupSharedItemMessage({
            groupId: target.group.id,
            senderId: user.id,
            item,
          })
        : await (async () => {
            const conversation = await ChatService.getOrCreateConversation(user.id, target.friend.id);
            if (!conversation.success || !conversation.data) return { success: false as const };
            return ChatService.sendSharedItemMessage({
              conversationId: conversation.data.id,
              senderId: user.id,
              item,
            });
          })();

    if (!sent.success || !sent.data) {
      showActionToast('Could not share this place. Please try again.');
      return;
    }

    await PointsService.awardPoints({ actionType: 'share_card', sourceType: 'share', sourceId: sent.data.id });
    showActionToast(`Shared ${place.name} with ${target.type === 'group' ? target.group.name : target.friend.name}`);
  };

  // --- Map Initialization ---
  useEffect(() => {
    if (!mapRef.current || !MAPS_API_KEY) return;

    const initMap = async () => {
      const google = getGoogleMaps();
      if (!google) {
        // Retry if Maps script hasn't loaded yet
        setTimeout(initMap, 500);
        return;
      }

      let MapClass = google.Map;
      if (!MapClass && typeof google.importLibrary === 'function') {
        const mapsLib = await google.importLibrary("maps") as any;
        MapClass = mapsLib.Map;
      }

      if (!MapClass) {
        console.error("Failed to load Google Maps Map class.");
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

      fetchPlaces(map);
      map.addListener('click', handleMapClick);

      navigator.geolocation.getCurrentPosition((p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserLocation(pos);
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
  // Brand-mapped source colors (kept distinct from each other for legend
  // legibility): sky = Nearby/Google, turmeric = FUZO community, lime = Saved.
  const MARKER_COLORS: Record<string, string> = {
    google: '#5b9bd5',
    fuzo: '#f2a93b',
    saved: '#8fbb2a',
  };

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

    const markers = activePlaces.map(place => {
      const color = MARKER_COLORS[place.markerSource || 'google'] || '#3b82f6';
      const marker = new google.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current,
        icon: getPinIcon(google, color, false)
      });
      marker.addListener('click', () => setSelectedPlace(place));
      return marker;
    });

    if (userLocation) {
      const userMarker = new google.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        zIndex: 1000,
        icon: getPinIcon(google, '#d64545', true)
      });
      markers.push(userMarker);
    }

    activeMarkersRef.current = markers;

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
  }, [isMapReady, activePlaces, pinnedPlace, userLocation]);

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
  const sourceCounts = useMemo(() => {
    const counts = { google: 0, fuzo: 0, saved: 0 };
    activePlaces.forEach(p => {
      const src = p.markerSource || 'google';
      if (src in counts) counts[src as keyof typeof counts]++;
    });
    return counts;
  }, [activePlaces]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
            <button onClick={() => setIsRoutePlannerOpen(true)} className="scout-search__route-btn">
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

        {/* Legend */}
        <div className="scout-legend">
          <div className="scout-legend__item">
            <span className="scout-legend__dot scout-legend__dot--google" />
            <span>Nearby ({sourceCounts.google})</span>
          </div>
          <div className="scout-legend__item">
            <span className="scout-legend__dot scout-legend__dot--fuzo" />
            <span>FUZO ({sourceCounts.fuzo})</span>
          </div>
          <div className="scout-legend__item">
            <span className="scout-legend__dot scout-legend__dot--saved" />
            <span>Saved ({sourceCounts.saved})</span>
          </div>
        </div>
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
      <ScoutRoutePlanner
        isVisible={isRoutePlannerOpen}
        onClose={() => setIsRoutePlannerOpen(false)}
        onCalculateRoute={handleCalculateRoute}
        onClear={handleClearRoute}
        isCalculating={isCalculatingRoute}
      />

      <ScoutDiscoveryPanel
        places={activePlaces}
        onPlaceSelect={handlePlaceSelect}
        filter={filter}
        onFilterChange={setFilter}
        onDistanceChangeEnd={() => { if (mapInstanceRef.current) fetchPlaces(mapInstanceRef.current, searchQuery); }}
        onClose={() => { }}
      />

      {selectedPlace && (
        <ScoutPlaceModal
          place={selectedPlace}
          modalTab={modalTab}
          setModalTab={setModalTab}
          isLoadingDetails={isLoadingDetails}
          isSaved={savedPlaceIds.has(selectedPlace.id)}
          onClose={() => setSelectedPlace(null)}
          onAction={handleAction}
        />
      )}

      {shareTargetPlace && user?.id && (
        <FriendPickerModal
          currentUserId={user.id}
          onClose={() => setShareTargetPlace(null)}
          onPick={handlePickShareTarget}
        />
      )}

      {actionToast && (
        <div className="toast show position-fixed bottom-0 start-50 translate-middle-x mb-5 bg-dark text-white rounded-pill px-3 py-2 shadow" style={{ zIndex: 1050 }}>
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
