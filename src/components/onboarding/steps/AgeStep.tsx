'use client';

import { useId, useState } from 'react';
import { Lock } from 'lucide-react';
import { checkAge } from '@/lib/onboarding/policy';

// I-03 "Confirm your age" (client spec v1; Canadian rules, client 2026-10-18).
// Neutral: month + year dropdowns with nothing hinting at the minimum age.
// Only someone who is exactly 13 is asked whether they live in Quebec (14+
// there). The parent decides what "too young" does (block + message).

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface BirthDate {
  month: number;
  year: number;
  livesInQuebec: boolean | null;
}

interface AgeStepProps {
  onDone: (birth: BirthDate) => void;
  onTooYoung: () => void;
  /** Rendered as the step's main button (so each host keeps its own button style). */
  renderSubmit: (label: string) => React.ReactNode;
}

export function AgeStep({ onDone, onTooYoung, renderSubmit }: AgeStepProps) {
  const id = useId();
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [askQuebec, setAskQuebec] = useState(false);
  const [quebec, setQuebec] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 111 }, (_, i) => thisYear - i);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !year) {
      setError(!month && !year ? 'Choose your birth month and year.' : !month ? 'Choose your birth month.' : 'Choose your birth year.');
      return;
    }
    const m = Number(month);
    const y = Number(year);
    if (askQuebec && quebec === null) {
      setError('Choose Yes or No.');
      return;
    }
    const result = checkAge(y, m, askQuebec ? quebec : null);
    if (result === 'ask_quebec') {
      setError(null);
      setAskQuebec(true);
      return;
    }
    if (result === 'too_young') {
      onTooYoung();
      return;
    }
    onDone({ month: m, year: y, livesInQuebec: askQuebec ? quebec : null });
  };

  const errId = error ? `${id}-err` : undefined;
  return (
    <form className="fz-step-age" onSubmit={submit} noValidate>
      <div className="fz-step-age__row">
        <div className="fz-step-field">
          <label htmlFor={`${id}-m`}>Birth month</label>
          <select
            id={`${id}-m`}
            value={month}
            aria-invalid={!!error && !month}
            aria-describedby={errId}
            onChange={(e) => {
              setMonth(e.target.value);
              setAskQuebec(false);
              setQuebec(null);
              setError(null);
            }}
          >
            <option value="">Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="fz-step-field">
          <label htmlFor={`${id}-y`}>Birth year</label>
          <select
            id={`${id}-y`}
            value={year}
            aria-invalid={!!error && !year}
            aria-describedby={errId}
            onChange={(e) => {
              setYear(e.target.value);
              setAskQuebec(false);
              setQuebec(null);
              setError(null);
            }}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {askQuebec && (
        <fieldset className="fz-step-quebec">
          <legend>Do you live in Quebec?</legend>
          <div className="fz-step-quebec__opts">
            {[
              [true, 'Yes'],
              [false, 'No'],
            ].map(([v, label]) => (
              <label key={String(v)} className={`fz-step-chip${quebec === v ? ' is-on' : ''}`}>
                <input
                  type="radio"
                  name={`${id}-qc`}
                  checked={quebec === v}
                  onChange={() => {
                    setQuebec(v as boolean);
                    setError(null);
                  }}
                />
                {label as string}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className="fz-step-private">
        <Lock size={14} aria-hidden="true" />
        Your birth date is private and never shown on your profile.
      </p>

      {error && (
        <p id={errId} className="fz-step-error" role="alert">
          {error}
        </p>
      )}

      {renderSubmit('Continue')}
    </form>
  );
}

/** Shown instead of the age step when someone is too young (nothing about them is kept). */
export function TooYoung({ children }: { children?: React.ReactNode }) {
  return (
    <div className="fz-step-young" role="status">
      <span className="fz-step-young__icon" aria-hidden="true">
        🌱
      </span>
      <h2>FUZO isn&rsquo;t available for you yet</h2>
      <p>Thanks for your interest. Please come back when you&rsquo;re older.</p>
      {children}
    </div>
  );
}
