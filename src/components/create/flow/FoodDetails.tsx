'use client';

import { useEffect, useState } from 'react';
import { Home, Store } from 'lucide-react';
import { RestaurantService, type MenuItem } from '@/lib/services/restaurantService';
import { SUGGESTED_LABELS } from '@/lib/services/postService';
import { UGC_DIETS, UGC_MEAL_TYPES } from '@/lib/utils/taxonomy';
import { readExifGps, type GpsPoint } from '@/lib/utils/exifGps';
import { COOKING_STYLES, PRICE_LEVELS } from '@/components/create/shared/TagChips';
import { FlavorSliders } from '@/components/create/shared/FlavorSliders';
import { ChipField } from './ChipField';
import { LocationStep } from './LocationStep';
import type { CreatePhoto, PostFields } from './types';

// Food post details (client, 2026-10-14; plan, Phase 4):
// 1. At a place or At home. A place = restaurant & location; for gallery
//    photos the photo's own GPS (EXIF) suggests the places there first.
// 2. Food name: picked from the restaurant's FUZO menu when it has one,
//    otherwise typed in (always typed in at home).
// 3. Meal type, Dietary, Price level (not at home), Cooking style, Flavour.
// 4. Tags: Must-Try Dish, Must-Try Spot, Weird Combo, Kitchen Trick, or own.

interface FoodDetailsProps {
  photos: CreatePhoto[];
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

export function FoodDetails({ photos, fields, onChange }: FoodDetailsProps) {
  const [photoSpot, setPhotoSpot] = useState<GpsPoint | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const restaurantId = fields.isHome ? null : fields.place?.restaurantId ?? null;

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

  // The restaurant's FUZO menu, if the place is a FUZO restaurant.
  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    RestaurantService.listMenu(restaurantId).then((res) => {
      if (!cancelled) setMenu(res.success ? (res.data ?? []).filter((m) => m.is_available) : []);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);
  const menuItems = restaurantId ? menu : [];

  const setTags = (key: 'meal_type' | 'diet' | 'cooking_style', value: string[]) =>
    onChange({ tags: { ...fields.tags, [key]: value } });

  const setHome = (isHome: boolean) =>
    onChange({ isHome, place: isHome ? null : fields.place, menuItemId: null, tags: { ...fields.tags, price_level: isHome ? null : fields.tags.price_level } });

  return (
    <div className="cf-form">
      <section className="cf-field" aria-labelledby="cf-food-where">
        <h3 id="cf-food-where" className="cf-field__label">Where did you have it?</h3>
        <div className="cf-toggle" role="radiogroup" aria-labelledby="cf-food-where">
          <button type="button" role="radio" aria-checked={!fields.isHome} className={`cf-toggle__opt${!fields.isHome ? ' is-on' : ''}`} onClick={() => setHome(false)}>
            <Store size={18} aria-hidden="true" /> At a place
          </button>
          <button type="button" role="radio" aria-checked={fields.isHome} className={`cf-toggle__opt${fields.isHome ? ' is-on' : ''}`} onClick={() => setHome(true)}>
            <Home size={18} aria-hidden="true" /> At home
          </button>
        </div>
      </section>

      {!fields.isHome && (
        <LocationStep
          value={fields.place}
          onChange={(place) => onChange({ place, menuItemId: null })}
          label="Restaurant & location"
          photoSpot={photoSpot}
        />
      )}

      <section className="cf-field" aria-labelledby="cf-food-name">
        <h3 id="cf-food-name" className="cf-field__label">
          Food name <span className="cf-field__req" aria-hidden="true">*</span>
        </h3>
        {menuItems.length > 0 && (
          <>
            <p className="cf-field__hint">Pick it from {fields.place?.name ?? 'the'} menu, or type it below.</p>
            <div className="studio-tag-options" role="group" aria-label="Menu dishes">
              {menuItems.slice(0, 30).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`studio-tag-chip${fields.menuItemId === m.id ? ' is-selected' : ''}`}
                  aria-pressed={fields.menuItemId === m.id}
                  onClick={() =>
                    fields.menuItemId === m.id
                      ? onChange({ menuItemId: null, title: '' })
                      : onChange({ menuItemId: m.id, title: m.name })
                  }
                >
                  {m.name}
                </button>
              ))}
            </div>
          </>
        )}
        <input
          className="cf-input"
          value={fields.title}
          onChange={(e) => onChange({ title: e.target.value, menuItemId: null })}
          placeholder={menuItems.length ? 'Or type another dish' : 'e.g. Butter chicken'}
          maxLength={120}
          aria-label="Food name"
        />
      </section>

      <ChipField label="Meal type" options={UGC_MEAL_TYPES} selected={fields.tags.meal_type} onChange={(v) => setTags('meal_type', v)} />
      <ChipField label="Dietary" options={UGC_DIETS} selected={fields.tags.diet} onChange={(v) => setTags('diet', v)} />

      {!fields.isHome && (
        <section className="cf-field" aria-labelledby="cf-food-price">
          <h3 id="cf-food-price" className="cf-field__label">Price level</h3>
          <div className="studio-tag-options" role="radiogroup" aria-labelledby="cf-food-price">
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
      )}

      <ChipField label="Cooking style" options={COOKING_STYLES} selected={fields.tags.cooking_style} onChange={(v) => setTags('cooking_style', v)} />

      <section className="cf-field" aria-labelledby="cf-food-flavour">
        <h3 id="cf-food-flavour" className="cf-field__label">Flavour DNA</h3>
        <p className="cf-field__hint">How did it taste? 0 = not at all, 5 = very.</p>
        <FlavorSliders value={fields.flavorProfile} onChange={(flavorProfile) => onChange({ flavorProfile })} />
      </section>

      <ChipField
        label="Tags"
        hint="Optional - help others find it."
        options={SUGGESTED_LABELS}
        selected={fields.labels}
        onChange={(labels) => onChange({ labels })}
        allowCustom
        customPlaceholder="Add your own tag"
        maxCustomLength={30}
      />

      <section className="cf-field">
        <label htmlFor="cf-food-caption" className="cf-field__label">Caption</label>
        <textarea
          id="cf-food-caption"
          className="cf-textarea"
          value={fields.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="What made it good? (optional)"
          maxLength={500}
          rows={3}
        />
      </section>
    </div>
  );
}

export default FoodDetails;
