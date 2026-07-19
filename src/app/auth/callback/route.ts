import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      // ignoreDuplicates means this only ever applies on the user's first
      // sign-in (an existing row is silently left untouched) - safe to also
      // seed avatar_url here without ever clobbering a real uploaded photo
      // on a returning user's later logins.
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? data.user.user_metadata?.picture ?? null,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );

      const { data: profile } = await supabase
        .from('users')
        .select('is_onboarded')
        .eq('id', data.user.id)
        .maybeSingle();

      return NextResponse.redirect(`${origin}${profile?.is_onboarded ? '/dashboard' : '/onboarding'}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
