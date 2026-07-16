'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import AuthBackHeader from '@/components/auth/AuthBackHeader';

// Adapted from Romio's SignIn/SignUp screens (merged into one toggle, matching
// the old FUZO login.html's single-page sign-in/sign-up flow), wired to real
// Supabase Auth. Re-skinned onto plain Bootstrap form markup (master CSS)
// instead of Romio's compiled CSS.
export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (data.user) await afterAuth(supabase, data.user.id);
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
    <div className="container">
      <AuthBackHeader />
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4 py-5">
          <h1 className="h3 fw-bold">
            {mode === 'signin' ? 'Welcome Back! 👋' : 'Join FUZO Today 🍽️'}
          </h1>
          <p className="text-muted">
            {mode === 'signin' ? 'Your next favorite meal awaits' : 'Find your next favorite meal, together'}
          </p>
          {!isSupabaseConfigured && (
            <div className="alert alert-warning small">
              Supabase isn’t connected yet — this form will render but auth calls will no-op until
              NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set in .env.local.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  placeholder="Your Name"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Email Address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control"
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger small">{error}</div>}

            <p className="small">
              {mode === 'signin' ? (
                <>
                  Don&rsquo;t have an account?{' '}
                  <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => setMode('signup')}>
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => setMode('signin')}>
                    Sign In
                  </button>
                </>
              )}
            </p>

            <div className="d-grid gap-2 mb-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            <div className="text-center text-muted small mb-2">or continue with</div>
            <div className="d-grid gap-2">
              <button type="button" className="btn btn-outline-dark" onClick={handleGoogle}>
                Continue with Google
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={handleGuest}>
                Continue as Guest
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
