'use client';

import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, Smartphone, Loader2 } from 'lucide-react';
import { E2ee, E2eeError, type E2eeStatus } from '@/lib/chat/e2ee';
import { passphraseProblem } from '@/lib/chat/crypto';

// Shown before the inbox until this device holds the user's chat key.
//
//   needs-setup  -> first time. ONE TAP - no passphrase needed. Like WhatsApp, the
//                   key is created silently and stays on this device. A backup
//                   passphrase is optional, for people who want to switch devices.
//   needs-unlock -> keys exist but this device doesn't have them (new device / cleared
//                   browser). If a backup exists: enter its passphrase. If not: start
//                   fresh here (older messages stay on the other device).

type Mode = 'setup' | 'unlock' | 'fresh';

export default function SecureMessagingGate({
  userId,
  status,
  onReady,
}: {
  userId: string;
  status: Exclude<E2eeStatus, 'ready'>;
  onReady: () => void;
}) {
  const [mode, setMode] = useState<Mode>(status === 'needs-unlock' ? 'unlock' : 'setup');
  const [backupExists, setBackupExists] = useState<boolean | null>(status === 'needs-unlock' ? null : false);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On a device that doesn't hold the key yet: is a passphrase restore even possible?
  useEffect(() => {
    if (status !== 'needs-unlock') return;
    let cancelled = false;
    E2ee.hasBackup(userId).then((has) => { if (!cancelled) setBackupExists(has); }).catch(() => { if (!cancelled) setBackupExists(false); });
    return () => { cancelled = true; };
  }, [status, userId]);

  if (status === 'unavailable') {
    return (
      <div className="fz-chat-gate">
        <div className="fz-chat-gate__card">
          <div className="fz-chat-gate__icon"><Lock size={26} /></div>
          <h1 className="fz-chat-gate__title">Secure messaging isn’t available</h1>
          <p className="fz-chat-gate__sub">
            Either your browser is blocking the storage or encryption features FUZO needs to keep messages private (this can happen in some
            private windows), or secure messaging isn’t fully set up on the server yet. Try a regular window in an up-to-date browser, or check back soon.
          </p>
        </div>
      </div>
    );
  }

  const wantsBackup = passphrase.length > 0 || confirm.length > 0;
  const weak = wantsBackup ? passphraseProblem(passphrase) : null;
  const mismatch = wantsBackup && confirm !== passphrase;
  const backupValid = !wantsBackup || (!weak && !mismatch);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onReady();
    } catch (err) {
      setError(err instanceof E2eeError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const turnOn = () => run(() => E2ee.setup(userId, wantsBackup ? passphrase : undefined));
  const startFresh = () => run(() => E2ee.reset(userId, wantsBackup ? passphrase : undefined));
  const restore = (e: React.FormEvent) => { e.preventDefault(); if (passphrase) run(() => E2ee.unlock(userId, passphrase)); };

  // ── Restoring a backup on a new device ──
  if (mode === 'unlock') {
    if (backupExists === null) {
      return <div className="fz-chat-gate"><div className="fz-chat-gate__card"><p className="fz-chat-gate__sub" style={{ margin: 0 }}>Checking your account…</p></div></div>;
    }

    if (!backupExists) {
      return (
        <div className="fz-chat-gate">
          <div className="fz-chat-gate__card">
            <div className="fz-chat-gate__icon"><Smartphone size={26} /></div>
            <h1 className="fz-chat-gate__title">Your chats are on another device</h1>
            <p className="fz-chat-gate__sub">
              Secure messaging was turned on from a different device or browser, and no backup was made. You can start fresh here —
              new messages work right away, and older ones stay on your other device.
            </p>
            {error && <p className="fz-chat-gate__hint fz-chat-gate__hint--error" role="alert">{error}</p>}
            <button type="button" className="fz-chat-gate__btn" onClick={() => setMode('fresh')} disabled={busy}>Start fresh on this device</button>
          </div>
        </div>
      );
    }

    return (
      <div className="fz-chat-gate">
        <form className="fz-chat-gate__card" onSubmit={restore}>
          <div className="fz-chat-gate__icon"><ShieldCheck size={28} /></div>
          <h1 className="fz-chat-gate__title">Welcome back</h1>
          <p className="fz-chat-gate__sub">Enter the backup passphrase you chose to read your chats on this device.</p>
          <label className="fz-chat-gate__label" htmlFor="chat-passphrase">Backup passphrase</label>
          <input
            id="chat-passphrase"
            type="password"
            className="fz-chat-gate__input"
            value={passphrase}
            onChange={(e) => { setPassphrase(e.target.value); setError(null); }}
            autoComplete="current-password"
            autoFocus
            disabled={busy}
          />
          {error && <p className="fz-chat-gate__hint fz-chat-gate__hint--error" role="alert">{error}</p>}
          <button type="submit" className="fz-chat-gate__btn" disabled={busy || !passphrase}>
            {busy ? <><Loader2 size={16} className="chat-spin" /> Unlocking…</> : 'Unlock my chats'}
          </button>
          <button type="button" className="fz-chat-gate__link" onClick={() => { setPassphrase(''); setError(null); setMode('fresh'); }} disabled={busy}>
            Forgot it? Start fresh instead
          </button>
        </form>
      </div>
    );
  }

  // ── First-time setup, or starting fresh: one tap, optional backup ──
  const fresh = mode === 'fresh';
  return (
    <div className="fz-chat-gate">
      <div className="fz-chat-gate__card">
        <div className="fz-chat-gate__icon"><ShieldCheck size={28} /></div>
        <h1 className="fz-chat-gate__title">{fresh ? 'Start fresh' : 'Turn on secure messaging'}</h1>
        <p className="fz-chat-gate__sub">
          {fresh
            ? 'Older messages that this device can’t read will stay unreadable. New messages will be private and work right away.'
            : 'Your chats are end-to-end encrypted — only you and the people in them can read what’s said, not even FUZO. It takes one tap.'}
        </p>

        <button type="button" className="fz-chat-gate__btn" onClick={fresh ? startFresh : turnOn} disabled={busy || !backupValid}>
          {busy ? <><Loader2 size={16} className="chat-spin" /> Working…</> : fresh ? 'Start fresh' : 'Turn on'}
        </button>
        {error && <p className="fz-chat-gate__hint fz-chat-gate__hint--error" role="alert">{error}</p>}

        <details className="fz-chat-gate__details">
          <summary>Want to use your chats on more than one device? Add a backup (optional)</summary>
          <p className="fz-chat-gate__hint">
            Without a backup, your chats stay on this device — like WhatsApp with backups off. A backup passphrase lets you read them on a new phone or browser.
            It can only be added now; you’ll need it to restore, and we can’t recover it for you.
          </p>
          <label className="fz-chat-gate__label" htmlFor="chat-passphrase">Backup passphrase</label>
          <input
            id="chat-passphrase"
            type="password"
            className="fz-chat-gate__input"
            value={passphrase}
            onChange={(e) => { setPassphrase(e.target.value); setError(null); }}
            autoComplete="new-password"
            disabled={busy}
          />
          {passphrase.length > 0 && weak && <p className="fz-chat-gate__hint fz-chat-gate__hint--warn">{weak}</p>}
          <label className="fz-chat-gate__label" htmlFor="chat-passphrase-confirm">Confirm passphrase</label>
          <input
            id="chat-passphrase-confirm"
            type="password"
            className="fz-chat-gate__input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={busy}
          />
          {mismatch && confirm.length > 0 && <p className="fz-chat-gate__hint fz-chat-gate__hint--warn">Passphrases don’t match.</p>}
        </details>

        {fresh && status === 'needs-unlock' && backupExists && (
          <button type="button" className="fz-chat-gate__link" onClick={() => { setPassphrase(''); setConfirm(''); setError(null); setMode('unlock'); }} disabled={busy}>
            I remember my passphrase — restore instead
          </button>
        )}
      </div>
    </div>
  );
}
