import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Update the user's last_seen timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('email', user.email);

    if (updateError) {
      console.error('Error updating last_seen:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update last seen' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Last seen updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in update-last-seen API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}