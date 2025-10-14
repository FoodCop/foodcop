import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { RestaurantDataService } from '@/lib/services/restaurant-data';

// Verify CRON secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - CRON endpoint is unprotected');
    return true; // Allow in development
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Master Bot posting endpoint for CRON jobs
 * POST /api/cron/master-bot-posts
 */
export async function POST(request: NextRequest) {
  console.log('CRON master-bot-posts endpoint hit:', {
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    hasAuth: !!request.headers.get('authorization'),
    hasCronSecret: !!process.env.CRON_SECRET
  });

  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('CRON authorization failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let timeOfDay: string;
    
    // Try to get timeOfDay from request body, otherwise determine from current time
    try {
      const body = await request.json();
      timeOfDay = body.timeOfDay;
    } catch {
      // No body or invalid JSON, determine from current time
      timeOfDay = '';
    }
    
    // Auto-determine time of day if not provided
    if (!timeOfDay) {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 6 && hour < 12) {
        timeOfDay = 'morning';
      } else if (hour >= 12 && hour < 18) {
        timeOfDay = 'afternoon';
      } else {
        timeOfDay = 'evening';
      }
    }
    
    const validTimes = ['morning', 'afternoon', 'evening'];
    if (!validTimes.includes(timeOfDay)) {
      return NextResponse.json({ 
        error: 'Invalid timeOfDay. Must be morning, afternoon, or evening' 
      }, { status: 400 });
    }

    console.log(`🤖 Starting Master Bot ${timeOfDay} posting cycle...`);
    
    const supabase = await supabaseServer();
    
    // Get all Master Bot users
    const { data: masterBots, error: botsError } = await supabase
      .from('users')
      .select('id, username, display_name')
      .eq('is_master_bot', true);
      
    if (botsError) {
      console.error('Error fetching master bots:', botsError);
      throw botsError;
    }
    
    if (!masterBots || masterBots.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No master bots found' 
      }, { status: 404 });
    }

    let postsCreated = 0;
    const results: any[] = [];

    // Generate post for each Master Bot
    for (const bot of masterBots) {
      try {
        // Get a random restaurant for this bot
        const restaurant = await RestaurantDataService.getRandomRestaurantForBot(bot.username, 30);
        
        if (!restaurant) {
          console.log(`No restaurants available for bot ${bot.username}`);
          results.push({
            bot: bot.username,
            success: false,
            error: 'No restaurants available'
          });
          continue;
        }

        // Generate bot-specific post content
        const postData = RestaurantDataService.generateBotPost(restaurant, bot.username);

        // Create the post in Supabase
        const { error: postError } = await supabase
          .from('master_bot_posts')
          .insert({
            master_bot_id: bot.id,
            title: postData.title,
            content: postData.content,
            image_url: restaurant.imageUrl,
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            restaurant_location: `${restaurant.city}, ${restaurant.country}`,
            restaurant_rating: restaurant.rating,
            restaurant_price_range: getPriceLevelText(restaurant.priceLevel),
            restaurant_cuisine: restaurant.category,
            tags: restaurant.tags || [],
            content_type: postData.content_type,
            personality_trait: getPersonalityTrait(bot.username),
            is_published: true
          });

        if (postError) {
          console.error(`Error creating post for bot ${bot.username}:`, postError);
          results.push({
            bot: bot.username,
            success: false,
            error: postError.message
          });
        } else {
          console.log(`✅ Created ${timeOfDay} post for ${bot.display_name}: ${restaurant.name}`);
          postsCreated++;
          results.push({
            bot: bot.username,
            success: true,
            restaurant: restaurant.name,
            location: `${restaurant.city}, ${restaurant.country}`
          });
        }

      } catch (error) {
        console.error(`Error processing bot ${bot.username}:`, error);
        results.push({
          bot: bot.username,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Master Bot ${timeOfDay} posting complete: ${postsCreated}/${masterBots.length} posts created`);
    
    return NextResponse.json({
      success: true,
      message: `Master Bot ${timeOfDay} posting complete`,
      stats: {
        totalBots: masterBots.length,
        postsCreated,
        successRate: `${Math.round((postsCreated / masterBots.length) * 100)}%`
      },
      results
    });
    
  } catch (error) {
    console.error('Failed to handle Master Bot posting:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Manual trigger endpoint for testing
 * GET /api/cron/master-bot-posts?timeOfDay=morning
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeOfDay = searchParams.get('timeOfDay') || 'morning';
  
  // Create a mock POST request for manual testing
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ timeOfDay })
  });
  
  return POST(mockRequest);
}

/**
 * Helper function to get price level text
 */
function getPriceLevelText(priceLevel: number): string {
  switch (priceLevel) {
    case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return 'Budget-friendly';
  }
}

/**
 * Helper function to get personality trait for a bot
 */
function getPersonalityTrait(botUsername: string): string {
  const traits: Record<string, string> = {
    'spice_scholar_anika': 'spice expertise',
    'sommelier_seb': 'culinary sophistication', 
    'plant_pioneer_lila': 'sustainable dining',
    'zen_minimalist_jun': 'minimalist perfection',
    'coffee_pilgrim_omar': 'coffee culture analysis',
    'adventure_rafa': 'bold exploration',
    'nomad_aurelia': 'street food wanderlust'
  };
  
  return traits[botUsername] || 'food enthusiasm';
}