'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, MapPin, X } from 'lucide-react';
import { UGC_CUISINES, UGC_DIETS, UGC_MEAL_TYPES } from '@/lib/utils/taxonomy';
import { COOKING_STYLES, PRICE_LEVELS } from '@/components/create/shared/TagChips';
import { FlavorSliders } from '@/components/create/shared/FlavorSliders';
import { MAX_TOUR_STOPS, MIN_TOUR_STOPS } from '@/lib/services/videoPostService';
import type { PostPlace } from '@/lib/services/postService';
import type { TourStop } from '@/lib/types/foodCard';
import { ChipField } from './ChipField';
import { LocationStep } from './LocationStep';
import type { PostFields } from './types';

// Food tour video (2c; client, 2026-10-16: "several stops"; docs/VIDEO_URL_PLAN.md):
// 2-10 stops, each a place (Scout search / near me / pin) and optionally the
// dish there, in order; then an optional tour name, cuisine, meal type,
// dietary, price, cooking style and an optional flavour meter.

interface TourDetailsProps {
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

const samePlace = (s: TourStop, p: PostPlace) => (s.placeId && p.placeId ? s.placeId === p.placeId : s.lat === p.lat && s.lng === p.lng);

export function TourDetails({ fields, onChange }: TourDetailsProps) {
  const stops = fields.stops;
  // A fresh place search after each stop is added.
  const [searchKey, setSearchKey] = useState(0);
  const [flavourOpen, setFlavourOpen] = useState(false);
  const setTags = (key: 'cuisine' | 'meal_type' | 'diet' | 'cooking_style', value: string[]) => onChange({ tags: { ...fields.tags, [key]: value } });
  const setStops = (next: TourStop[]) => onChange({ stops: next });

  // LocationStep reports a place, then (for a FUZO restaurant) the same place again with its FUZO link.
  const addStop = (place: PostPlace | null) => {
    if (!place) return;
    const existing = stops.findIndex((s) => samePlace(s, place));
    const stop: TourStop = {
      name: place.name || place.address || 'Pinned spot',
      address: place.address ?? null,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId ?? null,
      restaurantId: place.restaurantId ?? null,
      communityPlaceId: place.communityPlaceId ?? null,
      dish: existing >= 0 ? stops[existing].dish ?? null : null,
    };
    if (existing >= 0) {
      setStops(stops.map((s, i) => (i === existing ? stop : s)));
      return;
    }
    if (stops.length >= MAX_TOUR_STOPS) return;
    setStops([...stops, stop]);
    setSearchKey((k) => k + 1);
  };

  const move = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= stops.length) return;
    const next = [...stops];
    [next[i], next[j]] = [next[j], next[i]];
    setStops(next);
  };

  return (
    <div className="cf-form">
      <p className="cf-note">
        <span>Add each place in the order you visited. Soon FUZO&apos;s AI will find the stops in your video for you.</span>
      </p>

      <section className="cf-field" aria-labelledby="cf-tour-stops">
        <h3 id="cf-tour-stops" className="cf-field__label">
          Stops <span className="cf-field__req" aria-hidden="true">*</span>{' '}
          <span className="cf-field__opt">
            {stops.length} of {MAX_TOUR_STOPS}
            {stops.length < MIN_TOUR_STOPS ? ` · at least ${MIN_TOUR_STOPS}` : ''}
          </span>
        </h3>
        {stops.length > 0 && (
          <ol className="cf-stops">
            {stops.map((s, i) => (
              <li key={`${s.placeId ?? ''}-${s.lat}-${s.lng}`} className="cf-stop">
                <span className="cf-stop__num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="cf-stop__body">
                  <p className="cf-stop__name">
                    <MapPin size={14} aria-hidden="true" />
                    {s.name}
                    {s.restaurantId && <span className="cf-place__fuzo">On FUZO</span>}
                  </p>
                  {s.address && s.address !== s.name && <p className="cf-stop__addr">{s.address}</p>}
                  <input
                    className="cf-input cf-stop__dish"
                    value={s.dish ?? ''}
                    onChange={(e) => setStops(stops.map((x, k) => (k === i ? { ...x, dish: e.target.value } : x)))}
                    placeholder="What did you have? (optional)"
                    maxLength={120}
                    aria-label={`Dish at stop ${i + 1}, ${s.name}`}
                  />
                </div>
                <span className="cf-step__tools">
                  <button type="button" className="cf-row__remove" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move stop ${i + 1} up`}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" className="cf-row__remove" onClick={() => move(i, 1)} disabled={i === stops.length - 1} aria-label={`Move stop ${i + 1} down`}>
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" className="cf-row__remove" onClick={() => setStops(stops.filter((_, k) => k !== i))} aria-label={`Remove stop ${i + 1}, ${s.name}`}>
                    <X size={15} />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {stops.length < MAX_TOUR_STOPS ? (
        <LocationStep
          key={searchKey}
          value={null}
          onChange={addStop}
          label={stops.length ? `Add stop ${stops.length + 1}` : 'First stop'}
          required={false}
        />
      ) : (
        <p className="cf-field__hint">That&apos;s the most stops a tour can have.</p>
      )}

      <section className="cf-field">
        <label htmlFor="cf-tour-name" className="cf-field__label">
          Tour name <span className="cf-field__opt">(optional)</span>
        </label>
        <input
          id="cf-tour-name"
          className="cf-input"
          value={fields.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={stops.length ? `Food tour: ${stops.slice(0, 2).map((s) => s.name).join(', ')}` : 'e.g. Old Delhi street food'}
          maxLength={120}
        />
      </section>

      <ChipField
        label="Cuisine"
        options={UGC_CUISINES.filter((c) => c !== 'Custom')}
        selected={fields.tags.cuisine}
        onChange={(v) => setTags('cuisine', v)}
        allowCustom
        customPlaceholder="Another cuisine"
        maxCustomLength={30}
      />
      <ChipField label="Meal type" options={UGC_MEAL_TYPES} selected={fields.tags.meal_type} onChange={(v) => setTags('meal_type', v)} />
      <ChipField label="Dietary" options={UGC_DIETS} selected={fields.tags.diet} onChange={(v) => setTags('diet', v)} />

      <section className="cf-field" aria-labelledby="cf-tour-price">
        <h3 id="cf-tour-price" className="cf-field__label">Price level</h3>
        <div className="studio-tag-options" role="radiogroup" aria-labelledby="cf-tour-price">
          {PRICE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={fields.tags.price_level === level}
              className={`studio-tag-chip${fields.tags.price_level === level ? ' is-selected' : ''}`}
              onClick={() => onChange({ tags: { ...fields.tags, price_level: fields.tags.price_level === level ? null : level } })}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <ChipField label="Cooking style" options={COOKING_STYLES} selected={fields.tags.cooking_style} onChange={(v) => setTags('cooking_style', v)} />

      <section className="cf-field">
        <button type="button" className="cf-fold" aria-expanded={flavourOpen} aria-controls="cf-tour-flavour" onClick={() => setFlavourOpen((o) => !o)}>
          <span>
            Flavour DNA <span className="cf-field__opt">(optional)</span>
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        {flavourOpen && (
          <div id="cf-tour-flavour">
            <p className="cf-field__hint">How did the tour taste overall? 0 = not at all, 5 = very.</p>
            <FlavorSliders value={fields.flavorProfile} onChange={(flavorProfile) => onChange({ flavorProfile })} />
          </div>
        )}
      </section>

      <section className="cf-field">
        <label htmlFor="cf-tour-caption" className="cf-field__label">Caption</label>
        <textarea
          id="cf-tour-caption"
          className="cf-textarea"
          value={fields.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Best bite of the day? (optional)"
          maxLength={500}
          rows={3}
        />
      </section>
    </div>
  );
}

export default TourDetails;
