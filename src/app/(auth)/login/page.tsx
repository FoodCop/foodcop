'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, Compass, Eye, EyeOff, Gift, Lock, Mail, MailCheck, Users } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/share/safeNext';
import { rememberNextAfterSignup, takeNextAfterSignup } from '@/lib/share/afterSignup';
import { SignupSteps } from '@/components/auth/SignupSteps';

// ?mode=signup opens on Create account (e.g. a shared post's "Sign up to see it").
const noSubscribe = () => () => {};
const readWantsSignup = () => new URLSearchParams(window.location.search).get('mode') === 'signup';

// Sign in / Create account / Reset password on one page, wired to Supabase
// Auth (email + password, Google, guest). Create account is the onboarding
// spec's first steps (SignupSteps: account type, age, then the account). Layout (_auth.scss, .fz-auth):
// desktop = dark brand panel (food photo, logo, tagline, 3 reasons) beside a
// raised paper form card; phone = compact photo header above the card. The
// card has a Sign in | Create account switch, icon inputs, a password
// strength hint when signing up, and styled error / "check your email" states.
// Motion: the entrance (card rises in, brand text + points stagger in) is CSS
// so it runs before JavaScript loads - nothing is ever invisible waiting for
// hydration. Framer Motion (reduced-motion aware) handles the interactions:
// the switch's yellow pill slides, modes cross-fade, errors fade in.

const EASE = [0.16, 1, 0.3, 1] as const;

export default function LoginPage() {
  const router = useRouter();

  const wantsSignup = useSyncExternalStore(noSubscribe, readWantsSignup, () => false);
  const [modeChoice, setMode] = useState<'signin' | 'signup' | 'forgot' | null>(null);
  const mode = modeChoice ?? (wantsSignup ? 'signup' : 'signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const afterAuth = async (supabase: NonNullable<ReturnType<typeof createClient>>, userId: string, name?: string) => {
    await supabase.from('users').upsert(
      { id: userId, email, display_name: name || null },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    const { data: profile } = await supabase
      .from('users')
      .select('is_onboarded')
      .eq('id', userId)
      .maybeSingle();
    // Back to the shared link that sent them to login, if any.
    const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
    if (profile?.is_onboarded) {
      router.push(next ?? takeNextAfterSignup() ?? '/dashboard');
      return;
    }
    // New here: onboarding first, then on to that link.
    if (next) rememberNextAfterSignup(next);
    router.push('/onboarding');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError('Supabase isn’t connected yet — add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.user) await afterAuth(supabase, data.user.id);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError('Supabase isn’t connected yet — add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.');
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/recovery`,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setResetSent(true);
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    if (!supabase) {
      setError('Supabase isn’t connected yet — add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: (() => {
          const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
          return `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;
        })(),
      },
    });
  };

  const handleGuest = async () => {
    const supabase = createClient();
    if (!supabase) {
      setError('Supabase isn’t connected yet — add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.');
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // Guests just look around: no account, so no onboarding.
    if (data.user) router.push('/dashboard');
  };

  const switchMode = (m: 'signin' | 'signup' | 'forgot') => {
    setMode(m);
    setError(null);
  };

  // Linked to the inputs (aria-describedby) so screen readers read it with the field.
  const errorNote = error && (
    <motion.div
      id="auth-error"
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
  const errId = error ? 'auth-error' : undefined;
  // Which view is showing - drives the cross-fade between them.
  const view = confirmationSent ? 'confirm' : mode === 'forgot' ? (resetSent ? 'reset-sent' : 'forgot') : mode;

  return (
    <MotionConfig reducedMotion="user">
    <div className="fz-auth">
      {/* Brand panel (desktop) / photo header (phone) */}
      <aside className="fz-auth__brand">
        {/* The page's main image: optimised, sized per viewport, fetched first. */}
        <Image
          className="fz-auth__brand-photo"
          src="/images/hero-cards/noodles-wine.jpg"
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          loading="eager"
          fetchPriority="high"
        />
        <span className="fz-auth__brand-shade" aria-hidden="true" />
        <div className="fz-auth__brand-inner">
          <Image className="fz-auth__brand-logo" src="/fuzo_logo.svg" alt="FUZO" width={79} height={30} />
          <h2 className="fz-auth__brand-title">Find food you&rsquo;ll love.</h2>
          <p className="fz-auth__brand-sub">Scout spots near you, share bites with friends and earn rewards as you go.</p>
          <ul className="fz-auth__points">
            {[
              { icon: <Compass size={16} />, text: <>Discover places &amp; recipes near you</> },
              { icon: <Users size={16} />, text: <>Share your finds with friends</> },
              { icon: <Gift size={16} />, text: <>Earn points, badges &amp; rewards</> },
            ].map((pt, i) => (
              <li key={i} style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                <span aria-hidden="true">{pt.icon}</span>
                {pt.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="fz-auth__main">
        <div className="fz-auth__card">
          <Link href="/" className="fz-auth__back">
            <ArrowLeft size={15} /> Home
          </Link>

          {mode !== 'forgot' && !confirmationSent && (
            <div className="fz-auth__switch" role="tablist" aria-label="Sign in or create an account">
              {(
                [
                  ['signin', 'Sign in'],
                  ['signup', 'Create account'],
                ] as const
              ).map(([m, label]) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'is-active' : ''} onClick={() => switchMode(m)}>
                  {/* The yellow pill slides between the two options. */}
                  {mode === m && <motion.span layoutId="fz-auth-switch-thumb" className="fz-auth__switch-thumb" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  <span className="fz-auth__switch-label">{label}</span>
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
          {/* Create account has its own titles, one per step. */}
          {view !== 'signup' && (
            <>
              <h1 className="fz-auth__title">
                {confirmationSent ? 'Check your email' : mode === 'signin' ? 'Welcome back' : 'Reset your password'}
              </h1>
              <p className="fz-auth__sub">
                {confirmationSent
                  ? 'One quick step and you’re in.'
                  : mode === 'signin'
                    ? 'Your next favourite meal awaits.'
                    : 'Enter your email and we’ll send you a reset link.'}
              </p>
            </>
          )}

          {!isSupabaseConfigured && (
            <div className="fz-auth__note fz-auth__note--warn">
              <AlertCircle size={16} />
              <span>Supabase isn&rsquo;t connected yet - add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.</span>
            </div>
          )}

          {confirmationSent ? (
            <div className="fz-auth__done">
              <span className="fz-auth__done-icon" aria-hidden="true"><MailCheck size={26} /></span>
              <p>
                We sent a confirmation link to <strong>{email}</strong>. Open it on this device to carry on setting up your account.
              </p>
              <button
                type="button"
                className="fz-auth__cta"
                onClick={() => {
                  setConfirmationSent(false);
                  switchMode('signin');
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : mode === 'forgot' ? (
            resetSent ? (
              <div className="fz-auth__done">
                <span className="fz-auth__done-icon" aria-hidden="true"><MailCheck size={26} /></span>
                <p>
                  If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a reset link. Check your inbox (and spam).
                </p>
                <button
                  type="button"
                  className="fz-auth__cta"
                  onClick={() => {
                    setResetSent(false);
                    switchMode('signin');
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="fz-auth__field">
                  <label htmlFor="forgot-email">Email</label>
                  <div className="fz-auth__input">
                    <Mail size={17} aria-hidden="true" />
                    <input
                      autoFocus
                      type="email"
                      id="forgot-email"
                      placeholder="you@example.com"
                      aria-describedby={errId}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {errorNote}

                <button type="submit" className="fz-auth__cta" disabled={loading}>
                  {loading ? 'Sending…' : <>Send reset link <ArrowRight size={18} /></>}
                </button>
                <p className="fz-auth__alt">
                  Remembered it?{' '}
                  <button type="button" className="fz-auth__link" onClick={() => switchMode('signin')}>
                    Back to sign in
                  </button>
                </p>
              </form>
            )
          ) : mode === 'signup' ? (
            <SignupSteps
              onSignedIn={(userId, name) => {
                const supabase = createClient();
                if (supabase) afterAuth(supabase, userId, name);
              }}
              onConfirmationSent={(address) => {
                setEmail(address);
                setConfirmationSent(true);
              }}
              onGoogle={handleGoogle}
              onSignIn={() => switchMode('signin')}
            />
          ) : (
            <form onSubmit={handleSubmit}>

              <div className="fz-auth__field">
                <label htmlFor="email">Email</label>
                <div className="fz-auth__input">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    aria-describedby={errId}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fz-auth__field fz-auth__field--password">
                <label htmlFor="password">Password</label>
                <div className="fz-auth__input">
                  <Lock size={17} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-describedby={errId}
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
                {/* After the input in tab order (email → password → this), shown beside the label. */}
                <button type="button" className="fz-auth__link fz-auth__link--small fz-auth__forgot" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>

              {errorNote}

              <button type="submit" className="fz-auth__cta" disabled={loading}>
                {loading ? 'Please wait…' : <>Sign in <ArrowRight size={18} /></>}
              </button>

              <div className="fz-auth__divider">or</div>

              <button type="button" className="fz-auth__google" onClick={handleGoogle}>
                <Image src="/assets-romio/images/svg/google.svg" alt="" width={18} height={18} />
                Continue with Google
              </button>
              <button type="button" className="fz-auth__guest" onClick={handleGuest} disabled={loading}>
                Just looking? Continue as guest
              </button>
            </form>
          )}
          </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </MotionConfig>
  );
}
