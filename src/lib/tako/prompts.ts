// Tako / Chef AI landing-screen data. Ported from FUZO_V3/js/tako.js's
// MOODS/QUICK_ACTIONS/getGreeting, with changes:
//   - emoji-in-img-string glyphs replaced with real /SVG/... icon paths
//     throughout (renders consistently across devices, unlike native emoji);
//     Quick Discovery/Quick Links icons render as white silhouettes on solid
//     colour badges (see _tako.scss)
//   - every mood/action now does something real (navigates to an existing
//     route, or starts a real Tako conversation) instead of tako.js's
//     toast-only stubs. "Create Content" has no destination yet (Snap studio
//     isn't ported), so it's flagged 'soon' rather than linking nowhere.
// CHEF_SUGGESTED_PROMPTS is unchanged from
// legacy/fuzoapp/src/features/chef/constants/prompts.ts.
import type { Mood, QuickAction, QuickLink } from '@/types/tako';

export const CHEF_SUGGESTED_PROMPTS = [
  "What can I cook with salmon?",
  "Quick 15-min breakfast ideas",
  "How to make perfect sushi rice?",
  "Protein-rich dinner for two",
] as const;

export const MOODS: Mood[] = [
  { icon: '/SVG/social/Smile.svg', label: 'Happy', prompt: "I'm feeling happy, what should I eat?" },
  { icon: '/SVG/food/BURGER.svg', label: 'Comfort Food', prompt: 'I want some comfort food' },
  { icon: '/SVG/social/Gift.svg', label: 'Celebrating', prompt: "I'm celebrating, suggest something special to eat" },
  { icon: '/SVG/food/COFFEE.svg', label: 'Coffee', prompt: 'Recommend a great coffee spot or drink' },
  { icon: '/SVG/social/Fire.svg', label: 'Spicy', prompt: 'I want something spicy' },
  { icon: '/SVG/food/SUSHI.svg', label: 'Sushi', prompt: "I'm craving sushi" },
  { icon: '/SVG/food/NOODLE.svg', label: 'Ramen', prompt: "I'm craving ramen" },
  { icon: '/SVG/social/Star.svg', label: 'Surprise Me', prompt: 'Surprise me with a food idea' },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { icon: '/SVG/social/Location.svg', label: 'Find Somewhere To Eat', color: '#E8472B', type: 'prompt', prompt: 'Find me somewhere good to eat nearby' },
  { icon: '/SVG/social/Home.svg', label: 'Cook Tonight', color: '#F2A93B', type: 'prompt', prompt: 'What should I cook tonight?' },
  { icon: '/SVG/social/Video.svg', label: 'Watch Trims', color: '#9B7FD4', type: 'navigate', href: '/trims' },
  { icon: '/SVG/social/Camera.svg', label: 'Create Content', color: '#EC4899', type: 'soon' },
  { icon: '/SVG/map/Radar.svg', label: 'Explore Nearby', color: '#22C55E', type: 'navigate', href: '/scout' },
  { icon: '/SVG/social/Team.svg', label: 'Plan With My Crew', color: '#5B9BD5', type: 'navigate', href: '/messages' },
  { icon: '/SVG/social/Earth.svg', label: 'Explore A Cuisine', color: '#F59E0B', type: 'prompt', prompt: 'Suggest a cuisine for me to explore' },
  { icon: '/SVG/social/Gift.svg', label: 'Surprise Me', color: '#8B5CF6', type: 'prompt', prompt: 'Surprise me with a food idea' },
];

export const QUICK_LINKS: QuickLink[] = [
  { icon: '/SVG/social/Location.svg', label: 'Restaurants', color: '#E8472B', type: 'navigate', href: '/scout' },
  { icon: '/SVG/social/Book.svg', label: 'Recipes', color: '#F2A93B', type: 'prompt', prompt: 'Suggest a recipe for me' },
  { icon: '/SVG/social/Play.svg', label: 'More Videos', color: '#EC4899', type: 'navigate', href: '/trims' },
];

// System prompt + structured response schema, unchanged from
// legacy/fuzoapp/src/features/chef/components/ChefAIView.tsx.
export const CHEF_SYSTEM_INSTRUCTION =
  "You are TAKO, an elite AAA culinary expert AI within the FUZO ecosystem. Be bold, extremely concise, and professional. You MUST always respond in structured JSON format according to the provided schema. Never output markdown outside the JSON, and never include long narrative paragraphs. Focus on bullet points, selectable option cards, concise action commands, and quick follow-up suggestions.";

export const CHEF_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    speech: {
      type: 'string',
      description: 'A very concise greeting, summary, or introduction in 1 short sentence (max 15 words). Required.'
    },
    bullets: {
      type: 'array',
      items: { type: 'string' },
      description: '2-4 concise, punchy bullet points.'
    },
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Culinary name of the card. Max 25 characters.' },
          description: { type: 'string', description: 'Short 1-sentence description. Max 10 words.' },
          meta: { type: 'string', description: 'Brief tags like "Prep: 15m | 350 kcal" or "Keto | 4.8★".' },
          suggestion: { type: 'string', description: 'Prompt to send when user selects this card (e.g. "How to make Keto Salmon Bowl").' }
        },
        required: ['title', 'description', 'suggestion']
      },
      description: '1-3 interactive gourmet/dish cards.'
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Action button text. E.g. "Get Recipe", "List Ingredients". Max 15 chars.' },
          command: { type: 'string', description: 'The exact user query/command to trigger when this action is clicked.' }
        },
        required: ['label', 'command']
      },
      description: '1-2 concise action steps.'
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      description: '2-3 quick follow-up prompt chips.'
    }
  },
  required: ['speech']
};

export function getGreeting(): { title: string; sub: string } {
  const hour = new Date().getHours();
  if (hour < 11) return { title: 'Good Morning!', sub: 'Coffee or breakfast?' };
  if (hour < 15) return { title: 'Good Afternoon!', sub: 'Looking for lunch nearby?' };
  if (hour < 18) return { title: 'Good Evening!', sub: 'Need a quick snack?' };
  return { title: 'Good Evening!', sub: 'Comfort food tonight?' };
}
