'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Check, CheckCircle2, Circle, Clock, FileText, Loader2, Lock, Pencil, ShieldCheck, Upload } from 'lucide-react';
import { BUSINESS_CATEGORIES, columnsToService, daysLeft, serviceToColumns, type DeliveryStatus, type DocumentKind, type ServiceChoice, type VerificationStatus } from '@/lib/onboarding/policy';
import { CATEGORY_CONFIG, asksReservations } from '@/lib/onboarding/business';
import { WEEK_ORDER } from '@/lib/restaurant/hours';
import {
  BusinessDocumentsService,
  BusinessOnboardingService,
  documentProblem,
  type BusinessDocument,
  type BusinessProfile,
  type BusinessStatus,
} from '@/lib/services/businessOnboardingService';
import type { OnboardingStep } from '@/lib/services/onboardingService';

// Food business screens B-05 to B-10 (client spec v1, sections 5-10):
// reservations, loyalty, delivery (answers only - setup comes later), the
// optional document upload (due 15 days after the account was created),
// review, and "your business profile is created". FUZO never delivers food:
// delivery is only whether the business is on delivery apps.

type Submit = (label: string, busy: boolean) => React.ReactNode;
const ERR = 'That didn’t save. Check your connection and try again.';
const errorText = (code?: string) =>
  code === 'needs_update' ? 'Business setup needs the latest database update (npx supabase db push). Ask your admin to run it.' : ERR;

function ErrorLine({ text }: { text: string | null }) {
  return text ? (
    <p className="fz-onb__error" role="alert">
      {text}
    </p>
  ) : null;
}

// ── Radio cards ──────────────────────────────────────────────────────────────
interface Option<T extends string> {
  value: T;
  title: string;
  text?: string;
}

function OptionCards<T extends string>({ label, options, value, onChange }: { label: string; options: Option<T>[]; value: T | null; onChange: (v: T) => void }) {
  const ids = options.map((o) => o.value);
  return (
    <div className="fz-step-options" role="radiogroup" aria-label={label}>
      {options.map((o, i) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            className={`fz-step-option${on ? ' is-on' : ''}`}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const n = (i + d + ids.length) % ids.length;
              onChange(ids[n]);
              (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
            }}
          >
            <span className="fz-step-option__dot" aria-hidden="true">
              {on && <Check size={13} strokeWidth={3.4} />}
            </span>
            <span>
              <strong>{o.title}</strong>
              {o.text && <span>{o.text}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const RESERVATION_OPTIONS: Option<ServiceChoice>[] = [
  { value: 'existing', title: 'I already offer reservations', text: 'Through my own system or another booking service.' },
  { value: 'fuzo', title: 'I’d like to join FUZO Reservations', text: 'Let people book a table with you on FUZO.' },
  { value: 'both', title: 'Both', text: 'Keep what I use and add FUZO Reservations.' },
  { value: 'neither', title: 'Neither for now', text: 'You can opt in any time.' },
];
const LOYALTY_OPTIONS: Option<ServiceChoice>[] = [
  { value: 'existing', title: 'I already have a loyalty program', text: 'Stamps, points or a membership of my own.' },
  { value: 'fuzo', title: 'I’d like to join FUZO Loyalty', text: 'Reward regulars through FUZO.' },
  { value: 'both', title: 'Both', text: 'Keep my program and add FUZO Loyalty.' },
  { value: 'neither', title: 'Neither for now', text: 'You can opt in any time.' },
];
const DELIVERY_OPTIONS: Option<DeliveryStatus>[] = [
  { value: 'listed', title: 'Yes, I’m listed on delivery apps', text: 'Such as Uber Eats, DoorDash or SkipTheDishes.' },
  { value: 'interested', title: 'Not yet, but I’m interested' },
  { value: 'not_offered', title: 'No, I don’t offer delivery' },
];

export const SERVICE_LABEL: Record<ServiceChoice, string> = { existing: 'Has their own', fuzo: 'Wants FUZO’s', both: 'Both', neither: 'Neither for now' };
export const DELIVERY_LABEL: Record<DeliveryStatus, string> = { listed: 'On delivery apps', interested: 'Interested', not_offered: 'Doesn’t deliver' };

// ── B-05 / B-06 / B-07 ───────────────────────────────────────────────────────
type PrefKind = 'reservations' | 'loyalty' | 'delivery';

export function PreferenceStep({ kind, profile, onSaved, renderSubmit }: { kind: PrefKind; profile: BusinessProfile; onSaved: () => void; renderSubmit: Submit }) {
  const initial =
    kind === 'reservations'
      ? columnsToService(profile.reservationsExisting, profile.reservationsWantsFuzo)
      : kind === 'loyalty'
        ? columnsToService(profile.loyaltyExisting, profile.loyaltyWantsFuzo)
        : profile.deliveryStatus;
  const [value, setValue] = useState<string | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = kind === 'reservations' ? RESERVATION_OPTIONS : kind === 'loyalty' ? LOYALTY_OPTIONS : DELIVERY_OPTIONS;
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value) return setError('Choose one to continue.');
        setBusy(true);
        let patch = {};
        if (kind === 'delivery') patch = { deliveryStatus: value as DeliveryStatus };
        else {
          const c = serviceToColumns(value as ServiceChoice);
          patch = kind === 'reservations' ? { reservationsExisting: c.existing, reservationsWantsFuzo: c.wantsFuzo } : { loyaltyExisting: c.existing, loyaltyWantsFuzo: c.wantsFuzo };
        }
        const r = await BusinessOnboardingService.savePreferences(patch);
        setBusy(false);
        if (!r.success) return setError(errorText(r.error));
        onSaved();
      }}
    >
      <OptionCards
        label={kind === 'reservations' ? 'Table reservations' : kind === 'loyalty' ? 'Customer loyalty' : 'Food delivery platforms'}
        options={options as Option<string>[]}
        value={value}
        onChange={(v) => {
          setValue(v);
          setError(null);
        }}
      />
      <p className="fz-step-private">
        {kind === 'delivery'
          ? 'Add your delivery app links after onboarding. FUZO doesn’t deliver food or take delivery orders - it links people to your listing.'
          : 'You can set up the details after onboarding. Nothing is switched on yet.'}
      </p>
      <ErrorLine text={error} />
      {renderSubmit('Continue', busy)}
    </form>
  );
}

// ── Document status helpers ─────────────────────────────────────────────────
export const STATUS_LABEL: Record<VerificationStatus, string> = {
  awaiting_documents: 'Awaiting documents',
  submission_overdue: 'Submission overdue',
  pending_review: 'Pending review',
  action_required: 'Action required',
  verified: 'Verified',
};

export const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

function useDocuments() {
  const [docs, setDocs] = useState<BusinessDocument[] | null>(null);
  const [status, setStatus] = useState<BusinessStatus | null>(null);
  const refresh = async () => {
    const [d, s] = await Promise.all([BusinessDocumentsService.list(), BusinessDocumentsService.status()]);
    setDocs(d);
    setStatus(s);
  };
  useEffect(() => {
    let off = false;
    Promise.all([BusinessDocumentsService.list(), BusinessDocumentsService.status()]).then(([d, s]) => {
      if (off) return;
      setDocs(d);
      setStatus(s);
    });
    return () => {
      off = true;
    };
  }, []);
  return { docs, status, refresh };
}

export function Deadline({ status }: { status: BusinessStatus | null }) {
  if (!status) return null;
  if (status.status === 'pending_review' || status.status === 'verified') {
    return (
      <p className="fz-step-deadline fz-step-deadline--ok">
        <ShieldCheck size={17} aria-hidden="true" /> {status.status === 'verified' ? 'Your business is verified.' : 'Documents received - FUZO will review them.'}
      </p>
    );
  }
  const left = daysLeft(status.deadlineAt);
  return (
    <p className={`fz-step-deadline${left === 0 ? ' fz-step-deadline--late' : ''}`}>
      <CalendarClock size={17} aria-hidden="true" />
      <span>
        {left === 0 ? (
          <>
            The deadline passed on <strong>{formatDeadline(status.deadlineAt)}</strong>. Upload now to unlock your business tools.
          </>
        ) : (
          <>
            Due by <strong>{formatDeadline(status.deadlineAt)}</strong> · {left} {left === 1 ? 'day' : 'days'} left
          </>
        )}
      </span>
    </p>
  );
}

// ── B-08 Business documents ─────────────────────────────────────────────────
const DOC_SECTIONS: { type: DocumentKind; title: string; text: string }[] = [
  { type: 'business_registration', title: 'Business registration', text: 'Needed for verification - e.g. your business licence or registration certificate.' },
  { type: 'food_safety', title: 'Food safety', text: 'If it applies to you - e.g. a food handler certificate or health inspection.' },
];

export function DocumentsStep({ onSaved, renderSubmit }: { onSaved: () => void; renderSubmit: Submit }) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSaved();
      }}
    >
      <DocumentUploads footer={(count, busy) => renderSubmit(count ? 'Continue' : 'Upload later and continue', busy)} />
    </form>
  );
}

/**
 * The document upload block: deadline banner, one card per document type
 * with its files and an Upload button. Used by onboarding (B-08) and the
 * verification page (B-11 to B-13).
 */
export function DocumentUploads({
  footer,
  showDeadline = true,
  onUploaded,
}: {
  footer?: (docCount: number, uploading: boolean) => React.ReactNode;
  showDeadline?: boolean;
  onUploaded?: () => void;
}) {
  const id = useId();
  const { docs, status, refresh } = useDocuments();
  const [uploading, setUploading] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const inputs = useRef<Partial<Record<DocumentKind, HTMLInputElement | null>>>({});

  const pick = async (type: DocumentKind, file: File | undefined) => {
    if (!file) return;
    const problem = documentProblem(file);
    if (problem) return setError(problem);
    setError(null);
    setDone(null);
    setUploading(type);
    const r = await BusinessDocumentsService.upload(file, type);
    setUploading(null);
    if (!r.success) return setError(r.error === 'needs_update' ? errorText('needs_update') : 'The upload didn’t work. Check your connection and try again.');
    setDone(`${file.name} uploaded.`);
    await refresh();
    onUploaded?.();
  };

  return (
    <>
      {showDeadline && <Deadline status={status} />}
      {DOC_SECTIONS.map((sec) => {
        const mine = (docs ?? []).filter((d) => d.type === sec.type);
        return (
          <section key={sec.type} className="fz-step-doc" aria-labelledby={`${id}-${sec.type}`}>
            <div className="fz-step-doc__head">
              <span className="fz-step-doc__icon" aria-hidden="true">
                <FileText size={18} />
              </span>
              <div>
                <h3 id={`${id}-${sec.type}`}>{sec.title}</h3>
                <p>{sec.text}</p>
              </div>
            </div>
            {mine.length > 0 && (
              <ul className="fz-step-doc__files">
                {mine.map((d) => (
                  <li key={d.id}>
                    <CheckCircle2 size={15} aria-hidden="true" /> <span>{d.fileName}</span>
                    <em>{d.status === 'rejected' ? 'Needs replacing' : d.status === 'approved' ? 'Approved' : 'Submitted'}</em>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={(el) => {
                inputs.current[sec.type] = el;
              }}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              hidden
              onChange={(e) => {
                pick(sec.type, e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className="fz-step-add" onClick={() => inputs.current[sec.type]?.click()} disabled={!!uploading}>
              {uploading === sec.type ? <Loader2 size={16} className="fz-onb__spin" aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
              {uploading === sec.type ? 'Uploading…' : mine.length ? 'Add another file' : 'Upload a file'}
            </button>
          </section>
        );
      })}
      <p className="fz-step-private">
        <Lock size={14} aria-hidden="true" /> PDF, JPG or PNG, up to 10 MB. Documents are private: only you and FUZO&rsquo;s reviewers can open them.
      </p>
      {done && (
        <p className="fz-step-ok" role="status">
          {done}
        </p>
      )}
      <ErrorLine text={error} />
      {footer?.((docs ?? []).length, !!uploading)}
    </>
  );
}

// ── B-09 Review your business profile ──────────────────────────────────────
export function ReviewStep({ profile, onEdit, onCreate, renderSubmit }: { profile: BusinessProfile; onEdit: (s: OnboardingStep) => void; onCreate: () => Promise<boolean>; renderSubmit: Submit }) {
  const { docs, status } = useDocuments();
  const [busy, setBusy] = useState(false);
  const category = profile.category ?? 'restaurant';
  const catLabel = BUSINESS_CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const main = profile.branches.find((b) => b.isMain) ?? profile.branches[0];
  const cfg = CATEGORY_CONFIG[category];
  const openDays = WEEK_ORDER.filter((d) => profile.hours?.[d] && profile.hours[d]!.closed === false).length;
  const res = columnsToService(profile.reservationsExisting, profile.reservationsWantsFuzo);
  const loy = columnsToService(profile.loyaltyExisting, profile.loyaltyWantsFuzo);

  const rows: { step: OnboardingStep; label: string; value: string }[] = [
    { step: 'category', label: 'Business', value: `${profile.name || 'Unnamed'} · ${catLabel}` },
    { step: 'details', label: 'Contact', value: [profile.contactName, profile.contactEmail].filter(Boolean).join(' · ') || 'Not added' },
    {
      step: 'locations',
      label: profile.branches.length > 1 ? `Locations (${profile.branches.length})` : 'Location',
      value: main ? [main.addressPublic ? main.address : main.address ? 'Private address' : null, main.serviceArea].filter(Boolean).join(' · ') || 'Added' : 'Not added',
    },
    {
      step: 'operations',
      label: 'Operations',
      value:
        [profile.cuisines.slice(0, 3).join(', '), openDays ? `Open ${openDays} ${openDays === 1 ? 'day' : 'days'} a week` : cfg.hours === 'optional' ? null : 'Hours not set'].filter(Boolean).join(' · ') ||
        'Add later',
    },
    ...(asksReservations(category) ? [{ step: 'reservations' as const, label: 'Reservations', value: res ? SERVICE_LABEL[res] : 'Not answered' }] : []),
    { step: 'loyalty', label: 'Loyalty', value: loy ? SERVICE_LABEL[loy] : 'Not answered' },
    { step: 'delivery', label: 'Delivery', value: profile.deliveryStatus ? DELIVERY_LABEL[profile.deliveryStatus] : 'Not answered' },
    {
      step: 'documents',
      label: 'Documents',
      value: status ? `${STATUS_LABEL[status.status]}${docs?.length ? ` · ${docs.length} uploaded` : ''}` : docs?.length ? `${docs.length} uploaded` : 'Not uploaded yet',
    },
  ];

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await onCreate();
        if (!ok) setBusy(false);
      }}
    >
      <ul className="fz-step-review">
        {rows.map((r) => (
          <li key={r.step}>
            <span className="fz-step-review__label">{r.label}</span>
            <span className="fz-step-review__value">{r.value}</span>
            <button type="button" className="fz-step-review__edit" onClick={() => onEdit(r.step)} aria-label={`Edit ${r.label.toLowerCase()}`}>
              <Pencil size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="fz-step-private">Your profile goes live on FUZO straight away. The FUZO Verified badge and business tools come once your documents are approved.</p>
      {renderSubmit('Create business profile', busy)}
    </form>
  );
}

// ── B-10 Your business profile is created ───────────────────────────────────
export function CreatedStep({ profile, onGo }: { profile: BusinessProfile; onGo: () => void }) {
  const { docs, status } = useDocuments();
  const verified = status?.status === 'verified';
  const res = columnsToService(profile.reservationsExisting, profile.reservationsWantsFuzo);
  const loy = columnsToService(profile.loyaltyExisting, profile.loyaltyWantsFuzo);
  // Only what they showed interest in (spec section 10: never force optional setup).
  const checklist: { label: string; done: boolean }[] = [
    { label: 'Business profile', done: true },
    { label: 'Menu', done: false },
    ...(CATEGORY_CONFIG[profile.category ?? 'restaurant'].location.branches ? [{ label: 'Locations', done: profile.branches.length > 0 }] : []),
    ...(res && res !== 'neither' ? [{ label: 'Reservations', done: false }] : []),
    ...(loy && loy !== 'neither' ? [{ label: 'Loyalty', done: false }] : []),
    ...(profile.deliveryStatus && profile.deliveryStatus !== 'not_offered' ? [{ label: 'Delivery app links', done: false }] : []),
    { label: 'Documents', done: verified || status?.status === 'pending_review' || !!docs?.length },
  ];
  return (
    <div>
      <ul className="fz-step-facts">
        <li>
          <span>Profile visibility</span>
          <strong className="is-good">Available</strong>
        </li>
        <li>
          <span>Document status</span>
          <strong className={verified ? 'is-good' : ''}>{status ? STATUS_LABEL[status.status] : '…'}</strong>
        </li>
        {status && !verified && status.status !== 'pending_review' && (
          <li>
            <span>Documents due</span>
            <strong>
              <Clock size={14} aria-hidden="true" /> {formatDeadline(status.deadlineAt)}
            </strong>
          </li>
        )}
      </ul>

      <p className="fz-step-section">Setup checklist</p>
      <ul className="fz-step-checklist">
        {checklist.map((c) => (
          <li key={c.label} className={c.done ? 'is-done' : ''}>
            {c.done ? <CheckCircle2 size={17} aria-hidden="true" /> : <Circle size={17} aria-hidden="true" />}
            {c.label}
            <span className="visually-hidden">{c.done ? ' (done)' : ' (to do)'}</span>
          </li>
        ))}
      </ul>

      {!verified && (
        <p className="fz-step-note">
          Until your documents are approved you can view FUZO and your profile stays visible, but you can&rsquo;t post as your business, open the business
          dashboard, advertise, use FUZO Loyalty or show the Verified badge.
        </p>
      )}

      <Link href="/profile" className="fz-onb__cta fz-onb__cta--link">
        View business profile
      </Link>
      <button type="button" className="fz-onb__skip" onClick={onGo}>
        Go to FUZO
      </button>
    </div>
  );
}
