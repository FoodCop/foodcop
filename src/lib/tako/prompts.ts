// Tako / Chef AI data: the landing screen's three starting points and their
// options (TAKO_GROUPS - every option opens a real page, starts a real Tako
// conversation or opens Create a card; icons are the colour illustrations in
// /public/SVG), the greeting, and the chat's structured-response setup.
// CHEF_SUGGESTED_PROMPTS is unchanged from
// legacy/fuzoapp/src/features/chef/constants/prompts.ts.
import type { TakoAction, TakoGroup } from '@/types/tako';

export const CHEF_SUGGESTED_PROMPTS = [
  "What can I cook with salmon?",
  "Quick 15-min breakfast ideas",
  "How to make perfect sushi rice?",
  "Protein-rich dinner for two",
] as const;

const prompt = (text: string): TakoAction => ({ type: 'prompt', prompt: text });
const go = (href: string): TakoAction => ({ type: 'navigate', href });

// Landing screen (client, 2026-10-07): the old Food Mood / Quick Discovery /
// Quick Links lists, regrouped under three starting points.
export const TAKO_GROUPS: TakoGroup[] = [
  {
    id: 'eat',
    label: 'Eat out',
    sub: 'Places near you',
    tint: ['#FF9A76', '#E8472B'],
    options: [
      { icon: '/SVG/social/Location.svg', label: 'Somewhere to eat', action: prompt('Find me somewhere good to eat nearby') },
      { icon: '/SVG/map/Radar.svg', label: 'Explore the map', action: go('/scout') },
      { icon: '/SVG/food/COFFEE.svg', label: 'Coffee spot', action: prompt('Recommend a great coffee spot or drink') },
      { icon: '/SVG/food/NACHOS.svg', label: 'Street food', action: prompt('Find me great street food nearby') },
      { icon: '/SVG/social/Gift.svg', label: 'Celebrating', action: prompt("I'm celebrating, suggest something special to eat") },
      { icon: '/SVG/social/Team.svg', label: 'Plan with my crew', action: go('/messages') },
    ],
  },
  {
    id: 'cook',
    label: 'Cook',
    sub: 'Recipes & ideas',
    tint: ['#FFD66B', '#F2A93B'],
    options: [
      { icon: '/SVG/social/Home.svg', label: 'Cook tonight', action: prompt('What should I cook tonight?') },
      { icon: '/SVG/social/Book.svg', label: 'A recipe for me', action: prompt('Suggest a recipe for me') },
      { icon: '/SVG/food/SANDWICH.svg', label: 'Quick breakfast', action: prompt('Quick 15-min breakfast ideas') },
      { icon: '/SVG/food/CURRY%20RICE.svg', label: 'Dinner for two', action: prompt('Protein-rich dinner for two') },
      { icon: '/SVG/food/SALAD.svg', label: 'Something healthy', action: prompt('Suggest a healthy salad or bowl') },
      { icon: '/SVG/social/Camera.svg', label: 'Share what I made', action: { type: 'create-card' } },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    sub: 'Moods & videos',
    tint: ['#C4AEF5', '#8B5CF6'],
    options: [
      { icon: '/SVG/social/Smile.svg', label: 'Feeling happy', action: prompt("I'm feeling happy, what should I eat?") },
      { icon: '/SVG/food/BURGER.svg', label: 'Comfort food', action: prompt('I want some comfort food') },
      { icon: '/SVG/social/Fire.svg', label: 'Something spicy', action: prompt('I want something spicy') },
      { icon: '/SVG/food/SUSHI.svg', label: 'Sushi', action: prompt("I'm craving sushi") },
      { icon: '/SVG/food/NOODLE.svg', label: 'Ramen', action: prompt("I'm craving ramen") },
      { icon: '/SVG/social/Earth.svg', label: 'A new cuisine', action: prompt('Suggest a cuisine for me to explore') },
      { icon: '/SVG/social/Video.svg', label: 'Watch Trims', action: go('/dashboard?tab=trims') },
      { icon: '/SVG/social/Star.svg', label: 'Surprise me', action: prompt('Surprise me with a food idea') },
    ],
  },
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
  if (hour < 5) return { title: 'Up late?', sub: 'A midnight snack, maybe?' };
  if (hour < 11) return { title: 'Good morning!', sub: 'Coffee or breakfast?' };
  if (hour < 15) return { title: 'Good afternoon!', sub: 'Looking for lunch nearby?' };
  if (hour < 18) return { title: 'Good evening!', sub: 'Need a quick snack?' };
  return { title: 'Good evening!', sub: 'Comfort food tonight?' };
}
