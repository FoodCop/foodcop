import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await supabaseServer();
    const { username } = await params;

    // Get user profile by username
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, display_name, bio, location_city, location_country, followers_count, following_count, is_master_bot, last_seen, created_at')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's saved items count
    const { count: savedItemsCount } = await supabase
      .from('saved_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get user's friends count
    const { count: friendsCount } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
      .eq('status', 'accepted');

    // Check if current user is friends with this user (if authenticated)
    let isCurrentUserFriend = false;
    let hasPendingRequest = false;
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser && currentUser.id !== user.id) {
      const { data: friendshipData } = await supabase
        .from('friend_requests')
        .select('status')
        .or(`and(requester_id.eq.${currentUser.id},requested_id.eq.${user.id}),and(requester_id.eq.${user.id},requested_id.eq.${currentUser.id})`)
        .single();

      if (friendshipData) {
        isCurrentUserFriend = friendshipData.status === 'accepted';
        hasPendingRequest = friendshipData.status === 'pending';
      }
    }

    // Get some recent saved items if user is friend or if this is a masterbot
    let recentSavedItems = [];
    const isMasterbot = user.is_master_bot;
    
    if (isCurrentUserFriend || isMasterbot) {
      const { data: savedItems } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);
      
      recentSavedItems = savedItems || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          savedItemsCount: savedItemsCount || 0,
          friendsCount: Math.floor((friendsCount || 0) / 2), // Divide by 2 since each friendship has 2 records
          isMasterbot,
          isCurrentUserFriend,
          hasPendingRequest
        },
        recentSavedItems
      }
    });

  } catch (error) {
    console.error('Error in user-profile API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}