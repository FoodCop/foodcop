'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, BookOpen, MapPin, Pencil, Share2 } from 'lucide-react';
import { canEditInCreate } from '@/components/create/flow/fromCard';
import { communityRecipeId } from '@/lib/recipes/communityRecipes';
import { postTitle } from '@/lib/share/postShare';
import { TYPE_META, type FoodCardRecord } from '@/lib/types/foodCard';

// The whole post, for signed-in viewers of /post/<id> (PostView loads it):
// photos (swipe), who posted it and when, where, caption, tags, recipe
// ingredients and steps, then Share / Open in Bites / Edit (own posts).

export type PostAuthor = { id: string; name: string; avatar: string | null };

interface PostDetailProps {
  card: FoodCardRecord;
  author: PostAuthor | null;
  isOwner: boolean;
  onShare: () => void;
  onEdit: () => void;
}

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const photosOf = (card: FoodCardRecord) =>
  (card.photos?.length ? card.photos : card.image_url ? [card.image_url] : []).filter((u) => /^(https?:\/\/|data:image\/)/i.test(u));

export function PostDetail({ card, author, isOwner, onShare, onEdit }: PostDetailProps) {
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const meta = TYPE_META[card.card_type];
  const photos = photosOf(card);
  const chips = [...(card.labels ?? []), ...(card.business_identity ?? []), ...Object.values(card.tags ?? {}).flat()].filter(
    (t, i, all): t is string => typeof t === 'string' && !!t && all.indexOf(t) === i,
  );
  const ingredients = (card.ingredients ?? []).filter((r) => r[0]);
  const steps = (card.steps ?? []).filter(Boolean);
  const hasPlace = typeof card.lat === 'number' && typeof card.lng === 'number' && !card.is_home;
  const placeHref = hasPlace
    ? `/scout?${new URLSearchParams({ name: card.place_name || postTitle(card), lat: String(card.lat), lng: String(card.lng), ...(card.place_id ? { place: card.place_id } : {}) }).toString()}`
    : null;

  const onScroll = () => {
    const el = trackRef.current;
    if (el) setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };

  return (
    <main className="fz-post">
      <div className="fz-post__top">
        <Link href="/dashboard" className="fz-post__back" aria-label="Back to home">
          <ArrowLeft size={20} />
        </Link>
      </div>

      <motion.article
        className="fz-post__card"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="fz-post-title"
      >
        {photos.length > 0 && (
          <div className="fz-post__photos">
            <div className="fz-post__track" ref={trackRef} onScroll={onScroll} tabIndex={0} aria-label={`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}>
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src.slice(0, 80) + i} src={src} alt={`${postTitle(card)} - photo ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} />
              ))}
            </div>
            <span className="fz-post__badge">
              {meta?.emoji} {meta?.label}
            </span>
            {photos.length > 1 && (
              <div className="fz-post__dots" aria-hidden="true">
                {photos.map((_, i) => (
                  <span key={i} className={i === slide ? 'is-on' : ''} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="fz-post__body">
          {author && (
            <Link href={`/profile/${author.id}`} className="fz-post__author">
              <span className="fz-post__avatar" aria-hidden="true">
                {author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatar} alt="" />
                ) : (
                  author.name.charAt(0).toUpperCase()
                )}
              </span>
              <span>
                <strong>{author.name}</strong>
                <span className="fz-post__muted">{timeAgo(card.created_at)}</span>
              </span>
            </Link>
          )}

          <h1 id="fz-post-title" className="fz-post__title">
            {postTitle(card)}
          </h1>

          {placeHref && (
            <Link href={placeHref} className="fz-post__place">
              <MapPin size={16} aria-hidden="true" />
              <span>
                {card.place_name || 'On the map'}
                {card.address && card.address !== card.place_name && <span className="fz-post__muted"> · {card.address}</span>}
              </span>
            </Link>
          )}
          {card.is_home && <p className="fz-post__muted">Made at home</p>}

          {card.caption && <p className="fz-post__caption">{card.caption}</p>}

          {chips.length > 0 && (
            <ul className="fz-post__chips" aria-label="Tags">
              {chips.slice(0, 16).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          {ingredients.length > 0 && (
            <section className="fz-post__section" aria-labelledby="fz-post-ingredients">
              <h2 id="fz-post-ingredients">Ingredients</h2>
              <ul className="fz-post__ingredients">
                {ingredients.map(([name, qty, unit], i) => (
                  <li key={`${name}-${i}`}>
                    <span>{name}</span>
                    <span className="fz-post__muted">{[qty, unit].filter(Boolean).join(' ')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {steps.length > 0 && (
            <section className="fz-post__section" aria-labelledby="fz-post-steps">
              <h2 id="fz-post-steps">Steps</h2>
              <ol className="fz-post__steps">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </section>
          )}

          <div className="fz-post__actions">
            {card.status === 'PUBLISHED' && (
              <button type="button" className="fz-post__btn fz-post__btn--primary" onClick={onShare}>
                <Share2 size={18} aria-hidden="true" /> Share
              </button>
            )}
            {card.card_type === 'RECIPE' && card.status === 'PUBLISHED' && (
              <Link href={`/dashboard?tab=bites&recipe=${communityRecipeId(card.id)}`} className="fz-post__btn">
                <BookOpen size={18} aria-hidden="true" /> Open in Bites
              </Link>
            )}
            {isOwner && canEditInCreate(card) && (
              <button type="button" className="fz-post__btn" onClick={onEdit}>
                <Pencil size={18} aria-hidden="true" /> {card.status === 'DRAFT' ? 'Finish draft' : 'Edit'}
              </button>
            )}
          </div>
        </div>
      </motion.article>
    </main>
  );
}

export default PostDetail;
