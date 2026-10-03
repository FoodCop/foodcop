'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaPinterestP, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
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
  tiktok: FaTiktok,
  youtube: FaYoutube,
  x: FaXTwitter,
  facebook: FaFacebookF,
  pinterest: FaPinterestP,
};

const EMPTY: Record<SocialPlatform, string> = { instagram: '', tiktok: '', youtube: '', x: '', facebook: '', pinterest: '' };
const toValues = (links: SocialLinks) =>
  Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, links[p] ?? ''])) as Record<SocialPlatform, string>;

// Edits users.social_links. Linking = paste your profile link (or type your
// @username): the link is checked against the right site, turned into the bare
// handle, and an "Open" button lets you confirm it's really your profile
// before saving. Used in Settings > Profile and in the "Add socials" sheet on
// the Profile page. Loads and saves on its own.
export default function SocialLinksEditor({
  userId,
  onSaved,
  embedded = false,
}: {
  userId?: string | null;
  /** Called with the saved links (e.g. so the Profile hero updates at once). */
  onSaved?: (links: SocialLinks) => void;
  /** Inside a sheet: no group label / shadow. */
  embedded?: boolean;
}) {
  const [values, setValues] = useState<Record<SocialPlatform, string>>(EMPTY);
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
      setValues(toValues(links));
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
      setError(
        /social_links_shape/.test(res.error ?? '')
          ? 'YouTube and X can’t be saved yet - the app’s database needs its latest update.'
          : res.error ?? 'Could not save your social profiles.',
      );
      return;
    }
    const links = res.data ?? {};
    setSaved(links);
    setValues(toValues(links));
    onSaved?.(links);
  };

  return (
    <>
      {!embedded && <div className="fz-settings-group__label">Social Profiles</div>}
      <p className="fz-social-editor__hint">Paste the link to your profile (or type your @username). Use Open to check it&apos;s you.</p>
      <div className={`list-group rounded-4 border-0 mb-3${embedded ? '' : ' shadow-sm'}`}>
        {SOCIAL_PLATFORMS.map((p) => {
          const Icon = SOCIAL_ICONS[p];
          const handle = next[p];
          const isBad = invalid.includes(p);
          return (
            <div key={p} className="list-group-item p-3 border-0 border-bottom d-flex align-items-center gap-3">
              <span className={`fz-social-badge fz-social-badge--${p}`} aria-hidden="true">
                <Icon size={16} />
              </span>
              <label className="flex-grow-1 mb-0" style={{ minWidth: 0 }}>
                <span className="fw-bold text-dark d-block mb-1">{SOCIAL_META[p].label}</span>
                <input
                  type="text"
                  inputMode="url"
                  className={`form-control form-control-sm${isBad ? ' is-invalid' : ''}`}
                  placeholder={`@${SOCIAL_META[p].placeholder} or profile link`}
                  value={values[p]}
                  onChange={(e) => setValues((v) => ({ ...v, [p]: e.target.value }))}
                  disabled={!userId}
                  maxLength={200}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {handle && values[p].trim() !== handle && (
                  <span className="fz-social-editor__parsed"><Check size={11} strokeWidth={3} /> @{handle}</span>
                )}
                {isBad && (
                  <span className="fz-social-editor__error">That doesn&apos;t look like a {SOCIAL_META[p].label} profile link or username.</span>
                )}
              </label>
              {handle && (
                <a
                  className="fz-social-editor__open"
                  href={SOCIAL_META[p].urlFor(handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${SOCIAL_META[p].label} profile @${handle} to check it`}
                >
                  Open <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          );
        })}
        <div className="list-group-item p-3 border-0 d-flex justify-content-between align-items-center gap-2">
          <small className="text-muted">Shown on your profile for everyone who can see it.</small>
          <button
            type="button"
            className={`btn btn-sm fw-bold flex-shrink-0 ${dirty ? 'fz-btn-gold' : 'btn-outline-secondary'}`}
            onClick={handleSave}
            disabled={!userId || isSaving || !dirty || invalid.length > 0}
          >
            {isSaving ? 'Saving…' : dirty ? 'Save' : 'Saved ✓'}
          </button>
        </div>
      </div>
      {error && <div className="text-danger small mb-3">{error}</div>}
    </>
  );
}
