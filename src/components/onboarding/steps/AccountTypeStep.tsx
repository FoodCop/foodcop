'use client';

import { Check, Store, UserRound } from 'lucide-react';
import type { AccountType } from '@/lib/onboarding/policy';

// I-01 "Welcome to FUZO": Individual or Food Business (client spec v1).
// A radio group of two big tiles; the choice is final once saved.

const OPTIONS: { id: AccountType; title: string; text: string; Icon: typeof UserRound }[] = [
  { id: 'individual', title: 'Individual', text: 'Explore food, find new places and build your own taste journey.', Icon: UserRound },
  { id: 'food_business', title: 'Food Business', text: 'Put your restaurant, café, truck or kitchen on FUZO.', Icon: Store },
];

export function AccountTypeStep({ value, onChange }: { value: AccountType | null; onChange: (v: AccountType) => void }) {
  const pick = (i: number) => onChange(OPTIONS[(i + OPTIONS.length) % OPTIONS.length].id);
  return (
    <div className="fz-step-types" role="radiogroup" aria-label="Account type">
      {OPTIONS.map(({ id, title, text, Icon }, i) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            // Roving focus: one tab stop, arrow keys move between the two.
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            className={`fz-step-type${on ? ' is-on' : ''}`}
            onClick={() => onChange(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                pick(i + 1);
                (e.currentTarget.parentElement?.children[(i + 1) % OPTIONS.length] as HTMLElement | undefined)?.focus();
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                pick(i - 1);
                (e.currentTarget.parentElement?.children[(i + OPTIONS.length - 1) % OPTIONS.length] as HTMLElement | undefined)?.focus();
              }
            }}
          >
            <span className="fz-step-type__icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <span className="fz-step-type__text">
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
            <span className="fz-step-type__check" aria-hidden="true">
              {on && <Check size={14} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
