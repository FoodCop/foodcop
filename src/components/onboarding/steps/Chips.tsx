'use client';

import { Check } from 'lucide-react';

// Pastel choice chips (client, 2026-10-07: each chip a different soft pastel,
// selected = solid FUZO yellow). multi = toggle buttons (aria-pressed);
// single = a radio group. Once `max` is reached the others are disabled and
// the hint says why.

interface ChipsProps {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  max?: number;
  single?: boolean;
  /** Custom toggle rule (e.g. "No restrictions" excludes the rest). */
  toggle?: (current: string[], option: string) => string[];
  labelFor?: (option: string) => string;
}

export function Chips({ options, value, onChange, label, max, single = false, toggle, labelFor = (o) => o }: ChipsProps) {
  const full = !single && !!max && value.length >= max;
  const pick = (o: string) => {
    if (single) return onChange([o]);
    if (toggle) return onChange(toggle(value, o));
    if (value.includes(o)) return onChange(value.filter((v) => v !== o));
    if (!full) onChange([...value, o]);
  };
  return (
    <div className="fz-step-chips-wrap">
      <div className="fz-step-chips" role={single ? 'radiogroup' : 'group'} aria-label={label}>
        {options.map((o) => {
          const on = value.includes(o);
          const blocked = full && !on;
          return (
            <button
              key={o}
              type="button"
              className={`fz-step-pastel${on ? ' is-on' : ''}`}
              {...(single ? { role: 'radio', 'aria-checked': on } : { 'aria-pressed': on })}
              aria-disabled={blocked || undefined}
              onClick={() => !blocked && pick(o)}
            >
              {on && <Check size={14} strokeWidth={3} aria-hidden="true" />}
              {labelFor(o)}
            </button>
          );
        })}
      </div>
      {max && !single && (
        <p className="fz-step-count" aria-live="polite">
          {full ? `That's ${max} - tap one to swap it.` : `${value.length} of up to ${max}`}
        </p>
      )}
    </div>
  );
}
