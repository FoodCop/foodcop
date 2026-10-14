'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CreateKind, CreatePhoto } from './types';

// Step 2 of the Create flow: "What is this?" - four compact illustrated cards
// (client, 2026-10-14: "show buttons", then the illustrated reference: each
// picture on its own pastel blob with accent strokes). Art lives in
// public/images/create/kind-<id>.webp; swap those files to change it.

export const KIND_OPTIONS: { id: CreateKind; label: string; sub: string; art: string }[] = [
  { id: 'vibe', label: 'Vibe', sub: 'People and the feel of a place', art: '/images/create/kind-vibe-peach.webp' },
  { id: 'food', label: 'Food', sub: 'A dish, out or at home', art: '/images/create/kind-food.webp' },
  { id: 'recipe', label: 'Recipe', sub: 'Something you cooked, with steps', art: '/images/create/kind-recipe.webp' },
  { id: 'restaurant', label: 'Restaurant', sub: 'The place itself, or a new find', art: '/images/create/kind-restaurant.webp' },
];

interface KindPickerProps {
  photos: CreatePhoto[];
  selected: CreateKind | null;
  onPick: (kind: CreateKind) => void;
}

export function KindPicker({ photos, selected, onPick }: KindPickerProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="cf-kind">
      <ul className="cf-kind__photos" aria-label="Your photos">
        {photos.map((p, i) => (
          <li key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} />
          </li>
        ))}
      </ul>

      <div className="cf-kind__grid" role="group" aria-label="What is this?">
        {KIND_OPTIONS.map(({ id, label, sub, art }, i) => (
          <motion.button
            key={id}
            type="button"
            className={`cf-kind__tile${selected === id ? ' is-selected' : ''}`}
            aria-pressed={selected === id}
            aria-label={`${label}: ${sub}`}
            title={sub}
            onClick={() => onPick(id)}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          >
            <span className="cf-kind__art">
              <Image src={art} alt="" width={640} height={450} sizes="180px" priority={i < 2} />
              {selected === id && (
                <span className="cf-kind__check" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
              )}
            </span>
            <span className="cf-kind__label">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default KindPicker;
