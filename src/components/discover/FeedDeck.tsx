'use client';

import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
import { Bookmark, Heart, Share2, X } from 'lucide-react';
import { TYPE_META } from '@/lib/types/foodCard';
import type { FeedCard } from '@/lib/services/recommendationService';

// The Feed's Tinder-style card stack (client, 2026-10-18: "make it like
// Tinder" on phones). The top card follows the finger 1:1, tilts around the
// point it was grabbed, and is thrown off-screen from wherever it is on
// release - a long drag or a quick flick both count. The card behind grows
// into place as you drag, and the matching action button lights up.
// Directions (client, 2026-10-06): left = dislike, right = like, up = share,
// down = save to My Plate.

export type SwipeDir = 'left' | 'right' | 'up' | 'down';

const DIST_X = 0.3; // share of the card width a sideways drag needs to commit
const DIST_Y = 120; // px of up/down drag that commits
const FLICK = 500; // px/s: a flick this fast commits even a short drag
const MIN_FLICK_DIST = 30; // ...as long as it moved at least this far
const BEHIND = 2; // cards drawn under the top one

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Which way a drag points (the axis that moved more), or null while it's tiny. */
function dirOf(x: number, y: number): SwipeDir | null {
  if (Math.abs(x) < 12 && Math.abs(y) < 12) return null;
  return Math.abs(x) >= Math.abs(y) ? (x > 0 ? 'right' : 'left') : y < 0 ? 'up' : 'down';
}

export interface FeedDeckProps {
  cards: FeedCard[];
  /** The user decided on a card (fires as the throw starts). */
  onSwipe: (dir: SwipeDir, card: FeedCard) => void;
  /** Shown between the stack and the action bar (confirmation pill). */
  notice?: ReactNode;
  /** Shown under the action bar (first-visit hint). */
  footer?: ReactNode;
}

interface TopCardHandle {
  fling: (dir: SwipeDir) => void;
}

export default function FeedDeck({ cards, onSwipe, notice, footer }: FeedDeckProps) {
  const [index, setIndex] = useState(0);
  const [hot, setHot] = useState<SwipeDir | null>(null);
  const topRef = useRef<TopCardHandle>(null);
  // 0 → 1 as the top card is dragged towards a decision; drives the card behind.
  const progress = useMotionValue(0);

  const done = index >= cards.length;
  const visible = cards.slice(index, index + 1 + BEHIND);

  const fling = (dir: SwipeDir) => topRef.current?.fling(dir);

  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, SwipeDir> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();
    fling(dir);
  }

  return (
    <div className="feed">
      <div
        className="feed__stage"
        tabIndex={0}
        role="group"
        aria-label="Feed cards. Swipe or use arrow keys: left dislike, right like, up share, down save to My Plate."
        onKeyDown={onKeyDown}
      >
        {/* Drawn back to front so the top card is last (on top). */}
        {visible
          .map((card, depth) =>
            depth === 0 ? (
              <TopCard
                key={card.card.id}
                ref={topRef}
                card={card}
                progress={progress}
                onHot={setHot}
                onDecide={(dir) => onSwipe(dir, card)}
                onGone={() => {
                  progress.jump(0);
                  setHot(null);
                  setIndex((i) => i + 1);
                }}
              />
            ) : (
              <BackCard key={card.card.id} card={card} depth={depth} progress={progress} />
            ),
          )
          .reverse()}

        {done && (
          <div className="feed-done">
            <div className="feed-done__emoji" aria-hidden="true">🎉</div>
            <div className="feed-done__title">You&rsquo;re all caught up</div>
            <p className="feed-done__sub">Check back later for more discoveries.</p>
            <button type="button" className="feed-done__btn" onClick={() => setIndex(0)}>
              Start over
            </button>
          </div>
        )}
      </div>

      {notice}

      <div className="feed__bar">
        <button className={`feed__btn feed__btn--nope${hot === 'left' ? ' is-hot' : ''}`} onClick={() => fling('left')} type="button" aria-label="Dislike" title="Dislike (swipe left)" disabled={done}>
          <X size={26} strokeWidth={3} />
        </button>
        <button className={`feed__btn feed__btn--share${hot === 'up' ? ' is-hot' : ''}`} onClick={() => fling('up')} type="button" aria-label="Share" title="Share (swipe up)" disabled={done}>
          <Share2 size={18} strokeWidth={2.4} />
        </button>
        <span className="feed__count" aria-live="polite">
          {done ? `${cards.length} / ${cards.length}` : `${index + 1} / ${cards.length}`}
        </span>
        <button className={`feed__btn feed__btn--save${hot === 'down' ? ' is-hot' : ''}`} onClick={() => fling('down')} type="button" aria-label="Save to My Plate" title="Save to My Plate (swipe down)" disabled={done}>
          <Bookmark size={18} strokeWidth={2.4} />
        </button>
        <button className={`feed__btn feed__btn--like${hot === 'right' ? ' is-hot' : ''}`} onClick={() => fling('right')} type="button" aria-label="Like" title="Like (swipe right)" disabled={done}>
          <Heart size={26} fill="currentColor" />
        </button>
      </div>

      {!done && footer}
    </div>
  );
}

/** A card waiting underneath: smaller and lower, growing into place as the top card is dragged away. */
function BackCard({ card, depth, progress }: { card: FeedCard; depth: number; progress: MotionValue<number> }) {
  const scale = useTransform(progress, (p) => 1 - (depth - p) * 0.05);
  const y = useTransform(progress, (p) => (depth - p) * 14);
  return (
    <motion.article className="feed-card feed-card--behind" style={{ scale, y }} aria-hidden="true" inert>
      <CardFace card={card} />
    </motion.article>
  );
}

function TopCard({
  card,
  progress,
  onHot,
  onDecide,
  onGone,
  ref,
}: {
  card: FeedCard;
  progress: MotionValue<number>;
  onHot: (dir: SwipeDir | null) => void;
  onDecide: (dir: SwipeDir) => void;
  onGone: () => void;
  ref: Ref<TopCardHandle>;
}) {
  const reduce = useReducedMotion();
  const el = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  // Grabbed below the middle → tilt the other way, like holding a real card there.
  const grab = useMotionValue(1);
  const rotate = useTransform([x, grab], ([v, g]: number[]) => Math.max(-22, Math.min(22, v / 14)) * g);
  // The card's width, measured when a drag starts (distances scale with it).
  const cardW = useMotionValue(340);
  const busy = useRef(false);
  const lastDir = useRef<SwipeDir | null>(null);
  const armed = useRef(false);

  /** How far towards a decision the card is (0 = centre, 1 = will commit). */
  const strength = (vx: number, vy: number) => {
    const d = dirOf(vx, vy);
    if (!d) return 0;
    return d === 'left' || d === 'right' ? Math.abs(vx) / (cardW.get() * DIST_X) : Math.abs(vy) / DIST_Y;
  };

  // Stamps: only the direction the drag points in shows, fading in with distance.
  const stampFor = (want: SwipeDir) => ([vx, vy]: number[]) => (dirOf(vx, vy) === want ? clamp01(strength(vx, vy) * 1.2) : 0);
  const stampLeft = useTransform([x, y], stampFor('left'));
  const stampRight = useTransform([x, y], stampFor('right'));
  const stampUp = useTransform([x, y], stampFor('up'));
  const stampDown = useTransform([x, y], stampFor('down'));

  const track = () => {
    const vx = x.get();
    const vy = y.get();
    const s = strength(vx, vy);
    progress.set(clamp01(s));
    const d = dirOf(vx, vy);
    if (d !== lastDir.current) {
      lastDir.current = d;
      onHot(d);
    }
    // A tiny buzz (Android) the moment a release would count, like Tinder.
    const nowArmed = s >= 1;
    if (nowArmed && !armed.current) navigator.vibrate?.(8);
    armed.current = nowArmed;
  };
  useMotionValueEvent(x, 'change', track);
  useMotionValueEvent(y, 'change', track);

  /** Throw the card off-screen from where it is now, carrying the finger's speed. */
  const throwAway = (dir: SwipeDir, vx = 0, vy = 0) => {
    if (busy.current) return;
    busy.current = true;
    onDecide(dir);
    onHot(dir);
    progress.set(1);
    if (reduce) {
      animate(opacity, 0, { duration: 0.18 }).then(onGone);
      return;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const sideways = dir === 'left' || dir === 'right';
    const sign = dir === 'right' || dir === 'down' ? 1 : -1;
    const targetX = sideways ? sign * (W + cardW.get()) : x.get() + vx * 0.15;
    const targetY = sideways ? y.get() + vy * 0.2 : sign * (H + 200);
    // Faster flicks leave faster; a button press uses a steady throw.
    const speed = Math.hypot(vx, vy);
    const duration = speed > 0 ? Math.max(0.2, Math.min(0.42, 900 / speed / 4)) : 0.38;
    animate(x, targetX, { duration, ease: [0.2, 0.7, 0.4, 1] });
    animate(y, targetY, { duration, ease: [0.2, 0.7, 0.4, 1] }).then(onGone);
  };

  useImperativeHandle(ref, () => ({
    fling: (dir) => {
      // Buttons and keys: tilt from the top, like a grab near the top edge.
      grab.set(1);
      if (el.current) cardW.set(el.current.offsetWidth);
      throwAway(dir);
    },
  }));

  const onPointerDown = (e: React.PointerEvent) => {
    const r = el.current?.getBoundingClientRect();
    if (!r) return;
    cardW.set(r.width);
    grab.set(e.clientY > r.top + r.height / 2 ? -1 : 1);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (busy.current) return;
    const { x: ox, y: oy } = info.offset;
    const { x: vx, y: vy } = info.velocity;
    const dir = dirOf(ox, oy);
    const far = strength(ox, oy) >= 1;
    const sideways = dir === 'left' || dir === 'right';
    const v = sideways ? vx : vy;
    const flicked = !!dir && Math.abs(v) > FLICK && Math.sign(v) === Math.sign(sideways ? ox : oy) && Math.hypot(ox, oy) > MIN_FLICK_DIST;
    if (dir && (far || flicked)) {
      throwAway(dir, vx, vy);
      return;
    }
    // Not far enough: spring back to the middle.
    const spring = { type: 'spring' as const, stiffness: 520, damping: 32 };
    animate(x, 0, spring);
    animate(y, 0, spring);
  };

  return (
    <motion.article
      ref={el}
      className="feed-card feed-card--top"
      style={{ x, y, rotate, opacity }}
      drag
      dragMomentum={false}
      dragElastic={1}
      onPointerDown={onPointerDown}
      onDragEnd={onDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <CardFace card={card} />
      {/* Drag feedback stamps. */}
      <motion.div className="feed-stamp feed-stamp--nope" style={{ opacity: stampLeft }} aria-hidden="true">
        <X size={16} strokeWidth={3} /> Nope
      </motion.div>
      <motion.div className="feed-stamp feed-stamp--like" style={{ opacity: stampRight }} aria-hidden="true">
        <Heart size={16} fill="currentColor" /> Like
      </motion.div>
      <motion.div className="feed-stamp feed-stamp--share" style={{ opacity: stampUp }} aria-hidden="true">
        <Share2 size={16} strokeWidth={2.6} /> Share
      </motion.div>
      <motion.div className="feed-stamp feed-stamp--save" style={{ opacity: stampDown }} aria-hidden="true">
        <Bookmark size={16} fill="currentColor" /> Save
      </motion.div>
    </motion.article>
  );
}

function CardFace({ card: feedCard }: { card: FeedCard }) {
  const meta = TYPE_META[feedCard.card.card_type];
  const author = feedCard.author;
  return (
    <>
      {feedCard.card.image_url ? (
        <img className="feed-card__img" src={feedCard.card.image_url} alt="" draggable={false} />
      ) : (
        <span className="feed-card__img feed-card__img--empty" />
      )}
      <span className="feed-card__shade" />

      <span className="feed-card-badge">
        <span className="feed-card-badge__dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
        {meta.emoji} {meta.label}
      </span>

      <div className="feed-card__body">
        <div className="feed-card__author">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt="" draggable={false} />
          ) : (
            <span aria-hidden="true">{(author.displayName || '?').charAt(0).toUpperCase()}</span>
          )}
          <span className="feed-card__author-name">{author.displayName}</span>
        </div>
        <h3 className="feed-card__title">{feedCard.card.title}</h3>
        {feedCard.card.caption && <p className="feed-card__caption">{feedCard.card.caption}</p>}
        <div className="feed-meta">
          {feedCard.card.tags?.cuisine?.[0] && <span>{feedCard.card.tags.cuisine[0]}</span>}
          {feedCard.matchReason && <span className="feed-card-match-reason">{feedCard.matchReason}</span>}
        </div>
      </div>
    </>
  );
}
