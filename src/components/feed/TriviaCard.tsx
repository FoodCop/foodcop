import React from 'react';
import type { TriviaItem } from '../../types/trivia';

interface TriviaCardProps {
  readonly trivia: TriviaItem;
}

export function TriviaCard({ trivia }: TriviaCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
      {/* Trivia Badge */}
      <div className="absolute top-4 left-4 z-10 bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
        🧠 FOOD TRIVIA
      </div>

      {/* Trivia Image - 9:16 aspect ratio for vertical */}
      <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
        <img
          src={trivia.imageUrl}
          alt={trivia.altText}
          className="absolute top-0 left-0 w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
