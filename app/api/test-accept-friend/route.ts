import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Test endpoint to accept the friend request from Quantum Climb to Jun Cando
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Current authenticated user:', user.email, user.id);

    // Accept the specific friend request from Quantum Climb to Jun Cando
    const friendRequestId = 'ce1fa149-9bcb-4228-a98e-4ccd9a358058';
    
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ 
        status: 'accepted', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', friendRequestId)
      .eq('requested_id', user.id); // Make sure the current user is the one who received the request

    if (updateError) {
      console.error('Error accepting friend request:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to accept friend request' },
        { status: 500 }
      );
    }

    // Verify the update worked
    const { data: updatedRequest, error: fetchError } = await supabase
      .from('friend_requests')
      .select(`
        *,
        requester:requester_id(display_name, username),
        requested:requested_id(display_name, username)
      `)
      .eq('id', friendRequestId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated request:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted successfully!',
      request: updatedRequest,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Unexpected error in test-accept-friend:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}