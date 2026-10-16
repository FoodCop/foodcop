'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2, Sparkles, Undo2 } from 'lucide-react';
import type { AiFillState } from './useAiFill';

// What FUZO AI is doing on a details screen (client, 2026-10-16; phase 7).
// Nothing shows while AI is off - the form is simply filled in by hand.

export function AiBanner({ state, onUndo, what = 'video' }: { state: AiFillState; onUndo: () => void; what?: 'video' | 'post' }) {
  const reduceMotion = useReducedMotion();
  const show = state.status === 'working' || state.status === 'done' || state.status === 'error';
  return (
    <div role="status" aria-live="polite" className="cf-ai-live">
      <AnimatePresence>
        {show && (
          <motion.div
            className={`cf-ai cf-ai--${state.status}`}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {state.status === 'working' && (
              <>
                <Loader2 size={18} className="scout-spin" aria-hidden="true" />
                <span>FUZO AI is looking at your {what}…</span>
              </>
            )}
            {state.status === 'done' && (
              <>
                <Sparkles size={18} aria-hidden="true" />
                <span>
                  FUZO AI filled in the {state.filled.slice(0, 3).join(', ')}
                  {state.filled.length > 3 ? ' and more' : ''} - please check it.
                </span>
                <button type="button" className="cf-ai__undo" onClick={onUndo}>
                  <Undo2 size={15} aria-hidden="true" /> Undo
                </button>
              </>
            )}
            {state.status === 'error' && (
              <>
                <Sparkles size={18} aria-hidden="true" />
                <span>{state.message}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AiBanner;
