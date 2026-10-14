'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';

// A labelled group of pastel chips (multi-select) for the Create flow, with an
// optional "Add your own" field (client, 2026-10-14: business identity and
// tags can be custom). Picked chips are yellow, like everywhere in FUZO.

interface ChipFieldProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
  /** Shows an "Add your own" input; custom values join the chip list. */
  allowCustom?: boolean;
  customPlaceholder?: string;
  maxCustomLength?: number;
  hint?: string;
}

export function ChipField({
  label,
  options,
  selected,
  onChange,
  required = false,
  allowCustom = false,
  customPlaceholder = 'Add your own',
  maxCustomLength = 40,
  hint,
}: ChipFieldProps) {
  const id = useId();
  const [custom, setCustom] = useState('');
  const custom_ = selected.filter((s) => !options.some((o) => o.toLowerCase() === s.toLowerCase()));
  const all = [...options, ...custom_];

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const addCustom = () => {
    const value = custom.trim().replace(/\s+/g, ' ').slice(0, maxCustomLength);
    if (!value) return;
    const existing = all.find((o) => o.toLowerCase() === value.toLowerCase());
    if (existing) {
      if (!selected.includes(existing)) onChange([...selected, existing]);
    } else {
      onChange([...selected, value]);
    }
    setCustom('');
  };

  return (
    <section className="cf-field" aria-labelledby={`${id}-label`}>
      <h3 id={`${id}-label`} className="cf-field__label">
        {label} {required && <span className="cf-field__req" aria-hidden="true">*</span>}
      </h3>
      {hint && <p className="cf-field__hint">{hint}</p>}
      <div className="studio-tag-options" role="group" aria-labelledby={`${id}-label`}>
        {all.map((option) => (
          <button
            key={option}
            type="button"
            className={`studio-tag-chip${selected.includes(option) ? ' is-selected' : ''}`}
            aria-pressed={selected.includes(option)}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {allowCustom && (
        <form
          className="cf-custom"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <input
            className="cf-custom__input"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={customPlaceholder}
            maxLength={maxCustomLength}
            aria-label={`${label}: ${customPlaceholder}`}
          />
          <button type="submit" className="cf-custom__add" disabled={!custom.trim()} aria-label={`Add to ${label}`}>
            <Plus size={18} strokeWidth={2.6} />
          </button>
        </form>
      )}
    </section>
  );
}

export default ChipField;
