'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Camera, Dna, Sparkles, Tags, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { OnboardingService } from '@/lib/services/onboardingService';
import { cardHidden, finishSummary, hideCard, type FinishKey } from '@/lib/onboarding/finishProfile';

// "Finish your profile" card on Home (For you) and on your own Profile
// (client, 2026-10-18). Shows what was skipped during onboarding and stays
// until it's all done; × hides it for a week on this device.

const ICON: Record<FinishKey, typeof Dna> = { food: Dna, photo: Camera, roles: Tags };

export default function FinishProfileCard({ where }: { where: 'home' | 'profile' }) {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [summary, setSummary] = useState<ReturnType<typeof finishSummary>>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!user || user.is_anonymous) return;
    let off = false;
    OnboardingService.load().then((r) => {
      if (off || !r.success || !r.data) return;
      if (cardHidden(user.id)) return;
      setSummary(finishSummary(r.data));
    });
    return () => {
      off = true;
    };
  }, [user]);

  const show = !!summary && !hidden;
  return (
    <AnimatePresence>
      {show && (
        <motion.section
          className={`fz-finish fz-finish--${where}`}
          aria-labelledby={`fz-finish-${where}`}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            className="fz-finish__close"
            aria-label="Hide for a week"
            title="Hide for a week"
            onClick={() => {
              if (user) hideCard(user.id);
              setHidden(true);
            }}
          >
            <X size={16} />
          </button>
          <div className="fz-finish__head">
            <span className="fz-finish__icon" aria-hidden="true">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 id={`fz-finish-${where}`}>Finish your profile</h2>
              <p>
                {summary.done} of {summary.total} done · better picks for you
              </p>
            </div>
          </div>
          <div
            className="fz-finish__bar"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuemin={0}
            aria-valuemax={summary.total}
            aria-valuenow={summary.done}
          >
            <i style={{ width: `${(summary.done / summary.total) * 100}%` }} />
          </div>
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
          <Link href="/finish-profile" className="fz-finish__cta">
            Finish now <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
