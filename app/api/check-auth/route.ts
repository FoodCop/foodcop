import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Test endpoint to check current user authentication
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          message: 'No user is currently authenticated'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      message: 'User is authenticated'
    });

  } catch (error) {
    console.error('Unexpected error in check-auth:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}