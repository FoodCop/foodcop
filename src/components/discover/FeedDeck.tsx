'use client';

import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import Link from 'next/link';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Bookmark, CalendarDays, Heart, Share2, ShoppingBag, X } from 'lucide-react';
import { partnerLinks } from '@/lib/maps/partnerLinks';
import { familyOf } from '@/lib/types/foodCard';
import type { FeedCard } from '@/lib/services/recommendationService';

// The Feed's swipe card (client, 2026-11-04: "like the Greece card"): one
// full-photo card at a time (no stack behind it, no action buttons), the
// photo fading into a soft blur at the bottom under a big title, the caption
// and a dark frosted EXPLORE pill that opens the post.
// The card follows the finger 1:1 and tilts with the sideways drag. Once a
// swipe counts (a long drag or a quick flick), the card always leaves the
// same way for that direction (client, 2026-11-04: "the sliding is random,
// use fixed movement"): left / right fly straight out sideways with a fixed
// tilt, up / down straight up / down, all at one fixed speed.
// Directions (client, 2026-10-06): left = dislike, right = like, up = share,
// down = save to My Plate. Arrow keys do the same, and screen readers get
// hidden buttons. First visit: the card shows each swipe once (`demo`).

export type SwipeDir = 'left' | 'right' | 'up' | 'down';

const DIST_X = 0.3; // share of the card width a sideways drag needs to commit
const DIST_Y = 120; // px of up/down drag that commits
const FLICK = 500; // px/s: a flick this fast commits even a short drag
const MIN_FLICK_DIST = 30; // ...as long as it moved at least this far

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Which way a drag points (the axis that moved more), or null while it's tiny. */
function dirOf(x: number, y: number): SwipeDir | null {
  if (Math.abs(x) < 12 && Math.abs(y) < 12) return null;
  return Math.abs(x) >= Math.abs(y) ? (x > 0 ? 'right' : 'left') : y < 0 ? 'up' : 'down';
}

// The first-visit demo, in this order.
const DEMO: { dir: SwipeDir; label: string; icon: typeof ArrowLeft }[] = [
  { dir: 'left', label: 'Swipe left to skip', icon: ArrowLeft },
  { dir: 'right', label: 'Swipe right to like', icon: ArrowRight },
  { dir: 'up', label: 'Swipe up to share', icon: ArrowUp },
  { dir: 'down', label: 'Swipe down to save', icon: ArrowDown },
];

export interface FeedDeckProps {
  cards: FeedCard[];
  /** The user decided on a card (fires as the throw starts). */
  onSwipe: (dir: SwipeDir, card: FeedCard) => void;
  /** Shown under the card (confirmation pill). */
  notice?: ReactNode;
  /** Show the swipe demo (new users); onDemoDone fires when it ends or is skipped. */
  demo?: boolean;
  onDemoDone?: () => void;
}

interface TopCardHandle {
  fling: (dir: SwipeDir) => void;
  /** Lean the card towards a direction and back (the demo). Resolves when back. */
  nudge: (dir: SwipeDir) => Promise<void>;
  stop: () => void;
}

export default function FeedDeck({ cards, onSwipe, notice, demo = false, onDemoDone }: FeedDeckProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const topRef = useRef<TopCardHandle>(null);
  const [demoStep, setDemoStep] = useState(0);

  const done = index >= cards.length;
  const card = done ? null : cards[index];
  const next = cards[index + 1];

  const fling = (dir: SwipeDir) => topRef.current?.fling(dir);

  const endDemo = () => {
    topRef.current?.stop();
    onDemoDone?.();
  };

  // The demo: lean the card each way in turn, with a label for each.
  useEffect(() => {
    if (!demo || reduce || !card) return;
    let cancelled = false;
    (async () => {
      await wait(700);
      for (let i = 0; i < DEMO.length && !cancelled; i++) {
        setDemoStep(i);
        await topRef.current?.nudge(DEMO[i].dir);
        if (!cancelled) await wait(250);
      }
      if (!cancelled) {
        await wait(300);
        onDemoDone?.();
      }
    })();
    return () => {
      cancelled = true;
      topRef.current?.stop();
    };
    // Runs once per demo; the card it starts on is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, reduce]);

  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, SwipeDir> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();
    if (demo) endDemo();
    fling(dir);
  }

  const step = DEMO[demoStep];
  const StepIcon = step.icon;

  return (
    <div className="feed">
      <div
        className="feed__stage"
        tabIndex={0}
        role="group"
        aria-label="Feed card. Swipe or use arrow keys: left skip, right like, up share, down save to My Plate."
        onKeyDown={onKeyDown}
      >
        {card && (
          <TopCard
            key={card.card.id}
            ref={topRef}
            card={card}
            onDecide={(dir) => onSwipe(dir, card)}
            onGone={() => setIndex((i) => i + 1)}
          />
        )}
        {/* Warm the next photo so it's there when this card goes. */}
        {next?.card.image_url && <link rel="preload" as="image" href={next.card.image_url} />}

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

        {/* First visit: how to swipe. Tap anywhere to skip. */}
        <AnimatePresence>
          {demo && card && (
            <motion.div
              className={`feed-coach${reduce ? ' feed-coach--still' : ''}`}
              role="dialog"
              aria-label="How to use the Feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={endDemo}
            >
              {reduce ? (
                <div className="feed-coach__legend">
                  {DEMO.map(({ dir, label, icon: Icon }) => (
                    <span key={dir}>
                      <Icon size={16} strokeWidth={2.6} aria-hidden="true" /> {label}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <span className={`feed-coach__finger feed-coach__finger--${step.dir}`} key={step.dir} aria-hidden="true" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={step.dir}
                      className="feed-coach__label"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      aria-live="polite"
                    >
                      <StepIcon size={16} strokeWidth={2.6} aria-hidden="true" /> {step.label}
                    </motion.span>
                  </AnimatePresence>
                </>
              )}
              <button type="button" className="feed-coach__skip" onClick={endDemo} autoFocus>
                Got it
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {notice}

      {/* No visible buttons (client); these keep every action reachable without a swipe. */}
      {!done && (
        <div className="visually-hidden">
          <button type="button" onClick={() => fling('left')}>Skip this card</button>
          <button type="button" onClick={() => fling('right')}>Like</button>
          <button type="button" onClick={() => fling('up')}>Share</button>
          <button type="button" onClick={() => fling('down')}>Save to My Plate</button>
          <span aria-live="polite">{`Card ${index + 1} of ${cards.length}`}</span>
        </div>
      )}
    </div>
  );
}

function TopCard({
  card,
  onDecide,
  onGone,
  ref,
}: {
  card: FeedCard;
  onDecide: (dir: SwipeDir) => void;
  onGone: () => void;
  ref: Ref<TopCardHandle>;
}) {
  const reduce = useReducedMotion();
  const el = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  // Tilt follows the sideways position only, the same wherever the card is held.
  const rotate = useTransform(x, (v) => Math.max(-16, Math.min(16, v / 18)));
  // The card's width, measured when a drag starts (distances scale with it).
  const cardW = useMotionValue(340);
  const busy = useRef(false);
  const armed = useRef(false);
  const running = useRef<AnimationPlaybackControls[]>([]);

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

  // A tiny buzz (Android) the moment a release would count.
  const track = () => {
    const nowArmed = strength(x.get(), y.get()) >= 1;
    if (nowArmed && !armed.current) navigator.vibrate?.(8);
    armed.current = nowArmed;
  };
  useMotionValueEvent(x, 'change', track);
  useMotionValueEvent(y, 'change', track);

  const stopAll = () => {
    running.current.forEach((c) => c.stop());
    running.current = [];
  };

  /** Send the card off-screen: one fixed path and speed per direction. */
  const throwAway = (dir: SwipeDir) => {
    if (busy.current) return;
    busy.current = true;
    stopAll();
    onDecide(dir);
    if (reduce) {
      animate(opacity, 0, { duration: 0.18 }).then(onGone);
      return;
    }
    const sideways = dir === 'left' || dir === 'right';
    const sign = dir === 'right' || dir === 'down' ? 1 : -1;
    const targetX = sideways ? sign * (window.innerWidth / 2 + cardW.get()) : 0;
    const targetY = sideways ? 0 : sign * (window.innerHeight / 2 + (el.current?.offsetHeight ?? 600));
    const t = { duration: 0.36, ease: [0.4, 0, 0.2, 1] as const };
    animate(x, targetX, t);
    animate(y, targetY, t).then(onGone);
  };

  const springBack = () => {
    const spring = { type: 'spring' as const, stiffness: 520, damping: 32 };
    running.current = [animate(x, 0, spring), animate(y, 0, spring)];
  };

  useImperativeHandle(ref, () => ({
    fling: (dir) => {
      if (el.current) cardW.set(el.current.offsetWidth);
      throwAway(dir);
    },
    nudge: async (dir) => {
      if (busy.current) return;
      if (el.current) cardW.set(el.current.offsetWidth);
      // Far enough to show the stamp clearly, never far enough to count.
      const toX = dir === 'left' || dir === 'right' ? (dir === 'right' ? 1 : -1) * cardW.get() * DIST_X * 0.8 : 0;
      const toY = dir === 'up' || dir === 'down' ? (dir === 'down' ? 1 : -1) * DIST_Y * 0.8 : 0;
      const ease = [0.33, 1, 0.68, 1] as const;
      const out = [animate(x, toX, { duration: 0.55, ease }), animate(y, toY, { duration: 0.55, ease })];
      running.current = out;
      await Promise.all(out);
      if (running.current !== out) return; // stopped
      await wait(450);
      if (running.current !== out) return;
      const back = [animate(x, 0, { duration: 0.45, ease }), animate(y, 0, { duration: 0.45, ease })];
      running.current = back;
      await Promise.all(back);
    },
    stop: () => {
      if (busy.current) return;
      stopAll();
      springBack();
    },
  }));

  const onPointerDown = () => {
    stopAll();
    if (el.current) cardW.set(el.current.offsetWidth);
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
      throwAway(dir);
      return;
    }
    springBack();
  };

  const { card: c } = card;
  // Only posts about a named restaurant get the OpenTable / Uber Eats hand-offs.
  const partners = c.place_name && !c.is_home && familyOf(c.card_type) === 'restaurant' ? partnerLinks(c.place_name, c.lat, c.lng) : null;
  return (
    <motion.article
      ref={el}
      className="feed-card"
      style={{ x, y, rotate, opacity }}
      drag
      dragMomentum={false}
      dragElastic={1}
      onPointerDown={onPointerDown}
      onDragEnd={onDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      initial={reduce ? false : { scale: 0.96 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {c.image_url ? (
        <>
          <img className="feed-card__img" src={c.image_url} alt="" draggable={false} />
          {/* The same photo, blurred, showing only at the bottom: the soft fade under the text. */}
          <img className="feed-card__blur" src={c.image_url} alt="" draggable={false} aria-hidden="true" />
        </>
      ) : (
        <span className="feed-card__img feed-card__img--empty" />
      )}
      <span className="feed-card__shade" />

      <div className="feed-card__body">
        <h3 className="feed-card__title">{c.title}</h3>
        {c.caption && <p className="feed-card__caption">{c.caption}</p>}
        <div className="feed-card__actions">
          <Link
            href={`/post/${c.id}`}
            className="feed-card__explore"
            draggable={false}
            // A press on the pill opens the post; it never starts a swipe.
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            Explore <ArrowUpRight size={16} strokeWidth={2.6} aria-hidden="true" />
          </Link>
          {partners && (
            <>
              <a
                href={partners.openTable}
                target="_blank"
                rel="noopener noreferrer"
                className="feed-card__partner"
                draggable={false}
                aria-label={`Find ${c.place_name} on OpenTable (opens a new tab)`}
                onPointerDownCapture={(e) => e.stopPropagation()}
              >
                <CalendarDays size={15} aria-hidden="true" /> OpenTable
              </a>
              <a
                href={partners.uberEats}
                target="_blank"
                rel="noopener noreferrer"
                className="feed-card__partner"
                draggable={false}
                aria-label={`Find ${c.place_name} on Uber Eats (opens a new tab)`}
                onPointerDownCapture={(e) => e.stopPropagation()}
              >
                <ShoppingBag size={15} aria-hidden="true" /> Uber Eats
              </a>
            </>
          )}
        </div>
      </div>

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
