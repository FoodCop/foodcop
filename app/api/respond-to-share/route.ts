import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log('🔥 Respond-to-share API called');
    const body = await req.json();
    const { sharedSaveId, action } = body; // action: 'accept' or 'reject'

    // Validate required fields
    if (!sharedSaveId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "sharedSaveId and action ('accept' or 'reject') are required" },
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

    // Get the shared save and verify the user is the recipient
    console.log('📋 Getting shared save details...');
    const { data: sharedSave, error: sharedSaveError } = await supabase
      .from('shared_saves')
      .select('*, sharer:sharer_id(display_name, username)')
      .eq('id', sharedSaveId)
      .eq('shared_with_id', user.id)
      .eq('status', 'pending')
      .single();

    if (sharedSaveError || !sharedSave) {
      console.log('❌ Shared save not found or unauthorized:', sharedSaveError);
      return NextResponse.json(
        { success: false, error: "Shared save not found or you're not authorized to respond" },
        { status: 404 }
      );
    }

    // Update the shared save status
    console.log(`📝 ${action}ing shared save...`);
    const { data: updatedSave, error: updateError } = await supabase
      .from('shared_saves')
      .update({
        status: action === 'accept' ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sharedSaveId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating shared save:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // If accepted, save the item to the user's plate
    if (action === 'accept') {
      console.log('💾 Saving accepted item to user\'s plate...');
      const appTenantId = '00000000-0000-4000-8000-000000000001';
      
      const { error: saveError } = await supabase
        .from('saved_items')
        .upsert({
          user_id: user.id,
          item_type: sharedSave.item_type,
          item_id: sharedSave.item_id,
          metadata: {
            title: sharedSave.item_title,
            image_url: sharedSave.item_image_url,
            shared_from: sharedSave.sharer_id,
            shared_at: sharedSave.shared_at,
            shared_message: sharedSave.message
          },
          tenant_id: appTenantId
        }, {
          onConflict: 'tenant_id,user_id,item_type,item_id'
        });

      if (saveError) {
        console.error('❌ Error saving item to plate:', saveError);
      } else {
        console.log('✅ Item saved to user\'s plate');
      }
    }

    // Get current user's display name for notification
    const { data: userData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Create notification for the sharer
    console.log('🔔 Creating response notification...');
    await supabase
      .from('notifications')
      .insert({
        user_id: sharedSave.sharer_id,
        type: `save_to_plate_${action}`,
        title: `${action === 'accept' ? '✅' : '❌'} ${userData?.display_name} ${action}ed your share`,
        message: `"${sharedSave.item_title}" was ${action}ed${action === 'accept' ? ' and added to their plate' : ''}`,
        data: {
          shared_save_id: sharedSaveId,
          responder_id: user.id,
          responder_name: userData?.display_name,
          item_type: sharedSave.item_type,
          item_title: sharedSave.item_title,
          action: action
        }
      });

    console.log(`✅ Successfully ${action}ed shared item`);
    return NextResponse.json({
      success: true,
      data: updatedSave,
      message: `${sharedSave.item_title} ${action}ed successfully${action === 'accept' ? ' and added to your plate' : ''}!`
    });

  } catch (error) {
    console.error('💥 Unexpected error in respond-to-share API:', error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}