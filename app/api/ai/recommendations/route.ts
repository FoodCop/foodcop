import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OpenAIService } from '@/lib/services/openai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences, location, dietaryRestrictions } = body;

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

    // Use OpenAI service to generate recommendations
    const recommendations = await OpenAIService.generateFoodRecommendations(
      preferences || 'general food recommendations',
      location,
      dietaryRestrictions
    );

    return NextResponse.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI recommendations API error:', error);
    
    // Fallback response
    const fallbackRecommendations = `Here are some great food recommendations:

🍕 **Popular Options**: Try local pizzerias, burger joints, or Asian fusion restaurants
🥗 **Healthy Choices**: Look for salad bars, poke bowls, or Mediterranean cuisine
🍜 **Comfort Food**: Ramen shops, sandwich cafes, or classic diners
🌮 **Quick Bites**: Taco trucks, food courts, or grab-and-go options

For the best experience, I'd recommend checking local reviews and trying places that match your taste preferences!`;

    return NextResponse.json({
      success: true,
      recommendations: fallbackRecommendations,
      timestamp: new Date().toISOString()
    });
  }
}