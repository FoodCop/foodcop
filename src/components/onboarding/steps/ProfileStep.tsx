'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AtSign, Camera, Check, Loader2, X } from 'lucide-react';
import { ROLES, USERNAME_RE } from '@/lib/onboarding/policy';
import { OnboardingService } from '@/lib/services/onboardingService';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import { Chips } from './Chips';

// I-04 "Your profile" (client spec v1): name + @username are required (the
// username is checked live), the photo and roles are optional ("Skip optional
// profile details" saves just the name and username). Roles are profile
// labels, several allowed, editable later.

/** A username suggestion from a name: "Asha Patel" -> "asha.patel". */
export function suggestUsername(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '')
    .slice(0, 30);
  return base.length >= 3 ? base : base ? `${base}.eats` : '';
}

type NameCheck = 'idle' | 'checking' | 'free' | 'taken' | 'invalid' | 'unknown';

interface ProfileStepProps {
  initialName: string;
  initialUsername: string | null;
  initialAvatar: string | null;
  initialRoles: string[];
  onSaved: () => void;
  renderSubmit: (label: string, busy: boolean) => React.ReactNode;
}

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.id, r.label]));
const ROLE_IDS = ROLES.map((r) => r.id);

export function ProfileStep({ initialName, initialUsername, initialAvatar, initialRoles, onSaved, renderSubmit }: ProfileStepProps) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername ?? suggestUsername(initialName));
  const [check, setCheck] = useState<NameCheck>('idle');
  const [roles, setRoles] = useState<string[]>(initialRoles);
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  // Live username check, 400ms after typing stops.
  useEffect(() => {
    const u = username;
    const n = ++seq.current;
    const t = window.setTimeout(async () => {
      if (!u) return setCheck('idle');
      if (!USERNAME_RE.test(u)) return setCheck('invalid');
      if (u === initialUsername) return setCheck('free');
      setCheck('checking');
      const free = await OnboardingService.usernameAvailable(u);
      if (n === seq.current) setCheck(free === null ? 'unknown' : free ? 'free' : 'taken');
    }, 400);
    return () => window.clearTimeout(t);
  }, [username, initialUsername]);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return setError('Choose a JPG, PNG or WebP photo.');
    if (file.size > 15 * 1024 * 1024) return setError('That photo is over 15 MB - choose a smaller one.');
    setError(null);
    setUploading(true);
    const r = await MediaUploadService.uploadProfileImage(file, 'avatar');
    setUploading(false);
    if (!r.success || !r.data) return setError('The photo didn’t upload. Try again.');
    setAvatar(r.data);
  };

  const save = async (withOptional: boolean) => {
    setError(null);
    if (!name.trim()) return setError('Enter your name.');
    if (!username) return setError('Choose a username.');
    if (!USERNAME_RE.test(username)) return setError('Usernames are 3-30 lower-case letters, numbers, dots or underscores.');
    if (check === 'taken') return setError(`@${username} is taken - try another.`);
    setSaving(true);
    const r = await OnboardingService.saveProfile({
      displayName: name,
      username,
      roles: withOptional ? roles : [],
      avatarUrl: withOptional ? avatar : undefined,
    });
    setSaving(false);
    if (!r.success) {
      if (r.error === 'username_taken') {
        setCheck('taken');
        return setError(`@${username} is taken - try another.`);
      }
      return setError(r.error === 'username_invalid' ? 'Usernames are 3-30 lower-case letters, numbers, dots or underscores.' : 'That didn’t save. Check your connection and try again.');
    }
    onSaved();
  };

  const hint: Record<NameCheck, React.ReactNode> = {
    idle: 'Letters, numbers, dots and underscores.',
    checking: (
      <>
        <Loader2 size={13} className="fz-onb__spin" aria-hidden="true" /> Checking…
      </>
    ),
    free: (
      <>
        <Check size={13} strokeWidth={3} aria-hidden="true" /> @{username} is free
      </>
    ),
    taken: (
      <>
        <X size={13} strokeWidth={3} aria-hidden="true" /> @{username} is taken
      </>
    ),
    invalid: '3-30 lower-case letters, numbers, dots or underscores.',
    unknown: 'We’ll check it when you continue.',
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
    >
      <div className="fz-step-avatar">
        <button type="button" className="fz-step-avatar__pic" onClick={() => fileRef.current?.click()} aria-label={avatar ? 'Change profile photo' : 'Add a profile photo'}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- the user's own uploaded photo
            <img src={avatar} alt="" />
          ) : (
            <span aria-hidden="true">{(name.trim()[0] ?? '?').toUpperCase()}</span>
          )}
          <span className="fz-step-avatar__cam" aria-hidden="true">
            {uploading ? <Loader2 size={15} className="fz-onb__spin" /> : <Camera size={15} />}
          </span>
        </button>
        <div className="fz-step-avatar__text">
          <strong>Profile photo</strong>
          <span>Optional · you can add it later</span>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
      </div>

      <div className="fz-step-field">
        <label htmlFor={`${id}-name`}>Display name</label>
        <input id={`${id}-name`} type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="fz-step-field">
        <label htmlFor={`${id}-user`}>Username</label>
        <div className="fz-step-handle">
          <AtSign size={16} aria-hidden="true" />
          <input
            id={`${id}-user`}
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            value={username}
            aria-describedby={`${id}-user-hint`}
            aria-invalid={check === 'taken' || check === 'invalid'}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
          />
        </div>
        <p id={`${id}-user-hint`} className={`fz-step-hint fz-step-hint--${check}`} aria-live="polite">
          {hint[check]}
        </p>
      </div>

      <div className="fz-step-group">
        <p className="fz-step-group__label" id={`${id}-roles`}>
          Your roles <span>optional · pick any</span>
        </p>
        <Chips label="Your roles" options={ROLE_IDS} value={roles} onChange={setRoles} labelFor={(r) => ROLE_LABEL[r]} />
      </div>

      {error && (
        <p className="fz-onb__error" role="alert">
          {error}
        </p>
      )}

      {renderSubmit('Continue', saving)}
      <button type="button" className="fz-onb__skip" onClick={() => save(false)} disabled={saving}>
        Skip optional profile details
      </button>
    </form>
  );
}

/** Existing accounts: just the roles, asked once. */
export function RolesStep({ initialRoles, onDone, renderSubmit }: { initialRoles: string[]; onDone: (roles: string[]) => Promise<void>; renderSubmit: (label: string, busy: boolean) => React.ReactNode }) {
  const [roles, setRoles] = useState<string[]>(initialRoles);
  const [busy, setBusy] = useState(false);
  const go = async (r: string[]) => {
    setBusy(true);
    await onDone(r);
    setBusy(false);
  };
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        go(roles);
      }}
    >
      <Chips label="Your roles" options={ROLE_IDS} value={roles} onChange={setRoles} labelFor={(r) => ROLE_LABEL[r]} />
      {renderSubmit('Save', busy)}
      <button type="button" className="fz-onb__skip" onClick={() => go([])} disabled={busy}>
        Not now
      </button>
    </form>
  );
}
