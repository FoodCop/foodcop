'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  LocateFixed,
  Loader2,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

/** Arrow for the next turn (a fixed component, picked by the maneuver name). */
function TurnIcon({ maneuver }: { maneuver: string }) {
  const props = { size: 30, strokeWidth: 2.6 };
  if (maneuver === 'ARRIVE') return <Flag {...props} />;
  if (maneuver.includes('UTURN')) return <RotateCcw {...props} />;
  if (maneuver.includes('LEFT')) return <CornerUpLeft {...props} />;
  if (maneuver.includes('RIGHT')) return <CornerUpRight {...props} />;
  return <ArrowUp {...props} />;
}

const formatMeters = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
const formatDuration = (s: number) => {
  const min = Math.max(1, Math.round(s / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};
const arrival = (s: number) => new Date(Date.now() + s * 1000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

type Props = {
  destName: string;
  nextManeuver: string;
  nextText: string;
  thenText: string | null;
  toTurn: number | null;
  remainingM: number;
  remainingS: number;
  hasFix: boolean;
  gpsError: boolean;
  arrived: boolean;
  muted: boolean;
  following: boolean;
  googleHref: string | null;
  onToggleMute: () => void;
  onRecenter: () => void;
  onExit: () => void;
};

// Turn-by-turn screen on Scout: the next turn on top (arrow, distance, what to
// do, then what follows), trip progress at the bottom (time left, distance,
// arrival), mute, re-centre, an optional hand-off to Google Maps, and Exit.
export function ScoutNavigation(p: Props) {
  const reduceMotion = useReducedMotion();
  const rise = (from: number) => (reduceMotion ? {} : { initial: { opacity: 0, y: from }, animate: { opacity: 1, y: 0 } });

  return (
    <>
      <motion.div className={`scout-nav__banner${p.arrived ? ' is-arrived' : ''}`} role="status" aria-live="polite" {...rise(-16)}>
        {p.arrived ? (
          <>
            <span className="scout-nav__turn" aria-hidden="true">
              <Flag size={28} />
            </span>
            <div className="scout-nav__text">
              <strong className="scout-nav__instruction">You&apos;ve arrived</strong>
              <span className="scout-nav__then">{p.destName}</span>
            </div>
          </>
        ) : (
          <>
            <span className="scout-nav__turn" aria-hidden="true">
              <TurnIcon maneuver={p.nextManeuver} />
            </span>
            <div className="scout-nav__text">
              <span className="scout-nav__dist">
                {p.hasFix && p.toTurn !== null ? formatMeters(p.toTurn) : p.gpsError ? 'Waiting for GPS…' : <Loader2 size={18} className="scout-spin" aria-label="Locating" />}
              </span>
              <strong className="scout-nav__instruction">{p.nextText}</strong>
              {p.thenText && <span className="scout-nav__then">Then: {p.thenText}</span>}
            </div>
          </>
        )}
      </motion.div>

      {!p.following && !p.arrived && (
        <button type="button" className="scout-nav__recenter" onClick={p.onRecenter}>
          <LocateFixed size={17} aria-hidden="true" /> Re-centre
        </button>
      )}

      <motion.div className="scout-nav__bar" {...rise(16)}>
        <div className="scout-nav__trip">
          {p.arrived ? (
            <strong className="scout-nav__eta">Trip complete</strong>
          ) : (
            <>
              <strong className="scout-nav__eta">{formatDuration(p.remainingS)}</strong>
              <span className="scout-nav__meta">
                {formatMeters(p.remainingM)} · {arrival(p.remainingS)}
              </span>
            </>
          )}
        </div>
        <div className="scout-nav__actions">
          <button
            type="button"
            className="scout-nav__icon-btn"
            onClick={p.onToggleMute}
            aria-pressed={p.muted}
            aria-label={p.muted ? 'Turn voice on' : 'Mute voice'}
            title={p.muted ? 'Voice off' : 'Voice on'}
          >
            {p.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {p.googleHref && !p.arrived && (
            <a href={p.googleHref} target="_blank" rel="noopener noreferrer" className="scout-nav__icon-btn" aria-label="Continue in Google Maps" title="Open in Google Maps">
              <ExternalLink size={17} />
            </a>
          )}
          <button type="button" className="scout-nav__exit" onClick={p.onExit}>
            <X size={17} aria-hidden="true" /> {p.arrived ? 'Done' : 'Exit'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
