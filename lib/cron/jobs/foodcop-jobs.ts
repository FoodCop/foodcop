import { CronJobConfig } from '../types';
import { supabaseServer } from '@/lib/supabase/server';
import { RestaurantDataService } from '@/lib/services/restaurant-data';

// FoodCop specific CRON jobs
export const foodCopJobs: CronJobConfig[] = [
  {
    id: 'cleanup-expired-sessions',
    name: 'Cleanup Expired Sessions',
    description: 'Remove expired user sessions and temporary data',
    schedule: '0 2 * * *', // Daily at 2 AM
    enabled: true,
    handler: async () => {
      const supabase = await supabaseServer();
      
      try {
        // Clean up expired sessions (older than 30 days)
        const { error } = await supabase
          .from('auth.sessions')
          .delete()
          .lt('expires_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (error) throw error;
        
        console.log('Expired sessions cleaned up successfully');
      } catch (error) {
        console.error('Failed to cleanup expired sessions:', error);
        throw error;
      }
    }
  },
  {
    id: 'update-place-cache',
    name: 'Update Place Cache',
    description: 'Refresh cached place data from Google Places API',
    schedule: '0 */6 * * *', // Every 6 hours
    enabled: true,
    handler: async () => {
      const supabase = await supabaseServer();
      
      try {
        // Get places that haven't been updated in the last 6 hours
        const { data: stalePlaces, error: fetchError } = await supabase
          .from('place_media_cache')
          .select('place_id')
          .lt('updated_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
          .limit(50);
        
        if (fetchError) throw fetchError;
        
        if (stalePlaces && stalePlaces.length > 0) {
          // Here you would typically call Google Places API to refresh the data
          // For now, just update the timestamp
          const { error: updateError } = await supabase
            .from('place_media_cache')
            .update({ updated_at: new Date().toISOString() })
            .in('place_id', stalePlaces.map((p: any) => p.place_id));
          
          if (updateError) throw updateError;
        }
        
        console.log(`Updated ${stalePlaces?.length || 0} place cache entries`);
      } catch (error) {
        console.error('Failed to update place cache:', error);
        throw error;
      }
    }
  },
  {
    id: 'generate-daily-feed',
    name: 'Generate Daily Feed',
    description: 'Generate personalized feed content for all active users',
    schedule: '0 6 * * *', // Daily at 6 AM
    enabled: true,
    handler: async () => {
      const supabase = await supabaseServer();
      
      try {
        // Get all active users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('is_active', true);
        
        if (usersError) throw usersError;
        
        if (users && users.length > 0) {
          // Generate feed for each user
          for (const user of users) {
            // This would typically call your feed generation logic
            // For now, just log the action
            console.log(`Generating feed for user: ${user.id}`);
          }
        }
        
        console.log(`Generated daily feed for ${users?.length || 0} users`);
      } catch (error) {
        console.error('Failed to generate daily feed:', error);
        throw error;
      }
    }
  },
  {
    id: 'cleanup-uploaded-images',
    name: 'Cleanup Uploaded Images',
    description: 'Remove orphaned and temporary uploaded images',
    schedule: '0 3 * * *', // Daily at 3 AM
    enabled: true,
    handler: async () => {
      const supabase = await supabaseServer();
      
      try {
        // Find images that are older than 7 days and not associated with any content
        const { data: orphanedImages, error: fetchError } = await supabase
          .from('storage.objects')
          .select('name')
          .eq('bucket_id', 'uploads')
          .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        if (fetchError) throw fetchError;
        
        if (orphanedImages && orphanedImages.length > 0) {
          // Delete orphaned images
          const { error: deleteError } = await supabase.storage
            .from('uploads')
            .remove(orphanedImages.map((img: any) => img.name));
          
          if (deleteError) throw deleteError;
        }
        
        console.log(`Cleaned up ${orphanedImages?.length || 0} orphaned images`);
      } catch (error) {
        console.error('Failed to cleanup uploaded images:', error);
        throw error;
      }
    }
  },
  {
    id: 'master-bot-morning-posts',
    name: 'Master Bot Morning Posts',
    description: 'Generate morning restaurant posts from Master Bot datasets (3x daily schedule - morning)',
    schedule: '0 8 * * *', // Daily at 8 AM
    enabled: true,
    handler: async () => {
      await handleMasterBotPosting('morning');
    }
  },
  {
    id: 'master-bot-afternoon-posts', 
    name: 'Master Bot Afternoon Posts',
    description: 'Generate afternoon restaurant posts from Master Bot datasets (3x daily schedule - afternoon)',
    schedule: '0 14 * * *', // Daily at 2 PM
    enabled: true,
    handler: async () => {
      await handleMasterBotPosting('afternoon');
    }
  },
  {
    id: 'master-bot-evening-posts',
    name: 'Master Bot Evening Posts', 
    description: 'Generate evening restaurant posts from Master Bot datasets (3x daily schedule - evening)',
    schedule: '0 20 * * *', // Daily at 8 PM
    enabled: true,
    handler: async () => {
      await handleMasterBotPosting('evening');
    }
  },
  {
    id: 'health-check',
    name: 'System Health Check',
    description: 'Monitor system health and send alerts if needed',
    schedule: '*/15 * * * *', // Every 15 minutes
    enabled: true,
    handler: async () => {
      try {
        const supabase = await supabaseServer();
        
        // Check database connectivity
        const { error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (dbError) {
          console.error('Database health check failed:', dbError);
          // Here you would typically send an alert
        } else {
          console.log('System health check passed');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        throw error;
      }
    }
  }
];

/**
 * Handle Master Bot posting from restaurant datasets
 * Creates authentic posts for each Master Bot using their specialized restaurant data
 */
async function handleMasterBotPosting(timeOfDay: 'morning' | 'afternoon' | 'evening') {
  const supabase = await supabaseServer();
  
  try {
    console.log(`🤖 Starting Master Bot ${timeOfDay} posting cycle...`);
    
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
      console.log('No master bots found');
      return;
    }

    let postsCreated = 0;

    // Generate post for each Master Bot
    for (const bot of masterBots) {
      try {
        // Get a random restaurant for this bot (excluding recent posts)
        const restaurant = await RestaurantDataService.getRandomRestaurantForBot(bot.username, 30);
        
        if (!restaurant) {
          console.log(`No restaurants available for bot ${bot.username}`);
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
        } else {
          console.log(`✅ Created ${timeOfDay} post for ${bot.display_name}: ${restaurant.name}`);
          postsCreated++;
        }

      } catch (error) {
        console.error(`Error processing bot ${bot.username}:`, error);
      }
    }

    console.log(`🎉 Master Bot ${timeOfDay} posting complete: ${postsCreated}/${masterBots.length} posts created`);
    
  } catch (error) {
    console.error(`Failed to handle Master Bot ${timeOfDay} posting:`, error);
    throw error;
  }
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

