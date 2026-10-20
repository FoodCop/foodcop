'use client';

import { useId } from 'react';
import { Check } from 'lucide-react';

// The consent boxes of I-02 "Create your account" (client spec v1): Terms of
// Service and Privacy Policy are two separate ticks, each recorded with its
// version and the time. Food businesses also confirm they may act for it.

export interface Consents {
  terms: boolean;
  privacy: boolean;
  /** Food businesses only. */
  authority?: boolean;
}

export function consentsMissing(c: Consents, business: boolean): string | null {
  if (!c.terms && !c.privacy) return 'Tick both boxes to continue.';
  if (!c.terms) return 'Agree to the Terms of Service to continue.';
  if (!c.privacy) return 'Tick the Privacy Policy box to continue.';
  if (business && !c.authority) return 'Confirm you can set up this business on FUZO.';
  return null;
}

export function ConsentChecks({
  value,
  onChange,
  business = false,
  invalid = false,
}: {
  value: Consents;
  onChange: (c: Consents) => void;
  business?: boolean;
  invalid?: boolean;
}) {
  const id = useId();
  const rows: { key: keyof Consents; label: React.ReactNode }[] = [
    {
      key: 'terms',
      label: (
        <>
          I agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener">
            Terms of Service
          </a>
        </>
      ),
    },
    {
      key: 'privacy',
      label: (
        <>
          I&rsquo;ve read the{' '}
          <a href="/privacy" target="_blank" rel="noopener">
            Privacy Policy
          </a>
        </>
      ),
    },
  ];
  if (business) rows.push({ key: 'authority', label: <>I&rsquo;m 18 or older and allowed to set up this business on FUZO</> });

  return (
    <fieldset className="fz-step-consents">
      <legend className="visually-hidden">Agreements</legend>
      {rows.map(({ key, label }) => {
        const on = !!value[key];
        return (
          <div key={key} className={`fz-step-consent${on ? ' is-on' : ''}${invalid && !on ? ' is-invalid' : ''}`}>
            <input
              id={`${id}-${key}`}
              type="checkbox"
              checked={on}
              aria-invalid={invalid && !on}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            />
            <span className="fz-step-consent__box" aria-hidden="true">
              {on && <Check size={13} strokeWidth={3.2} />}
            </span>
            <label htmlFor={`${id}-${key}`}>{label}</label>
          </div>
        );
      })}
    </fieldset>
  );
}
