import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured on server' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

