import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
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
