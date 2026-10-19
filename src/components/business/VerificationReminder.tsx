'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CalendarClock, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { BusinessDocumentsService, type BusinessStatus } from '@/lib/services/businessOnboardingService';
import { daysLeft } from '@/lib/onboarding/policy';

// B-11 "Complete your business verification" (client spec v1, section 8.2):
// shown on each business sign-in (once per browser session) while documents
// are outstanding or need replacing. It never hides the profile or blocks
// FUZO - "Remind me later" just closes it.

const KEY = 'fz-verify-reminded';
const SKIP = /^\/(onboarding|login|auth|reset-password|terms|privacy|business|admin)(\/|$)/;
const DUE: BusinessStatus['status'][] = ['awaiting_documents', 'submission_overdue', 'action_required'];

export default function VerificationReminder() {
  const { user } = useAuth();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<BusinessStatus | null>(null);
  const firstButton = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!user || user.is_anonymous || SKIP.test(pathname) || pathname === '/') return;
    try {
      if (sessionStorage.getItem(KEY) === user.id) return;
    } catch {
      return;
    }
    let off = false;
    BusinessDocumentsService.status().then((s) => {
      if (off || !s || !DUE.includes(s.status)) return;
      try {
        sessionStorage.setItem(KEY, user.id);
      } catch {
        /* shows again next page - acceptable */
      }
      setStatus(s);
    });
    return () => {
      off = true;
    };
  }, [user, pathname]);

  const close = () => setStatus(null);
  useEffect(() => {
    if (!status) return;
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  const left = status ? daysLeft(status.deadlineAt) : 0;
  const deadline = status ? new Date(status.deadlineAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  return (
    <AnimatePresence>
      {status && (
        <motion.div className="fz-remind" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="fz-remind__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fz-remind-title"
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 16, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="fz-remind__close" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
            <span className={`fz-onb__badge${status.status === 'awaiting_documents' ? '' : ' fz-onb__badge--warn'}`} aria-hidden="true">
              {status.status === 'awaiting_documents' ? <CalendarClock size={24} /> : <AlertTriangle size={24} />}
            </span>
            <h2 id="fz-remind-title" className="fz-onb__title">
              {status.status === 'action_required' ? 'Please update your business documents' : 'Complete your business verification'}
            </h2>
            <p className="fz-onb__sub">
              Your business profile stays visible. Business posting, ads, the dashboard, FUZO Loyalty and the Verified location tag are unavailable until approval.
            </p>
            <p className={`fz-step-deadline${status.status === 'awaiting_documents' ? '' : ' fz-step-deadline--late'}`}>
              <CalendarClock size={17} aria-hidden="true" />
              <span>
                {status.status === 'action_required'
                  ? status.reviewerNote || 'FUZO asked for changes to your documents.'
                  : status.status === 'submission_overdue'
                    ? `The deadline passed on ${deadline}. Upload now to unlock your business tools.`
                    : `Due by ${deadline} · ${left} ${left === 1 ? 'day' : 'days'} left`}
              </span>
            </p>
            <Link ref={firstButton} href="/business/verification" className="fz-onb__cta fz-onb__cta--link" onClick={close}>
              {status.status === 'action_required' ? 'Replace documents' : 'Upload documents'}
            </Link>
            <button type="button" className="fz-onb__skip" onClick={close}>
              Remind me later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
