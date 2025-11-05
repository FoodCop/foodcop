import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { responses } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build prompt from responses
    const responseText = responses.map((r: any) => 
      `Q: ${r.question}\nA: ${r.answer ? 'Yes' : 'No'}${r.followUp ? ` (${r.followUp})` : ''}`
    ).join('\n\n');

    const systemPrompt = `You are a food preference analyzer for FUZO.
Based on YES/NO responses to food questions, extract dietary preferences.

OUTPUT ONLY valid JSON with this structure:
{
  "dietary_preferences": ["vegetarian"|"vegan"|"pescetarian"|"ketogenic"|"paleo"|"glutenFree"|"whole30"|"lowFodmap"],
  "allergies": ["dairy"|"nuts"|"shellfish"|"gluten"|"soy"],
  "cuisine_preferences": ["italian"|"mexican"|"asian"|"american"|"indian"|"mediterranean"],
  "cuisine_dislikes": [],
  "spice_tolerance": 1-5,
  "health_conscious": true|false
}

MAPPING RULES:
- No meat + No seafood = vegetarian or vegan
- No meat + Yes seafood = pescetarian
- Yes meat + healthy options = paleo or ketogenic
- Avoid dairy = add "dairy" to allergies
- Allergic to nuts = add "nuts" to allergies
- Yes spicy = spice_tolerance: 4-5
- No spicy = spice_tolerance: 1-2
- Moderate spicy = spice_tolerance: 3
- Following specific diet = add to dietary_preferences
- Prefer healthy = health_conscious: true`;

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Based on these responses, extract food preferences:\n\n${responseText}\n\nReturn ONLY JSON.` }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      console.error('Invalid OpenAI response:', openaiData);
      throw new Error('Invalid response from OpenAI');
    }
    
    const content = openaiData.choices[0].message.content;
    console.log('Raw OpenAI response:', content);
    
    // Parse JSON from response
    const preferences = JSON.parse(content);

    console.log('Extracted preferences:', preferences);

    return new Response(
      JSON.stringify({ preferences }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
