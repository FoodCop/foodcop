'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CreateKind, CreatePhoto, VideoKind } from './types';

// Step 2 of the Create flow: "What is this?" - four compact illustrated cards
// (client, 2026-10-14: "show buttons", then the illustrated reference: each
// picture on its own pastel blob with accent strokes). Art lives in
// public/images/create/kind-<id>.webp; swap those files to change it.
// Video posts (client, 2026-10-16) pick from VIDEO_KIND_OPTIONS instead.

export interface KindOption<T extends string> {
  id: T;
  label: string;
  sub: string;
  art: string;
}

export const KIND_OPTIONS: KindOption<CreateKind>[] = [
  { id: 'vibe', label: 'Vibe', sub: 'People and the feel of a place', art: '/images/create/kind-vibe-peach.webp' },
  { id: 'food', label: 'Food', sub: 'A dish, out or at home', art: '/images/create/kind-food.webp' },
  { id: 'recipe', label: 'Recipe', sub: 'Something you cooked, with steps', art: '/images/create/kind-recipe.webp' },
  { id: 'restaurant', label: 'Restaurant', sub: 'The place itself, or a new find', art: '/images/create/kind-restaurant.webp' },
];

// Art reused from the photo kinds until the client sends video ones.
export const VIDEO_KIND_OPTIONS: KindOption<VideoKind>[] = [
  { id: 'video_recipe', label: 'Recipe', sub: 'How you cooked it, with steps', art: '/images/create/kind-recipe.webp' },
  { id: 'food_review', label: 'Food review', sub: 'A dish and the place you had it', art: '/images/create/kind-food.webp' },
  { id: 'food_tour', label: 'Food tour', sub: 'Several stops in one video', art: '/images/create/kind-restaurant.webp' },
];

interface KindPickerProps<T extends string> {
  photos: CreatePhoto[];
  /** A video post: shown above the cards instead of photos. */
  video?: { url: string; coverUrl?: string | null } | null;
  options?: KindOption<T>[];
  selected: T | null;
  onPick: (kind: T) => void;
}

export function KindPicker<T extends string = CreateKind>({ photos, video, options, selected, onPick }: KindPickerProps<T>) {
  const reduceMotion = useReducedMotion();
  const list = (options ?? KIND_OPTIONS) as KindOption<T>[];
  return (
    <div className="cf-kind">
      {video ? (
        <div className="cf-kind__photos cf-kind__photos--video" aria-label="Your video">
          {video.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.coverUrl} alt="Video cover" />
          ) : (
            <video src={video.url} muted playsInline preload="metadata" aria-hidden="true" />
          )}
        </div>
      ) : (
        <ul className="cf-kind__photos" aria-label="Your photos">
          {photos.map((p, i) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} />
            </li>
          ))}
        </ul>
      )}

      <div className={`cf-kind__grid${list.length === 3 ? ' cf-kind__grid--three' : ''}`} role="group" aria-label={video ? 'What is this video?' : 'What is this?'}>
        {list.map(({ id, label, sub, art }, i) => (
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
