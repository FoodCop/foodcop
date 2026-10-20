'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, ExternalLink, FileText, Loader2, ShieldAlert } from 'lucide-react';
import { AdminVerificationService, type AdminBusiness } from '@/lib/services/adminVerificationService';
import { BUSINESS_CATEGORIES, type VerificationStatus } from '@/lib/onboarding/policy';
import { STATUS_LABEL, formatDeadline } from '@/components/onboarding/steps/BusinessFinish';

// /admin/verification - FUZO admins approve food business documents or ask
// for changes (client spec v1, section 8; B-12 to B-14 follow from here).
// The database only gives this data to accounts in app_admins and records
// every decision in business_audit_log.

type Filter = 'pending_review' | 'action_required' | 'waiting' | 'verified' | 'all';
const FILTERS: { id: Filter; label: string; match: (s: VerificationStatus) => boolean }[] = [
  { id: 'pending_review', label: 'Needs review', match: (s) => s === 'pending_review' },
  { id: 'action_required', label: 'Action required', match: (s) => s === 'action_required' },
  { id: 'waiting', label: 'Awaiting documents', match: (s) => s === 'awaiting_documents' || s === 'submission_overdue' },
  { id: 'verified', label: 'Verified', match: (s) => s === 'verified' },
  { id: 'all', label: 'All', match: () => true },
];
const CAT = Object.fromEntries(BUSINESS_CATEGORIES.map((c) => [c.id, c.label]));
const DOC_LABEL = { business_registration: 'Business registration', food_safety: 'Food safety', other: 'Other' } as const;
const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-');

export default function AdminVerificationView() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [list, setList] = useState<AdminBusiness[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending_review');
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await AdminVerificationService.list();
    if (r.success && r.data) setList(r.data);
    else setError(r.error === 'needs_update' ? 'Verification needs the latest database update (npx supabase db push).' : 'Couldn’t load businesses. Try again.');
  }, []);

  useEffect(() => {
    let off = false;
    AdminVerificationService.isAdmin().then(async (ok) => {
      if (off) return;
      setAdmin(ok);
      if (!ok) return;
      const r = await AdminVerificationService.list();
      if (off) return;
      if (r.success && r.data) setList(r.data);
      else setError(r.error === 'needs_update' ? 'Verification needs the latest database update (npx supabase db push).' : 'Couldn’t load businesses. Try again.');
    });
    return () => {
      off = true;
    };
  }, []);

  const shown = (list ?? []).filter((b) => FILTERS.find((f) => f.id === filter)!.match(b.status));

  return (
    <div className="fz-onb fz-admin">
      <header className="fz-onb__top">
        <Link href="/dashboard" className="fz-onb__back">
          <ArrowLeft size={15} aria-hidden="true" /> FUZO
        </Link>
        <span className="fz-verify-eyebrow">Admin · Business verification</span>
      </header>
      <main className="fz-admin__main">
        {admin === null ? (
          <div className="fz-onb__state" role="status" aria-label="Loading">
            <Loader2 size={26} className="fz-onb__spin" aria-hidden="true" />
          </div>
        ) : !admin ? (
          <div className="fz-onb__card fz-onb__state">
            <ShieldAlert size={28} aria-hidden="true" />
            <p>This page is for FUZO admins.</p>
          </div>
        ) : (
          <>
            <h1 className="fz-onb__title">Business verification</h1>
            <p className="fz-onb__sub">Check each business&rsquo;s documents, then approve it or say what needs to change.</p>
            <div className="fz-admin__filters" role="tablist" aria-label="Filter businesses">
              {FILTERS.map((f) => {
                const n = (list ?? []).filter((b) => f.match(b.status)).length;
                return (
                  <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>
                    {f.label}
                    <span>{n}</span>
                  </button>
                );
              })}
            </div>
            {error && (
              <p className="fz-onb__error" role="alert">
                {error}
              </p>
            )}
            {!list && !error ? (
              <div className="fz-onb__state" role="status" aria-label="Loading">
                <Loader2 size={24} className="fz-onb__spin" aria-hidden="true" />
              </div>
            ) : shown.length === 0 ? (
              <p className="fz-admin__empty">Nothing here right now.</p>
            ) : (
              <ul className="fz-admin__list">
                {shown.map((b) => (
                  <BusinessRow key={b.id} business={b} open={open === b.id} onToggle={() => setOpen(open === b.id ? null : b.id)} onReviewed={load} />
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function BusinessRow({ business: b, open, onToggle, onReviewed }: { business: AdminBusiness; open: boolean; onToggle: () => void; onReviewed: () => Promise<void> }) {
  const id = useId();
  const [mode, setMode] = useState<'idle' | 'approve' | 'changes'>('idle');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const openDoc = async (path: string) => {
    // Open the tab first (pop-up blockers), then point it at the short-lived link.
    // ('noopener' would make window.open return null, so cut the link by hand.)
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    const url = await AdminVerificationService.openLink(path);
    if (url && tab) tab.location.href = url;
    else {
      tab?.close();
      setError('Couldn’t open that file.');
    }
  };

  const decide = async (approve: boolean) => {
    if (!approve && !note.trim()) return setError('Say what needs to change.');
    setBusy(true);
    setError(null);
    const r = await AdminVerificationService.review(b.id, approve, approve ? undefined : note.trim());
    setBusy(false);
    if (!r.success) return setError(r.error === 'not_admin' ? 'Only FUZO admins can review businesses.' : r.error === 'note_required' ? 'Say what needs to change.' : 'That didn’t save. Try again.');
    setDone(approve ? 'Approved - the business is now verified.' : 'Sent - the business will see your note.');
    setMode('idle');
    setNote('');
    await onReviewed();
  };

  return (
    <li className={`fz-admin__item${open ? ' is-open' : ''}`}>
      <button type="button" className="fz-admin__row" aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}>
        <span className="fz-admin__name">
          <strong>{b.name}</strong>
          <span>
            {b.category ? CAT[b.category] ?? b.category : 'No category'} · {b.documents.length} {b.documents.length === 1 ? 'document' : 'documents'}
          </span>
        </span>
        <span className={`fz-admin__status fz-admin__status--${b.status}`}>{STATUS_LABEL[b.status]}</span>
        <ChevronDown size={18} className="fz-admin__chev" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`${id}-panel`} className="fz-admin__panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <dl className="fz-admin__facts">
              <div>
                <dt>Contact</dt>
                <dd>{[b.contactName, b.contactEmail, b.contactPhone].filter(Boolean).join(' · ') || '-'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{b.address || '-'}</dd>
              </div>
              <div>
                <dt>Account created</dt>
                <dd>{shortDate(b.accountCreatedAt)}</dd>
              </div>
              <div>
                <dt>Documents due</dt>
                <dd>{formatDeadline(b.deadlineAt)}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{shortDate(b.submittedAt)}</dd>
              </div>
              {b.reviewerNote && (
                <div>
                  <dt>Last note</dt>
                  <dd>{b.reviewerNote}</dd>
                </div>
              )}
            </dl>

            <p className="fz-step-section">Documents</p>
            {b.documents.length === 0 ? (
              <p className="fz-admin__empty">No documents uploaded yet.</p>
            ) : (
              <ul className="fz-admin__docs">
                {b.documents.map((d) => (
                  <li key={d.id}>
                    <FileText size={16} aria-hidden="true" />
                    <span>
                      <strong>{DOC_LABEL[d.type]}</strong>
                      {d.fileName} · {shortDate(d.submittedAt)} · {d.status}
                    </span>
                    <button type="button" className="fz-admin__open" onClick={() => openDoc(d.path)}>
                      Open <ExternalLink size={13} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {done && (
              <p className="fz-step-ok" role="status">
                {done}
              </p>
            )}
            {error && (
              <p className="fz-onb__error" role="alert">
                {error}
              </p>
            )}

            {mode === 'changes' ? (
              <div className="fz-step-field">
                <label htmlFor={`${id}-note`}>What needs to change? (the business sees this)</label>
                <textarea id={`${id}-note`} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The registration photo is blurry - please upload a clear copy." />
                <div className="fz-admin__actions">
                  <button type="button" className="fz-onb__cta" onClick={() => decide(false)} disabled={busy}>
                    {busy ? 'Sending…' : 'Send to the business'}
                  </button>
                  <button type="button" className="fz-onb__ghost" onClick={() => setMode('idle')} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : mode === 'approve' ? (
              <div className="fz-admin__confirm">
                <p>
                  Approve <strong>{b.name}</strong>? It gets the Verified badge and its business tools.
                </p>
                <div className="fz-admin__actions">
                  <button type="button" className="fz-onb__cta" onClick={() => decide(true)} disabled={busy}>
                    {busy ? 'Approving…' : (
                      <>
                        <Check size={17} aria-hidden="true" /> Yes, approve
                      </>
                    )}
                  </button>
                  <button type="button" className="fz-onb__ghost" onClick={() => setMode('idle')} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="fz-admin__actions">
                <button type="button" className="fz-onb__cta" onClick={() => setMode('approve')} disabled={b.status === 'verified' || b.documents.length === 0}>
                  Approve
                </button>
                <button type="button" className="fz-onb__ghost" onClick={() => setMode('changes')}>
                  Ask for changes
                </button>
              </div>
            )}
            {b.documents.length === 0 && b.status !== 'verified' && <p className="fz-step-private">Approval opens once the business uploads a document.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
