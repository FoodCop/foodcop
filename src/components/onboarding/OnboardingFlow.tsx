'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Loader2, LogOut, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/share/safeNext';
import { takeNextAfterSignup } from '@/lib/share/afterSignup';
import { clearIntent, readIntent, blockAgeGate } from '@/lib/onboarding/intent';
import type { AccountType } from '@/lib/onboarding/policy';
import { OnboardingService, nextStep, type OnboardingState, type OnboardingStep } from '@/lib/services/onboardingService';
import { AccountTypeStep } from './steps/AccountTypeStep';
import { AgeStep, TooYoung } from './steps/AgeStep';
import { ConsentChecks, consentsMissing, type Consents } from './steps/ConsentChecks';

// /onboarding (client spec v1, docs/ONBOARDING_PLAN.md). Shows only what is
// still missing, worked out from the database, so it resumes anywhere:
//   type (I-01) -> age (I-03, individuals) -> consent (I-02 ticks) -> ...
// Choices made on the sign-up steps before the account existed are saved
// first (lib/onboarding/intent). Phases 3-5 add the profile, food profile and
// business screens between consent and the end.

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS: Record<AccountType, OnboardingStep[]> = {
  individual: ['type', 'age', 'consent', 'ready'],
  food_business: ['type', 'consent', 'business'],
};

const MESSAGES: Record<string, string> = {
  needs_update: 'Onboarding needs the latest database update (npx supabase db push). Ask your admin to run it.',
  failed: 'Something went wrong saving that. Check your connection and try again.',
};

export default function OnboardingFlow() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [tooYoung, setTooYoung] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [type, setType] = useState<AccountType | null>(null);
  const [consents, setConsents] = useState<Consents>({ terms: false, privacy: false, authority: false });
  const [triedConsent, setTriedConsent] = useState(false);
  const [name, setName] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const leave = useCallback(() => {
    const next = safeNextPath(new URLSearchParams(window.location.search).get('next')) ?? takeNextAfterSignup();
    router.replace(next ?? '/dashboard');
  }, [router]);

  const show = useCallback(
    (s: OnboardingState) => {
      if (s.isOnboarded) {
        leave();
        return;
      }
      setState(s);
      setName((n) => n || s.displayName);
      const n = nextStep(s);
      setStep(n);
      OnboardingService.saveStep(n);
    },
    [leave],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await OnboardingService.load();
      if (cancelled) return;
      if (!res.success || !res.data) {
        if (res.error === 'signed_out') {
          router.replace('/login?next=%2Fonboarding');
          return;
        }
        setLoadError(MESSAGES[res.error ?? 'failed'] ?? MESSAGES.failed);
        return;
      }
      // Save what was chosen on the sign-up steps, then carry on from there.
      const intent = readIntent();
      if (intent && !res.data.isOnboarded) {
        const applied = await OnboardingService.applyIntent(res.data, intent);
        if (cancelled) return;
        clearIntent();
        if (!applied.success) {
          if (applied.error === 'too_young') {
            blockAgeGate();
            setTooYoung(true);
            setState(res.data);
            return;
          }
          show(res.data);
          return;
        }
        if (applied.data) {
          show(applied.data);
          return;
        }
      }
      show(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, show]);

  // Move focus to the new heading on each step (screen readers hear it).
  useEffect(() => {
    if (step) headingRef.current?.focus();
  }, [step]);

  const reload = async () => {
    const res = await OnboardingService.load();
    if (res.success && res.data) show(res.data);
  };

  const run = async (action: () => Promise<{ success: boolean; error?: string }>) => {
    setSaving(true);
    setError(null);
    const r = await action();
    setSaving(false);
    if (!r.success) {
      if (r.error === 'too_young') {
        blockAgeGate();
        setTooYoung(true);
        return false;
      }
      setError(MESSAGES[r.error ?? 'failed'] ?? MESSAGES.failed);
      return false;
    }
    return true;
  };

  const signOut = async () => {
    await createClient()?.auth.signOut();
    router.replace('/');
  };

  const business = state?.accountType === 'food_business' || type === 'food_business';
  const flow = STEPS[state?.accountType ?? type ?? 'individual'];
  const index = step ? Math.max(0, flow.indexOf(step)) : 0;

  const errorNote = error && (
    <motion.p className="fz-onb__error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
      <AlertCircle size={16} aria-hidden="true" /> {error}
    </motion.p>
  );
  const cta = (label: string, onClick?: () => void) => (
    <button type={onClick ? 'button' : 'submit'} className="fz-onb__cta" onClick={onClick} disabled={saving}>
      {saving ? (
        <>
          <Loader2 size={18} className="fz-onb__spin" aria-hidden="true" /> Saving…
        </>
      ) : (
        <>
          {label} <ArrowRight size={18} aria-hidden="true" />
        </>
      )}
    </button>
  );

  let body: React.ReactNode;
  let key = step ?? 'loading';
  if (loadError) {
    key = 'load-error';
    body = (
      <div className="fz-onb__state" role="alert">
        <AlertCircle size={28} aria-hidden="true" />
        <p>{loadError}</p>
        <button type="button" className="fz-onb__ghost" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  } else if (tooYoung) {
    key = 'young';
    body = (
      <TooYoung>
        <button type="button" className="fz-onb__ghost" onClick={signOut}>
          Sign out
        </button>
      </TooYoung>
    );
  } else if (!state || !step) {
    body = (
      <div className="fz-onb__state" role="status" aria-label="Loading">
        <Loader2 size={28} className="fz-onb__spin" aria-hidden="true" />
      </div>
    );
  } else if (step === 'type') {
    body = (
      <>
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          Welcome to FUZO
        </h1>
        <p className="fz-onb__sub">Discover food that finds you. How will you use FUZO?</p>
        <AccountTypeStep
          value={type}
          onChange={(v) => {
            setType(v);
            setError(null);
          }}
        />
        <p className="fz-onb__hint">You can&rsquo;t switch between the two later.</p>
        {errorNote}
        {cta('Continue', async () => {
          if (!type) return setError('Choose Individual or Food Business.');
          if (await run(() => OnboardingService.setAccountType(type))) await reload();
        })}
      </>
    );
  } else if (step === 'age') {
    body = (
      <>
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          Confirm your age
        </h1>
        <p className="fz-onb__sub">This helps us apply the right protections.</p>
        <AgeStep
          onTooYoung={() => {
            blockAgeGate();
            setTooYoung(true);
          }}
          onDone={async (b) => {
            if (await run(() => OnboardingService.saveBirthDate(b.month, b.year, b.livesInQuebec))) await reload();
          }}
          renderSubmit={(label) => (
            <>
              {errorNote}
              {cta(label)}
            </>
          )}
        />
      </>
    );
  } else if (step === 'consent') {
    body = (
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const missing = consentsMissing(consents, business);
          setTriedConsent(true);
          if (missing) return setError(missing);
          if (await run(() => OnboardingService.acceptConsents())) await reload();
        }}
      >
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          {state.termsOk || state.privacyOk ? 'We’ve updated our terms' : 'A couple of agreements'}
        </h1>
        <p className="fz-onb__sub">Please read and accept these to use FUZO.</p>
        <ConsentChecks
          value={consents}
          business={business}
          invalid={triedConsent}
          onChange={(c) => {
            setConsents(c);
            setError(null);
          }}
        />
        {errorNote}
        {cta('Continue')}
      </form>
    );
  } else if (step === 'ready') {
    body = (
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return setError('Enter your name.');
          if (await run(() => OnboardingService.finish(name))) leave();
        }}
      >
        <span className="fz-onb__badge" aria-hidden="true">
          🎉
        </span>
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          You&rsquo;re ready to explore
        </h1>
        <p className="fz-onb__sub">Explore food, discover places and see what people are eating. Your food profile can be set up any time from your profile.</p>
        {!state.displayName && (
          <div className="fz-step-field">
            <label htmlFor="onb-name">Your name</label>
            <input id="onb-name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        {errorNote}
        {cta('Enter FUZO')}
      </form>
    );
  } else {
    // Food business: the business screens (B-01 to B-10) come in phases 4-5.
    body = (
      <>
        <span className="fz-onb__badge" aria-hidden="true">
          <Store size={26} />
        </span>
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          Next: your business details
        </h1>
        <p className="fz-onb__sub">Setting up your business profile is coming in the next update of this branch.</p>
      </>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="fz-onb">
        <header className="fz-onb__top">
          {/* eslint-disable-next-line @next/next/no-img-element -- two theme variants, CSS shows one */}
          <img className="fz-onb__logo fz-onb__logo--light" src="/images/brand/fuzo-logo.png" alt="FUZO" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fz-onb__logo fz-onb__logo--dark" src="/images/brand/fuzo-logo-dark.png" alt="" aria-hidden="true" />
          {state && (
            <button type="button" className="fz-onb__signout" onClick={signOut}>
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          )}
        </header>

        <main className="fz-onb__main">
          <div className="fz-onb__card">
            {state && step && !tooYoung && !loadError && (
              <span className="fz-onb__dots" role="img" aria-label={`Step ${index + 1} of ${flow.length}`}>
                {flow.map((s, i) => (
                  <i key={s} className={i === index ? 'is-on' : i < index ? 'is-done' : ''} />
                ))}
              </span>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                {body}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
