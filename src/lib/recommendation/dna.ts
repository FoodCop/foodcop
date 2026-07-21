// Ported verbatim from the old app's quiz.html (FUZO's real 5-module Food DNA
// quiz: MODULES data, DNA_WEIGHTS scoring table, computeDnaScores, PERSONA_MAP).
// This is FUZO's actual quiz content, not placeholder/demo copy.

export type Question =
  | { id: string; type: 'single'; text: string; options: string[]; helper?: string }
  | { id: string; type: 'multi'; text: string; options: string[]; max: number; requireExact: boolean; helper?: string }
  | { id: string; type: 'scale'; text: string; helper?: string };

export type Module = {
  id: number;
  key: 'dining' | 'discovery' | 'mood' | 'budget' | 'social';
  emoji: string;
  title: string;
  blurb: string;
  accent: string;
  accentDark: string;
  questions: Question[];
};

export const MODULES: Module[] = [
  {
    id: 1,
    key: 'dining',
    emoji: '🍽️',
    title: 'Dining Habits',
    blurb: 'Helps tailor when, where, and how you eat.',
    accent: '#FF8C69',
    accentDark: '#F06B45',
    questions: [
      { id: 'q1', type: 'single', text: 'How often do you eat out?', options: ['Daily', '3–5 times a week', '1–2 times a week', 'Few times a month', 'Rarely'] },
      { id: 'q2', type: 'single', text: 'When do you usually discover new food?', options: ['Breakfast', 'Lunch', 'Dinner', 'Late Night', 'Anytime'] },
      { id: 'q3', type: 'single', text: 'Who do you usually dine with?', options: ['Alone', 'Partner', 'Friends', 'Family', 'Colleagues'] },
      { id: 'q4', type: 'single', text: 'What type of dining do you prefer?', options: ['Takeout', 'Delivery', 'Casual Dining', 'Fine Dining', 'Mix of everything'] },
      { id: 'q5', type: 'single', text: 'How far would you travel for great food?', options: ['Under 5 km', '5-10 km', '10-25 km', '25-50 km', 'Anywhere'] },
    ],
  },
  {
    id: 2,
    key: 'discovery',
    emoji: '🌍',
    title: 'Discovery & Exploration',
    blurb: 'Feeds your Adventure Score and Exploration Score.',
    accent: '#3FB6A1',
    accentDark: '#2E9483',
    questions: [
      { id: 'q1', type: 'single', text: 'How often do you try new cuisines?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
      { id: 'q2', type: 'multi', max: 3, requireExact: true, text: 'When choosing a restaurant, what matters most?', helper: 'Pick your top 3', options: ['Reviews', 'Food Photos', 'Price', 'Distance', 'Recommendations', 'Ambience', 'Trendiness'] },
      { id: 'q3', type: 'single', text: 'Which best describes you?', options: ['I stick to favorites', 'I occasionally explore', 'I actively seek new experiences'] },
      { id: 'q4', type: 'scale', text: 'How likely are you to visit a newly opened restaurant?', helper: '1 = not likely, 5 = very likely' },
      { id: 'q5', type: 'single', text: 'What excites you most?', options: ['Authentic food', 'Hidden gems', 'Trending spots', 'Premium experiences', 'Local favorites'] },
    ],
  },
  {
    id: 3,
    key: 'mood',
    emoji: '😊',
    title: 'Mood & Cravings',
    blurb: 'Powers mood-based food insights.',
    accent: '#F2B23E',
    accentDark: '#D9961E',
    questions: [
      { id: 'q1', type: 'multi', max: 3, requireExact: false, text: 'When you’re stressed, what do you crave?', helper: 'Select up to 3', options: ['Pizza', 'Burgers', 'Ice Cream', 'Pasta', 'Fried Food', 'Desserts', 'Soup', 'Noodles'] },
      { id: 'q2', type: 'single', text: 'When celebrating, you usually choose:', options: ['Steakhouse', 'Sushi', 'Fine Dining', 'BBQ', 'Seafood', 'Family Feast'] },
      { id: 'q3', type: 'single', text: 'On a rainy day you prefer:', options: ['Comfort food', 'Hot drinks', 'Soup', 'Street food', 'Desserts'] },
      { id: 'q4', type: 'single', text: 'Your ideal weekend food adventure:', options: ['Food truck', 'Hidden cafe', 'Fine dining', 'Ethnic cuisine', 'Local market'] },
      { id: 'q5', type: 'single', text: 'If you could eat one category forever:', options: ['Pizza', 'Burgers', 'Asian', 'Indian', 'Mediterranean', 'Desserts'] },
    ],
  },
  {
    id: 4,
    key: 'budget',
    emoji: '💰',
    title: 'Budget & Experience',
    blurb: 'Feeds your Luxury Score and Value Score.',
    accent: '#B07FD4',
    accentDark: '#9560BC',
    questions: [
      { id: 'q1', type: 'single', text: 'Typical spend per meal?', options: ['Under $15', '$15–30', '$30–50', '$50–100', '$100+'] },
      { id: 'q2', type: 'single', text: 'What’s more important?', options: ['Price', 'Food Quality', 'Ambience', 'Service'] },
      { id: 'q3', type: 'single', text: 'How often do you visit premium restaurants?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { id: 'q4', type: 'single', text: 'Which dining experience appeals most?', options: ['Quick bites', 'Casual', 'Trendy spots', 'Fine dining', 'Chef experiences'] },
      { id: 'q5', type: 'single', text: 'What would you spend extra on?', options: ['Better ingredients', 'Better ambience', 'Better service', 'Exclusive dishes'] },
    ],
  },
  {
    id: 5,
    key: 'social',
    emoji: '👥',
    title: 'Social Food Profile',
    blurb: 'Feeds your Social Score.',
    accent: '#F0739B',
    accentDark: '#D8537E',
    questions: [
      { id: 'q1', type: 'single', text: 'Eating food is primarily:', options: ['Necessity', 'Hobby', 'Social activity', 'Passion'] },
      { id: 'q2', type: 'single', text: 'How often do you share food photos?', options: ['Never', 'Occasionally', 'Often', 'Always'] },
      { id: 'q3', type: 'single', text: 'Do you enjoy recommending food to others?', options: ['No', 'Sometimes', 'Often', 'Absolutely'] },
      { id: 'q4', type: 'single', text: 'What best describes you?', options: ['Quiet eater', 'Food enthusiast', 'Local guide', 'Food influencer'] },
      { id: 'q5', type: 'single', text: 'Do you like organizing food outings?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
    ],
  },
];

export type TasteAnswers = Record<string, string | string[]>;
export type TasteProfileState = Record<Module['key'], TasteAnswers>;

export function blankTasteProfile(): TasteProfileState {
  const o = {} as TasteProfileState;
  for (const m of MODULES) {
    o[m.key] = {};
    for (const q of m.questions) o[m.key][q.id] = q.type === 'multi' ? [] : '';
  }
  return o;
}

export function questionAnswered(tp: TasteProfileState, modKey: Module['key'], q: Question): boolean {
  const val = tp[modKey][q.id];
  if (q.type === 'multi') {
    return Array.isArray(val) && (q.requireExact ? val.length === q.max : val.length > 0);
  }
  return !!val;
}

export function moduleAnsweredCount(tp: TasteProfileState, mod: Module): number {
  return mod.questions.filter((q) => questionAnswered(tp, mod.key, q)).length;
}

export function isModuleComplete(tp: TasteProfileState, mod: Module): boolean {
  return moduleAnsweredCount(tp, mod) === mod.questions.length;
}

export type DnaAxis = 'adventure' | 'luxury' | 'comfort' | 'social' | 'health';
type Contribution = Partial<Record<DnaAxis, number>>;

const DNA_WEIGHTS: Record<string, Record<string, Record<string, Contribution> | { scale: (v: number) => Contribution } | { multi: (arr: string[]) => Contribution }>> = {
  dining: {
    q1: { Daily: { social: 10 }, '3–5 times a week': { social: 7 }, Rarely: { social: 1 } },
    q4: { 'Fine Dining': { luxury: 15 }, Takeout: { comfort: 8 }, 'Mix of everything': { adventure: 5 } },
    q5: { Anywhere: { adventure: 15 }, 'Under 5 km': { comfort: 5 } },
  },
  discovery: {
    q1: { Always: { adventure: 20 }, Never: { comfort: 15 } },
    q3: { 'I actively seek new experiences': { adventure: 20 } },
    q4: { scale: (v: number) => ({ adventure: v * 4 }) },
  },
  mood: {
    q1: { multi: (arr: string[]) => ({ comfort: arr.length * 5 }) },
  },
  budget: {
    q1: { '$100+': { luxury: 20 }, 'Under $15': { comfort: 10 } },
    q3: { Often: { luxury: 15 }, Never: { comfort: 10 } },
  },
  social: {
    q2: { Always: { social: 20 }, Never: { social: 2 } },
    q4: { 'Food influencer': { social: 20 }, 'Quiet eater': { social: 2 } },
  },
};

export function computeDnaScores(tp: TasteProfileState): Record<DnaAxis, number> {
  const totals: Record<DnaAxis, number> = { adventure: 0, luxury: 0, comfort: 0, social: 0, health: 0 };
  const caps: Record<DnaAxis, number> = { adventure: 0, luxury: 0, comfort: 0, social: 0, health: 0 };

  for (const [modKey, questions] of Object.entries(DNA_WEIGHTS)) {
    const answers = tp[modKey as Module['key']] || {};
    for (const [qId, rule] of Object.entries(questions)) {
      const val = answers[qId];
      if (val == null || val === '') continue;
      let contrib: Contribution = {};
      const anyRule = rule as any;
      if (typeof anyRule.scale === 'function') contrib = anyRule.scale(Number(val));
      else if (typeof anyRule.multi === 'function') contrib = anyRule.multi(val as string[]);
      else contrib = (rule as Record<string, Contribution>)[val as string] || {};
      for (const [axis, pts] of Object.entries(contrib) as [DnaAxis, number][]) {
        totals[axis] = (totals[axis] || 0) + pts;
        caps[axis] = (caps[axis] || 0) + 20;
      }
    }
  }

  const scores = {} as Record<DnaAxis, number>;
  for (const axis of Object.keys(totals) as DnaAxis[]) {
    scores[axis] = caps[axis] ? Math.round(Math.min(100, (totals[axis] / caps[axis]) * 100)) : 0;
  }
  return scores;
}

export const PERSONA_MAP: Record<DnaAxis, { emoji: string; title: string; desc: string }> = {
  adventure: { emoji: '🌍', title: 'Flavor Explorer', desc: 'You love exploring bold flavors and trying new cuisines.' },
  luxury: { emoji: '⭐', title: 'Fine Dining Devotee', desc: 'You seek out premium ingredients and elevated experiences.' },
  comfort: { emoji: '🍲', title: 'Comfort Seeker', desc: 'You know exactly what makes a meal feel like home.' },
  social: { emoji: '👥', title: 'Social Foodie', desc: 'Food is how you connect — sharing plates and recommendations.' },
  health: { emoji: '🥗', title: 'Mindful Eater', desc: 'You make thoughtful, health-conscious choices.' },
};

export function personaFromScores(scores: Record<DnaAxis, number>) {
  const topAxis = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as DnaAxis) ?? 'adventure';
  return PERSONA_MAP[topAxis];
}
