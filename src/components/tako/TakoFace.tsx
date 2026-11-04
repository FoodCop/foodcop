'use client';

import { TAKO_ART } from '@/lib/tako/openTako';
import { TakoMascot, type TakoMood } from './TakoMascot';
import { TakoSquirrel } from './TakoSquirrel';

// Tako's picture everywhere. With the client's squirrel art (TAKO_ART in
// lib/tako/openTako.ts): big spots (from 100px, the Tako landing) get the
// full animated squirrel, small ones (the dock button, the chat header,
// Tako's answer cards) the round face, which tilts while Tako is thinking.
// Without the art: the animated octopus.
export function TakoFace({
  size,
  still = false,
  mood = 'idle',
  lookAt = null,
  className = '',
}: {
  size: number;
  still?: boolean;
  mood?: TakoMood;
  lookAt?: { x: number; y: number } | null;
  className?: string;
}) {
  if (TAKO_ART) {
    if (size >= 100) return <TakoSquirrel src={TAKO_ART.body} size={size} mood={mood} lookDown={(lookAt?.y ?? 0) > 0} />;
    return (
      <img
        src={TAKO_ART.face}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={`fz-tako-face${!still && mood === 'thinking' ? ' is-thinking' : ''} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return <TakoMascot size={size} still={still} mood={mood} lookAt={lookAt} className={className} />;
}
