'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DNA_AXIS_META } from '@/components/profile/FoodDnaSection';
import {
  MODULES,
  blankTasteProfile,
  computeDnaScores,
  isModuleComplete,
  moduleAnsweredCount,
  personaFromScores,
  type DnaAxis,
  type Question,
  type TasteProfileState,
} from '@/lib/recommendation/dna';
import { MAX_CUISINES, MAX_FLAVOURS, TASTE_CUISINES, TASTE_DIETS, TASTE_FLAVOURS, toggleDiet } from '@/lib/onboarding/taste';
import { OnboardingService, type OnboardingData } from '@/lib/services/onboardingService';
import { Chips } from './Chips';

// I-05A "Food DNA & Flavour DNA" (client spec v1): an optional questionnaire
// that personalises recommendations and never gates anything. Screens:
// flavours -> cuisines -> diet -> the 5 Food DNA sections (FUZO's real quiz,
// lib/recommendation/dna) -> the result. Every screen saves as it is left
// (taste_profiles + user_onboarding.data), so it resumes where it stopped;
// "Skip for now" works anywhere and the reminders bring it back (phase 7).

const EASE = [0.16, 1, 0.3, 1] as const;
const FIRST_DNA = 3;
const RESULT = FIRST_DNA + MODULES.length; // 8
const AXES: DnaAxis[] = ['adventure', 'luxury', 'comfort', 'social', 'health'];

interface TasteSetupProps {
  data: OnboardingData;
  onDone: () => void;
  onSkip: () => void;
  renderSubmit: (label: string, busy: boolean) => React.ReactNode;
  /** Focused on each screen change (the host's heading). */
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export function TasteSetup({ data, onDone, onSkip, renderSubmit, headingRef }: TasteSetupProps) {
  const [step, setStep] = useState(Math.min(data.tasteStep ?? 0, RESULT));
  const [flavors, setFlavors] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [dna, setDna] = useState<TasteProfileState>(data.dna ?? blankTasteProfile());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(!!data.tasteStep);
  const ownHeading = useRef<HTMLHeadingElement>(null);
  const heading = headingRef ?? ownHeading;

  // What they picked before (resume, or Settings choices).
  useEffect(() => {
    let off = false;
    OnboardingService.loadTaste().then((t) => {
      if (off) return;
      setFlavors(t.flavors.filter((f) => TASTE_FLAVOURS.includes(f)));
      setCuisines(t.cuisines.filter((c) => TASTE_CUISINES.includes(c)));
      setDietary(t.dietary.filter((d) => TASTE_DIETS.includes(d)));
    });
    return () => {
      off = true;
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [step, heading]);

  const scores = step === RESULT ? computeDnaScores(dna) : null;
  const persona = scores ? personaFromScores(scores) : null;

  const save = async (next: number) => {
    setBusy(true);
    setError(null);
    const writes: Promise<{ success: boolean }>[] = [];
    if (!started.current) {
      started.current = true;
      writes.push(OnboardingService.setFoodPrefs('in_progress'));
    }
    if (step === 0) writes.push(OnboardingService.saveTaste({ flavors }));
    if (step === 1) writes.push(OnboardingService.saveTaste({ cuisines }));
    if (step === 2) writes.push(OnboardingService.saveTaste({ dietary }));
    writes.push(OnboardingService.saveData({ ...data, tasteStep: next, dna }));
    const results = await Promise.all(writes);
    setBusy(false);
    if (results.some((r) => !r.success)) {
      setError('That didn’t save. Check your connection and try again.');
      return false;
    }
    return true;
  };

  const next = async () => {
    if (step >= FIRST_DNA && step < RESULT) {
      const mod = MODULES[step - FIRST_DNA];
      if (!isModuleComplete(dna, mod)) {
        const left = mod.questions.length - moduleAnsweredCount(dna, mod);
        setError(`Answer ${left === 1 ? 'the last question' : `the ${left} remaining questions`} to continue - or skip for now.`);
        return;
      }
    }
    if (step === RESULT) {
      setBusy(true);
      const r1 = await OnboardingService.saveDnaResult(scores!, persona!);
      const r2 = r1.success ? await OnboardingService.setFoodPrefs('completed') : r1;
      setBusy(false);
      if (!r2.success) return setError('That didn’t save. Check your connection and try again.');
      onDone();
      return;
    }
    if (await save(step + 1)) setStep(step + 1);
  };

  const skip = async () => {
    setBusy(true);
    // Something saved already = "in progress", else "skipped"; both stamp the time.
    await OnboardingService.setFoodPrefs(started.current ? 'in_progress' : 'skipped', true);
    setBusy(false);
    onSkip();
  };

  const mod = step >= FIRST_DNA && step < RESULT ? MODULES[step - FIRST_DNA] : null;
  const titles = ['Flavours you love', 'Cuisines you enjoy', 'Dietary preferences'];
  const subs = [
    'Pick up to 5. These match the Flavour DNA every post is rated on.',
    'Pick up to 10 you’d happily eat any day.',
    'Choose any that apply, or No restrictions.',
  ];
  const title = step < FIRST_DNA ? titles[step] : mod ? `${mod.emoji} ${mod.title}` : 'Your Food DNA';
  const sub = step < FIRST_DNA ? subs[step] : mod ? mod.blurb : 'Here’s your first taste snapshot. It sharpens as you use FUZO.';

  return (
    <div className="fz-taste">
      <div className="fz-taste__progress">
        <span>
          {step + 1} of {RESULT + 1}
        </span>
        <span className="fz-taste__bar" aria-hidden="true">
          <motion.i initial={false} animate={{ width: `${((step + 1) / (RESULT + 1)) * 100}%` }} transition={{ duration: 0.3, ease: EASE }} />
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2, ease: EASE }}>
          <h1 className="fz-onb__title" tabIndex={-1} ref={heading}>
            {title}
          </h1>
          <p className="fz-onb__sub">{sub}</p>

          {step === 0 && <Chips label="Flavours" options={TASTE_FLAVOURS} value={flavors} onChange={setFlavors} max={MAX_FLAVOURS} />}
          {step === 1 && <Chips label="Cuisines" options={TASTE_CUISINES} value={cuisines} onChange={setCuisines} max={MAX_CUISINES} />}
          {step === 2 && <Chips label="Dietary preferences" options={TASTE_DIETS} value={dietary} onChange={setDietary} toggle={toggleDiet} />}

          {mod && (
            <div className="fz-taste__questions">
              {mod.questions.map((q, i) => (
                <DnaQuestion
                  key={q.id}
                  index={i}
                  question={q}
                  value={dna[mod.key][q.id]}
                  onChange={(v) => {
                    setError(null);
                    setDna((d) => ({ ...d, [mod.key]: { ...d[mod.key], [q.id]: v } }));
                  }}
                />
              ))}
            </div>
          )}

          {step === RESULT && persona && scores && (
            <div className="fz-taste__result">
              <div className="fz-taste__persona">
                <span aria-hidden="true">{persona.emoji}</span>
                <div>
                  <strong>{persona.title}</strong>
                  <p>{persona.desc}</p>
                </div>
              </div>
              <ul className="fz-taste__axes">
                {AXES.map((axis) => {
                  const meta = DNA_AXIS_META[axis];
                  return (
                    <li key={axis}>
                      <span className="fz-taste__axis">
                        <span aria-hidden="true">{meta.emoji}</span> {meta.label}
                      </span>
                      <span className="fz-taste__track" aria-hidden="true">
                        <motion.i
                          style={{ background: `linear-gradient(90deg, ${meta.from}, ${meta.to})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${scores[axis]}%` }}
                          transition={{ duration: 0.6, ease: EASE }}
                        />
                      </span>
                      <span className="fz-taste__pct">{scores[axis]}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="fz-onb__error" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {renderSubmit(step === RESULT ? 'Save my food profile' : 'Continue', busy)}
      </form>
      <div className="fz-taste__nav">
        {step > 0 ? (
          <button type="button" className="fz-onb__skip" onClick={() => setStep(step - 1)} disabled={busy}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < RESULT && (
          <button type="button" className="fz-onb__skip" onClick={skip} disabled={busy}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

function DnaQuestion({ index, question: q, value, onChange }: { index: number; question: Question; value: string | string[]; onChange: (v: string | string[]) => void }) {
  const label = `${index + 1}. ${q.text}`;
  return (
    <div className="fz-taste__q">
      <p className="fz-taste__q-text">{label}</p>
      {q.helper && <p className="fz-taste__q-help">{q.helper}</p>}
      {q.type === 'single' && <Chips single label={q.text} options={q.options} value={value ? [value as string] : []} onChange={(v) => onChange(v[0])} />}
      {q.type === 'multi' && <Chips label={q.text} options={q.options} value={(value as string[]) ?? []} onChange={onChange} max={q.max} />}
      {q.type === 'scale' && (
        <Chips single label={q.text} options={['1', '2', '3', '4', '5']} value={value ? [value as string] : []} onChange={(v) => onChange(v[0])} />
      )}
    </div>
  );
}
