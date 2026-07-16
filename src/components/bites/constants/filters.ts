// Filter chip definitions, matched against the actual diets/cuisines values
// found in public/data/curatedRecipes.json (checked directly - e.g. diets
// mixes casing like "Gluten free" and "Gluten Free", and both "Vegetarian"
// and "Lacto ovo vegetarian" appear for the same intent), so each filter
// matches a small synonym set case-insensitively rather than one exact string.

export type BiteFilter = { label: string; match: string[] };

export const BITE_DIET_FILTERS: BiteFilter[] = [
  { label: 'Vegetarian', match: ['vegetarian', 'lacto ovo vegetarian'] },
  { label: 'Vegan', match: ['vegan'] },
  { label: 'Gluten Free', match: ['gluten free'] },
  { label: 'Dairy Free', match: ['dairy free'] },
  { label: 'Paleo', match: ['paleo', 'paleolithic', 'primal'] },
  { label: 'Whole30', match: ['whole 30'] },
  { label: 'Pescatarian', match: ['pescatarian'] },
  { label: 'Ketogenic', match: ['ketogenic'] },
];

export const BITE_CUISINE_FILTERS: BiteFilter[] = [
  { label: 'European', match: ['european'] },
  { label: 'Mediterranean', match: ['mediterranean'] },
  { label: 'Asian', match: ['asian'] },
  { label: 'Italian', match: ['italian'] },
  { label: 'American', match: ['american'] },
  { label: 'Mexican', match: ['mexican'] },
  { label: 'Indian', match: ['indian'] },
  { label: 'French', match: ['french'] },
  { label: 'Japanese', match: ['japanese'] },
  { label: 'Thai', match: ['thai'] },
  { label: 'Greek', match: ['greek'] },
];

export function matchesFilter(tags: string[] | undefined, filter: BiteFilter): boolean {
  if (!tags || tags.length === 0) return false;
  const lower = tags.map((t) => t.toLowerCase());
  return filter.match.some((m) => lower.includes(m));
}
