'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Only interactive part of /reset-password - the page itself already
// confirmed a valid recovery session exists server-side before rendering
// this, so this component only has to handle the password update.
export default function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Supabase isn’t connected yet — add NEXT_PUBLIC_SUPABASE_URL/ANON_KEY to .env.local.');
      return;
    }

    setLoading(true);
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (data.user) {
      // Closes a real gap, not boilerplate: a user who signed up but never
      // confirmed their email has no `users` row yet (only afterAuth/the
      // OAuth callback create it) - OnboardingWizard.tsx does an `update`,
      // not an `upsert`, when finishing onboarding, which silently no-ops
      // on a missing row.
      await supabase.from('users').upsert(
        { id: data.user.id, email: data.user.email },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    }

    setSuccess(true);
  };

  const handleContinue = async () => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/login');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase
      .from('users')
      .select('is_onboarded')
      .eq('id', userData.user.id)
      .maybeSingle();
    router.push(profile?.is_onboarded ? '/dashboard' : '/onboarding');
  };

  if (success) {
    return (
      <div className="alert alert-success small">
        Your password has been updated.
        <div className="mt-2">
          <button type="button" className="btn btn-link p-0 align-baseline small" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="new-password" className="auth-field__label">
          New Password
        </label>
        <div className="auth-password">
          <input
            autoFocus
            type={showPassword ? 'text' : 'password'}
            id="new-password"
            className="auth-field__input"
            placeholder="New password"
            autoComplete="new-password"
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

      <div className="auth-field">
        <label htmlFor="confirm-password" className="auth-field__label">
          Confirm Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          id="confirm-password"
          className="auth-field__input"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      {error && <div className="alert alert-danger small">{error}</div>}

      <button type="submit" className="auth-cta" disabled={loading}>
        {loading ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  );
}
