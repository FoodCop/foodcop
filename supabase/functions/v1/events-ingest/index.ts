import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface SwipeEventRequest {
  user_id: string;
  card_id: string;
  swipe_direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  card_type: 'RECIPE' | 'RESTAURANT_NEARBY' | 'VIDEO' | 'PHOTO' | 'AD';
  content_id: string;
  content_metadata: Record<string, any>;
  
  // Optional context
  session_id?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  user_agent?: string;
  swipe_velocity?: number;
  swipe_distance?: number;
  interaction_duration?: number;
  user_lat?: number;
  user_lng?: number;
}

interface SwipeEventResponse {
  event_id: string;
  swipe_action: string;
  saved_item_id?: string;
  preferences_updated: number;
  already_existed: boolean;
}

// Map swipe directions to actions
const SWIPE_ACTION_MAP = {
  'LEFT': 'DISLIKE',
  'RIGHT': 'LIKE',
  'UP': 'SHARE',
  'DOWN': 'SAVE'
} as const;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    const eventData: SwipeEventRequest = await req.json();
    const { 
      user_id, 
      card_id, 
      swipe_direction, 
      card_type, 
      content_id, 
      content_metadata,
      session_id,
      device_type,
      user_agent,
      swipe_velocity,
      swipe_distance,
      interaction_duration = 0,
      user_lat,
      user_lng
    } = eventData;

    // Validate required fields
    if (!user_id || !card_id || !swipe_direction || !card_type || !content_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: user_id, card_id, swipe_direction, card_type, content_id' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate swipe direction
    if (!Object.keys(SWIPE_ACTION_MAP).includes(swipe_direction)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid swipe_direction. Must be LEFT, RIGHT, UP, or DOWN' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const swipe_action = SWIPE_ACTION_MAP[swipe_direction];
    let savedItemId: string | null = null;
    let preferencesUpdated = 0;
    let alreadyExisted = false;

    // Start transaction
    const { data: eventResult, error: eventError } = await supabaseClient
      .rpc('insert_swipe_event', {
        p_user_id: user_id,
        p_card_id: card_id,
        p_swipe_direction: swipe_direction,
        p_swipe_action: swipe_action,
        p_card_type: card_type,
        p_content_id: content_id,
        p_session_id: session_id,
        p_device_type: device_type,
        p_user_agent: user_agent,
        p_swipe_velocity: swipe_velocity,
        p_swipe_distance: swipe_distance,
        p_interaction_duration: interaction_duration,
        p_user_lat: user_lat,
        p_user_lng: user_lng
      });

    if (eventError) {
      console.error('Error inserting swipe event:', eventError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert swipe event',
          details: eventError.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if this is a duplicate event by seeing if we got back an existing ID
    const eventId = eventResult;
    
    // Get the actual event to check if it's new
    const { data: existingEvent } = await supabaseClient
      .from('swipe_events')
      .select('created_at')
      .eq('id', eventId)
      .single();

    // Consider it duplicate if the event was created more than 1 minute ago
    if (existingEvent) {
      const eventAge = Date.now() - new Date(existingEvent.created_at).getTime();
      alreadyExisted = eventAge > 60000; // 1 minute
    }

    // Only process preferences and saves for new events
    if (!alreadyExisted) {
      // Update user preferences based on the swipe
      try {
        const { error: prefError } = await supabaseClient
          .rpc('learn_from_swipe_event', {
            p_user_id: user_id,
            p_card_type: card_type,
            p_content_metadata: content_metadata,
            p_swipe_action: swipe_action
          });

        if (prefError) {
          console.error('Error updating preferences:', prefError);
        } else {
          preferencesUpdated = 1; // Simplified - in real implementation, could return actual count
        }
      } catch (error) {
        console.error('Preference learning error:', error);
      }

      // Handle SAVE action - save the item to user's saved collection
      if (swipe_action === 'SAVE') {
        try {
          // Map card type to saved item type
          const itemTypeMap = {
            'RECIPE': 'RECIPE',
            'RESTAURANT_NEARBY': 'RESTAURANT',
            'VIDEO': 'VIDEO',
            'PHOTO': 'PHOTO',
            'AD': 'PHOTO' // Treat ads as photos for saving purposes
          };

          const itemType = itemTypeMap[card_type] || card_type;

          const { data: saveResult, error: saveError } = await supabaseClient
            .rpc('save_item', {
              p_user_id: user_id,
              p_item_type: itemType,
              p_item_id: content_id,
              p_metadata: content_metadata,
              p_card_id: card_id,
              p_swipe_event_id: eventId
            });

          if (saveError) {
            console.error('Error saving item:', saveError);
          } else {
            savedItemId = saveResult;
          }
        } catch (error) {
          console.error('Save item error:', error);
        }
      }

      // Handle SHARE action - could trigger sharing functionality
      if (swipe_action === 'SHARE') {
        // TODO: Implement sharing logic
        // - Create share event
        // - Generate share link
        // - Send to social platforms
        // - Notify friends
        console.log('Share action triggered for:', { user_id, card_id, content_id });
      }
    }

    // Generate stable event ID for response
    const { data: stableEventId } = await supabaseClient
      .rpc('generate_swipe_event_id', {
        p_user_id: user_id,
        p_card_id: card_id,
        p_swipe_direction: swipe_direction
      });

    const response: SwipeEventResponse = {
      event_id: stableEventId || eventId,
      swipe_action: swipe_action,
      saved_item_id: savedItemId || undefined,
      preferences_updated: preferencesUpdated,
      already_existed: alreadyExisted
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Events ingest error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});