import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get friend ID from search params
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    
    if (!friendId) {
      return NextResponse.json(
        { success: false, error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    // Verify friendship exists and is accepted
    const { data: friendshipData, error: friendshipError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(requester_id.eq.${user.id},requested_id.eq.${friendId}),and(requester_id.eq.${friendId},requested_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single();

    if (friendshipError || !friendshipData) {
      return NextResponse.json(
        { success: false, error: 'You are not friends with this user' },
        { status: 403 }
      );
    }

    // Get friend's profile info
    const { data: friendProfile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, username, email')
      .eq('id', friendId)
      .single();

    if (profileError || !friendProfile) {
      return NextResponse.json(
        { success: false, error: 'Friend not found' },
        { status: 404 }
      );
    }

    // Get friend's saved items
    const { data: savedItems, error: itemsError } = await supabase
      .from('saved_items')
      .select(`
        *,
        created_at
      `)
      .eq('user_id', friendId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching friend\'s saved items:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch friend\'s plate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        friend: friendProfile,
        savedItems: savedItems || []
      }
    });

  } catch (error) {
    console.error('Error in view-friend-plate API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}