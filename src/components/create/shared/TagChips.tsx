import React from 'react';
import { UGC_CUISINES, UGC_DIETS, UGC_MEAL_TYPES, UGC_FOOD_CATEGORIES, UGC_VIBES } from '@/lib/utils/taxonomy';
import type { CardTags } from '@/lib/types/foodCard';

// Small literal lists for the two CardTags categories that don't have a
// taxonomy.ts source yet (cooking_style, season) - mirrors fuzo-food-card-demo.html's
// hardcoded TAG_DATA.COOKING_STYLE / TAG_DATA.SEASON, the concrete reference
// this whole tagging shape is modeled on.
const COOKING_STYLES = ['Grilled', 'Roasted', 'Fried', 'Steamed', 'Smoked', 'Baked'];
const SEASONS = ['Summer', 'Winter', 'Festival', 'Holiday'];
const PRICE_LEVELS = ['$', '$$', '$$$', '$$$$'];

type MultiCategory = 'cuisine' | 'food_type' | 'meal_type' | 'cooking_style' | 'diet' | 'occasion' | 'season';

const CATEGORY_CONFIG: Record<MultiCategory, { label: string; options: readonly string[] }> = {
  cuisine: { label: 'Cuisine', options: UGC_CUISINES },
  food_type: { label: 'Food Type', options: UGC_FOOD_CATEGORIES },
  meal_type: { label: 'Meal Type', options: UGC_MEAL_TYPES },
  cooking_style: { label: 'Cooking Style', options: COOKING_STYLES },
  diet: { label: 'Dietary', options: UGC_DIETS },
  occasion: { label: 'Occasion', options: UGC_VIBES },
  season: { label: 'Season', options: SEASONS },
};

interface TagChipsProps {
  value: CardTags;
  onChange: (next: CardTags) => void;
  categories?: MultiCategory[];
  showPriceLevel?: boolean;
}

const DEFAULT_CATEGORIES: MultiCategory[] = ['cuisine', 'meal_type', 'diet'];

// Shared categorized tag picker, used by every Create Card studio's Review
// step. Writes into the CardTags shape (fuzo-recommendation-engine-solution.md
// §1) rather than a flat string[], so the matcher can weight cuisine vs diet
// separately later. Also embedded inside ScoutAddPinModal's Flavor & Tags step.
export const TagChips: React.FC<TagChipsProps> = ({ value, onChange, categories = DEFAULT_CATEGORIES, showPriceLevel = false }) => {
  const toggle = (category: MultiCategory, option: string) => {
    const current = value[category];
    const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
    onChange({ ...value, [category]: next });
  };

  return (
    <div className="studio-tag-groups">
      {categories.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const selected = value[category];
        return (
          <div key={category} className="studio-tag-section">
            <span className="studio-tag-section__label">{config.label}</span>
            <div className="studio-tag-options">
              {config.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(category, option)}
                  className={`studio-tag-chip${selected.includes(option) ? ' is-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {showPriceLevel && (
        <div className="studio-tag-section">
          <span className="studio-tag-section__label">Price Level</span>
          <div className="studio-tag-options">
            {PRICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ ...value, price_level: value.price_level === level ? null : level })}
                className={`studio-tag-chip${value.price_level === level ? ' is-selected' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagChips;
