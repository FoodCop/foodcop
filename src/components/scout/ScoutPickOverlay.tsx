'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, Loader2, MapPin } from 'lucide-react';
import type { PickState } from './useScoutDirections';

// "Choose on map" for Directions' From / To: a pin fixed at the centre of the
// map; the user drags the map (or taps a spot) to put the place under it. The
// card shows the address under the pin and confirms it.
export function ScoutPickOverlay({ pick, onConfirm, onCancel }: { pick: PickState; onConfirm: () => void; onCancel: () => void }) {
  const reduceMotion = useReducedMotion();
  const label = pick.which === 'from' ? 'Set as starting point' : 'Set as destination';

  return (
    <>
      <p className="scout-pick__hint" role="status">
        Move the map to place the pin {pick.which === 'from' ? 'on your start' : 'on where you want to go'}
      </p>

      <span className={`scout-pick__pin scout-pick__pin--${pick.which}`} aria-hidden="true">
        <MapPin size={44} strokeWidth={2.2} />
        <span className="scout-pick__shadow" />
      </span>

      <motion.div
        className="scout-pick__card"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="scout-pick__label">{pick.which === 'from' ? 'Starting point' : 'Destination'}</p>
        <p className="scout-pick__address" aria-live="polite">
          {pick.loading && !pick.address ? (
            <>
              <Loader2 size={15} className="scout-spin" aria-hidden="true" /> Finding the address…
            </>
          ) : (
            pick.address || 'Pinned spot'
          )}
        </p>
        <div className="scout-pick__actions">
          <button type="button" className="scout-pick__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="scout-pick__confirm" onClick={onConfirm}>
            <Check size={17} aria-hidden="true" /> {label}
          </button>
        </div>
      </motion.div>
    </>
  );
}
