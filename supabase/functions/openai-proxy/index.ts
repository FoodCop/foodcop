import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Health check endpoint - GET request to test API key
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.pathname.endsWith('/health') || url.searchParams.get('health') === 'true') {
      const hasKey = !!OPENAI_API_KEY;
      const keyPreview = hasKey ? `${OPENAI_API_KEY.substring(0, 7)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}` : 'NOT SET';
      
      // Test the key with a minimal API call
      let keyValid = false;
      let testError = null;
      if (hasKey) {
        try {
          const testResponse = await fetch(`${OPENAI_BASE_URL}/models`, {
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
          });
          keyValid = testResponse.ok;
          if (!testResponse.ok) {
            const errData = await testResponse.json().catch(() => ({}));
            testError = errData.error?.message || testResponse.statusText;
          }
        } catch (e) {
          testError = e instanceof Error ? e.message : 'Unknown error';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          health: {
            keyConfigured: hasKey,
            keyPreview,
            keyValid,
            testError,
            model: 'gpt-4o-mini'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    // Check for API key in environment
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured on server. Please set OPENAI_API_KEY in Supabase secrets.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Note: With verify_jwt: true, Supabase automatically verifies JWT before this code runs
    // If we reach here, the JWT is valid (or the function allows anon access)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed. Use POST' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { 
      model = 'gpt-4o-mini', 
      messages, 
      tools, 
      tool_choice, 
      functions, // Legacy format
      function_call, // Legacy format
      max_tokens = 1000 
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Messages array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Forward request to OpenAI API
    const openaiUrl = `${OPENAI_BASE_URL}/chat/completions`;
    const openaiBody: any = {
      model,
      messages,
      max_tokens,
    };

    // Add tools if provided (new format)
    if (tools) {
      openaiBody.tools = tools;
      openaiBody.tool_choice = tool_choice || 'auto';
    }
    // Support legacy functions format for backward compatibility
    else if (functions) {
      openaiBody.functions = functions;
      openaiBody.function_call = function_call || 'auto';
    }

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.message || 'OpenAI API error',
          details: data 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in openai-proxy:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

