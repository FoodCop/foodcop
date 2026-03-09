const normalizeTokens = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
};

export const buildTrimQueries = (params: {
  location?: string;
  cuisine?: string;
  diet?: string;
}) => {
  const location = (params.location || '').trim().toLowerCase();
  const cuisines = normalizeTokens(params.cuisine);
  const diets = normalizeTokens(params.diet);

  const cuisinePrimary = cuisines[0] || 'local';
  const dietPrimary = diets[0] || '';

  const raw = [
    `${location || 'local'} ${cuisinePrimary} street food shorts`,
    `${location || 'local'} ${dietPrimary} cooking recipes shorts`,
    `${cuisinePrimary} chef techniques shorts`,
  ];

  return Array.from(new Set(raw.map((query) => query.replace(/\s+/g, ' ').trim()))).slice(0, 3);
};
