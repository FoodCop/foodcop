import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        first_name,
        last_name,
        date_of_birth,
        location_city,
        location_state,
        location_country,
        dietary_preferences,
        avatar_url,
        cover_photo_url,
        is_private,
        is_verified,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      display_name,
      username,
      first_name,
      last_name,
      date_of_birth,
      location_city,
      location_state,
      location_country,
      dietary_preferences,
      avatar_url,
      cover_photo_url,
      is_private
    } = body;

    // Validation
    const errors: Record<string, string> = {};

    // Display name validation
    if (!display_name || typeof display_name !== 'string') {
      errors.display_name = 'Display name is required';
    } else if (display_name.length > 100) {
      errors.display_name = 'Display name must be 100 characters or less';
    }

    // Username validation
    if (!username || typeof username !== 'string') {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (username.length > 50) {
      errors.username = 'Username must be 50 characters or less';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Check username availability (if changed)
    if (username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        errors.username = 'Username is already taken';
      }
    }

    // Name validation (if provided)
    if (first_name && (typeof first_name !== 'string' || first_name.length > 50)) {
      errors.first_name = 'First name must be 50 characters or less';
    }
    if (last_name && (typeof last_name !== 'string' || last_name.length > 50)) {
      errors.last_name = 'Last name must be 50 characters or less';
    }

    // Location validation (if provided)
    if (location_city && (typeof location_city !== 'string' || location_city.length > 100)) {
      errors.location_city = 'City must be 100 characters or less';
    }
    if (location_state && (typeof location_state !== 'string' || location_state.length > 100)) {
      errors.location_state = 'State must be 100 characters or less';
    }
    if (location_country && (typeof location_country !== 'string' || location_country.length > 100)) {
      errors.location_country = 'Country must be 100 characters or less';
    }

    // Date of birth validation (if provided)
    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (isNaN(birthDate.getTime())) {
        errors.date_of_birth = 'Invalid date format';
      } else if (age < 13) {
        errors.date_of_birth = 'You must be at least 13 years old';
      }
    }

    // Dietary preferences validation
    if (dietary_preferences && !Array.isArray(dietary_preferences)) {
      errors.dietary_preferences = 'Dietary preferences must be an array';
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (display_name !== undefined) updateData.display_name = display_name;
    if (username !== undefined) updateData.username = username;
    if (first_name !== undefined) updateData.first_name = first_name || null;
    if (last_name !== undefined) updateData.last_name = last_name || null;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
    if (location_city !== undefined) updateData.location_city = location_city || null;
    if (location_state !== undefined) updateData.location_state = location_state || null;
    if (location_country !== undefined) updateData.location_country = location_country || null;
    if (dietary_preferences !== undefined) updateData.dietary_preferences = dietary_preferences;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null;
    if (cover_photo_url !== undefined) updateData.cover_photo_url = cover_photo_url || null;
    if (is_private !== undefined) updateData.is_private = Boolean(is_private);

    // Update user profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select(`
        id,
        email,
        username,
        display_name,
        first_name,
        last_name,
        date_of_birth,
        location_city,
        location_state,
        location_country,
        dietary_preferences,
        avatar_url,
        cover_photo_url,
        is_private,
        is_verified,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      
      // Handle specific database errors
      if (updateError.code === '23505') {
        if (updateError.message.includes('username')) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}