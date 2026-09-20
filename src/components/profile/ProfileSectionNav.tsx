'use client';

// Fig. 03 — Sections: the numbered blueprint row-list from the Industry
// mockup. Purely presentational/controlled - the parent (ProfileShell) owns
// which tab is active, since this list has to stay in sync with the
// separately-rendered content pane in the main column.
const SECTION_LABEL: Record<string, string> = {
  activity: 'Activity',
  dna: 'Food DNA',
  settings: 'Settings',
  menu: 'Menu',
  info: 'Info',
  gallery: 'Gallery',
};

export default function ProfileSectionNav({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="ind-section-nav">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          type="button"
          className="ind-section-row"
          data-active={active === tab}
          onClick={() => onChange(tab)}
        >
          <span className="ind-section-row__num">{String(i + 1).padStart(2, '0')}</span>
          <span className="ind-section-row__label">{SECTION_LABEL[tab] ?? tab}</span>
        </button>
      ))}
    </div>
  );
}
