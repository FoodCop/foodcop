import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Landing point for Supabase's password-recovery email link - deliberately a
// separate route from /auth/callback (Google OAuth) so recovery-specific
// error handling can't regress the working OAuth flow. Exchanges the code
// server-side so the session cookie is already set by the time /reset-password
// renders, instead of leaving that to the browser client's async
// detectSessionInUrl - see /auth/callback for the pattern this mirrors.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    const params = new URLSearchParams({ error, ...(errorDescription ? { error_description: errorDescription } : {}) });
    return NextResponse.redirect(`${origin}/reset-password?${params.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const params = new URLSearchParams({ error: 'exchange_failed', error_description: exchangeError.message });
      return NextResponse.redirect(`${origin}/reset-password?${params.toString()}`);
    }

    return NextResponse.redirect(`${origin}/reset-password`);
  }

  return NextResponse.redirect(`${origin}/reset-password?error=missing_code`);
}
