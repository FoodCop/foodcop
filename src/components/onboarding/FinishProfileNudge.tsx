'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, Dna, Sparkles, Tags, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { OnboardingService, nextStep } from '@/lib/services/onboardingService';
import { finishPopupDue, finishSummary, type FinishKey } from '@/lib/onboarding/finishProfile';

// The "Finish your profile" pop-up (client, 2026-10-18): 1, 3 and 7 days after
// someone skips parts of onboarding, at most once a day, three times in all -
// after that only the card on Home and Profile. Each showing is recorded in
// the database, so it doesn't repeat on another device.

const KEY = 'fz-finish-nudge-checked';
const SKIP = /^\/(onboarding|login|auth|reset-password|terms|privacy|business|admin|finish-profile)(\/|$)/;
const ICON: Record<FinishKey, typeof Dna> = { food: Dna, photo: Camera, roles: Tags };

export default function FinishProfileNudge() {
  const { user } = useAuth();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [summary, setSummary] = useState<ReturnType<typeof finishSummary>>(null);
  const cta = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!user || user.is_anonymous || SKIP.test(pathname) || pathname === '/') return;
    try {
      if (sessionStorage.getItem(KEY) === user.id) return;
      sessionStorage.setItem(KEY, user.id);
    } catch {
      return;
    }
    let off = false;
    OnboardingService.load().then((r) => {
      // Existing accounts still being asked for details (OnboardingCatchUp) come first.
      if (off || !r.success || !r.data || nextStep(r.data) !== 'done' || !finishPopupDue(r.data)) return;
      OnboardingService.markNudgeShown(r.data.nudgesShown);
      setSummary(finishSummary(r.data));
    });
    return () => {
      off = true;
    };
  }, [user, pathname]);

  const close = () => setSummary(null);
  useEffect(() => {
    if (!summary) return;
    cta.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [summary]);

  return (
    <AnimatePresence>
      {summary && (
        <motion.div className="fz-remind" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="fz-remind__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fz-finish-nudge-title"
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 16, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="fz-remind__close" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
            <span className="fz-onb__badge" aria-hidden="true">
              <Sparkles size={24} />
            </span>
            <h2 id="fz-finish-nudge-title" className="fz-onb__title">
              Finish your profile
            </h2>
            <p className="fz-onb__sub">
              {summary.done} of {summary.total} done. A few minutes now and FUZO picks food that really fits your taste.
            </p>
            <ul className="fz-finish__items">
              {summary.items
                .filter((i) => !i.done)
                .map((i) => {
                  const Icon = ICON[i.key];
                  return (
                    <li key={i.key}>
                      <Icon size={15} aria-hidden="true" /> {i.label}
                    </li>
                  );
                })}
            </ul>
            <Link ref={cta} href="/finish-profile" className="fz-onb__cta fz-onb__cta--link" onClick={close}>
              Finish now
            </Link>
            <button type="button" className="fz-onb__skip" onClick={close}>
              Not now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
