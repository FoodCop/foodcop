'use client';

// The app only ships a light theme today (nothing reads a stored theme
// choice), so Dark / System are shown as not-yet-available rather than as a
// preference that saves and then changes nothing.
const OPTIONS: { value: string; emoji: string; label: string; available: boolean }[] = [
  { value: 'light', emoji: '☀️', label: 'Light', available: true },
  { value: 'dark', emoji: '🌙', label: 'Dark', available: false },
  { value: 'system', emoji: '⚙️', label: 'System', available: false },
];

export default function AppearancePanel() {
  return (
    <div>
      <div className="list-group shadow-sm rounded-4 border-0 mb-3">
        {OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
            aria-disabled={!opt.available}
            style={opt.available ? undefined : { opacity: 0.6 }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="bg-light rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>{opt.emoji}</div>
              <div className="fw-bold text-dark">{opt.label}</div>
            </div>
            {opt.available ? (
              <span className="text-primary fw-bold" aria-label="Selected">✓</span>
            ) : (
              <span className="badge rounded-pill bg-light text-secondary fw-bold">Coming soon</span>
            )}
          </div>
        ))}
      </div>
      <div className="fz-empty">Dark mode and follow-system are on the way.</div>
    </div>
  );
}
