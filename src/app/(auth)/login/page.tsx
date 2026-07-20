'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import AuthBackHeader from '@/components/auth/AuthBackHeader';

// Adapted from Romio's SignIn/SignUp screens (merged into one toggle, matching
// the old FUZO login.html's single-page sign-in/sign-up flow), wired to real
// Supabase Auth. Re-skinned from a Claude Design mockup (soft pill inputs,
// warm gold CTA - see _auth.scss) - the mockup's waving-hand emoji is a real
// SVG here (public/SVG/social/Smile.svg) instead.
export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const afterAuth = async (supabase: NonNullable<ReturnType<typeof createClient>>, userId: string) => {
    await supabase.from('users').upsert(
      { id: userId, email, display_name: name || null },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    const { data: profile } = await supabase
      .from('users')
      .select('is_onboarded')
      .eq('id', userId)
      .maybeSingle();
    router.push(profile?.is_onboarded ? '/dashboard' : '/onboarding');
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
    const { data, error: authError } =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // signUp() still returns a user even when email confirmation is required -
    // data.session is only populated once the user actually confirms. Writing
    // to the users table now would just 401 (no auth.uid() yet), so surface a
    // real "check your email" state instead of silently proceeding.
    if (mode === 'signup' && data.user && !data.session) {
      setConfirmationSent(true);
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
    if (data.user) router.push('/onboarding');
  };

  return (
    <div className="auth-page">
      <AuthBackHeader />

      <h1 className="auth-title">
        {mode === 'signin' ? (
          <>
            Welcome Back! <img src="/SVG/social/Smile.svg" className="auth-title__icon" alt="" />
          </>
        ) : mode === 'signup' ? (
          'Join FUZO Today 🍽️'
        ) : (
          'Reset Your Password'
        )}
      </h1>
      <p className="auth-subtitle">
        {mode === 'signin'
          ? 'Your next favorite meal awaits'
          : mode === 'signup'
          ? 'Find your next favorite meal, together'
          : 'Enter your email and we’ll send you a reset link'}
      </p>
      {!isSupabaseConfigured && (
        <div className="alert alert-warning small">
          Supabase isn’t connected yet — this form will render but auth calls will no-op until
          NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set in .env.local.
        </div>
      )}

      {confirmationSent ? (
        <div className="alert alert-success small">
          Almost there — we sent a confirmation link to <strong>{email}</strong>. Click it, then
          sign in below.
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-link p-0 align-baseline small"
              onClick={() => {
                setConfirmationSent(false);
                setMode('signin');
              }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      ) : mode === 'forgot' ? (
        resetSent ? (
          <div className="alert alert-success small">
            If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a password reset
            link. Check your inbox (and spam folder).
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-link p-0 align-baseline small"
                onClick={() => {
                  setResetSent(false);
                  setMode('signin');
                }}
              >
                Back to sign in
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit}>
            <div className="auth-field">
              <label htmlFor="forgot-email" className="auth-field__label">
                Email
              </label>
              <input
                autoFocus
                type="email"
                id="forgot-email"
                className="auth-field__input"
                placeholder="Email Address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert alert-danger small">{error}</div>}

            <p className="auth-switch">
              Remembered your password?{' '}
              <button type="button" className="auth-switch__link" onClick={() => setMode('signin')}>
                Sign In
              </button>
            </p>

            <button type="submit" className="auth-cta" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )
      ) : (
      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div className="auth-field">
            <label htmlFor="name" className="auth-field__label">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="auth-field__input"
              placeholder="Your Name"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="email" className="auth-field__label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="auth-field__input"
            placeholder="Email Address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-field__label">
            Password
          </label>
          <div className="auth-password">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="auth-field__input"
              placeholder="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-password__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === 'signin' && (
          <p className="auth-switch" style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
            <button type="button" className="auth-switch__link" onClick={() => setMode('forgot')}>
              Forgot password?
            </button>
          </p>
        )}

        {error && <div className="alert alert-danger small">{error}</div>}

        <p className="auth-switch">
          {mode === 'signin' ? (
            <>
              Don&rsquo;t have an account?{' '}
              <button type="button" className="auth-switch__link" onClick={() => setMode('signup')}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="auth-switch__link" onClick={() => setMode('signin')}>
                Sign In
              </button>
            </>
          )}
        </p>

        <button type="submit" className="auth-cta" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>

        <div className="auth-divider">or continue with</div>

        <button type="button" className="auth-google" onClick={handleGoogle}>
          <img src="/assets-romio/images/svg/google.svg" alt="" />
          Continue with Google
        </button>
        <button type="button" className="auth-guest" onClick={handleGuest}>
          Continue as Guest
        </button>
      </form>
      )}

      <div className="auth-footer">FUZO</div>
    </div>
  );
}
