import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OpenAIService } from '@/lib/services/openai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Build context-aware prompt
    let contextualPrompt = message;
    
    if (context?.preferences) {
      contextualPrompt += ` (User preferences: ${context.preferences})`;
    }
    
    if (context?.location?.city) {
      contextualPrompt += ` (User location: ${context.location.city})`;
    }
    
    if (context?.dietaryRestrictions?.length > 0) {
      contextualPrompt += ` (Dietary restrictions: ${context.dietaryRestrictions.join(', ')})`;
    }

    // Generate AI response using a general food assistant personality
    const systemPrompt = `You are a helpful AI food assistant. You provide personalized food recommendations, cooking advice, restaurant suggestions, and culinary knowledge. Keep responses helpful, friendly, and under 200 words. Focus on practical advice and actionable suggestions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextualPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI general API error:', error);
    
    // Fallback response
    return NextResponse.json({
      success: true,
      response: "I'd love to help you with your food questions! Could you tell me more about what you're looking for?",
      timestamp: new Date().toISOString()
    });
  }
}