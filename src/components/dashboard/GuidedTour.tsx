'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// First-time guide on Home (client list #3, 2026-11-04): a spotlight walks a new
// user through the app's main places, one short line each. It waits for the
// Feed's swipe demo to finish so the two never overlap, and shows once per
// browser. Esc or Skip ends it. Styles: _dashboard.scss.

const SEEN_KEY = 'fz-guide-seen';

const STEPS = [
  { target: '.fz-dash-tabs', title: 'Your food, three ways', text: 'Bites has recipes, Feed has cards to swipe, and Trims has short videos.' },
  { target: '.fz-dash-dock__fab--tako', title: 'Meet Tako', text: 'Ask Tako what to eat or cook, or search for friends.' },
  { target: '.fz-dash-dock a[href="/scout"]', title: 'Explore', text: 'Find restaurants near you on the map.' },
  { target: '.fz-dash-dock button[aria-label="Create a post"]', title: 'Create', text: 'Share a recipe, a review or a food video.' },
  { target: '.fz-dash-dock a[href="/my-plate"]', title: 'My Plate', text: 'Everything you save ends up here.' },
  { target: '.fz-dash-dock a[href="/leaderboard"]', title: 'Rankings', text: 'Earn points and see how you rank.' },
];

type Box = { top: number; left: number; width: number; height: number };
const PAD = 6;

const seen = () => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // Storage blocked: it couldn't remember, so don't show it on every visit.
  }
};

export default function GuidedTour() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Start once the Feed has loaded and its swipe demo is over.
  useEffect(() => {
    if (seen()) return;
    let quiet = 0;
    const timer = window.setInterval(() => {
      const busy = document.querySelector('.feed-coach, .feed-card--skeleton');
      quiet = busy ? 0 : quiet + 1;
      if (quiet >= 3) {
        window.clearInterval(timer);
        setStep(0);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const finish = () => {
    setStep(null);
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Nothing to do: see seen().
    }
  };

  const next = () => {
    if (step === null) return;
    if (step >= STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  // Follow the step's target, also through resizes and scrolling.
  useEffect(() => {
    if (step === null) return;
    const measure = () => {
      const el = document.querySelector(STEPS[step].target);
      if (!el) {
        setBox(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    nextRef.current?.focus();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  if (step === null) return null;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const viewH = typeof window === 'undefined' ? 800 : window.innerHeight;
  const below = !box || box.top + box.height / 2 < viewH / 2;
  const cardStyle = !box
    ? { top: '50%', left: '50%', x: '-50%', y: '-50%' }
    : below
      ? { top: box.top + box.height + 12 }
      : { bottom: viewH - box.top + 12 };

  return (
    <div className="fz-guide" role="dialog" aria-modal="true" aria-labelledby="fz-guide-title" aria-describedby="fz-guide-text">
      {box && (
        <motion.span
          className="fz-guide__spot"
          aria-hidden="true"
          initial={false}
          animate={box}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }}
        />
      )}
      <motion.div
        key={step}
        className={`fz-guide__card${box ? '' : ' is-centred'}`}
        style={cardStyle}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="fz-guide__count">{step + 1} of {STEPS.length}</p>
        <h2 id="fz-guide-title" className="fz-guide__title">{current.title}</h2>
        <p id="fz-guide-text" className="fz-guide__text">{current.text}</p>
        <div className="fz-guide__actions">
          {!last && <button type="button" className="fz-guide__skip" onClick={finish}>Skip</button>}
          <button ref={nextRef} type="button" className="fz-guide__next" onClick={next}>{last ? 'Got it' : 'Next'}</button>
        </div>
      </motion.div>
    </div>
  );
}
