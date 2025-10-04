import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No need to set cookies for service role operations
        },
      },
    }
  );

  try {
    // Get pending masterbot interactions
    const { data: interactions, error } = await supabase
      .from('masterbot_interactions')
      .select(`
        *,
        masterbot:users!masterbot_id(username, display_name),
        user:users!user_id(username, display_name)
      `)
      .eq('response_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching masterbot interactions:', error);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }

    return NextResponse.json({
      interactions: interactions || [],
      count: interactions?.length || 0
    });
    
  } catch (error) {
    console.error('Masterbot interactions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No need to set cookies for service role operations
        },
      },
    }
  );

  try {
    const { interaction_id, response_data, status = 'processed' } = await request.json();

    if (!interaction_id) {
      return NextResponse.json({ error: 'Interaction ID required' }, { status: 400 });
    }

    // Update the interaction with response
    const { data, error } = await supabase
      .from('masterbot_interactions')
      .update({
        response_status: status,
        response_data: response_data || {},
        processed_at: new Date().toISOString()
      })
      .eq('id', interaction_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating masterbot interaction:', error);
      return NextResponse.json({ error: 'Failed to update interaction' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      interaction: data
    });
    
  } catch (error) {
    console.error('Masterbot interactions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}