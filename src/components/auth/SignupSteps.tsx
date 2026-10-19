'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PRIVACY_VERSION, TERMS_VERSION, type AccountType } from '@/lib/onboarding/policy';
import { ageGateBlocked, blockAgeGate, saveIntent } from '@/lib/onboarding/intent';
import { AccountTypeStep } from '@/components/onboarding/steps/AccountTypeStep';
import { AgeStep, TooYoung, type BirthDate } from '@/components/onboarding/steps/AgeStep';
import { ConsentChecks, consentsMissing, type Consents } from '@/components/onboarding/steps/ConsentChecks';

// "Create account" on /login, as the client's onboarding spec orders it:
// I-01 Individual or Food Business -> I-03 age (individuals; asked BEFORE the
// account exists, so nothing is kept about someone too young) -> I-02 name,
// email, password or Google, with the Terms / Privacy ticks. The choices wait
// in this browser (lib/onboarding/intent) until /onboarding saves them.

const EASE = [0.16, 1, 0.3, 1] as const;
type Step = 'type' | 'age' | 'account';

/** 0-4 rough password strength for the sign-up hint. */
function passwordScore(pw: string): number {
  if (pw.length < 6) return 0;
  let score = 1;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}
const STRENGTH = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

const noSubscribe = () => () => {};

interface SignupStepsProps {
  /** Signed in straight away (no email confirmation needed). */
  onSignedIn: (userId: string, name: string) => void;
  /** A confirmation email was sent. */
  onConfirmationSent: (email: string) => void;
  /** Start Google sign-in (the login page builds the redirect). */
  onGoogle: () => void;
  onSignIn: () => void;
}

export function SignupSteps({ onSignedIn, onConfirmationSent, onGoogle, onSignIn }: SignupStepsProps) {
  const [step, setStep] = useState<Step>('type');
  const [type, setType] = useState<AccountType | null>(null);
  const [birth, setBirth] = useState<BirthDate | null>(null);
  const [tooYoungNow, setTooYoung] = useState(false);
  // A device that just failed the age gate waits a day (read after hydration).
  const blocked = useSyncExternalStore(noSubscribe, ageGateBlocked, () => false);
  const tooYoung = tooYoungNow || (blocked && type === 'individual' && step !== 'type');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consents, setConsents] = useState<Consents>({ terms: false, privacy: false, authority: false });
  const [error, setError] = useState<string | null>(null);
  const [triedConsent, setTriedConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const business = type === 'food_business';
  const steps: Step[] = business ? ['type', 'account'] : ['type', 'age', 'account'];
  const index = steps.indexOf(step);

  const go = (s: Step) => {
    setError(null);
    setStep(s);
  };

  const remember = () =>
    saveIntent({
      accountType: type!,
      birthMonth: birth?.month,
      birthYear: birth?.year,
      livesInQuebec: birth?.livesInQuebec ?? null,
      consents: { terms: TERMS_VERSION, privacy: PRIVACY_VERSION },
    });

  const consentProblem = () => {
    const missing = consentsMissing(consents, business);
    setTriedConsent(true);
    if (missing) setError(missing);
    return missing;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(business ? 'Enter your business name.' : 'Enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (consentProblem()) return;
    const supabase = createClient();
    if (!supabase) return setError('Supabase isn’t connected yet — add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.');
    remember();
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setLoading(false);
    if (authError) return setError(authError.message);
    // signUp() returns a user but no session while the email still needs confirming.
    if (data.user && !data.session) return onConfirmationSent(email.trim());
    if (data.user) onSignedIn(data.user.id, name.trim());
  };

  const google = () => {
    setError(null);
    if (consentProblem()) return;
    remember();
    onGoogle();
  };

  const errorNote = error && (
    <motion.div
      id="signup-error"
      className="fz-auth__note fz-auth__note--error"
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AlertCircle size={16} />
      <span>{error}</span>
    </motion.div>
  );
  const errId = error ? 'signup-error' : undefined;
  const score = passwordScore(password);

  const title =
    step === 'type' ? 'Welcome to FUZO' : step === 'age' ? 'Confirm your age' : business ? 'Create your business account' : 'Create your account';
  const sub =
    step === 'type'
      ? 'Discover food that finds you. How will you use FUZO?'
      : step === 'age'
        ? 'This helps us apply the right protections.'
        : business
          ? 'You’ll add your business details next.'
          : 'Set up your FUZO account.';

  return (
    <div className="fz-signup">
      <div className="fz-signup__top">
        {index > 0 && !tooYoung ? (
          <button type="button" className="fz-signup__back" onClick={() => go(steps[index - 1])}>
            <ArrowLeft size={15} /> Back
          </button>
        ) : (
          <span />
        )}
        {!tooYoung && (
          <span className="fz-signup__dots" role="img" aria-label={`Step ${index + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <i key={s} className={i === index ? 'is-on' : i < index ? 'is-done' : ''} />
            ))}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tooYoung ? 'young' : step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {tooYoung ? (
            <TooYoung />
          ) : (
            <>
              <h1 className="fz-auth__title">{title}</h1>
              <p className="fz-auth__sub">{sub}</p>

              {step === 'type' && (
                <>
                  <AccountTypeStep
                    value={type}
                    onChange={(v) => {
                      setType(v);
                      setError(null);
                    }}
                  />
                  {errorNote}
                  <button
                    type="button"
                    className="fz-auth__cta"
                    onClick={() => (type ? go(type === 'individual' ? 'age' : 'account') : setError('Choose Individual or Food Business.'))}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </>
              )}

              {step === 'age' && (
                <AgeStep
                  onDone={(b) => {
                    setBirth(b);
                    go('account');
                  }}
                  onTooYoung={() => {
                    blockAgeGate();
                    setTooYoung(true);
                  }}
                  renderSubmit={(label) => (
                    <button type="submit" className="fz-auth__cta">
                      {label} <ArrowRight size={18} />
                    </button>
                  )}
                />
              )}

              {step === 'account' && (
                <form onSubmit={submit} noValidate>
                  <div className="fz-auth__field">
                    <label htmlFor="su-name">{business ? 'Business name' : 'Name'}</label>
                    <div className="fz-auth__input">
                      <User size={17} aria-hidden="true" />
                      <input
                        id="su-name"
                        type="text"
                        placeholder={business ? 'e.g. Maya’s Kitchen' : 'Your name'}
                        autoComplete={business ? 'organization' : 'name'}
                        maxLength={80}
                        value={name}
                        aria-describedby={errId}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="fz-auth__field">
                    <label htmlFor="su-email">Email</label>
                    <div className="fz-auth__input">
                      <Mail size={17} aria-hidden="true" />
                      <input
                        id="su-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={email}
                        aria-describedby={errId}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="fz-auth__field fz-auth__field--password">
                    <label htmlFor="su-password">Password</label>
                    <div className="fz-auth__input">
                      <Lock size={17} aria-hidden="true" />
                      <input
                        id="su-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        value={password}
                        aria-describedby={[password && 'su-strength', errId].filter(Boolean).join(' ') || undefined}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="fz-auth__eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password && (
                      <div className="fz-auth__strength" id="su-strength">
                        <span className="fz-auth__bars" data-score={score} aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                        {STRENGTH[score]}
                      </div>
                    )}
                  </div>

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

                  <button type="submit" className="fz-auth__cta" disabled={loading}>
                    {loading ? 'Please wait…' : <>Create account <ArrowRight size={18} /></>}
                  </button>
                  <div className="fz-auth__divider">or</div>
                  <button type="button" className="fz-auth__google" onClick={google}>
                    <Image src="/assets-romio/images/svg/google.svg" alt="" width={18} height={18} />
                    Continue with Google
                  </button>
                </form>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="fz-auth__alt">
        Already have an account?{' '}
        <button type="button" className="fz-auth__link" onClick={onSignIn}>
          Sign in
        </button>
      </p>
    </div>
  );
}
