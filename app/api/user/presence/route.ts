import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/user/presence - Update user's online status and last_seen
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isOnline = true } = body;

    // Update user's presence
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating presence:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update presence' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Presence updated successfully',
      isOnline,
      lastSeen: new Date().toISOString()
    });

  } catch (error) {
    console.error('Presence API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET /api/user/presence - Get current user's presence status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current presence
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('is_online, last_seen')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching presence:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch presence' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isOnline: userData.is_online,
      lastSeen: userData.last_seen
    });

  } catch (error) {
    console.error('Presence GET API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}