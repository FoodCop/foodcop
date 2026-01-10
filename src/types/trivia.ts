/**
 * Trivia Type Definitions for Feed
 */

export interface TriviaItem {
  type: 'trivia';
  id: string;
  imageUrl: string;
  format: 'square' | 'vertical';
  aspectRatio: '1:1' | '3:4';
  altText: string;
  category?: string;
}

export type TriviaFormat = TriviaItem['format'];
export type TriviaAspectRatio = TriviaItem['aspectRatio'];
