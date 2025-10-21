import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Use service role to bypass RLS
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get Master Bots that are available for chat
    const { data: masterBots, error } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url, bio')
      .eq('is_master_bot', true)
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching Master Bots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Master Bots', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      masterbots: masterBots || [],
      count: masterBots?.length || 0
    });

  } catch (error) {
    console.error('Master Bots API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}