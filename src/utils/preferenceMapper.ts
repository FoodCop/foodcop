/**
 * Maps user dietary preferences to Spoonacular API diet parameter
 * Spoonacular accepts: vegetarian, vegan, pescetarian, ketogenic, paleo, primal, whole30
 */
export function mapDietaryPreferenceToSpoonacular(preference: string): string | null {
  const mapping: Record<string, string> = {
    'vegetarian': 'vegetarian',
    'vegan': 'vegan',
    'pescetarian': 'pescetarian',
    'ketogenic': 'ketogenic',
    'keto': 'ketogenic',
    'paleo': 'paleo',
    'gluten-free': 'gluten free',
    'gluten free': 'gluten free',
    'dairy-free': 'dairy free',
    'dairy free': 'dairy free',
    'no restrictions': null, // Will be filtered out
  };

  const normalized = preference.toLowerCase().trim();
  return mapping[normalized] || null;
}

/**
 * Get the primary diet parameter for Spoonacular API
 * If user has multiple preferences, use the first valid one
 * Returns null if no valid preferences (show all)
 */
export function getSpoonacularDietParam(preferences: string[]): string | undefined {
  if (!preferences || preferences.length === 0) {
    return undefined; // No filter - show all
  }

  // Filter out "no restrictions" and map to Spoonacular format
  const validPreferences = preferences
    .map(mapDietaryPreferenceToSpoonacular)
    .filter((p): p is string => p !== null);

  // Return first valid preference (Spoonacular API typically accepts one diet parameter)
  return validPreferences[0] || undefined;
}

/**
 * Shuffle array using crypto.getRandomValues for better randomness
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  const randomValues = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomValues);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Check if recipes have been shuffled in this session
 */
export function hasRecipesBeenShuffled(): boolean {
  return sessionStorage.getItem('recipes_shuffled') === 'true';
}

/**
 * Mark recipes as shuffled for this session
 */
export function markRecipesAsShuffled(): void {
  sessionStorage.setItem('recipes_shuffled', 'true');
}

