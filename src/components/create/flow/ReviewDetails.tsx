'use client';

import { UGC_CUISINES, UGC_DIETS, UGC_MEAL_TYPES } from '@/lib/utils/taxonomy';
import { COOKING_STYLES, PRICE_LEVELS } from '@/components/create/shared/TagChips';
import { FlavorSliders } from '@/components/create/shared/FlavorSliders';
import { ChipField } from './ChipField';
import { FoodNameField } from './FoodNameField';
import { LocationStep } from './LocationStep';
import type { PostFields } from './types';

// Food review video (2b; client, 2026-10-16; docs/VIDEO_URL_PLAN.md): where
// it was* and the food name* (from the restaurant's FUZO menu when it has
// one), then cuisine, meal type, dietary, price, cooking style and the
// flavour meter. Posting from the place counts a visit (like photo posts).

interface ReviewDetailsProps {
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

export function ReviewDetails({ fields, onChange }: ReviewDetailsProps) {
  const setTags = (key: 'cuisine' | 'meal_type' | 'diet' | 'cooking_style', value: string[]) => onChange({ tags: { ...fields.tags, [key]: value } });

  return (
    <div className="cf-form">
      <p className="cf-note">
        <span>Tell people where this was and what you had.</span>
      </p>

      <LocationStep value={fields.place} onChange={(place) => onChange({ place, menuItemId: null })} label="Where was this?" />

      <FoodNameField
        id="cf-review-food"
        restaurantId={fields.place?.restaurantId ?? null}
        restaurantName={fields.place?.name}
        title={fields.title}
        menuItemId={fields.menuItemId}
        onChange={(patch) => onChange(patch)}
      />

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

      <section className="cf-field" aria-labelledby="cf-review-price">
        <h3 id="cf-review-price" className="cf-field__label">Price level</h3>
        <div className="studio-tag-options" role="radiogroup" aria-labelledby="cf-review-price">
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

      <section className="cf-field" aria-labelledby="cf-review-flavour">
        <h3 id="cf-review-flavour" className="cf-field__label">Flavour DNA</h3>
        <p className="cf-field__hint">How did it taste? 0 = not at all, 5 = very.</p>
        <FlavorSliders value={fields.flavorProfile} onChange={(flavorProfile) => onChange({ flavorProfile })} />
      </section>

      <section className="cf-field">
        <label htmlFor="cf-review-caption" className="cf-field__label">Caption</label>
        <textarea
          id="cf-review-caption"
          className="cf-textarea"
          value={fields.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Worth it? Tell people (optional)"
          maxLength={500}
          rows={3}
        />
      </section>
    </div>
  );
}

export default ReviewDetails;
