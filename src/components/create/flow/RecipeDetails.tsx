'use client';

import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { UGC_CUISINES, UGC_DIETS, UGC_MEAL_TYPES } from '@/lib/utils/taxonomy';
import { COOKING_STYLES } from '@/components/create/shared/TagChips';
import { FlavorSliders } from '@/components/create/shared/FlavorSliders';
import { ChipField } from './ChipField';
import type { PostFields } from './types';

// Recipe post details (client, 2026-10-14; plan, Phase 5): Food name*,
// Cuisine*, Ingredients* (name, quantity, unit), Preparation steps*, then
// Meal type, Dietary, Cooking style and the Flavour meter. No location.
// Published recipes appear in the Feed, Bites and Profile -> Recipes.
// variant="video" is the recipe video (2a, client 2026-10-16): the video
// shows the cooking, so cuisine and steps are optional there.

interface RecipeDetailsProps {
  fields: PostFields;
  onChange: (patch: Partial<PostFields>) => void;
  variant?: 'photo' | 'video';
}

const MAX_INGREDIENTS = 40;
const MAX_STEPS = 30;

export function RecipeDetails({ fields, onChange, variant = 'photo' }: RecipeDetailsProps) {
  const isVideo = variant === 'video';
  // Always show at least one empty row to type into.
  const ingredients: [string, string, string][] = fields.ingredients.length ? fields.ingredients : [['', '', '']];
  const steps = fields.steps.length ? fields.steps : [''];

  const setTags = (key: 'cuisine' | 'meal_type' | 'diet' | 'cooking_style', value: string[]) =>
    onChange({ tags: { ...fields.tags, [key]: value } });

  const setIngredient = (i: number, part: 0 | 1 | 2, value: string) => {
    const next = ingredients.map((row) => [...row] as [string, string, string]);
    next[i][part] = value;
    onChange({ ingredients: next });
  };
  const addIngredient = () => onChange({ ingredients: [...ingredients, ['', '', ''] as [string, string, string]].slice(0, MAX_INGREDIENTS) });
  const removeIngredient = (i: number) => onChange({ ingredients: ingredients.filter((_, j) => j !== i) });

  const setStep = (i: number, value: string) => onChange({ steps: steps.map((s, j) => (j === i ? value : s)) });
  const addStep = () => onChange({ steps: [...steps, ''].slice(0, MAX_STEPS) });
  const removeStep = (i: number) => onChange({ steps: steps.filter((_, j) => j !== i) });
  const moveStep = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ steps: next });
  };

  return (
    <div className="cf-form">
      {isVideo && (
        <p className="cf-note">
          <span>Add the dish and what goes in it - your video shows how. Soon FUZO&apos;s AI will fill this in from your video for you.</span>
        </p>
      )}
      <section className="cf-field">
        <label htmlFor="cf-recipe-name" className="cf-field__label">
          Food name <span className="cf-field__req" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-recipe-name"
          className="cf-input"
          value={fields.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Grandma's dal makhani"
          maxLength={120}
        />
      </section>

      <ChipField
        label="Cuisine"
        required={!isVideo}
        options={UGC_CUISINES.filter((c) => c !== 'Custom')}
        selected={fields.tags.cuisine}
        onChange={(v) => setTags('cuisine', v)}
        allowCustom
        customPlaceholder="Another cuisine"
        maxCustomLength={30}
      />

      <section className="cf-field" aria-labelledby="cf-recipe-ingredients">
        <h3 id="cf-recipe-ingredients" className="cf-field__label">
          Ingredients <span className="cf-field__req" aria-hidden="true">*</span>
        </h3>
        <ul className="cf-rows">
          {ingredients.map((row, i) => (
            <li key={i} className="cf-ingredient">
              <input
                className="cf-input cf-ingredient__name"
                value={row[0]}
                onChange={(e) => setIngredient(i, 0, e.target.value)}
                placeholder="Basmati rice"
                maxLength={80}
                aria-label={`Ingredient ${i + 1} name`}
              />
              <input
                className="cf-input cf-ingredient__qty"
                value={row[1]}
                onChange={(e) => setIngredient(i, 1, e.target.value)}
                placeholder="2"
                inputMode="decimal"
                maxLength={12}
                aria-label={`Ingredient ${i + 1} quantity`}
              />
              <input
                className="cf-input cf-ingredient__unit"
                value={row[2]}
                onChange={(e) => setIngredient(i, 2, e.target.value)}
                placeholder="cups"
                maxLength={16}
                aria-label={`Ingredient ${i + 1} unit`}
              />
              <button
                type="button"
                className="cf-row__remove"
                onClick={() => removeIngredient(i)}
                aria-label={`Remove ingredient ${i + 1}`}
                disabled={ingredients.length === 1 && !row.some(Boolean)}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="cf-chipbtn cf-rows__add" onClick={addIngredient} disabled={ingredients.length >= MAX_INGREDIENTS}>
          <Plus size={16} /> Add ingredient
        </button>
      </section>

      <section className="cf-field" aria-labelledby="cf-recipe-steps">
        <h3 id="cf-recipe-steps" className="cf-field__label">
          Preparation steps {isVideo ? <span className="cf-field__opt">(optional)</span> : <span className="cf-field__req" aria-hidden="true">*</span>}
        </h3>
        <ol className="cf-rows">
          {steps.map((step, i) => (
            <li key={i} className="cf-step">
              <span className="cf-step__num" aria-hidden="true">{i + 1}</span>
              <textarea
                className="cf-textarea cf-step__text"
                value={step}
                onChange={(e) => setStep(i, e.target.value)}
                placeholder={i === 0 ? 'e.g. Soak the lentils overnight.' : 'Next step'}
                maxLength={600}
                rows={2}
                aria-label={`Step ${i + 1}`}
              />
              <span className="cf-step__tools">
                <button type="button" className="cf-row__remove" onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label={`Move step ${i + 1} up`}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" className="cf-row__remove" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} aria-label={`Move step ${i + 1} down`}>
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="cf-row__remove"
                  onClick={() => removeStep(i)}
                  disabled={steps.length === 1 && !step}
                  aria-label={`Remove step ${i + 1}`}
                >
                  <X size={15} />
                </button>
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className="cf-chipbtn cf-rows__add" onClick={addStep} disabled={steps.length >= MAX_STEPS}>
          <Plus size={16} /> Add step
        </button>
      </section>

      <ChipField label="Meal type" options={UGC_MEAL_TYPES} selected={fields.tags.meal_type} onChange={(v) => setTags('meal_type', v)} />
      <ChipField label="Dietary" options={UGC_DIETS} selected={fields.tags.diet} onChange={(v) => setTags('diet', v)} />
      <ChipField label="Cooking style" options={COOKING_STYLES} selected={fields.tags.cooking_style} onChange={(v) => setTags('cooking_style', v)} />

      <section className="cf-field" aria-labelledby="cf-recipe-flavour">
        <h3 id="cf-recipe-flavour" className="cf-field__label">Flavour DNA</h3>
        <p className="cf-field__hint">How does it taste? 0 = not at all, 5 = very.</p>
        <FlavorSliders value={fields.flavorProfile} onChange={(flavorProfile) => onChange({ flavorProfile })} />
      </section>

      <section className="cf-field">
        <label htmlFor="cf-recipe-caption" className="cf-field__label">About this recipe</label>
        <textarea
          id="cf-recipe-caption"
          className="cf-textarea"
          value={fields.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="A story, a tip, who it's for (optional)"
          maxLength={500}
          rows={3}
        />
      </section>
    </div>
  );
}

export default RecipeDetails;
