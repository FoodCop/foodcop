'use client';

import { useSyncExternalStore } from 'react';
import { getThemePref, setThemePref, subscribeThemePref, type ThemePref } from '@/lib/theme';

// Light / Dark / System (client, 2026-10-06). The choice is kept on this
// device (localStorage) and applied before paint by the script in
// app/layout.tsx; System follows the phone/computer setting live.
const OPTIONS: { value: ThemePref; emoji: string; label: string; hint: string }[] = [
  { value: 'light', emoji: '☀️', label: 'Light', hint: 'Warm cream with golden glows' },
  { value: 'dark', emoji: '🌙', label: 'Dark', hint: 'Black with soft amber glows' },
  { value: 'system', emoji: '⚙️', label: 'System', hint: 'Match your device setting' },
];

export default function AppearancePanel() {
  // Server render has no localStorage: assume Light, then hydrate to the real choice.
  const current = useSyncExternalStore(subscribeThemePref, getThemePref, () => 'light' as ThemePref);

  return (
    <div>
      <div className="list-group shadow-sm rounded-4 border-0 mb-3" role="radiogroup" aria-label="Theme">
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setThemePref(opt.value)}
              className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom text-start"
            >
              <span className="d-flex align-items-center gap-3">
                <span className="bg-light rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }} aria-hidden="true">{opt.emoji}</span>
                <span className="d-flex flex-column">
                  <span className="fw-bold text-dark">{opt.label}</span>
                  <small className="text-secondary">{opt.hint}</small>
                </span>
              </span>
              {selected && <span className="fw-bold" style={{ color: '#c9a227' }} aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="fz-empty">Dark mode changes every app page, including your profile.</div>
    </div>
  );
}
