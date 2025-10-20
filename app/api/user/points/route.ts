import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { points, activity, metadata } = await req.json();
    
    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { success: false, error: "Invalid points value" },
        { status: 400 }
      );
    }

    const sb = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError) {
      console.error("Auth error in points update:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication failed", details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No authenticated user found" },
        { status: 401 }
      );
    }

    // Update user points
    const { data: userData, error: updateError } = await sb
      .from("users")
      .update({
        total_points: sb.rpc('increment_points', { user_id: user.id, points_to_add: points }),
        experience_points: sb.rpc('increment_experience', { user_id: user.id, exp_to_add: points }),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('total_points, experience_points, current_level')
      .single();

    if (updateError) {
      console.error("Points update error:", updateError);
      
      // Fallback: try a simpler update
      const { data: fallbackData, error: fallbackError } = await sb
        .from("users")
        .select('total_points, experience_points')
        .eq('id', user.id)
        .single();

      if (!fallbackError && fallbackData) {
        const { error: simpleUpdateError } = await sb
          .from("users")
          .update({
            total_points: (fallbackData.total_points || 0) + points,
            experience_points: (fallbackData.experience_points || 0) + points,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (simpleUpdateError) {
          console.error("Fallback update error:", simpleUpdateError);
          return NextResponse.json(
            { success: false, error: "Failed to update points" },
            { status: 500 }
          );
        }
      }
    }

    // Log the activity
    const activityLogData = {
      user_id: user.id,
      activity_type: activity || 'snap_created',
      description: `Earned ${points} points for ${activity || 'creating a food snap'}`,
      points_earned: points,
      metadata: metadata || {}
    };

    const { error: logError } = await sb
      .from("activity_logs")
      .insert(activityLogData);

    if (logError) {
      console.error("Activity log error:", logError);
      // Don't fail the request if logging fails
    }

    // Check for level up
    const totalPoints = (userData?.total_points || 0) + points;
    const newLevel = Math.floor(totalPoints / 100) + 1; // Simple level calculation
    const currentLevel = userData?.current_level || 1;
    
    let leveledUp = false;
    if (newLevel > currentLevel) {
      leveledUp = true;
      
      // Update user level
      const { error: levelError } = await sb
        .from("users")
        .update({ current_level: newLevel })
        .eq('id', user.id);

      if (levelError) {
        console.error("Level update error:", levelError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        pointsAdded: points,
        totalPoints: totalPoints,
        newLevel: leveledUp ? newLevel : currentLevel,
        leveledUp: leveledUp
      }
    });

  } catch (error) {
    console.error("Points update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}