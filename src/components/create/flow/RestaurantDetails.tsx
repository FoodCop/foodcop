'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { RESTAURANT_LABELS } from '@/lib/services/postService';
import { readExifGps, type GpsPoint } from '@/lib/utils/exifGps';
import { ChipField } from './ChipField';
import { LocationStep } from './LocationStep';
import type { CreatePhoto, PostFields } from './types';

// Restaurant post details (client, 2026-10-14; plan, Phase 6): pick the
// restaurant (Scout search, places near you, or where the photo was taken),
// then an optional caption and tags. The photos go to that restaurant's
// gallery on FUZO (its owner can remove them), and posting from there counts
// a visit. Restaurants that aren't listed yet come in Phase 7.

interface RestaurantDetailsProps {
  photos: CreatePhoto[];
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

export function RestaurantDetails({ photos, fields, onChange }: RestaurantDetailsProps) {
  const [photoSpot, setPhotoSpot] = useState<GpsPoint | null>(null);

  // The first gallery photo that knows where it was taken.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const p of photos) {
        if (p.source !== 'gallery') continue;
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

  return (
    <div className="cf-form">
      <LocationStep
        value={fields.place}
        onChange={(place) => onChange({ place })}
        label="Which restaurant?"
        photoSpot={photoSpot}
        allowPin={false}
      />

      <p className="cf-note">
        <Info size={16} aria-hidden="true" />
        <span>
          Your photos show in the restaurant&apos;s gallery on FUZO. Posting while you&apos;re there counts as a visit.
          Can&apos;t find it? Adding new restaurants is coming soon.
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
