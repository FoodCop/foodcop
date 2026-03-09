/**
 * Supabase Edge Function: cleanup-old-messages
 * 
 * This function automatically deletes messages older than 7 days.
 * Should be scheduled to run daily via Supabase Cron or pg_cron.
 * 
 * Setup:
 * 1. Deploy: supabase functions deploy cleanup-old-messages
 * 2. Schedule via Supabase Dashboard > Database > Cron Jobs
 *    - Schedule: 0 2 * * * (runs daily at 2 AM UTC)
 *    - SQL: SELECT cron.schedule('cleanup-old-messages', '0 2 * * *', $$SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-old-messages', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb)$$);
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify this is called from a scheduled job or admin
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Allow service role key or check for cron secret
    const cronSecret = Deno.env.get('CRON_SECRET')
    const providedSecret = req.headers.get('X-Cron-Secret')
    
    if (!authHeader && (!cronSecret || providedSecret !== cronSecret)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Calculate cutoff date (7 days ago)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoffDate = sevenDaysAgo.toISOString()

    console.log(`🧹 Starting cleanup of messages older than ${cutoffDate}`)

    // Delete old messages
    const { data: deletedMessages, error: deleteError } = await supabaseClient
      .from('dm_messages')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id')

    if (deleteError) {
      console.error('❌ Error deleting old messages:', deleteError)
      throw deleteError
    }

    const deletedCount = deletedMessages?.length || 0
    console.log(`✅ Deleted ${deletedCount} old messages`)

    // Also clean up empty conversations (conversations with no messages)
    // Only delete conversations that are older than 7 days and have no messages
    const { data: emptyConversations, error: convError } = await supabaseClient
      .rpc('cleanup_empty_conversations')

    // If the RPC doesn't exist, use a manual query
    if (convError && convError.message.includes('function') && convError.message.includes('does not exist')) {
      console.log('ℹ️ cleanup_empty_conversations function not found, skipping empty conversation cleanup')
    } else if (convError) {
      console.error('❌ Error cleaning up empty conversations:', convError)
    } else {
      const cleanedCount = emptyConversations || 0
      console.log(`✅ Cleaned up ${cleanedCount} empty conversations`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedMessages: deletedCount,
        deletedEmptyConversations: emptyConversations || 0,
        cutoffDate,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('💥 Error in cleanup-old-messages:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

