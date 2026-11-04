'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { TakoMood } from './TakoMascot';

// Tako the squirrel, big (the Tako landing; client art 2026-11-04). The art
// is a still image, so the life comes from around it: a warm halo that
// breathes, a dashed ring with three little foods slowly orbiting, and the
// squirrel itself floating gently. Moods: happy = a hop, thinking = a head
// tilt back and forth, looking down (the ask bar is focused) = a lean
// towards it. It also reacts: a tap makes it hop, and it turns in 3D
// towards the pointer (a finger drag on phones). Reduced motion: the still
// picture only. Styles: _tako-home.scss. A Rive file (docs/TAKO_RIVE_BRIEF.md)
// will replace this with a real wave and jump.

const FOODS = ['🥐', '🍓', '🌰'];

export function TakoSquirrel({
  src,
  size,
  mood = 'idle',
  lookDown = false,
}: {
  src: string;
  size: number;
  mood?: TakoMood;
  lookDown?: boolean;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);

  // Tap: a hop (the same as the happy pose), once per tap.
  const [hop, setHop] = useState(0);
  const hopping = hop > 0;
  useEffect(() => {
    if (!hop) return;
    const t = window.setTimeout(() => setHop(0), 720);
    return () => window.clearTimeout(t);
  }, [hop]);

  // 3D turn towards the pointer, -1..1 on each axis from the squirrel's centre.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 14 });
  const sy = useSpring(py, { stiffness: 120, damping: 14 });
  const rotateY = useTransform(sx, (v) => v * 16);
  const rotateX = useTransform(sy, (v) => v * -10);
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      px.set(clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      py.set(clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
    };
    const reset = () => {
      px.set(0);
      py.set(0);
    };
    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', reset);
    };
  }, [reduce, px, py]);

  // The squirrel's pose for each mood (the float runs on a wrapper underneath).
  const pose =
    hopping || mood === 'happy'
      ? { y: [0, -16, 0, -6, 0], rotate: [0, -4, 0, 2, 0], scale: [1, 1.05, 1, 1.02, 1] }
      : mood === 'thinking'
        ? { y: 0, rotate: [0, -6, 0, 6, 0], scale: 1 }
        : lookDown
          ? { y: 6, rotate: 5, scale: 1 }
          : { y: 0, rotate: 0, scale: 1 };
  const poseTransition =
    hopping || mood === 'happy'
      ? { duration: 0.7, ease: 'easeOut' as const }
      : mood === 'thinking'
        ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const }
        : { type: 'spring' as const, stiffness: 260, damping: 18 };

  return (
    <div
      ref={box}
      className="tako-squirrel"
      style={{ width: size, height: size }}
      aria-hidden="true"
      onPointerDown={() => !reduce && setHop((n) => n + 1)}
    >
      {!reduce && (
        <>
          <motion.span
            className="tako-squirrel__halo"
            animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="tako-squirrel__orbit"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            {FOODS.map((food, i) => (
              <span key={food} className="tako-squirrel__food" style={{ transform: `rotate(${i * 120}deg) translateY(-${size * 0.54}px)` }}>
                {/* Counter-turn so each food stays upright while the ring spins. */}
                <motion.span
                  style={{ display: 'inline-block', rotate: -i * 120 }}
                  animate={{ rotate: [-i * 120, -i * 120 - 360] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                >
                  {food}
                </motion.span>
              </span>
            ))}
          </motion.span>
        </>
      )}
      {reduce && <span className="tako-squirrel__halo" />}

      <motion.div
        className="tako-squirrel__float"
        style={reduce ? undefined : { rotateX, rotateY }}
        initial={reduce ? false : { scale: 0.7, opacity: 0, y: 20 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1, y: [0, -7, 0] }}
        transition={
          reduce
            ? undefined
            : {
                scale: { type: 'spring', stiffness: 220, damping: 14 },
                opacity: { duration: 0.3 },
                y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
              }
        }
      >
        <motion.img
          key={hop}
          className="tako-squirrel__img"
          src={src}
          alt=""
          width={size}
          height={size}
          draggable={false}
          animate={reduce ? undefined : pose}
          transition={poseTransition}
        />
      </motion.div>
    </div>
  );
}
