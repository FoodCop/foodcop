'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, BadgeCheck, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { BusinessDocumentsService, type BusinessStatus } from '@/lib/services/businessOnboardingService';
import { DocumentUploads, STATUS_LABEL, formatDeadline } from '@/components/onboarding/steps/BusinessFinish';
import { daysLeft } from '@/lib/onboarding/policy';

// /business/verification - the business owner's verification status
// (client spec v1, B-11 to B-14): awaiting / overdue (upload), pending review,
// action required (reason + replace), verified (open the dashboard). The
// profile stays visible in every state; business tools wait for approval.

const LOCKED = ['Posting as your business', 'The business dashboard', 'Advertising', 'FUZO Loyalty', 'The FUZO Verified badge and location tag'];

export default function VerificationView() {
  const router = useRouter();
  const [status, setStatus] = useState<BusinessStatus | null | undefined>(undefined);

  const load = useCallback(async () => {
    const s = await BusinessDocumentsService.status();
    setStatus(s);
  }, []);
  useEffect(() => {
    let off = false;
    BusinessDocumentsService.status().then((s) => !off && setStatus(s));
    return () => {
      off = true;
    };
  }, []);

  let body: React.ReactNode;
  if (status === undefined) {
    body = (
      <div className="fz-onb__state" role="status" aria-label="Loading">
        <Loader2 size={26} className="fz-onb__spin" aria-hidden="true" />
      </div>
    );
  } else if (status === null) {
    body = (
      <div className="fz-onb__state">
        <p>This page is for food business accounts.</p>
        <Link href="/dashboard" className="fz-onb__ghost fz-onb__ghost--link">
          Go to FUZO
        </Link>
      </div>
    );
  } else if (status.status === 'verified') {
    // B-14 Business verified
    body = (
      <>
        <span className="fz-onb__badge fz-onb__badge--good" aria-hidden="true">
          <BadgeCheck size={28} />
        </span>
        <h1 className="fz-onb__title">Business verified</h1>
        <p className="fz-onb__sub">Your business documents have been approved.</p>
        <ul className="fz-step-facts">
          <li>
            <span>Status</span>
            <strong className="is-good">Verified</strong>
          </li>
          <li>
            <span>Verified badge and location tag</span>
            <strong className="is-good">Available</strong>
          </li>
          <li>
            <span>Business tools</span>
            <strong>Unlocked</strong>
          </li>
        </ul>
        <p className="fz-step-section">Continue setup</p>
        <p className="fz-step-private">Add your menu, locations, reservations, loyalty and delivery links from the business dashboard.</p>
        <Link href="/profile?tab=dashboard" className="fz-onb__cta fz-onb__cta--link">
          Open business dashboard
        </Link>
      </>
    );
  } else if (status.status === 'pending_review') {
    // B-12 Documents under review
    body = (
      <>
        <span className="fz-onb__badge" aria-hidden="true">
          <Clock size={26} />
        </span>
        <h1 className="fz-onb__title">Documents under review</h1>
        <p className="fz-onb__sub">We&rsquo;ve received your documents. FUZO will check them and let you know.</p>
        <ul className="fz-step-facts">
          <li>
            <span>Status</span>
            <strong>Pending review</strong>
          </li>
          <li>
            <span>Your profile</span>
            <strong className="is-good">Visible</strong>
          </li>
        </ul>
        <p className="fz-step-note">The FUZO Verified badge, location tag and business tools stay unavailable until your documents are approved.</p>
        <p className="fz-step-section">Your documents</p>
        <DocumentUploads showDeadline={false} onUploaded={load} />
      </>
    );
  } else {
    // B-11 / B-13: awaiting, overdue or action required
    const action = status.status === 'action_required';
    const overdue = status.status === 'submission_overdue';
    const left = daysLeft(status.deadlineAt);
    body = (
      <>
        <span className={`fz-onb__badge${action || overdue ? ' fz-onb__badge--warn' : ''}`} aria-hidden="true">
          {action || overdue ? <AlertTriangle size={26} /> : <ShieldCheck size={26} />}
        </span>
        <h1 className="fz-onb__title">{action ? 'Action required' : 'Complete your business verification'}</h1>
        <p className="fz-onb__sub">
          {action
            ? 'Please update your business documents.'
            : overdue
              ? `The deadline was ${formatDeadline(status.deadlineAt)}. Upload your documents to unlock your business tools.`
              : `Upload your documents by ${formatDeadline(status.deadlineAt)} · ${left} ${left === 1 ? 'day' : 'days'} left.`}
        </p>
        {action && status.reviewerNote && (
          <div className="fz-verify-reason" role="note">
            <strong>What needs to change</strong>
            <p>{status.reviewerNote}</p>
          </div>
        )}
        <ul className="fz-step-facts">
          <li>
            <span>Status</span>
            <strong>{STATUS_LABEL[status.status]}</strong>
          </li>
          <li>
            <span>Your profile</span>
            <strong className="is-good">Visible</strong>
          </li>
        </ul>
        <p className="fz-step-section">Unavailable until approval</p>
        <ul className="fz-verify-locked">
          {LOCKED.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="fz-step-section">{action ? 'Replace documents' : 'Upload documents'}</p>
        <DocumentUploads showDeadline={false} onUploaded={load} />
        <Link href="/profile" className="fz-onb__skip fz-onb__skip--link">
          View profile
        </Link>
      </>
    );
  }

  return (
    <div className="fz-onb">
      <header className="fz-onb__top">
        <button type="button" className="fz-onb__back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/profile'))}>
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </button>
        <span className="fz-verify-eyebrow">Business verification</span>
      </header>
      <main className="fz-onb__main">
        <motion.div className="fz-onb__card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
          {body}
        </motion.div>
      </main>
    </div>
  );
}
