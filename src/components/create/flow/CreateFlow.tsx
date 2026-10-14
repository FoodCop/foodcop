'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { CameraCapture } from './CameraCapture';
import { KindPicker, KIND_OPTIONS } from './KindPicker';
import type { CreateKind, CreateMode, CreatePhoto, CreateStep } from './types';

// The Create flow (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md):
// camera -> "What is this?" -> that kind's details -> Post. This component
// holds the photos and answers, so Back never loses anything, and asks
// before throwing away a post in progress. Phase 1 builds the camera and the
// kind step; each kind's details arrive in later phases.

interface CreateFlowProps {
  onClose: () => void;
  /** Pre-selects a kind on the "What is this?" step (e.g. Profile's "Add a recipe"). */
  initialKind?: CreateKind;
  /** Opens on a tab other than Photo (e.g. Profile's "Add a video"). */
  initialMode?: CreateMode;
}

const STEPS: { id: CreateStep; label: string }[] = [
  { id: 'capture', label: 'Photos' },
  { id: 'kind', label: 'Type' },
  { id: 'details', label: 'Details' },
];

// What each kind will ask for - shown on the details step until that kind's
// phase is built.
const COMING_NEXT: Record<CreateKind, string[]> = {
  vibe: ['Location (search or map pin)', 'Meal type, Dietary', 'Business identity (pick several or add your own)'],
  food: ['At home, or the restaurant and location', 'Food name (from the menu, or your own)', 'Meal, Dietary, Price, Cooking style, Flavour', 'Tags like Must-Try Dish'],
  recipe: ['Food name and cuisine', 'Ingredients and steps', 'Meal, Dietary, Cooking style, Flavour'],
  restaurant: ['Pick the restaurant, or add a new one', 'Caption and tags', 'Photos go to its gallery'],
};

export function CreateFlow({ onClose, initialKind, initialMode = 'photo' }: CreateFlowProps) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(true);
  const [step, setStep] = useState<CreateStep>('capture');
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const [photos, setPhotos] = useState<CreatePhoto[]>([]);
  const [kind, setKind] = useState<CreateKind | null>(initialKind ?? null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [direction, setDirection] = useState(1);

  // Free the preview URLs when photos are removed or the flow closes.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const requestClose = useCallback(() => {
    if (photos.length > 0) setConfirmDiscard(true);
    else onClose();
  }, [photos.length, onClose]);

  const goTo = (next: CreateStep) => {
    setDirection(STEPS.findIndex((s) => s.id === next) > STEPS.findIndex((s) => s.id === step) ? 1 : -1);
    setStep(next);
  };

  const goBack = () => {
    if (step === 'details') goTo('kind');
    else if (step === 'kind') goTo('capture');
    else requestClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDiscard) setConfirmDiscard(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDiscard, requestClose]);

  const addPhotos = (added: CreatePhoto[]) => setPhotos((prev) => [...prev, ...added]);
  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const kindLabel = KIND_OPTIONS.find((k) => k.id === kind)?.label ?? '';
  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 40 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 * direction },
      };

  return createPortal(
    <div ref={trapRef} className={`cf${step === 'capture' ? ' cf--camera' : ''}`} role="dialog" aria-modal="true" aria-label="Create a post">
      {step !== 'capture' && (
        <header className="cf__head">
          <button type="button" className="cf__icon" onClick={goBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="cf__titles">
            <h1 className="cf__title">{step === 'kind' ? 'What is this?' : `${kindLabel} details`}</h1>
            <ol className="cf__progress" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
              {STEPS.map((s, i) => (
                <li key={s.id} className={i <= stepIndex ? 'is-done' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
                  <span className="visually-hidden">{s.label}</span>
                </li>
              ))}
            </ol>
          </div>
          <button type="button" className="cf__icon" onClick={requestClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
      )}

      <div className="cf__body">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div key={step} className="cf__step" {...slide} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {step === 'capture' && (
              <CameraCapture
                mode={mode}
                onModeChange={setMode}
                photos={photos}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                onNext={() => goTo('kind')}
                onClose={requestClose}
              />
            )}

            {step === 'kind' && (
              <KindPicker
                photos={photos}
                selected={kind}
                onPick={(k) => {
                  setKind(k);
                  goTo('details');
                }}
              />
            )}

            {step === 'details' && kind && (
              <div className="cf-soon">
                <ul className="cf-kind__photos" aria-label="Your photos">
                  {photos.map((p, i) => (
                    <li key={p.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={`Photo ${i + 1}`} />
                    </li>
                  ))}
                </ul>
                <div className="cf-soon__card">
                  <span className="cf-soon__badge">Coming next</span>
                  <h2 className="cf-soon__title">{kindLabel} posts</h2>
                  <p className="cf-soon__sub">This step is being built. It will ask for:</p>
                  <ul className="cf-soon__list">
                    {COMING_NEXT[kind].map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmDiscard && (
          <motion.div
            className="cf-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDiscard(false)}
          >
            <motion.div
              className="cf-confirm__sheet"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cf-confirm-title"
              aria-describedby="cf-confirm-text"
              initial={reduceMotion ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="cf-confirm-title" className="cf-confirm__title">Discard post?</h2>
              <p id="cf-confirm-text" className="cf-confirm__text">
                Your {photos.length === 1 ? 'photo' : `${photos.length} photos`} and anything you&apos;ve filled in will be lost.
              </p>
              <div className="cf-confirm__actions">
                <button type="button" className="cf-confirm__btn cf-confirm__btn--danger" onClick={onClose}>
                  Discard
                </button>
                <button type="button" className="cf-confirm__btn" onClick={() => setConfirmDiscard(false)} autoFocus>
                  Keep editing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

export default CreateFlow;
