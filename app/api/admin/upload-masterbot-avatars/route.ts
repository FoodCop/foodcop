import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Masterbot avatar mappings
const MASTERBOT_AVATARS = {
  'spice_scholar_anika': {
    name: 'Anika Kapoor',
    filename: 'anika_spice_scholar.png',
    description: 'Spice scholar with cultural elements'
  },
  'sommelier_seb': {
    name: 'Sebastian LeClair', 
    filename: 'sebastian_sommelier.png',
    description: 'Wine sommelier with elegant background'
  },
  'coffee_pilgrim_omar': {
    name: 'Omar Darzi',
    filename: 'omar_coffee_pilgrim.png', 
    description: 'Coffee expert with warm atmosphere'
  },
  'zen_minimalist_jun': {
    name: 'Jun Tanaka',
    filename: 'jun_zen_minimalist.png',
    description: 'Minimalist with sushi and serene setting'
  },
  'nomad_aurelia': {
    name: 'Aurelia Voss',
    filename: 'aurelia_nomad.png',
    description: 'Street food traveler with urban background'
  },
  'adventure_rafa': {
    name: 'Rafael Mendez',
    filename: 'rafael_adventure.png',
    description: 'Adventure seeker with outdoor food'
  },
  'plant_pioneer_lila': {
    name: 'Lila Cheng',
    filename: 'lila_plant_pioneer.png',
    description: 'Plant-based advocate with sustainable food'
  }
};

// POST /api/admin/upload-masterbot-avatars
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
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

    const formData = await request.formData();
    const results = [];

    // Process each masterbot avatar
    for (const [username, config] of Object.entries(MASTERBOT_AVATARS)) {
      const file = formData.get(username) as File;
      
      if (!file) {
        console.log(`No file provided for ${username}`);
        continue;
      }

      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${username}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('master-bot-posts')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${username}:`, uploadError);
          results.push({ username, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('master-bot-posts')
          .getPublicUrl(filePath);

        // Update user record
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: publicUrl })
          .eq('username', username)
          .eq('is_master_bot', true);

        if (updateError) {
          console.error(`Database update error for ${username}:`, updateError);
          results.push({ username, success: false, error: updateError.message });
          continue;
        }

        results.push({
          username,
          success: true,
          publicUrl,
          fileName: config.filename
        });

        console.log(`Successfully uploaded avatar for ${config.name} (${username})`);

      } catch (error) {
        console.error(`Error processing ${username}:`, error);
        results.push({ username, success: false, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} masterbot avatars`,
      results
    });

  } catch (error) {
    console.error('Masterbot avatar upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: String(error)
    }, { status: 500 });
  }
}

// GET /api/admin/upload-masterbot-avatars - Get upload status
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

    // Get current masterbot avatar status
    const { data: masterbots, error } = await supabase
      .from('users')
      .select('username, display_name, avatar_url, is_master_bot')
      .eq('is_master_bot', true)
      .order('username');

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      masterbots: masterbots?.map(bot => ({
        username: bot.username,
        displayName: bot.display_name,
        hasAvatar: !!bot.avatar_url,
        avatarUrl: bot.avatar_url
      })) || []
    });

  } catch (error) {
    console.error('Get masterbot avatars error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}