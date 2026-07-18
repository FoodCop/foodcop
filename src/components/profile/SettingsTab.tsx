'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsTab() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || 'Something went wrong. Please try again.');
        setIsDeleting(false);
        return;
      }
      const supabase = createClient();
      await supabase?.auth.signOut();
      router.push('/login');
    } catch {
      setDeleteError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h6 className="text-muted fw-bold text-uppercase mt-4 mb-2 ms-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
      {children}
    </h6>
  );

  return (
    <div className="pb-5 position-relative">
      {toastMessage && (
        <div className="toast show position-fixed bottom-0 start-50 translate-middle-x mb-5 bg-dark text-white rounded-pill px-3 py-2 shadow" style={{ zIndex: 1050 }}>
          {toastMessage}
        </div>
      )}

      {/* ── TASTE PREFERENCES ── */}
      <SectionTitle>Taste Preferences</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🌶️</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Flavor Profile</div>
              <small className="text-muted">Spicy 4.6 · Savory 4.1 · Creamy 3.8</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 text-warning rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🌍</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Cuisine Preferences</div>
              <small className="text-muted">Indian, Thai, Mexican +7 more</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🥗</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Dietary Preferences</div>
              <small className="text-muted">No restrictions currently set</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🏷️</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Price Range</div>
              <small className="text-muted">$$ Mid-range preferred</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border">$$–$$$</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
        <div className="list-group-item d-flex flex-column p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-info bg-opacity-10 text-info rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>📍</div>
            <div className="flex-grow-1">
              <div className="fw-bold text-dark d-flex justify-content-between">
                Discovery Radius <span className="text-primary">25 km</span>
              </div>
              <small className="text-muted">How far you'd travel for food</small>
            </div>
          </div>
          <input type="range" className="form-range" min="5" max="50" step="5" defaultValue="25" />
          <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.65rem' }}>
            <span>5km</span><span>25km</span><span>50km+</span>
          </div>
        </div>
      </div>

      {/* ── DISCOVERY & MATCHING ── */}
      <SectionTitle>Discovery & Matching</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-purple bg-opacity-10 rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#F0EAF8' }}>🎯</div>
            <div>
              <div className="fw-bold text-dark">Match Sensitivity</div>
              <small className="text-muted">How closely we filter recommendations</small>
            </div>
          </div>
          <select className="form-select form-select-sm w-auto border-0 bg-light fw-bold text-primary">
            <option>Broad</option>
            <option defaultValue="true">Balanced</option>
            <option>Exact</option>
          </select>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 text-warning rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>💎</div>
            <div>
              <div className="fw-bold text-dark">Show Hidden Gems</div>
              <small className="text-muted">Include lesser-known spots</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
          </div>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🚀</div>
            <div>
              <div className="fw-bold text-dark">Prioritise Trending Spots</div>
              <small className="text-muted">Weight recently popular places higher</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input className="form-check-input" type="checkbox" role="switch" />
          </div>
        </div>
      </div>

      {/* ── PRIVACY ── */}
      <SectionTitle>Privacy & Social</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-secondary bg-opacity-10 text-secondary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>👁️</div>
            <div>
              <div className="fw-bold text-dark">Profile Visibility</div>
            </div>
          </div>
          <select className="form-select form-select-sm w-auto border-0 bg-light fw-bold text-primary">
            <option defaultValue="true">Public</option>
            <option>Followers</option>
            <option>Private</option>
          </select>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧬</div>
            <div>
              <div className="fw-bold text-dark">Show Food DNA™</div>
              <small className="text-muted d-block">Others can see your scores</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
          </div>
        </div>
      </div>

      {/* ── CONNECTED ACCOUNTS ── */}
      <SectionTitle>Connected Accounts</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom" onClick={() => showToast('Instagram connected!')}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded p-2 text-center d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}>IG</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Instagram</div>
              <small className="text-muted">@naveenkaur · Connected</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-success fw-bold" style={{ fontSize: '0.75rem' }}>Connected</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom" onClick={() => showToast('Connect TikTok to import videos')}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-dark text-white rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🎵</div>
            <div className="text-start">
              <div className="fw-bold text-dark">TikTok</div>
              <small className="text-muted">Tap to connect</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary fw-bold" style={{ fontSize: '0.75rem' }}>Connect</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom" onClick={() => showToast('Connect YouTube to import cooking content')}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger text-white rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>▶</div>
            <div className="text-start">
              <div className="fw-bold text-dark">YouTube</div>
              <small className="text-muted">Tap to connect</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary fw-bold" style={{ fontSize: '0.75rem' }}>Connect</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
      </div>

      {/* ── AI & PERSONALISATION ── */}
      <SectionTitle>AI & Personalisation</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🤖</div>
            <div>
              <div className="fw-bold text-dark">AI Card Generation</div>
              <small className="text-muted d-block">Auto-generate titles and captions</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
          </div>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 text-info rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧠</div>
            <div>
              <div className="fw-bold text-dark">Use Activity for ML</div>
              <small className="text-muted d-block">Include likes, saves in match model</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
          </div>
        </div>
      </div>

      {/* ── ACCOUNT ── */}
      <SectionTitle>Account</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0 mb-3">
        <button
          className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0 border-bottom text-dark fw-bold"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <div className="me-3 fs-5">🚪</div> {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </button>
        <button
          className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0 text-danger fw-bold"
          onClick={() => {
            setDeleteError(null);
            setDeleteConfirmText('');
            setShowDeleteConfirm(true);
          }}
        >
          <div className="me-3 fs-5">🗑️</div> Delete Account
        </button>
      </div>

      <div className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
        FUZO v3.0.0 (Next.js Port) · Made with ❤️
      </div>

      {showDeleteConfirm && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4">
                <div className="fs-3 mb-2">🗑️</div>
                <h5 className="fw-bold mb-2">Delete your account?</h5>
                <p className="text-muted mb-3">
                  This permanently deletes your profile, food cards, saved items, chats, and points. This can&rsquo;t be undone.
                </p>
                <label className="form-label small fw-bold text-muted" htmlFor="delete-confirm-input">
                  Type <span className="text-danger">DELETE</span> to confirm
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  className="form-control"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                  autoComplete="off"
                />
                {deleteError && <div className="alert alert-danger small mt-3 mb-0">{deleteError}</div>}
              </div>
              <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger flex-fill fw-bold"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
