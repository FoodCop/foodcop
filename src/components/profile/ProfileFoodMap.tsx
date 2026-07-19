'use client';

import { useEffect, useRef, useState } from 'react';
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
}

// A real map of places the profile owner has actually pinned (Restaurant-
// family food_cards + saved Places, both of which already carry real
// lat/lng) - reuses Scout's own google.maps rendering + cleanup pattern
// rather than a new map library or component, and the same lesson learned
// there: markers/listeners must be torn down on unmount or a later resize
// can crash React's reconciler trying to touch an already-detached node.
export default function ProfileFoodMap({ places, onSelect }: ProfileFoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isReady, setIsReady] = useState(false);

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
        const mapsLib = await google.importLibrary('maps') as any;
        MapClass = mapsLib.Map;
      }
      if (!MapClass || cancelled || !mapRef.current) return;

      const map = new MapClass(mapRef.current, {
        center: places[0] ? { lat: places[0].lat, lng: places[0].lng } : { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
        disableDefaultUI: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { featureType: 'road' as any, elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'poi' as any, stylers: [{ visibility: 'off' }] },
          { featureType: 'transit' as any, stylers: [{ visibility: 'off' }] },
        ],
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
    // Only re-init if the map DOM node itself is (re)mounted - place
    // updates are handled by the marker-sync effect below instead of a
    // full map teardown/rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever the place list changes, without recreating the map.
  useEffect(() => {
    const google = getGoogleMaps();
    const map = mapInstanceRef.current;
    if (!isReady || !google || !map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (places.length === 0) return;

    const bounds = new google.LatLngBounds();
    places.forEach((place) => {
      const marker = new google.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.name,
        icon: {
          path: google.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 8,
          fillColor: '#f2a93b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => onSelect?.(place.id));
      markersRef.current.push(marker);
      bounds.extend({ lat: place.lat, lng: place.lng });
    });

    if (places.length === 1) {
      map.setCenter({ lat: places[0].lat, lng: places[0].lng });
      map.setZoom(14);
    } else {
      map.fitBounds(bounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, isReady]);

  if (!MAPS_API_KEY) {
    return (
      <div className="text-center text-muted py-5 bg-light rounded-4">
        Maps isn&rsquo;t configured.
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="text-center text-muted py-5 bg-light rounded-4">
        <div style={{ fontSize: 32 }}>🗺️</div>
        <div className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
          No places pinned yet
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-4 overflow-hidden" style={{ width: '100%', height: '360px' }} />;
}
