'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';

// Tako's face (client, 2026-10-07: "a 3D mascot face"): a glossy orange
// octopus in a little chef's hat, drawn as an SVG with radial-gradient
// shading so it reads as 3D without loading a model. It floats, blinks,
// sways its tentacles, follows the pointer with its eyes, waves hello when
// it first appears and reacts to what you do:
//   idle      - floating, looking at the pointer (or `lookAt`)
//   happy     - a quick hop, ^ ^ eyes and an open smile (an option was picked)
//   thinking  - head tilted, eyes up and to the side, small "o" mouth (waiting on an answer)
// `still` draws the same face with no motion (small avatars in the chat).
export type TakoMood = 'idle' | 'happy' | 'thinking';

interface TakoMascotProps {
  mood?: TakoMood;
  size?: number;
  /** Where the eyes look, -1..1 on each axis; overrides pointer tracking. */
  lookAt?: { x: number; y: number } | null;
  still?: boolean;
  className?: string;
}

const PUPIL_RANGE = 6;

export function TakoMascot({ mood = 'idle', size = 168, lookAt = null, still = false, className = '' }: TakoMascotProps) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `tako-${uid}-${name}`;
  const reduceMotion = useReducedMotion();
  const animated = !still && !reduceMotion;
  const svgRef = useRef<SVGSVGElement>(null);

  const pupilX = useSpring(0, { stiffness: 180, damping: 18 });
  const pupilY = useSpring(0, { stiffness: 180, damping: 18 });

  // Eyes follow the pointer, unless told where to look or the mood decides.
  useEffect(() => {
    if (mood === 'thinking') {
      pupilX.set(PUPIL_RANGE * 0.7);
      pupilY.set(-PUPIL_RANGE * 0.8);
      return;
    }
    if (lookAt) {
      pupilX.set(lookAt.x * PUPIL_RANGE);
      pupilY.set(lookAt.y * PUPIL_RANGE);
      return;
    }
    pupilX.set(0);
    pupilY.set(0);
    if (!animated) return;
    const onMove = (e: PointerEvent) => {
      const box = svgRef.current?.getBoundingClientRect();
      if (!box) return;
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height * 0.45);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / 260);
      pupilX.set((dx / dist) * reach * PUPIL_RANGE);
      pupilY.set((dy / dist) * reach * PUPIL_RANGE);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mood, lookAt, animated, pupilX, pupilY]);

  // Waves hello for a couple of seconds after it appears.
  const [waving, setWaving] = useState(animated);
  useEffect(() => {
    if (!waving) return;
    const t = setTimeout(() => setWaving(false), 2600);
    return () => clearTimeout(t);
  }, [waving]);

  const happy = mood === 'happy';
  const thinking = mood === 'thinking';

  const floatAnim = !animated
    ? undefined
    : happy
      ? { y: [0, -16, 0, -6, 0], transition: { duration: 0.8, ease: 'easeOut' as const } }
      : { y: [0, -7, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const } };

  const swing = (i: number) =>
    animated
      ? {
          rotate: [0, i % 2 ? 6 : -6, 0],
          transition: { duration: 2.4 + i * 0.35, repeat: Infinity, ease: 'easeInOut' as const, delay: i * 0.2 },
        }
      : undefined;

  const tentacle = { transformBox: 'fill-box' as const, transformOrigin: '50% 0%' };

  const tentacles = [
    'M80 132 C64 156 46 164 42 182 C39 195 52 199 57 189',
    'M94 142 C88 164 80 178 83 196',
    'M110 146 C110 168 107 182 111 199',
    'M126 142 C132 164 140 178 137 196',
  ];
  // The right-hand tentacle is the one that waves.
  const waveTentacle = 'M140 132 C156 156 174 164 178 182 C181 195 168 199 163 189';

  return (
    <svg
      ref={svgRef}
      className={`tako-mascot${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 220 220"
      role="img"
      aria-label="Tako, FUZO's food assistant"
    >
      <defs>
        <radialGradient id={id('body')} cx="38%" cy="30%" r="78%">
          <stop offset="0" stopColor="#FFE09A" />
          <stop offset="0.32" stopColor="#FFA94D" />
          <stop offset="0.72" stopColor="#F2692F" />
          <stop offset="1" stopColor="#C4411C" />
        </radialGradient>
        <radialGradient id={id('tent')} cx="40%" cy="10%" r="95%">
          <stop offset="0" stopColor="#FFB565" />
          <stop offset="0.55" stopColor="#EF6C31" />
          <stop offset="1" stopColor="#B83C1A" />
        </radialGradient>
        <linearGradient id={id('under')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#8A2A0E" stopOpacity="0" />
          <stop offset="1" stopColor="#8A2A0E" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={id('eye')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#FBFAFC" />
          <stop offset="1" stopColor="#DCD6E2" />
        </radialGradient>
        <radialGradient id={id('pupil')} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#4B3B33" />
          <stop offset="1" stopColor="#120D0B" />
        </radialGradient>
        <radialGradient id={id('cheek')}>
          <stop offset="0" stopColor="#FF5F7A" stopOpacity="0.6" />
          <stop offset="1" stopColor="#FF5F7A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('hat')} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.65" stopColor="#F3F0EA" />
          <stop offset="1" stopColor="#D6CFC2" />
        </radialGradient>
        <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Ground shadow: shrinks as Tako rises. */}
      <motion.ellipse
        cx="110"
        cy="208"
        rx="52"
        ry="7"
        fill="rgba(0,0,0,0.13)"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={animated && !happy ? { scaleX: [1, 0.86, 1], opacity: [1, 0.75, 1] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.g animate={floatAnim} key={happy ? 'hop' : 'float'}>
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 60%' }}
          animate={{ rotate: thinking ? 6 : 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        >
          {/* Tentacles, behind the head */}
          {tentacles.map((d, i) => (
            <motion.g key={d} style={tentacle} animate={swing(i)}>
              <path d={d} stroke={`url(#${id('tent')})`} strokeWidth="20" strokeLinecap="round" fill="none" />
            </motion.g>
          ))}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}
            animate={
              waving
                ? { rotate: [0, -38, -8, -38, -8, 0], transition: { duration: 2.4, ease: 'easeInOut' } }
                : swing(4)
            }
          >
            <path d={waveTentacle} stroke={`url(#${id('tent')})`} strokeWidth="20" strokeLinecap="round" fill="none" />
          </motion.g>
          {/* Suckers peeking out under the tentacle tips */}
          <g fill="#FFD2A6" opacity="0.85">
            <circle cx="50" cy="186" r="3" />
            <circle cx="83" cy="188" r="2.6" />
            <circle cx="111" cy="191" r="2.6" />
            <circle cx="137" cy="188" r="2.6" />
          </g>

          {/* Head */}
          <ellipse cx="110" cy="100" rx="72" ry="66" fill={`url(#${id('body')})`} />
          <ellipse cx="110" cy="100" rx="72" ry="66" fill={`url(#${id('under')})`} />
          {/* Spots */}
          <g fill="#D9542A" opacity="0.45">
            <circle cx="66" cy="78" r="6" />
            <circle cx="58" cy="96" r="3.5" />
            <circle cx="158" cy="72" r="5" />
            <circle cx="166" cy="92" r="3.5" />
          </g>
          {/* Gloss */}
          <ellipse cx="80" cy="62" rx="20" ry="10" fill="#fff" opacity="0.55" transform="rotate(-28 80 62)" filter={`url(#${id('soft')})`} />
          <circle cx="98" cy="50" r="3.2" fill="#fff" opacity="0.75" />

          {/* Chef's hat */}
          <g transform="rotate(-8 110 34)">
            <circle cx="95" cy="22" r="13" fill={`url(#${id('hat')})`} />
            <circle cx="125" cy="22" r="13" fill={`url(#${id('hat')})`} />
            <circle cx="110" cy="13" r="15" fill={`url(#${id('hat')})`} />
            <rect x="88" y="24" width="44" height="16" rx="5" fill={`url(#${id('hat')})`} stroke="#D9D2C5" strokeWidth="1" />
          </g>

          {/* Cheeks */}
          <ellipse cx="62" cy="128" rx="15" ry="9" fill={`url(#${id('cheek')})`} />
          <ellipse cx="158" cy="128" rx="15" ry="9" fill={`url(#${id('cheek')})`} />

          {/* Eyes */}
          {happy ? (
            <g stroke="#2A1610" strokeWidth="6" strokeLinecap="round" fill="none">
              <path d="M70 108 Q84 90 98 108" />
              <path d="M122 108 Q136 90 150 108" />
            </g>
          ) : (
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              animate={animated ? { scaleY: [1, 1, 0.08, 1] } : undefined}
              transition={{ duration: 0.32, times: [0, 0.4, 0.6, 1], repeat: Infinity, repeatDelay: 3.4 }}
            >
              {[84, 136].map((cx) => (
                <g key={cx}>
                  <ellipse cx={cx} cy="104" rx="20" ry="23" fill={`url(#${id('eye')})`} stroke="rgba(120,40,12,0.25)" strokeWidth="1.5" />
                  <motion.g style={{ x: pupilX, y: pupilY }}>
                    <circle cx={cx} cy="106" r="11.5" fill={`url(#${id('pupil')})`} />
                    <circle cx={cx - 4} cy="101" r="4" fill="#fff" />
                    <circle cx={cx + 4} cy="110" r="1.8" fill="#fff" opacity="0.85" />
                  </motion.g>
                </g>
              ))}
            </motion.g>
          )}

          {/* Mouth */}
          {happy ? (
            <g>
              <path d="M97 127 Q110 150 123 127 Z" fill="#7A2312" />
              <ellipse cx="110" cy="139" rx="7" ry="4" fill="#FF7A8A" />
            </g>
          ) : thinking ? (
            <ellipse cx="118" cy="133" rx="5" ry="6" fill="#7A2312" />
          ) : (
            <path d="M99 129 Q110 140 121 129" stroke="#6A200F" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          )}
        </motion.g>
      </motion.g>
    </svg>
  );
}

export default TakoMascot;
