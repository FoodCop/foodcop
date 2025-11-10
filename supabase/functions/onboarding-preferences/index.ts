import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionResponse {
  question: string;
  answer: boolean;
  followUp?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { responses } = await req.json();
    
    console.log('=== Onboarding Preferences Extraction ===');
    console.log('Responses received:', responses?.length || 0);
    console.log('Response data:', JSON.stringify(responses, null, 2));

    // Direct extraction from questionnaire responses
    const preferences = {
      dietary_preferences: [] as string[],
      allergies: [] as string[],
      cuisine_preferences: [] as string[],
      cuisine_dislikes: [] as string[],
      spice_tolerance: 3,
      health_conscious: false
    };

    // Process each response
    // Questions: 
    // q1: "Do you eat meat?" 
    // q2: "Do you eat seafood?"
    // q3: "Do you avoid dairy products?"
    // q4: "Are you allergic to nuts?"
    // q5: "Do you enjoy spicy food?"
    // q6: "Do you prefer healthy, low-calorie options?"
    // q7: "Are you following a specific diet?" (with follow-up)
    
    let eatsMeat = false;
    let eatsSeafood = false;
    
    responses.forEach((r: QuestionResponse) => {
      const question = r.question.toLowerCase();
      const answer = r.answer;
      const followUp = r.followUp?.toLowerCase() || '';

      // Q1: Do you eat meat?
      if (question.includes('eat meat')) {
        eatsMeat = answer;
      }

      // Q2: Do you eat seafood?
      if (question.includes('eat seafood')) {
        eatsSeafood = answer;
      }

      // Q3: Do you avoid dairy? (YES = avoid = allergy/intolerance)
      if (question.includes('avoid dairy')) {
        if (answer) {
          preferences.allergies.push('dairy');
        }
      }

      // Q4: Are you allergic to nuts? (YES = allergic)
      if (question.includes('allergic to nuts')) {
        if (answer) {
          preferences.allergies.push('nuts');
        }
      }

      // Q5: Do you enjoy spicy food?
      if (question.includes('spicy')) {
        preferences.spice_tolerance = answer ? 4 : 1;
      }

      // Q6: Do you prefer healthy, low-calorie options?
      if (question.includes('healthy') || question.includes('low-calorie')) {
        preferences.health_conscious = answer;
      }

      // Q7: Are you following a specific diet? (from follow-up)
      if (question.includes('specific diet') && followUp && followUp !== 'none') {
        if (followUp.includes('keto')) {
          preferences.dietary_preferences.push('ketogenic');
        }
        if (followUp.includes('paleo')) {
          preferences.dietary_preferences.push('paleo');
        }
        if (followUp.includes('whole30')) {
          preferences.dietary_preferences.push('whole30');
        }
        if (followUp.includes('fodmap')) {
          preferences.dietary_preferences.push('lowFodmap');
        }
      }
    });

    // Determine dietary preference based on meat/seafood answers
    if (!eatsMeat && !eatsSeafood) {
      preferences.dietary_preferences.push('vegetarian');
    } else if (!eatsMeat && eatsSeafood) {
      preferences.dietary_preferences.push('pescetarian');
    }
    // If eats both meat and seafood = omnivore (no special dietary preference)

    // Remove duplicates
    preferences.dietary_preferences = [...new Set(preferences.dietary_preferences)];
    preferences.allergies = [...new Set(preferences.allergies)];
    preferences.cuisine_preferences = [...new Set(preferences.cuisine_preferences)];

    console.log('Extracted preferences:', JSON.stringify(preferences, null, 2));

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
