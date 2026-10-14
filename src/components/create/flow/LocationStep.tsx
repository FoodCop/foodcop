'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Crosshair, Loader2, MapPin, Navigation, Search, Store, X } from 'lucide-react';
import LocationPickerModal from '@/components/profile/LocationPickerModal';
import { PlacesService, type ScoutPlaceRaw } from '@/lib/services/placesService';
import { RestaurantService } from '@/lib/services/restaurantService';
import type { PostPlace } from '@/lib/services/postService';
import type { GpsPoint } from '@/lib/utils/exifGps';

// Where a post was taken (Create flow; client, 2026-10-14: "search for a
// place using Scout, or drop a map pin"). Used by Vibe, Food and Restaurant
// posts. Search uses FUZO's Places proxy (/api/places); "Near me" lists the
// places around the user; "Drop a pin" opens the map picker. A Google place
// that a verified FUZO restaurant owns is linked to that restaurant.

interface LocationStepProps {
  value: PostPlace | null;
  onChange: (place: PostPlace | null) => void;
  /** Heading above the field. */
  label?: string;
  /** Where the photo was taken (EXIF GPS): places there are suggested first. */
  photoSpot?: GpsPoint | null;
  /** Offer "Drop a pin" / "Use the photo's exact spot" (off when it must be a listed place). */
  allowPin?: boolean;
}

type Status = 'idle' | 'searching' | 'locating' | 'error';

const toPlace = (r: ScoutPlaceRaw): PostPlace | null => {
  const lat = r.geometry?.location?.lat;
  const lng = r.geometry?.location?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { placeId: r.place_id ?? null, name: r.name, address: r.formatted_address || r.vicinity || null, lat, lng };
};

const getPosition = () =>
  new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 120000 },
    );
  });

export function LocationStep({ value, onChange, label = 'Location', photoSpot = null, allowPin = true }: LocationStepProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PostPlace[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  // The user's position (if they allow it): biases search, centres the pin map.
  const here = useRef<{ lat: number; lng: number } | null>(null);
  const [herePos, setHerePos] = useState<{ lat: number; lng: number } | null>(null);
  const seq = useRef(0);
  const [fromPhoto, setFromPhoto] = useState<PostPlace[] | null>(null);

  // Ask for the user's position once, quietly, to bias search results nearby.
  useEffect(() => {
    getPosition().then((p) => {
      here.current = p;
      setHerePos(p);
    });
  }, []);

  // Places where the photo was taken (once per photo spot).
  useEffect(() => {
    if (!photoSpot) return;
    let cancelled = false;
    PlacesService.searchNearby(photoSpot.lat, photoSpot.lng, 150).then((res) => {
      if (cancelled) return;
      setFromPhoto((res.data?.results ?? []).map(toPlace).filter((p): p is PostPlace => !!p).slice(0, 5));
    });
    return () => {
      cancelled = true;
    };
  }, [photoSpot]);

  const choose = async (place: PostPlace) => {
    setResults([]);
    setQuery('');
    setMessage(null);
    onChange(place);
    // Link to the FUZO restaurant that owns this Google place (verified links only).
    if (place.placeId) {
      const res = await RestaurantService.findByPlaceIds([place.placeId]);
      const link = res.success ? res.data?.get(place.placeId) : undefined;
      if (link) onChange({ ...place, restaurantId: link.restaurantId, name: link.name || place.name });
    }
  };

  const search = async () => {
    const text = query.trim();
    if (text.length < 2) return;
    const id = ++seq.current;
    setStatus('searching');
    setMessage(null);
    const near = here.current ?? { lat: 0, lng: 0 };
    // Google allows a 50 km bias at most; without a position the name decides.
    const res = await PlacesService.searchByText(text, near.lat, near.lng, 50000);
    if (id !== seq.current) return;
    const places = (res.data?.results ?? []).map(toPlace).filter((p): p is PostPlace => !!p).slice(0, 6);
    setResults(places);
    setStatus('idle');
    if (!res.success) setMessage("Search isn't working right now. Try dropping a pin instead.");
    else if (places.length === 0) setMessage('No places found. Try another name, or drop a pin.');
  };

  const nearMe = async () => {
    const id = ++seq.current;
    setStatus('locating');
    setMessage(null);
    const p = here.current ?? (await getPosition());
    if (id !== seq.current) return;
    if (!p) {
      setStatus('idle');
      setMessage('Location is off. Search for the place or drop a pin instead.');
      return;
    }
    here.current = p;
    const res = await PlacesService.searchNearby(p.lat, p.lng, 300);
    if (id !== seq.current) return;
    const places = (res.data?.results ?? []).map(toPlace).filter((x): x is PostPlace => !!x).slice(0, 8);
    setResults(places);
    setStatus('idle');
    if (places.length === 0) setMessage('Nothing found right here. Search by name, or drop a pin.');
  };

  return (
    <section className="cf-field" aria-labelledby="cf-loc-label">
      <h3 id="cf-loc-label" className="cf-field__label">{label} <span className="cf-field__req" aria-hidden="true">*</span></h3>

      {value ? (
        <div className="cf-place">
          <span className="cf-place__icon" aria-hidden="true">{value.restaurantId ? <Store size={18} /> : <MapPin size={18} />}</span>
          <span className="cf-place__text">
            <strong>{value.name || 'Pinned location'}</strong>
            {value.address && value.address !== value.name && <span>{value.address}</span>}
            {value.restaurantId && <span className="cf-place__fuzo">On FUZO</span>}
          </span>
          <button type="button" className="cf-place__clear" onClick={() => onChange(null)} aria-label="Change location">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          {photoSpot && (
            <div className="cf-fromphoto">
              <p className="cf-fromphoto__title">
                <Camera size={15} aria-hidden="true" /> From your photo&apos;s location
              </p>
              {fromPhoto === null ? (
                <p className="cf-field__hint">
                  <Loader2 size={14} className="scout-spin" aria-hidden="true" /> Looking for places there…
                </p>
              ) : fromPhoto.length === 0 ? (
                <p className="cf-field__hint">We couldn&apos;t spot a restaurant there. Search for it{allowPin ? <>, or use the photo&apos;s spot</> : null}.</p>
              ) : (
                <ul className="cf-results" aria-label="Places where the photo was taken">
                  {fromPhoto.map((r) => (
                    <li key={`p-${r.placeId ?? ''}-${r.lat}-${r.lng}`}>
                      <button type="button" className="cf-results__item" onClick={() => choose(r)}>
                        <MapPin size={16} aria-hidden="true" />
                        <span>
                          <strong>{r.name}</strong>
                          {r.address && <span>{r.address}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {allowPin && (
                <button
                  type="button"
                  className="cf-chipbtn"
                  onClick={() => choose({ lat: photoSpot.lat, lng: photoSpot.lng, name: null, address: null, placeId: null })}
                >
                  <Crosshair size={15} /> Use the photo&apos;s exact spot
                </button>
              )}
            </div>
          )}

          <form
            className="cf-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <Search size={17} aria-hidden="true" />
            <input
              className="cf-search__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a restaurant, café or place"
              aria-label="Search a place"
              enterKeyHint="search"
            />
            <button type="submit" className="cf-search__go" disabled={query.trim().length < 2 || status === 'searching'}>
              {status === 'searching' ? <Loader2 size={16} className="scout-spin" /> : 'Search'}
            </button>
          </form>

          <div className="cf-loc-actions">
            <button type="button" className="cf-chipbtn" onClick={nearMe} disabled={status === 'locating'}>
              {status === 'locating' ? <Loader2 size={15} className="scout-spin" /> : <Navigation size={15} />} Places near me
            </button>
            {allowPin && (
              <button type="button" className="cf-chipbtn" onClick={() => setPinOpen(true)}>
                <Crosshair size={15} /> Drop a pin
              </button>
            )}
          </div>

          {message && <p className="cf-field__hint" role="status">{message}</p>}

          {results.length > 0 && (
            <ul className="cf-results" aria-label="Places">
              {results.map((r) => (
                <li key={`${r.placeId ?? ''}-${r.lat}-${r.lng}`}>
                  <button type="button" className="cf-results__item" onClick={() => choose(r)}>
                    <MapPin size={16} aria-hidden="true" />
                    <span>
                      <strong>{r.name}</strong>
                      {r.address && <span>{r.address}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {pinOpen && (
        <LocationPickerModal
          title="Drop a pin"
          zIndex={1200}
          initialLat={herePos?.lat}
          initialLng={herePos?.lng}
          onClose={() => setPinOpen(false)}
          onConfirm={({ lat, lng, address }) => {
            setPinOpen(false);
            const isCoords = /^-?\d/.test(address);
            choose({ lat, lng, name: isCoords ? null : address.split(',')[0], address: isCoords ? null : address, placeId: null });
          }}
        />
      )}
    </section>
  );
}

export default LocationStep;
