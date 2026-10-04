'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Home, LocateFixed, Map as MapIcon, MapPin } from 'lucide-react';
import { getGoogleMaps } from '@/types/scout';
import type { LocationState } from './useNearbyPlaces';

const LocationPickerModal = dynamic(() => import('@/components/profile/LocationPickerModal'), { ssr: false });

// "📍 Near Bang Rak, Bangkok · Change" at the top of For you: shows which
// location the dashboard is using and lets the user fix it when the browser's
// guess is wrong - Use my current location (fresh, high-accuracy fix), Use my
// home area, or Pick on map. Everything on For you follows this location.

// A browser fix this coarse is usually network/IP-based - flag it.
const APPROX_METERS = 3000;

/** "Bang Rak, Bangkok" for a point (Google Maps JS Geocoder, already loaded app-wide). */
function reverseLabel(lat: number, lng: number): Promise<string | null> {
  return new Promise((resolve) => {
    const google = getGoogleMaps();
    if (!google?.Geocoder) return resolve(null);
    new google.Geocoder().geocode({ location: { lat, lng } }, (results: unknown, status: string) => {
      if (status !== 'OK' || !Array.isArray(results) || !results.length) return resolve(null);
      const parts = (results[0] as { address_components?: { long_name: string; types: string[] }[] }).address_components ?? [];
      const pick = (...types: string[]) => parts.find((c) => types.some((t) => c.types.includes(t)))?.long_name;
      const area = pick('sublocality_level_1', 'sublocality', 'neighborhood');
      const city = pick('locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1');
      resolve([area, city].filter((v, i, a) => v && a.indexOf(v) === i).join(', ') || null);
    });
  });
}

export function LocationChip({
  loc,
  onUseCurrent,
  onUseHome,
  onPick,
}: {
  loc: LocationState;
  onUseCurrent: () => void;
  onUseHome: () => Promise<boolean>;
  onPick: (lat: number, lng: number, label?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [noHome, setNoHome] = useState(false);
  // Place name for the current point, keyed by the point so a new location re-labels.
  const [named, setNamed] = useState<{ key: string; label: string | null } | null>(null);
  const key = loc.status === 'ready' ? `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}` : '';

  useEffect(() => {
    if (loc.status !== 'ready' || loc.label) return;
    let cancelled = false;
    // The Maps script loads async - retry briefly until it's there.
    let tries = 0;
    const run = () => {
      if (cancelled) return;
      if (!getGoogleMaps()?.Geocoder && tries++ < 10) {
        window.setTimeout(run, 500);
        return;
      }
      reverseLabel(loc.lat, loc.lng).then((label) => {
        if (!cancelled) setNamed({ key, label });
      });
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const unknown = loc.status === 'unavailable';
  const ready = loc.status === 'ready';
  const label = ready ? loc.label ?? (named?.key === key ? named.label : null) : null;
  const approx = ready && loc.source === 'gps' && (loc.accuracy ?? 0) > APPROX_METERS;
  const sourceText = unknown
    ? 'Allow location, use your home area, or pick a spot'
    : !ready
    ? 'Finding your location…'
    : loc.source === 'picked'
      ? 'Chosen on the map'
      : loc.source === 'home'
        ? 'Your home area'
        : approx
          ? `Approximate · within ~${Math.round((loc.accuracy ?? 0) / 1000)} km`
          : 'Your current location';

  return (
    <div className="fz-dash-loc">
      <span className={`fz-dash-loc__icon${approx || unknown ? ' is-approx' : ''}`} aria-hidden="true">
        <MapPin size={16} />
      </span>
      <span className="fz-dash-loc__text">
        <strong>{unknown ? 'Location not set' : ready ? (label ? `Near ${label}` : 'Near you') : 'Locating…'}</strong>
        <span className={approx ? 'is-approx' : ''}>
          {sourceText}
          {approx && ' - not right? Change it'}
        </span>
      </span>

      <div className="fz-dash-loc__anchor">
        <button
          type="button"
          className="fz-dash-loc__change"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            setNoHome(false);
            setOpen((v) => !v);
          }}
        >
          Change <ChevronDown size={14} />
        </button>
        {open && (
          <>
            <button type="button" className="fz-dash-loc__scrim" aria-label="Close" onClick={() => setOpen(false)} />
            <div className="fz-dash-loc__menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="fz-dash-loc__item"
                onClick={() => {
                  setOpen(false);
                  onUseCurrent();
                }}
              >
                <span className="fz-dash-loc__item-icon"><LocateFixed size={16} /></span>
                <span>
                  <strong>Use my current location</strong>
                  <small>Ask this device again (precise)</small>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="fz-dash-loc__item"
                onClick={async () => {
                  const ok = await onUseHome();
                  if (ok) setOpen(false);
                  else setNoHome(true);
                }}
              >
                <span className="fz-dash-loc__item-icon"><Home size={16} /></span>
                <span>
                  <strong>Use my home area</strong>
                  <small>{noHome ? 'No home area saved - set it in Profile > Settings' : 'From your profile settings'}</small>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="fz-dash-loc__item"
                onClick={() => {
                  setOpen(false);
                  setPicking(true);
                }}
              >
                <span className="fz-dash-loc__item-icon"><MapIcon size={16} /></span>
                <span>
                  <strong>Pick on map</strong>
                  <small>Drop a pin anywhere</small>
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {picking && (
        <LocationPickerModal
          initialLat={ready ? loc.lat : null}
          initialLng={ready ? loc.lng : null}
          onClose={() => setPicking(false)}
          onConfirm={({ lat, lng }) => {
            setPicking(false);
            // The chip names the spot itself ("Bang Rak, Bangkok") - a full
            // address would start with a street number.
            onPick(lat, lng);
          }}
        />
      )}
    </div>
  );
}
