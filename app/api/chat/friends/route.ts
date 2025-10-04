import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/chat/friends - Get user's friends for chat
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

    // Get user's friends (accepted friend requests)
    const { data: friendRequests, error: requestsError } = await supabase
      .from('friend_requests')
      .select(`
        requester_id,
        requested_id,
        status,
        requester:users!friend_requests_requester_id_fkey(
          id,
          display_name,
          username,
          email,
          avatar_url,
          is_online,
          last_seen
        ),
        requested:users!friend_requests_requested_id_fkey(
          id,
          display_name,
          username,
          email,
          avatar_url,
          is_online,
          last_seen
        )
      `)
      .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (requestsError) {
      console.error('Error fetching friend requests:', requestsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch friends',
        details: requestsError.message 
      }, { status: 500 });
    }

    // Extract friends data and remove duplicates
    const friends = new Map();
    
    friendRequests?.forEach((request) => {
      let friend = null;
      
      if (request.requester_id === user.id && request.requested) {
        // User sent the request
        friend = Array.isArray(request.requested) ? request.requested[0] : request.requested;
      } else if (request.requested_id === user.id && request.requester) {
        // User received the request
        friend = Array.isArray(request.requester) ? request.requester[0] : request.requester;
      }
      
      if (friend && friend.id !== user.id) {
        friends.set(friend.id, {
          id: friend.id,
          display_name: friend.display_name,
          username: friend.username,
          email: friend.email,
          avatar_url: friend.avatar_url,
          is_online: friend.is_online,
          last_seen: friend.last_seen
        });
      }
    });

    const friendsList = Array.from(friends.values());

    return NextResponse.json({
      success: true,
      friends: friendsList,
      count: friendsList.length
    });

  } catch (error) {
    console.error('Chat friends API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}