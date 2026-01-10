/**
 * Trivia Configuration
 * Central configuration for trivia displayed in the feed
 */

import type { TriviaItem } from '../types/trivia';

/**
 * Generate trivia configurations from local images
 */
function generateTriviasFromFolder(): TriviaItem[] {
  const trivias: TriviaItem[] = [];
  
  // Add Vertical trivias (3:4 ratio) - Using all 59 of them (0000-0058)
  for (let i = 0; i < 59; i++) {
    trivias.push({
      type: 'trivia',
      id: `trivia-vertical-${i}`,
      imageUrl: `/trivia/vertical/TRIV_V_${String(i).padStart(4, '0')}.png`,
      format: 'vertical',
      aspectRatio: '3:4',
      altText: `Food Trivia ${i + 1}`,
      category: 'Food Facts'
    });
  }
  
  console.log(`🧠 Generated ${trivias.length} trivias from folder`);
  return trivias;
}

export const TRIVIA_CONFIG: TriviaItem[] = generateTriviasFromFolder();

/**
 * Trivia injection configuration
 */
export const TRIVIA_INJECTION_CONFIG = {
  // Feed: Insert 1 trivia every 4 posts (different from ads at 3)
  feed: {
    interval: 4
  }
};

/**
 * Get a random trivia from the pool
 */
export function getRandomTrivia(): TriviaItem {
  return TRIVIA_CONFIG[Math.floor(Math.random() * TRIVIA_CONFIG.length)];
}

/**
 * Get multiple unique random trivias
 */
export function getRandomTrivias(count: number): TriviaItem[] {
  const shuffled = [...TRIVIA_CONFIG].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, TRIVIA_CONFIG.length));
}

/**
 * Get vertical trivias only (for Feed)
 */
export function getVerticalTrivias(count: number): TriviaItem[] {
  const verticalTrivias = TRIVIA_CONFIG.filter(trivia => trivia.format === 'vertical');
  const shuffled = [...verticalTrivias].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, verticalTrivias.length));
}
