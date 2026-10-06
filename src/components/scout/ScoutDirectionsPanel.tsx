'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUp,
  Bike,
  Car,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CornerUpLeft,
  CornerUpRight,
  Crosshair,
  Flag,
  Footprints,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  RotateCcw,
  Star,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { TravelMode } from '@/lib/services/placesService';
import { googleDirectionsUrl } from '@/lib/maps/placeLinks';
import type { ScoutPlace } from '@/types/scout';
import type { AlongStatus, DirFrom, DirStatus, DirTarget } from './useScoutDirections';
import { usePlaceSearch, type PlaceSuggestion } from './usePlaceSearch';
import { SourceBadge, placeOrigin } from './SourceBadge';

const MODES: Array<{ key: TravelMode; label: string; icon: LucideIcon }> = [
  { key: 'DRIVE', label: 'Car', icon: Car },
  { key: 'TWO_WHEELER', label: 'Bike', icon: Bike },
  { key: 'WALK', label: 'Walk', icon: Footprints },
];

const maneuverIcon = (m: string): LucideIcon => {
  if (m.includes('UTURN')) return RotateCcw;
  if (m.includes('LEFT')) return CornerUpLeft;
  if (m.includes('RIGHT')) return CornerUpRight;
  return ArrowUp;
};

const arrivalTime = (seconds: number) =>
  new Date(Date.now() + seconds * 1000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

type Props = {
  target: DirTarget | null;
  from: DirFrom;
  gps: { lat: number; lng: number } | null;
  mode: TravelMode;
  onModeChange: (m: TravelMode) => void;
  onTargetChange: (t: DirTarget) => void;
  onFromChange: (f: DirFrom) => void;
  status: DirStatus;
  alongWay: boolean;
  onAlongWayChange: (on: boolean) => void;
  alongStatus: AlongStatus;
  onSelectPlace: (place: ScoutPlace) => void;
  onRetry: () => void;
  onClose: () => void;
  /** In-app turn-by-turn navigation. */
  onStart: () => void;
  /** Choose From / To by pinning it on the map. */
  onPickOnMap: (which: 'from' | 'to') => void;
  /** Folded down to one summary line so the map shows. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

// The Directions panel on Scout (it replaced the old Route Planner): From
// (your location, or search any place) -> To, Car / Bike / Walk, time +
// distance + arrival, Start (in-app turn-by-turn; Google Maps is a secondary
// button), steps, and "Food along the way". Bottom sheet on phones, card on
// desktop; the handle folds it to one line so the whole route shows.
export function ScoutDirectionsPanel(props: Props) {
  const { target, from, gps, mode, onModeChange, onTargetChange, onFromChange, status, alongWay, onAlongWayChange, alongStatus, onSelectPlace, onRetry, onClose, onStart, collapsed, onToggleCollapsed, onPickOnMap } = props;
  const reduceMotion = useReducedMotion();
  const [showSteps, setShowSteps] = useState(false);
  // Which field is being typed in. With no destination yet, "To" starts open.
  const [editing, setEditing] = useState<'from' | 'to' | null>(target ? null : 'to');

  const googleHref =
    target &&
    googleDirectionsUrl(target, {
      origin: from.kind === 'gps' ? gps ?? undefined : from.kind === 'point' ? { lat: from.lat, lng: from.lng } : { name: from.name, placeId: from.placeId },
      mode,
      navigate: true,
    });

  return (
    <motion.section
      className="scout-dir"
      aria-label={target ? `Directions to ${target.name}` : 'Directions'}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className="scout-dir__handle"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show directions details' : 'Hide directions details to see the map'}
      >
        <span className="scout-dir__grip" aria-hidden="true" />
        {collapsed ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>

      {collapsed ? (
        <div className="scout-dir__mini">
          <button type="button" className="scout-dir__mini-text" onClick={onToggleCollapsed}>
            {status.status === 'ready' ? (
              <>
                <strong className="scout-dir__mini-time">{status.route.duration}</strong>
                <span>
                  {status.route.distance} · to {target?.name}
                </span>
              </>
            ) : (
              <>
                <strong>{target ? target.name : 'Directions'}</strong>
                <span>Tap to see details</span>
              </>
            )}
          </button>
          {status.status === 'ready' && (
            <button type="button" className="scout-dir__start" onClick={onStart}>
              <Navigation size={17} aria-hidden="true" /> Start
            </button>
          )}
          <button type="button" className="scout-dir__close" onClick={onClose} aria-label="Close directions">
            <X size={18} />
          </button>
        </div>
      ) : (
      <>
      <div className="scout-dir__head">
        <div className="scout-dir__trip">
          <TripField
            kind="from"
            label={from.kind === 'gps' ? 'Your location' : from.name}
            placeholder="Choose starting point"
            editing={editing === 'from'}
            onEdit={() => setEditing('from')}
            onDone={() => setEditing(null)}
            bias={gps}
            offerMyLocation={from.kind !== 'gps'}
            onPickOnMap={() => {
              setEditing(null);
              onPickOnMap('from');
            }}
            onPick={(s) => {
              onFromChange(s ? { kind: 'place', name: s.text, placeId: s.placeId } : { kind: 'gps' });
              setEditing(null);
            }}
          />
          <TripField
            kind="to"
            label={target?.name ?? ''}
            placeholder="Where to? Search a place"
            editing={editing === 'to'}
            onEdit={() => setEditing('to')}
            onDone={() => setEditing(target ? null : 'to')}
            bias={gps}
            onPickOnMap={() => {
              setEditing(null);
              onPickOnMap('to');
            }}
            onPick={(s) => {
              if (!s) return;
              onTargetChange({ name: s.text, placeId: s.placeId });
              setEditing(null);
            }}
          />
        </div>
        <button type="button" className="scout-dir__close" onClick={onClose} aria-label="Close directions">
          <X size={18} />
        </button>
      </div>

      <div className="scout-dir__modes" role="group" aria-label="Travel mode">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" className="scout-dir__mode" aria-pressed={mode === key} onClick={() => onModeChange(key)}>
            <Icon size={17} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="scout-dir__body" aria-live="polite">
        {status.status === 'pick' && <p className="scout-dir__note">Search for where you want to go.</p>}
        {status.status === 'locating' && (
          <p className="scout-dir__note">
            <Loader2 size={18} className="scout-spin" aria-hidden="true" /> Finding your location…
          </p>
        )}
        {status.status === 'routing' && (
          <p className="scout-dir__note">
            <Loader2 size={18} className="scout-spin" aria-hidden="true" /> Finding the best route…
          </p>
        )}
        {status.status === 'no-location' && (
          <div className="scout-dir__problem">
            <p>
              {status.denied
                ? 'Location is blocked. Allow location for FUZO in your browser, or tap "Your location" above to start from a place you choose.'
                : "Couldn't get your location. Check that location is on, or start from a place you choose."}
            </p>
            <button type="button" className="scout-dir__btn" onClick={onRetry}>
              <LocateFixed size={16} /> Try again
            </button>
          </div>
        )}
        {status.status === 'error' && (
          <div className="scout-dir__problem">
            <p>{status.message}</p>
            <button type="button" className="scout-dir__btn" onClick={onRetry}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}
        {status.status === 'ready' && (
          <div className="scout-dir__scroll">
            <div className="scout-dir__summary">
              <div>
                <p className="scout-dir__time">{status.route.duration}</p>
                <p className="scout-dir__meta">
                  {status.route.distance}
                  {status.route.seconds > 0 && <> · Arrive {arrivalTime(status.route.seconds)}</>}
                </p>
              </div>
              <div className="scout-dir__go">
                {googleHref && (
                  <a href={googleHref} target="_blank" rel="noopener noreferrer" className="scout-dir__gmaps" aria-label="Open in Google Maps" title="Open in Google Maps">
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                )}
                <button type="button" className="scout-dir__start" onClick={onStart}>
                  <Navigation size={17} aria-hidden="true" /> Start
                </button>
              </div>
            </div>

            {/* Food along the way */}
            <button type="button" role="switch" aria-checked={alongWay} className="scout-dir__along" onClick={() => onAlongWayChange(!alongWay)}>
              <span className="scout-dir__along-icon" aria-hidden="true">
                <UtensilsCrossed size={16} />
              </span>
              <span className="scout-dir__along-text">
                <strong>Food along the way</strong>
                <span>Restaurants close to this route</span>
              </span>
              <span className="scout-dir__switch" aria-hidden="true" />
            </button>
            {alongStatus.status === 'loading' && (
              <p className="scout-dir__note">
                <Loader2 size={16} className="scout-spin" aria-hidden="true" /> Finding spots along your route…
              </p>
            )}
            {alongStatus.status === 'error' && <p className="scout-dir__note">Couldn&apos;t load places along this route.</p>}
            {alongStatus.status === 'ready' &&
              (alongStatus.places.length === 0 ? (
                <p className="scout-dir__note">No restaurants found along this route.</p>
              ) : (
                <>
                  <p className="scout-dir__along-count">{alongStatus.places.length} spots along the way · tap a pin or a spot</p>
                  <ul className="scout-dir__spots">
                    {alongStatus.places.slice(0, 8).map((p) => (
                      <li key={p.id}>
                        <button type="button" className="scout-dir__spot" onClick={() => onSelectPlace(p)}>
                          <span className="scout-dir__spot-photo">
                            <img src={p.img} alt="" loading="lazy" />
                            <SourceBadge origin={placeOrigin(p)} className="scout-dir__spot-badge" />
                          </span>
                          <span className="scout-dir__spot-text">
                            <strong>{p.name}</strong>
                            <span>
                              {p.rating > 0 && (
                                <>
                                  <Star size={11} fill="currentColor" aria-hidden="true" /> {p.rating.toFixed(1)} ·{' '}
                                </>
                              )}
                              {p.address}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ))}

            {status.route.steps.length > 0 && (
              <>
                <button
                  type="button"
                  className="scout-dir__steps-toggle"
                  aria-expanded={showSteps}
                  aria-controls="scout-dir-steps"
                  onClick={() => setShowSteps((v) => !v)}
                >
                  {showSteps ? 'Hide steps' : `Steps (${status.route.steps.length})`}
                  <ChevronDown size={16} aria-hidden="true" className={showSteps ? 'is-open' : undefined} />
                </button>
                <AnimatePresence initial={false}>
                  {showSteps && (
                    <motion.ol
                      id="scout-dir-steps"
                      className="scout-dir__steps"
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {status.route.steps.map((step, i) => {
                        const Icon = maneuverIcon(step.maneuver);
                        return (
                          <li key={i} className="scout-dir__step">
                            <span className="scout-dir__step-icon" aria-hidden="true">
                              <Icon size={16} />
                            </span>
                            <span className="scout-dir__step-text">{step.text}</span>
                            {step.distance && <span className="scout-dir__step-dist">{step.distance}</span>}
                          </li>
                        );
                      })}
                      <li className="scout-dir__step scout-dir__step--end">
                        <span className="scout-dir__step-icon" aria-hidden="true">
                          <Flag size={16} />
                        </span>
                        <span className="scout-dir__step-text">Arrive at {target?.name}</span>
                      </li>
                    </motion.ol>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>
      </>
      )}
    </motion.section>
  );
}

/** One row of the trip header: shows the place, tap to search another. */
function TripField({
  kind,
  label,
  placeholder,
  editing,
  onEdit,
  onDone,
  onPick,
  bias,
  offerMyLocation = false,
  onPickOnMap,
}: {
  kind: 'from' | 'to';
  label: string;
  placeholder: string;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  /** null = "Your location". */
  onPick: (s: PlaceSuggestion | null) => void;
  bias: { lat: number; lng: number } | null;
  offerMyLocation?: boolean;
  onPickOnMap: () => void;
}) {
  const [text, setText] = useState('');
  const { suggestions, search, clear } = usePlaceSearch(bias);
  const listId = `scout-dir-${kind}-list`;
  const marker =
    kind === 'from' ? <span className="scout-dir__dot" aria-hidden="true" /> : <MapPin size={15} className="scout-dir__pin" aria-hidden="true" />;

  const pick = (s: PlaceSuggestion | null) => {
    setText('');
    clear();
    onPick(s);
  };

  if (!editing) {
    return (
      <button type="button" className={`scout-dir__field scout-dir__field--${kind}`} onClick={onEdit} aria-label={`${kind === 'from' ? 'From' : 'To'}: ${label || placeholder}. Change`}>
        {marker}
        <span className={label ? 'scout-dir__field-label' : 'scout-dir__field-label is-empty'}>{label || placeholder}</span>
      </button>
    );
  }

  const showMine = offerMyLocation && !text.trim();
  return (
    <div className={`scout-dir__field scout-dir__field--${kind} is-editing`}>
      {marker}
      <input
        type="text"
        // Opening a field to type in is the user's own tap, so moving focus there is expected.
        autoFocus
        value={text}
        placeholder={placeholder}
        aria-label={kind === 'from' ? 'Starting point' : 'Destination'}
        role="combobox"
        aria-expanded
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          setText(e.target.value);
          search(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setText('');
            clear();
            onDone();
          }
          if (e.key === 'Enter' && suggestions[0]) pick(suggestions[0]);
        }}
        onBlur={() => window.setTimeout(onDone, 180)}
      />
      <ul id={listId} className="scout-dir__suggest" role="listbox">
          {showMine && (
            <li role="option" aria-selected="false">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(null)}>
                <LocateFixed size={15} aria-hidden="true" /> Your location
              </button>
            </li>
          )}
          {suggestions.map((s) => (
            <li key={`${s.placeId}-${s.text}`} role="option" aria-selected="false">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                <MapPin size={15} aria-hidden="true" /> <span>{s.text}</span>
              </button>
            </li>
          ))}
          <li role="option" aria-selected="false">
            <button type="button" className="scout-dir__suggest-map" onMouseDown={(e) => e.preventDefault()} onClick={onPickOnMap}>
              <Crosshair size={15} aria-hidden="true" /> <span>Choose on map</span>
            </button>
          </li>
      </ul>
    </div>
  );
}
