'use client';

import { useState } from 'react';
import { ClipboardPaste, Link2, Loader2 } from 'lucide-react';
import { parseSourceUrl } from '@/lib/import/platforms';
import type { ImportResult } from '@/app/api/import/route';

// Create -> URL tab (client, 2026-10-16; docs/VIDEO_URL_PLAN.md, 3a): paste a
// Facebook / Instagram / Pinterest / TikTok / YouTube post or a recipe website,
// and FUZO reads what it shares (POST /api/import). Mostly recipes: a photo
// post becomes a Recipe card, a video a recipe Trim - credited to the creator.

interface UrlImportProps {
  onImported: (result: ImportResult) => void;
}

export function UrlImport({ onImported }: UrlImportProps) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

  const run = async (value = url) => {
    const link = value.trim();
    if (!link) return;
    if (!parseSourceUrl(link)) {
      setError('Paste a full link starting with https://');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: link }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : "We couldn't read that link. Try another one.");
        return;
      }
      onImported(data as ImportResult);
    } catch {
      setError('No connection. Check your internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  const paste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        setUrl(text);
        run(text);
      }
    } catch {
      setError('Allow pasting, or long-press the box and paste the link.');
    }
  };

  return (
    <div className="cf-import">
      <span className="cf-import__icon" aria-hidden="true">
        <Link2 size={28} />
      </span>
      <h2 className="cf-import__title">Import a recipe</h2>
      <p className="cf-import__sub">Paste a link from Instagram, TikTok, Facebook, Pinterest, YouTube or a recipe website.</p>
      <form
        className="cf-import__form"
        noValidate // our own message, not the browser's tooltip
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <input
          className="cf-import__input"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://"
          aria-label="Link to import"
          autoComplete="off"
          disabled={busy}
        />
        <button type="submit" className="cf-import__go" disabled={busy || !url.trim()}>
          {busy ? <Loader2 size={18} className="scout-spin" aria-hidden="true" /> : null} {busy ? 'Reading…' : 'Import'}
        </button>
      </form>
      {canPaste && !busy && (
        <button type="button" className="cf-import__paste" onClick={paste}>
          <ClipboardPaste size={16} aria-hidden="true" /> Paste link
        </button>
      )}
      <p className="cf-import__msg" role={error ? 'alert' : 'status'}>
        {error ?? (busy ? 'Reading the post…' : '')}
      </p>
      <p className="cf-import__fine">The original stays credited to its creator.</p>
    </div>
  );
}

export default UrlImport;
