import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log('🔥 Share-to-friend API called');
    const body = await req.json();
    const { friendId, itemType, itemId, itemTitle, itemImageUrl, message } = body;

    // Validate required fields
    if (!friendId || !itemType || !itemId || !itemTitle) {
      return NextResponse.json(
        { success: false, error: "friendId, itemType, itemId, and itemTitle are required" },
        { status: 400 }
      );
    }

    if (!['restaurant', 'recipe'].includes(itemType)) {
      return NextResponse.json(
        { success: false, error: "itemType must be 'restaurant' or 'recipe'" },
        { status: 400 }
      );
    }

    // Initialize server-side Supabase client
    console.log('🔐 Initializing server-side Supabase client...');
    const supabase = await supabaseServer();
    
    // Check if user is authenticated
    console.log('👤 Checking user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Verify that users are friends
    console.log('👥 Checking friendship status...');
    const { data: friendship, error: friendshipError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(requester_id.eq.${user.id},requested_id.eq.${friendId}),and(requester_id.eq.${friendId},requested_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single();

    if (friendshipError || !friendship) {
      console.log('❌ Users are not friends:', friendshipError);
      return NextResponse.json(
        { success: false, error: "You can only share items with accepted friends" },
        { status: 403 }
      );
    }

    // Create the shared save
    console.log('💾 Creating shared save...');
    const { data: sharedSave, error: shareError } = await supabase
      .from('shared_saves')
      .insert({
        sharer_id: user.id,
        shared_with_id: friendId,
        item_type: itemType,
        item_id: itemId.toString(),
        item_title: itemTitle,
        item_image_url: itemImageUrl,
        message: message || `Check out this ${itemType} I found!`
      })
      .select()
      .single();

    if (shareError) {
      console.error('❌ Error creating shared save:', shareError);
      return NextResponse.json(
        { success: false, error: shareError.message },
        { status: 500 }
      );
    }

    // Get friend's display name for notification
    const { data: friendData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', friendId)
      .single();

    // Create notification for the friend
    console.log('🔔 Creating notification...');
    const { data: sharerData } = await supabase
      .from('users')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    await supabase
      .from('notifications')
      .insert({
        user_id: friendId,
        type: 'save_to_plate_share',
        title: `${itemType === 'recipe' ? '🍳' : '🍽️'} ${sharerData?.display_name} shared a ${itemType}`,
        message: `"${itemTitle}" - ${message || `Check out this ${itemType} I found!`}`,
        data: {
          shared_save_id: sharedSave.id,
          sharer_id: user.id,
          sharer_name: sharerData?.display_name,
          sharer_username: sharerData?.username,
          item_type: itemType,
          item_id: itemId,
          item_title: itemTitle,
          item_image_url: itemImageUrl
        }
      });

    console.log('✅ Successfully shared item with friend');
    return NextResponse.json({
      success: true,
      data: sharedSave,
      message: `${itemType} shared with ${friendData?.display_name || 'friend'} successfully!`
    });

  } catch (error) {
    console.error('💥 Unexpected error in share-to-friend API:', error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}