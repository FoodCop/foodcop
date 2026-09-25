'use client';

import { useEffect, useState } from 'react';
import { FaFacebookF, FaInstagram, FaPinterestP, FaTiktok } from 'react-icons/fa6';
import {
  SOCIAL_META,
  SOCIAL_PLATFORMS,
  SocialLinksService,
  normalizeHandle,
  type SocialLinks,
  type SocialPlatform,
} from '@/lib/services/socialLinksService';

export const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ size?: number }>> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  tiktok: FaTiktok,
  pinterest: FaPinterestP,
};

// "Social profiles" group in Settings > Profile - edits users.social_links,
// which the mobile Profile hero shows on the back of its flip card. Loads and
// saves on its own so the (already large) SettingsTab state doesn't grow.
export default function SocialLinksEditor({ userId }: { userId?: string | null }) {
  const [values, setValues] = useState<Record<SocialPlatform, string>>({ instagram: '', facebook: '', tiktok: '', pinterest: '' });
  const [saved, setSaved] = useState<SocialLinks>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    SocialLinksService.get(userId).then((res) => {
      if (cancelled) return;
      const links = res.data ?? {};
      setSaved(links);
      setValues({
        instagram: links.instagram ?? '',
        facebook: links.facebook ?? '',
        tiktok: links.tiktok ?? '',
        pinterest: links.pinterest ?? '',
      });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const invalid = SOCIAL_PLATFORMS.filter((p) => values[p].trim() && !normalizeHandle(p, values[p]));
  const next: SocialLinks = {};
  for (const p of SOCIAL_PLATFORMS) {
    const h = normalizeHandle(p, values[p]);
    if (h) next[p] = h;
  }
  const dirty = SOCIAL_PLATFORMS.some((p) => (next[p] ?? '') !== (saved[p] ?? ''));

  const handleSave = async () => {
    if (!userId || invalid.length > 0) return;
    setIsSaving(true);
    setError(null);
    const res = await SocialLinksService.update(userId, next);
    setIsSaving(false);
    if (!res.success) {
      setError(res.error ?? 'Could not save your social profiles.');
      return;
    }
    const links = res.data ?? {};
    setSaved(links);
    setValues({
      instagram: links.instagram ?? '',
      facebook: links.facebook ?? '',
      tiktok: links.tiktok ?? '',
      pinterest: links.pinterest ?? '',
    });
  };

  return (
    <>
      <div className="fz-settings-group__label">Social Profiles</div>
      <div className="list-group shadow-sm rounded-4 border-0 mb-3">
        {SOCIAL_PLATFORMS.map((p) => {
          const Icon = SOCIAL_ICONS[p];
          return (
            <label key={p} className="list-group-item p-3 border-0 border-bottom d-flex align-items-center gap-3 mb-0">
              <span className={`fz-social-badge fz-social-badge--${p}`} aria-hidden="true">
                <Icon size={16} />
              </span>
              <span className="flex-grow-1">
                <span className="fw-bold text-dark d-block mb-1">{SOCIAL_META[p].label}</span>
                <input
                  type="text"
                  className={`form-control form-control-sm${invalid.includes(p) ? ' is-invalid' : ''}`}
                  placeholder={`@${SOCIAL_META[p].placeholder} or profile link`}
                  value={values[p]}
                  onChange={(e) => setValues((v) => ({ ...v, [p]: e.target.value }))}
                  disabled={!userId}
                  maxLength={200}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </span>
            </label>
          );
        })}
        <div className="list-group-item p-3 border-0 d-flex justify-content-between align-items-center">
          <small className="text-muted">Shown on the back of your profile card.</small>
          <button
            type="button"
            className={`btn btn-sm fw-bold ${dirty ? 'fz-btn-gold' : 'btn-outline-secondary'}`}
            onClick={handleSave}
            disabled={!userId || isSaving || !dirty || invalid.length > 0}
          >
            {isSaving ? 'Saving…' : dirty ? 'Save' : 'Saved ✓'}
          </button>
        </div>
      </div>
      {invalid.length > 0 && (
        <div className="text-danger small mb-3">Enter a username or a link to your {SOCIAL_META[invalid[0]].label} profile.</div>
      )}
      {error && <div className="text-danger small mb-3">{error}</div>}
    </>
  );
}
