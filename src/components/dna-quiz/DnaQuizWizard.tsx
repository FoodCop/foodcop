'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MultiChips, ToggleButton, toggleArr } from '@/components/ui/MultiChips';
import { DNA_AXIS_META } from '@/components/profile/FoodDnaSection';
import {
  MODULES,
  blankTasteProfile,
  isModuleComplete,
  moduleAnsweredCount,
  computeDnaScores,
  personaFromScores,
  type Module,
  type Question,
  type TasteProfileState,
  type DnaAxis,
} from '@/lib/recommendation/dna';

const TOTAL_QUESTIONS = MODULES.reduce((sum, m) => sum + m.questions.length, 0);
const DNA_AXIS_ORDER: DnaAxis[] = ['adventure', 'luxury', 'comfort', 'social', 'health'];

// The real 25-question/5-module Food DNA quiz (src/lib/recommendation/dna.ts)
// had a complete scoring engine and zero UI anywhere calling it - found via
// a repo-wide grep during the 2026-07-20/21 audit. This is that UI. Reuses
// onboarding's own chip/radio primitives (MultiChips/ToggleButton) for the
// 'single'/'multi' question types and its .onboarding-* screen shell for
// visual consistency; 'scale' questions are the one genuinely new input.
export default function DnaQuizWizard() {
  const router = useRouter();
  const [moduleIndex, setModuleIndex] = useState(0);
  const [answers, setAnswers] = useState<TasteProfileState>(blankTasteProfile());
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');
  const [scores, setScores] = useState<Record<DnaAxis, number> | null>(null);
  const [saving, setSaving] = useState(false);

  const currentModule = MODULES[moduleIndex];
  const answeredSoFar = MODULES.slice(0, moduleIndex).reduce((sum, m) => sum + m.questions.length, 0) + moduleAnsweredCount(answers, currentModule);
  const pct = Math.round((answeredSoFar / TOTAL_QUESTIONS) * 100);

  const setAnswer = (modKey: Module['key'], qId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [modKey]: { ...prev[modKey], [qId]: value } }));
  };

  const handleNext = () => {
    if (!isModuleComplete(answers, currentModule)) return;
    if (moduleIndex < MODULES.length - 1) {
      setModuleIndex((i) => i + 1);
      return;
    }
    const result = computeDnaScores(answers);
    setScores(result);
    setPhase('results');
  };

  const handleBack = () => {
    if (moduleIndex > 0) setModuleIndex((i) => i - 1);
    else router.back();
  };

  const handleSave = async () => {
    if (!scores) return;
    setSaving(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('taste_profiles')
        .upsert({ user_id: user.id, dna_scores: scores, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      router.push('/profile?tab=dna');
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'results' && scores) {
    const persona = personaFromScores(scores);
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <h1 className="onboarding-title">Your Food DNA™</h1>
          <p className="onboarding-subtitle">{persona.emoji} {persona.title} — {persona.desc}</p>

          <div className="dna-grid">
            {DNA_AXIS_ORDER.map((axis) => {
              const meta = DNA_AXIS_META[axis];
              return (
                <div className="dna-row" key={axis}>
                  <div className="dna-label">
                    <div className="icon" style={{ background: meta.iconBg }}>{meta.emoji}</div>
                    {meta.label}
                  </div>
                  <div className="dna-track">
                    <div
                      className="dna-fill"
                      style={{ width: `${scores[axis]}%`, background: `linear-gradient(90deg,${meta.from},${meta.to})` }}
                    />
                  </div>
                  <div className="dna-pct">{scores[axis]}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="onboarding-footer">
          <span />
          <button className="onboarding-btn-next" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Saving…' : 'Save & View My Food DNA'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-step-label">
        {currentModule.emoji} {currentModule.title} — Module {moduleIndex + 1} of {MODULES.length}
      </div>
      <div className="onboarding-progress">
        <div className="onboarding-progress__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="onboarding-card">
        <p className="onboarding-subtitle">{currentModule.blurb}</p>
        {currentModule.questions.map((q, qi) => (
          <QuestionBlock
            key={q.id}
            index={qi}
            question={q}
            value={answers[currentModule.key][q.id]}
            onChange={(value) => setAnswer(currentModule.key, q.id, value)}
          />
        ))}
      </div>

      <div className="onboarding-footer">
        <button className="onboarding-btn-back" onClick={handleBack} type="button">
          Back
        </button>
        <button className="onboarding-btn-next" onClick={handleNext} disabled={!isModuleComplete(answers, currentModule)} type="button">
          {moduleIndex < MODULES.length - 1 ? 'Next' : 'See My Results'}
        </button>
      </div>
    </div>
  );
}

function QuestionBlock({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}) {
  return (
    <div className="onboarding-quiz-q">
      <h2 className="onboarding-quiz-q__label">
        {index + 1}. {question.text}
      </h2>
      {question.helper && <p className="onboarding-subtitle" style={{ marginTop: -8 }}>{question.helper}</p>}

      {question.type === 'single' && (
        <div className="onboarding-chips">
          {question.options.map((opt) => (
            <ToggleButton
              key={opt}
              id={`${question.id}-${opt}`}
              label={opt}
              type="radio"
              name={question.id}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
          ))}
        </div>
      )}

      {question.type === 'multi' && (
        <MultiChips
          options={question.options}
          selected={(value as string[]) ?? []}
          max={question.max}
          onToggle={(v) => onChange(toggleArr((value as string[]) ?? [], v, question.max))}
        />
      )}

      {question.type === 'scale' && (
        <div className="onboarding-chips">
          {[1, 2, 3, 4, 5].map((n) => (
            <ToggleButton
              key={n}
              id={`${question.id}-${n}`}
              label={String(n)}
              type="radio"
              name={question.id}
              checked={value === String(n)}
              onChange={() => onChange(String(n))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
