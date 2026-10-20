'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, Check, ChevronRight, Dna, Loader2, PartyPopper, Tags } from 'lucide-react';
import { OnboardingService, type OnboardingState } from '@/lib/services/onboardingService';
import { finishItems, type FinishKey } from '@/lib/onboarding/finishProfile';
import { ProfileStep } from './steps/ProfileStep';
import { TasteSetup } from './steps/TasteSetup';

// /finish-profile - the parts of onboarding people skipped (client,
// 2026-10-18): the food profile (the same questionnaire, picking up where it
// stopped), a profile photo and roles. Reached from the "Finish your profile"
// card and pop-up.

const ICON: Record<FinishKey, typeof Dna> = { food: Dna, photo: Camera, roles: Tags };
const EASE = [0.16, 1, 0.3, 1] as const;

export default function FinishProfileView() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [open, setOpen] = useState<FinishKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async () => {
    const r = await OnboardingService.load();
    if (r.success && r.data) setState(r.data);
    else if (r.error === 'signed_out') router.replace('/login?next=%2Ffinish-profile');
    else setError('Couldn’t load your profile. Try again.');
  }, [router]);

  useEffect(() => {
    let off = false;
    OnboardingService.load().then((r) => {
      if (off) return;
      if (r.success && r.data) setState(r.data);
      else if (r.error === 'signed_out') router.replace('/login?next=%2Ffinish-profile');
      else setError('Couldn’t load your profile. Try again.');
    });
    return () => {
      off = true;
    };
  }, [router]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [open]);

  const back = async () => {
    setOpen(null);
    await load();
  };
  const submit = (label: string, busy: boolean) => (
    <button type="submit" className="fz-onb__cta" disabled={busy}>
      {busy ? 'Saving…' : label} {!busy && <ArrowRight size={18} aria-hidden="true" />}
    </button>
  );

  let body: React.ReactNode;
  if (error) {
    body = (
      <p className="fz-onb__error" role="alert">
        {error}
      </p>
    );
  } else if (!state) {
    body = (
      <div className="fz-onb__state" role="status" aria-label="Loading">
        <Loader2 size={26} className="fz-onb__spin" aria-hidden="true" />
      </div>
    );
  } else if (open === 'food') {
    body = <TasteSetup data={state.data} headingRef={headingRef} onDone={back} onSkip={back} renderSubmit={submit} />;
  } else if (open === 'photo' || open === 'roles') {
    body = (
      <>
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          {open === 'photo' ? 'Add a profile photo' : 'Choose your roles'}
        </h1>
        <p className="fz-onb__sub">{open === 'photo' ? 'Tap the circle to pick a photo.' : 'Pick any that fit. They show on your profile.'}</p>
        <ProfileStep
          initialName={state.displayName}
          initialUsername={state.username}
          initialAvatar={state.avatarUrl}
          initialRoles={state.roles}
          showSkip={false}
          submitLabel="Save"
          onSaved={back}
          renderSubmit={submit}
        />
      </>
    );
  } else {
    const items = finishItems(state);
    const allDone = items.every((i) => i.done);
    body = (
      <>
        {allDone && (
          <span className="fz-onb__badge fz-onb__badge--good" aria-hidden="true">
            <PartyPopper size={26} />
          </span>
        )}
        <h1 className="fz-onb__title" tabIndex={-1} ref={headingRef}>
          {allDone ? 'Your profile is complete' : 'Finish your profile'}
        </h1>
        <p className="fz-onb__sub">{allDone ? 'Thanks! Your recommendations now start from your taste.' : 'A few minutes now means better picks for you. Do them in any order.'}</p>
        <ul className="fz-finish-list">
          {items.map((i) => {
            const Icon = ICON[i.key];
            return (
              <li key={i.key}>
                <button type="button" className={`fz-finish-list__item${i.done ? ' is-done' : ''}`} onClick={() => setOpen(i.key)}>
                  <span className="fz-finish-list__icon" aria-hidden="true">
                    {i.done ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                  </span>
                  <span className="fz-finish-list__text">
                    <strong>{i.done ? i.doneLabel : i.label}</strong>
                    <span>{i.done ? 'Done - tap to change' : i.hint}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        <Link href={allDone ? '/profile' : '/dashboard'} className={allDone ? 'fz-onb__cta fz-onb__cta--link' : 'fz-onb__skip fz-onb__skip--link'}>
          {allDone ? 'View your profile' : 'Maybe later'}
        </Link>
      </>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="fz-onb">
        <header className="fz-onb__top">
          <button type="button" className="fz-onb__back" onClick={() => (open ? back() : router.push('/profile'))}>
            <ArrowLeft size={15} aria-hidden="true" /> {open ? 'All steps' : 'Profile'}
          </button>
        </header>
        <main className="fz-onb__main">
          <div className="fz-onb__card">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={open ?? 'list'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE }}>
                {body}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
