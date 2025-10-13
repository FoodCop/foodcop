import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/chat/share - Share restaurant or recipe in chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      friendId, 
      roomId, 
      sharedContent, 
      message = ''
    } = body;

    if (!sharedContent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Shared content is required' 
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
    let shareRoomId = roomId;
    if (friendId && !roomId) {
      shareRoomId = `private_${[user.id, friendId].sort().join('_')}`;
    }
    if (!shareRoomId) {
      shareRoomId = 'general';
    }

    // Create share message content
    const shareMessage = message || `Shared ${sharedContent.type}: ${sharedContent.name || sharedContent.title}`;

    // Insert the share message
    const { data: shareMessageData, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        content: shareMessage,
        room_id: shareRoomId,
        is_ai_generated: false,
        shared_content: sharedContent
      })
      .select(`
        *,
        user:users(id, email, display_name, avatar_url, username)
      `)
      .single();

    if (error) {
      console.error('Error sharing content:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to share content',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: shareMessageData,
      roomId: shareRoomId
    });

  } catch (error) {
    console.error('Chat share API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}