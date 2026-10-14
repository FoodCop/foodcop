'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Camera, Crosshair, Loader2, MapPin, Navigation, X } from 'lucide-react';
import LocationPickerModal from '@/components/profile/LocationPickerModal';
import { BUSINESS_IDENTITY } from '@/lib/onboarding/data';
import { UGC_CUISINES } from '@/lib/utils/taxonomy';
import { PRICE_LEVELS } from '@/components/create/shared/TagChips';
import { CommunityPlacesService, PLACE_CATEGORIES, type NewPlaceFields, type PlaceDuplicate } from '@/lib/services/communityPlacesService';
import type { GpsPoint } from '@/lib/utils/exifGps';
import { ChipField } from './ChipField';

// A restaurant that isn't on the map yet (client, 2026-10-14; plan Phase 7):
// name, map pin, category, business identity, cuisine, price, hours and
// contact. While the user types, places with a similar name within ~150 m
// (FUZO or Google) are shown so they can post there instead; the database
// refuses duplicates too. Once posted it shows on Scout as "Community Added"
// until the community votes on it.

interface NewRestaurantFormProps {
  value: NewPlaceFields;
  onChange: (patch: Partial<NewPlaceFields>) => void;
  /** Where the photo was taken (EXIF GPS). */
  photoSpot: GpsPoint | null;
  /** The user picked an existing place from the duplicate warning. */
  onUseExisting: (place: PlaceDuplicate) => void;
}

const getPosition = () =>
  new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });

export function NewRestaurantForm({ value, onChange, photoSpot, onUseExisting }: NewRestaurantFormProps) {
  const [pinOpen, setPinOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [dupes, setDupes] = useState<{ key: string; list: PlaceDuplicate[] } | null>(null);

  const hasPin = value.lat != null && value.lng != null;
  const dupKey = hasPin && value.name.trim().length >= 2 ? `${value.name.trim()}|${value.lat}|${value.lng}` : null;

  // Duplicate check, a moment after the name / pin stop changing.
  useEffect(() => {
    if (!dupKey || value.lat == null || value.lng == null) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      CommunityPlacesService.findDuplicates(value.name.trim(), value.lat!, value.lng!).then((list) => {
        if (!cancelled) setDupes({ key: dupKey, list });
      });
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [dupKey, value.name, value.lat, value.lng]);
  const duplicates = dupes?.key === dupKey ? dupes.list : [];
  const checking = !!dupKey && dupes?.key !== dupKey;

  const useMyLocation = async () => {
    setLocating(true);
    setLocError(null);
    const p = await getPosition();
    setLocating(false);
    if (!p) {
      setLocError('Location is off. Drop a pin on the map instead.');
      return;
    }
    onChange({ lat: p.lat, lng: p.lng });
  };

  return (
    <div className="cf-form">
      <section className="cf-field">
        <label htmlFor="cf-new-name" className="cf-field__label">
          Restaurant name <span className="cf-field__req" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-new-name"
          className="cf-input"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Raju's Chaat Corner"
          maxLength={120}
          autoComplete="off"
        />
      </section>

      <section className="cf-field" aria-labelledby="cf-new-where">
        <h3 id="cf-new-where" className="cf-field__label">
          Where is it? <span className="cf-field__req" aria-hidden="true">*</span>
        </h3>
        {hasPin ? (
          <div className="cf-place">
            <span className="cf-place__icon" aria-hidden="true">
              <MapPin size={18} />
            </span>
            <span className="cf-place__text">
              <strong>{value.address || 'Pinned on the map'}</strong>
              <span>
                {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)}
              </span>
            </span>
            <button type="button" className="cf-place__clear" onClick={() => onChange({ lat: null, lng: null, address: '' })} aria-label="Change location">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <p className="cf-field__hint">Put the pin on the restaurant&apos;s door - it&apos;s how people find it.</p>
            <div className="cf-loc-actions">
              <button type="button" className="cf-chipbtn" onClick={useMyLocation} disabled={locating}>
                {locating ? <Loader2 size={15} className="scout-spin" /> : <Navigation size={15} />} I&apos;m here now
              </button>
              <button type="button" className="cf-chipbtn" onClick={() => setPinOpen(true)}>
                <Crosshair size={15} /> Drop a pin
              </button>
              {photoSpot && (
                <button type="button" className="cf-chipbtn" onClick={() => onChange({ lat: photoSpot.lat, lng: photoSpot.lng })}>
                  <Camera size={15} /> Where the photo was taken
                </button>
              )}
            </div>
            {locError && (
              <p className="cf-field__hint" role="status">
                {locError}
              </p>
            )}
          </>
        )}
        {hasPin && (
          <input
            className="cf-input"
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Address or landmark (optional)"
            maxLength={300}
            aria-label="Address or landmark"
          />
        )}
      </section>

      <div role="status" aria-live="polite" className="cf-dupes-live">
        {checking && (
          <p className="cf-field__hint">
            <Loader2 size={14} className="scout-spin" aria-hidden="true" /> Checking it isn&apos;t on the map already…
          </p>
        )}
        {duplicates.length > 0 && (
          <div className="cf-dupes">
            <p className="cf-dupes__title">
              <AlertTriangle size={16} aria-hidden="true" /> Already on the map?
            </p>
            <p className="cf-field__hint">We found a place with a similar name right there. If it&apos;s the same one, post your photos to it instead.</p>
            <ul className="cf-results" aria-label="Places with a similar name">
              {duplicates.map((d) => (
                <li key={`${d.kind}-${d.id ?? d.placeId}`}>
                  <button type="button" className="cf-results__item" onClick={() => onUseExisting(d)}>
                    <MapPin size={16} aria-hidden="true" />
                    <span>
                      <strong>{d.name}</strong>
                      <span>{d.kind === 'google' ? d.address || 'On Google Maps' : d.kind === 'restaurant' ? 'On FUZO' : 'Community Added'}</span>
                      <span className="cf-dupes__use">Use this place</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <section className="cf-field" aria-labelledby="cf-new-category">
        <h3 id="cf-new-category" className="cf-field__label">
          Category <span className="cf-field__req" aria-hidden="true">*</span>
        </h3>
        <div className="studio-tag-options" role="radiogroup" aria-labelledby="cf-new-category">
          {PLACE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={value.category === c}
              className={`studio-tag-chip${value.category === c ? ' is-selected' : ''}`}
              onClick={() => onChange({ category: value.category === c ? '' : c })}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <ChipField
        label="Business identity"
        hint="What's the place like? Pick all that fit."
        options={BUSINESS_IDENTITY}
        selected={value.businessIdentity}
        onChange={(businessIdentity) => onChange({ businessIdentity })}
        allowCustom
        customPlaceholder="Add your own, e.g. Rooftop"
      />

      <ChipField
        label="Cuisine"
        options={UGC_CUISINES.filter((c) => c !== 'Custom')}
        selected={value.cuisines}
        onChange={(cuisines) => onChange({ cuisines })}
        allowCustom
        customPlaceholder="Another cuisine"
        maxCustomLength={30}
      />

      <section className="cf-field" aria-labelledby="cf-new-price">
        <h3 id="cf-new-price" className="cf-field__label">Price level</h3>
        <div className="studio-tag-options" role="radiogroup" aria-labelledby="cf-new-price">
          {PRICE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={value.priceLevel === level}
              className={`studio-tag-chip${value.priceLevel === level ? ' is-selected' : ''}`}
              onClick={() => onChange({ priceLevel: value.priceLevel === level ? null : level })}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <section className="cf-field">
        <label htmlFor="cf-new-hours" className="cf-field__label">Opening hours</label>
        <input
          id="cf-new-hours"
          className="cf-input"
          value={value.hours}
          onChange={(e) => onChange({ hours: e.target.value })}
          placeholder="e.g. Mon-Sat 11am-10pm (optional)"
          maxLength={200}
        />
      </section>

      <section className="cf-field" aria-labelledby="cf-new-contact">
        <h3 id="cf-new-contact" className="cf-field__label">Contact</h3>
        <input
          className="cf-input"
          type="tel"
          value={value.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="Phone (optional)"
          maxLength={40}
          aria-label="Phone"
          autoComplete="off"
        />
        <input
          className="cf-input"
          type="url"
          inputMode="url"
          value={value.website}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="Website or Instagram link (optional)"
          maxLength={300}
          aria-label="Website"
          autoComplete="off"
        />
      </section>

      {pinOpen && (
        <LocationPickerModal
          title="Pin the restaurant"
          zIndex={1200}
          initialLat={value.lat ?? photoSpot?.lat}
          initialLng={value.lng ?? photoSpot?.lng}
          onClose={() => setPinOpen(false)}
          onConfirm={({ lat, lng, address }) => {
            setPinOpen(false);
            const isCoords = /^-?\d/.test(address);
            onChange({ lat, lng, address: isCoords ? value.address : address });
          }}
        />
      )}
    </div>
  );
}

export default NewRestaurantForm;
