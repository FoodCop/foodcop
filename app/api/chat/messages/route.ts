import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/chat/messages - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    const roomId = searchParams.get('roomId');
    const limit = parseInt(searchParams.get('limit') || '50');

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
              // This can be ignored if you have middleware refreshing
              // user sessions.
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

    // Determine room ID for query
    let queryRoomId = roomId;
    if (friendId && !roomId) {
      // Create consistent room ID for private chat (smaller ID first)
      queryRoomId = `private_${[user.id, friendId].sort().join('_')}`;
    }
    if (!queryRoomId) {
      queryRoomId = 'general';
    }

    // Fetch messages with user data
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users(id, email, display_name, avatar_url, username)
      `)
      .eq('room_id', queryRoomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch messages',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      roomId: queryRoomId
    });

  } catch (error) {
    console.error('Chat messages API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/chat/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, friendId, roomId, sharedContent } = body;

    if (!content?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message content is required' 
      }, { status: 400 });
    }

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

    // Determine room ID
    let messageRoomId = roomId;
    if (friendId && !roomId) {
      messageRoomId = `private_${[user.id, friendId].sort().join('_')}`;
    }
    if (!messageRoomId) {
      messageRoomId = 'general';
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        content: content.trim(),
        room_id: messageRoomId,
        is_ai_generated: false,
        shared_content: sharedContent || null
      })
      .select(`
        *,
        user:users(id, email, display_name, avatar_url, username)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send message',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}