import { FLAVORS, CUISINES, DIETARY } from '@/lib/onboarding/data';

export type TasteField = 'flavors' | 'cuisines' | 'dietary';

export const TASTE_FIELD_CONFIG: Record<TasteField, { title: string; emoji: string; options: readonly string[] }> = {
  flavors: { title: 'Flavor Profile', emoji: '🌶️', options: FLAVORS },
  cuisines: { title: 'Cuisine Preferences', emoji: '🌍', options: CUISINES },
  dietary: { title: 'Dietary Preferences', emoji: '🥗', options: DIETARY },
};

export const summarize = (values: string[], emptyText: string) => {
  if (values.length === 0) return emptyText;
  if (values.length <= 3) return values.join(' · ');
  return `${values.slice(0, 3).join(', ')} +${values.length - 3} more`;
};
