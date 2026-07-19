'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getGoogleMaps } from '@/types/scout';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Toronto - matches the "Toronto, ON" placeholder onboarding already uses
// for its plain-text location field, so a user with no prior pin lands
// somewhere sensible rather than off the coast of Africa (0,0).
const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 };

interface LocationPickerModalProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (result: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

// Click-or-drag-to-pin location picker, reusing the same google.maps
// init/cleanup pattern as ProfileFoodMap.tsx and Scout - draggable marker +
// map-click both move the pin, "Detect my location" uses the browser
// Geolocation API, and confirming reverse-geocodes the pin via
// google.maps.Geocoder so the caller gets a real address string, not just
// raw coordinates.
export default function LocationPickerModal({ initialLat, initialLng, onConfirm, onClose }: LocationPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const positionRef = useRef(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !MAPS_API_KEY) return;
    let cancelled = false;

    const initMap = async () => {
      const google = getGoogleMaps();
      if (!google) {
        setTimeout(() => {
          if (!cancelled) initMap();
        }, 500);
        return;
      }
      if (cancelled || !mapRef.current) return;

      const map = new google.Map(mapRef.current, {
        center: positionRef.current,
        zoom: 12,
        disableDefaultUI: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      const marker = new google.Marker({ position: positionRef.current, map, draggable: true });
      marker.addListener('dragend', () => {
        const pos = marker.getPosition?.();
        if (pos) positionRef.current = { lat: pos.lat(), lng: pos.lng() };
      });
      map.addListener('click', (e: any) => {
        if (!e?.latLng) return;
        const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(next);
        positionRef.current = next;
      });
      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      cancelled = true;
      const google = getGoogleMaps();
      if (markerRef.current) markerRef.current.setMap(null);
      if (mapInstanceRef.current && google?.event) google.event.clearInstanceListeners(mapInstanceRef.current);
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Location detection is not supported by this browser.');
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        positionRef.current = next;
        markerRef.current?.setPosition(next);
        mapInstanceRef.current?.panTo(next);
        mapInstanceRef.current?.setZoom(15);
        setIsLocating(false);
      },
      () => {
        setError('Could not detect your location. Check your browser permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleConfirm = () => {
    const google = getGoogleMaps();
    const { lat, lng } = positionRef.current;
    if (!google) {
      onConfirm({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      return;
    }
    setIsConfirming(true);
    const geocoder = new google.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      setIsConfirming(false);
      const address = status === 'OK' && results?.[0]?.formatted_address ? results[0].formatted_address : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      onConfirm({ lat, lng, address });
    });
  };

  return createPortal(
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1080 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="fw-bold mb-0">Set your location</h6>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          {MAPS_API_KEY ? (
            <div ref={mapRef} style={{ width: '100%', height: '360px' }} />
          ) : (
            <div className="text-center text-muted py-5 bg-light">Maps isn&rsquo;t configured.</div>
          )}
          <div className="p-3">
            {error && <div className="alert alert-danger small py-2 mb-2">{error}</div>}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 mb-2"
              onClick={handleDetectLocation}
              disabled={isLocating || !MAPS_API_KEY}
            >
              {isLocating ? 'Detecting…' : '📍 Detect my location'}
            </button>
            <div className="text-muted small text-center">or tap/drag the pin on the map</div>
          </div>
          <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary flex-fill fw-bold" onClick={handleConfirm} disabled={isConfirming || !MAPS_API_KEY}>
              {isConfirming ? 'Saving…' : 'Use this location'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
