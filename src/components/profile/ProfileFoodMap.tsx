'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe2, LocateFixed, MapPin } from 'lucide-react';
import { getGoogleMaps } from '@/types/scout';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export interface ProfileMapPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
}

interface ProfileFoodMapProps {
  places: ProfileMapPlace[];
  onSelect?: (id: string) => void;
  /** Shows an "Add a place" CTA in the empty state - omitted for a
   * read-only (someone else's) profile view. */
  onAdd?: () => void;
}

// Colours of the "world view" (client reference: a flat light-blue/grey world
// map with dark dots). Kept when zoomed in so it feels like the same map.
const WATER = '#e6eef8';
const LAND = '#d7d7d4';
const DOT = '#1d4a5c';

// Zoomed out: just continents + dots, no labels/roads.
const WORLD_STYLE = [
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'on' }, { color: '#f4f4f2' }, { weight: 0.6 }] },
  { featureType: 'landscape', stylers: [{ color: LAND }] },
  { featureType: 'water', stylers: [{ color: WATER }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// Zoomed in: the real Google map (streets, place names) in the same palette.
const DETAIL_STYLE = [
  { featureType: 'water', stylers: [{ color: WATER }] },
  { featureType: 'landscape', stylers: [{ color: '#f1f0ec' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e0da' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f5a50' }] },
];
const DETAIL_FROM_ZOOM = 5;

const WORLD_CENTER = { lat: 20, lng: 10 };

// Zoom at which exactly one world (256px tiles) spans the map's width - a
// fractional zoom (isFractionalZoomEnabled below), so a wide card shows one
// full world instead of several repeated copies.
function worldZoom(width: number) {
  return Math.max(0, Math.log2(Math.max(width, 256) / 256));
}

// A real map of places the profile owner has pinned (Restaurant-family
// food_cards + saved Places, both carry real lat/lng). Opens on a world view
// with a dot per place; zooming in reveals the full Google map. Reuses
// Scout's google.maps init/cleanup pattern - markers/listeners are torn down
// on unmount or a later resize can crash React trying to touch detached nodes.
export default function ProfileFoodMap({ places, onSelect, onAdd }: ProfileFoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  const showWorld = () => {
    const map = mapInstanceRef.current;
    if (!map || !mapRef.current) return;
    map.setCenter(WORLD_CENTER);
    map.setZoom(worldZoom(mapRef.current.clientWidth));
  };

  const showMyPlaces = () => {
    const google = getGoogleMaps();
    const map = mapInstanceRef.current;
    if (!google || !map || places.length === 0) return;
    if (places.length === 1) {
      map.setCenter({ lat: places[0].lat, lng: places[0].lng });
      map.setZoom(13);
      return;
    }
    const bounds = new google.LatLngBounds();
    places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 48);
  };

  useEffect(() => {
    if (!mapRef.current || !MAPS_API_KEY) return;
    let cancelled = false;

    const initMap = async () => {
      const google = getGoogleMaps();
      if (!google) {
        setTimeout(() => { if (!cancelled) initMap(); }, 500);
        return;
      }
      if (cancelled || !mapRef.current) return;

      let MapClass = google.Map;
      if (!MapClass && typeof google.importLibrary === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapsLib = await google.importLibrary('maps') as any;
        MapClass = mapsLib.Map;
      }
      if (!MapClass || cancelled || !mapRef.current) return;

      const minZoom = worldZoom(mapRef.current.clientWidth);
      const map = new MapClass(mapRef.current, {
        center: WORLD_CENTER,
        zoom: minZoom,
        minZoom,
        isFractionalZoomEnabled: true,
        backgroundColor: WATER,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        // Page scroll isn't hijacked: ctrl/cmd + scroll or two fingers to zoom.
        gestureHandling: 'cooperative',
        // Keep the world from repeating sideways / showing grey above the poles.
        restriction: { latLngBounds: { north: 85, south: -85, west: -180, east: 180 }, strictBounds: false },
        styles: WORLD_STYLE,
      });

      // Plain world look when zoomed out, full street detail when zoomed in.
      let detailed = false;
      map.addListener('zoom_changed', () => {
        const next = (map.getZoom() ?? 0) >= DETAIL_FROM_ZOOM;
        if (next !== detailed) {
          detailed = next;
          map.setOptions({ styles: next ? DETAIL_STYLE : WORLD_STYLE });
        }
      });

      mapInstanceRef.current = map;
      setIsReady(true);
    };

    initMap();

    return () => {
      cancelled = true;
      const google = getGoogleMaps();
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (mapInstanceRef.current && google?.event) {
        google.event.clearInstanceListeners(mapInstanceRef.current);
      }
      mapInstanceRef.current = null;
    };
    // Only re-init if the map DOM node itself is (re)mounted - place updates
    // are handled by the marker-sync effect below.
  }, []);

  // One dot per place. The map stays on the world view - it doesn't jump to the places.
  useEffect(() => {
    const google = getGoogleMaps();
    const map = mapInstanceRef.current;
    if (!isReady || !google || !map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const marker = new google.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.name,
        icon: {
          path: google.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: DOT,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
      });
      marker.addListener('click', () => onSelect?.(place.id));
      markersRef.current.push(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, isReady]);

  if (!MAPS_API_KEY) {
    return (
      <div className="text-center text-muted py-5 bg-light rounded-4">
        Maps isn&rsquo;t configured.
      </div>
    );
  }

  return (
    <div className="fz-world-map fz-profile-map">
      <div ref={mapRef} className="fz-world-map__canvas" />

      {places.length > 0 ? (
        <div className="fz-world-map__controls">
          <button type="button" className="fz-world-map__btn" onClick={showWorld}>
            <Globe2 size={14} /> World
          </button>
          <button type="button" className="fz-world-map__btn" onClick={showMyPlaces}>
            <LocateFixed size={14} /> My places
          </button>
        </div>
      ) : (
        <div className="fz-world-map__empty">
          <MapPin size={16} />
          <span>No places pinned yet</span>
          {onAdd && (
            <button type="button" className="fz-world-map__add" onClick={onAdd}>
              + Add a place
            </button>
          )}
        </div>
      )}

      {places.length > 0 && (
        <div className="fz-world-map__count">
          <span className="fz-world-map__dot" aria-hidden="true" />
          {places.length} {places.length === 1 ? 'place' : 'places'}
        </div>
      )}
    </div>
  );
}
