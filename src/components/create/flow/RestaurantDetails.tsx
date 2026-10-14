'use client';

import { useEffect, useState } from 'react';
import { Info, MapPinPlus, Store } from 'lucide-react';
import { RESTAURANT_LABELS } from '@/lib/services/postService';
import { emptyNewPlace, type PlaceDuplicate } from '@/lib/services/communityPlacesService';
import { readExifGps, type GpsPoint } from '@/lib/utils/exifGps';
import { ChipField } from './ChipField';
import { LocationStep } from './LocationStep';
import { NewRestaurantForm } from './NewRestaurantForm';
import { placeFromDuplicate } from './placeFromDuplicate';
import type { CreatePhoto, PostFields } from './types';

// Restaurant post details (client, 2026-10-14; plan, Phases 6-7):
// - On the map: pick the restaurant (Scout search, places near you, or where
//   the photo was taken). The photos go to its gallery on FUZO (its owner can
//   remove them), and posting from there counts a visit.
// - Add new: a restaurant that isn't on the map yet (NewRestaurantForm). It
//   shows on Scout as "Community Added" until the community votes on it.
// Then an optional caption and tags.

interface RestaurantDetailsProps {
  photos: CreatePhoto[];
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

export function RestaurantDetails({ photos, fields, onChange }: RestaurantDetailsProps) {
  const [photoSpot, setPhotoSpot] = useState<GpsPoint | null>(null);
  const adding = !!fields.newPlace;

  // The first gallery photo that knows where it was taken.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const p of photos) {
        if (p.source !== 'gallery' || !p.file) continue;
        const gps = await readExifGps(p.file);
        if (gps) {
          if (!cancelled) setPhotoSpot(gps);
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  const useExisting = async (d: PlaceDuplicate) => {
    onChange({ newPlace: null, place: await placeFromDuplicate(d) });
  };

  return (
    <div className="cf-form">
      <section className="cf-field" aria-labelledby="cf-rest-mode">
        <h3 id="cf-rest-mode" className="cf-field__label">Is it on the map?</h3>
        <div className="cf-toggle" role="radiogroup" aria-labelledby="cf-rest-mode">
          <button type="button" role="radio" aria-checked={!adding} className={`cf-toggle__opt${!adding ? ' is-on' : ''}`} onClick={() => onChange({ newPlace: null })}>
            <Store size={18} aria-hidden="true" /> Find it
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={adding}
            className={`cf-toggle__opt${adding ? ' is-on' : ''}`}
            onClick={() => !adding && onChange({ newPlace: emptyNewPlace(), place: null })}
          >
            <MapPinPlus size={18} aria-hidden="true" /> Add a new one
          </button>
        </div>
      </section>

      {fields.newPlace ? (
        <NewRestaurantForm
          value={fields.newPlace}
          onChange={(patch) => onChange({ newPlace: { ...fields.newPlace!, ...patch } })}
          photoSpot={photoSpot}
          onUseExisting={useExisting}
        />
      ) : (
        <LocationStep
          value={fields.place}
          onChange={(place) => onChange({ place })}
          label="Which restaurant?"
          photoSpot={photoSpot}
          allowPin={false}
        />
      )}

      <p className="cf-note">
        <Info size={16} aria-hidden="true" />
        <span>
          {adding
            ? "New places show on the map as Community Added. Once 100 people vote, 2 in 3 saying it's real makes it Verified."
            : "Your photos show in the restaurant's gallery on FUZO. Posting while you're there counts as a visit."}
        </span>
      </p>

      <ChipField
        label="Tags"
        hint="Optional - help others find it."
        options={RESTAURANT_LABELS}
        selected={fields.labels}
        onChange={(labels) => onChange({ labels })}
        allowCustom
        customPlaceholder="Add your own tag"
        maxCustomLength={30}
      />

      <section className="cf-field">
        <label htmlFor="cf-restaurant-caption" className="cf-field__label">Caption</label>
        <textarea
          id="cf-restaurant-caption"
          className="cf-textarea"
          value={fields.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="What's it like? (optional)"
          maxLength={500}
          rows={3}
        />
      </section>
    </div>
  );
}

export default RestaurantDetails;
