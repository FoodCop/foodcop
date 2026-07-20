import { createClient } from '@/lib/supabase/server';
import AuthBackHeader from '@/components/auth/AuthBackHeader';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

// Landed on only via /auth/recovery, which already exchanged the recovery
// code for a session server-side - by the time this renders, the session
// cookie is already set (or the exchange already failed and we got an
// ?error= param instead). Deliberately NOT in middleware's protectedRoutes:
// at the moment this route first hits middleware there is no session yet
// (the exchange happens inside /auth/recovery, which runs after
// middleware) - protecting this route would bounce the user to /login
// before the exchange ever gets a chance to run.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const { error, error_description: errorDescription } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const invalid = !!error || !data.user;

  return (
    <div className="auth-page">
      <AuthBackHeader />

      <h1 className="auth-title">Reset Your Password</h1>

      {invalid ? (
        <>
          <p className="auth-subtitle">
            {errorDescription || 'This link is invalid or has expired.'}
          </p>
          <a href="/login" className="auth-cta" style={{ display: 'block', textDecoration: 'none' }}>
            Back to Sign In
          </a>
        </>
      ) : (
        <>
          <p className="auth-subtitle">Choose a new password for your account.</p>
          <ResetPasswordForm />
        </>
      )}

      <div className="auth-footer">FUZO</div>
    </div>
  );
}
