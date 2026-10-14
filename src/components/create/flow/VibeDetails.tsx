'use client';

import { BUSINESS_IDENTITY } from '@/lib/onboarding/data';
import { UGC_DIETS, UGC_MEAL_TYPES } from '@/lib/utils/taxonomy';
import { ChipField } from './ChipField';
import { LocationStep } from './LocationStep';
import type { PostFields } from './types';

// Vibe post details (client, 2026-10-14; plan, Phase 3): location (search or
// pin), Meal type*, Dietary*, Business identity* (several, or the user's
// own), and an optional caption.

interface VibeDetailsProps {
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
}

export function VibeDetails({ fields, onChange }: VibeDetailsProps) {
  const setTags = (key: 'meal_type' | 'diet', value: string[]) => onChange({ tags: { ...fields.tags, [key]: value } });

  return (
    <div className="cf-form">
      <LocationStep value={fields.place} onChange={(place) => onChange({ place })} label="Where was this?" />

      <ChipField label="Meal type" required options={UGC_MEAL_TYPES} selected={fields.tags.meal_type} onChange={(v) => setTags('meal_type', v)} />

      <ChipField label="Dietary" required options={UGC_DIETS} selected={fields.tags.diet} onChange={(v) => setTags('diet', v)} />

      <ChipField
        label="Business identity"
        required
        hint="What's the place like? Pick all that fit."
        options={BUSINESS_IDENTITY}
        selected={fields.businessIdentity}
        onChange={(businessIdentity) => onChange({ businessIdentity })}
        allowCustom
        customPlaceholder="Add your own, e.g. Rooftop"
      />

      <section className="cf-field">
        <label htmlFor="cf-vibe-caption" className="cf-field__label">Caption</label>
        <textarea
          id="cf-vibe-caption"
          className="cf-textarea"
          value={fields.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Say something about the moment (optional)"
          maxLength={500}
          rows={3}
        />
      </section>
    </div>
  );
}

export default VibeDetails;
