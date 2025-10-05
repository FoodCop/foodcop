import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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

    // Get user statistics
    const stats = {
      savedRestaurants: 0,
      favoriteRecipes: 0,
      friendConnections: 0,
      aiInteractions: 0
    };

    try {
      // Get saved restaurants count
      const { count: restaurantCount } = await supabase
        .from('saved_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      stats.savedRestaurants = restaurantCount || 0;

      // Get saved recipes count
      const { count: recipeCount } = await supabase
        .from('saved_recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      stats.favoriteRecipes = recipeCount || 0;

      // Get friend connections count
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      stats.friendConnections = friendCount || 0;

      // Get AI chat interactions count
      const { count: chatCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_ai_generated', false);
      
      stats.aiInteractions = chatCount || 0;

    } catch (error) {
      console.error('Error fetching stats:', error);
      // Continue with default stats if queries fail
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}