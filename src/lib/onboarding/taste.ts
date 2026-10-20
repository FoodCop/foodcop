// The food-profile options (I-05A, client spec v1), from FUZO's own lists so
// what people pick matches how posts are tagged:
// - flavours: the 10 Flavour DNA axes every post is rated on (FLAVOR_AXES,
//   the same list as the client's mock);
// - cuisines / diets: the shared taxonomy (src/lib/data/fuzoTaxonomy.json).
// Settings -> Taste preferences uses the same lists.

import { FLAVOR_AXES } from '@/lib/types/foodCard';
import { UGC_CUISINES, UGC_DIETS } from '@/lib/utils/taxonomy';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const TASTE_FLAVOURS: readonly string[] = FLAVOR_AXES.map(title);
export const TASTE_CUISINES: readonly string[] = UGC_CUISINES.filter((c) => c !== 'Custom');
export const NO_RESTRICTIONS = 'No Restrictions';
export const TASTE_DIETS: readonly string[] = [NO_RESTRICTIONS, ...UGC_DIETS];

export const MAX_FLAVOURS = 5;
export const MAX_CUISINES = 10;

/** "No restrictions" can't be combined with a diet. */
export function toggleDiet(current: string[], value: string): string[] {
  if (current.includes(value)) return current.filter((v) => v !== value);
  if (value === NO_RESTRICTIONS) return [NO_RESTRICTIONS];
  return [...current.filter((v) => v !== NO_RESTRICTIONS), value];
}
