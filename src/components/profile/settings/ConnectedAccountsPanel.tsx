'use client';

// Instagram / TikTok / YouTube import is not built yet, so these rows are
// shown as unavailable instead of pretending a tap connects anything (they
// used to show a "Connect ..." toast and do nothing).
const ACCOUNTS: { name: string; blurb: string; badge: React.ReactNode; badgeClass: string }[] = [
  { name: 'Instagram', blurb: 'Import your food photos', badge: 'IG', badgeClass: 'text-white fw-bold' },
  { name: 'TikTok', blurb: 'Import your videos', badge: '🎵', badgeClass: 'bg-dark text-white' },
  { name: 'YouTube', blurb: 'Import cooking content', badge: '▶', badgeClass: 'bg-danger text-white' },
];

export default function ConnectedAccountsPanel() {
  return (
    <div className="list-group shadow-sm rounded-4 border-0">
      {ACCOUNTS.map((a, i) => (
        <div
          key={a.name}
          className={`list-group-item d-flex align-items-center justify-content-between p-3 border-0${i < ACCOUNTS.length - 1 ? ' border-bottom' : ''}`}
          aria-disabled="true"
          style={{ opacity: 0.75 }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className={`rounded p-2 text-center d-flex align-items-center justify-content-center ${a.badgeClass}`}
              style={{ width: '40px', height: '40px', ...(a.name === 'Instagram' ? { background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' } : null) }}
            >
              {a.badge}
            </div>
            <div className="text-start">
              <div className="fw-bold text-dark">{a.name}</div>
              <small className="text-muted">{a.blurb}</small>
            </div>
          </div>
          <span className="badge rounded-pill bg-light text-secondary fw-bold">Coming soon</span>
        </div>
      ))}
    </div>
  );
}
