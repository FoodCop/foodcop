/**
 * Supabase Edge Function: generate-stream-token
 * 
 * This function generates Stream Chat tokens securely on the backend.
 * Deploy this to Supabase Edge Functions.
 * 
 * Setup:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Create function: supabase functions new generate-stream-token
 * 3. Add STREAM_CHAT_SECRET to your Supabase secrets
 * 4. Deploy: supabase functions deploy generate-stream-token
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { StreamChat } from 'https://esm.sh/stream-chat@9.25.0'

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
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client to verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { userId } = await req.json()

    // Verify userId matches authenticated user (security check)
    if (userId !== user.id) {
      throw new Error('UserId mismatch')
    }

    // Initialize Stream Chat with secret (server-side only)
    const streamChatApiKey = Deno.env.get('STREAM_CHAT_API_KEY')
    const streamChatSecret = Deno.env.get('STREAM_CHAT_SECRET')

    if (!streamChatApiKey || !streamChatSecret) {
      throw new Error('Stream Chat credentials not configured')
    }

    const serverClient = StreamChat.getInstance(streamChatApiKey, streamChatSecret)

    // Generate token with 24-hour expiration
    const token = serverClient.createToken(userId, Math.floor(Date.now() / 1000) + 86400)

    return new Response(
      JSON.stringify({
        token,
        userId,
        expiresAt: Date.now() + 86400000, // 24 hours
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error generating Stream token:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
