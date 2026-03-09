import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const hasKey = !!OPENAI_API_KEY;
  const keyPreview = hasKey ? `${OPENAI_API_KEY!.substring(0, 7)}...${OPENAI_API_KEY!.substring(OPENAI_API_KEY!.length - 4)}` : 'NOT SET';
  
  let keyValid = false;
  let testError: string | null = null;
  
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
});

