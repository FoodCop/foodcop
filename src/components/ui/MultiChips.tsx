// Extracted out of OnboardingWizard.tsx (originally private to that file) so
// Settings' Taste Preference edit rows (Flavor Profile / Cuisine / Dietary)
// can reuse the exact same chip-grid UI and .onboarding-chip* styles
// (_onboarding.scss, imported globally via main.scss) instead of a second,
// slightly-different implementation.

export function toggleArr(arr: string[], value: string, max?: number): string[] {
  if (arr.includes(value)) return arr.filter((v) => v !== value);
  if (max && arr.length >= max) return arr;
  return [...arr, value];
}

export function ToggleButton({
  id,
  label,
  checked,
  onChange,
  type = 'checkbox',
  name,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  type?: 'checkbox' | 'radio';
  name?: string;
}) {
  return (
    <>
      <input
        type={type}
        className="visually-hidden"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        autoComplete="off"
      />
      <label className={`onboarding-chip${checked ? ' is-selected' : ''}`} htmlFor={id}>
        {label}
      </label>
    </>
  );
}

export function MultiChips({
  options,
  selected,
  max,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  max?: number;
  onToggle: (v: string) => void;
}) {
  const atMax = !!(max && selected.length >= max);
  return (
    <>
      <div className="onboarding-chips">
        {options.map((opt, i) => {
          const on = selected.includes(opt);
          return (
            <span key={opt} className={!on && atMax ? 'is-at-max' : ''}>
              <ToggleButton id={`chip-${i}-${opt}`} label={opt} checked={on} onChange={() => onToggle(opt)} />
            </span>
          );
        })}
      </div>
      {max && (
        <p className="onboarding-chip-count">
          {selected.length} / {max} selected
        </p>
      )}
    </>
  );
}
