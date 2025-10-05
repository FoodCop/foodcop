import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
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

    // Generate AI insights based on user activity
    const insights = [];

    try {
      // Get user's saved restaurants for location-based insights
      const { data: savedRestaurants } = await supabase
        .from('saved_restaurants')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);

      // Get user's recent chat activity for personalization
      const { data: recentChats } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('user_id', user.id)
        .eq('is_ai_generated', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // Generate insights using OpenAI
      const openaiKey = process.env.OPENAI_API_KEY;
      
      if (openaiKey) {
        try {
          const contextData = {
            savedRestaurants: savedRestaurants?.length || 0,
            recentChatTopics: recentChats?.map(c => c.content).join(', ').substring(0, 200) || '',
            hasActivity: (savedRestaurants?.length || 0) > 0 || (recentChats?.length || 0) > 0
          };

          const prompt = `Generate 3-4 personalized food insights for a user with the following activity:
- Saved restaurants: ${contextData.savedRestaurants}
- Recent interests: ${contextData.recentChatTopics || 'general food topics'}
- Has activity: ${contextData.hasActivity}

Create insights about food trends, recommendations, health tips, or social connections. Each insight should have:
- A short title (max 50 chars)
- A description (max 150 chars)
- A type: recommendation, trend, health, or social

Format as JSON array.`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a food insights generator. Create helpful, personalized insights about food trends, recommendations, and tips. Return valid JSON only.'
                },
                { role: 'user', content: prompt }
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            const aiContent = aiData.choices[0]?.message?.content;
            
            if (aiContent) {
              try {
                const aiInsights = JSON.parse(aiContent);
                if (Array.isArray(aiInsights)) {
                  insights.push(...aiInsights.map((insight: any) => ({
                    title: insight.title || 'Food Insight',
                    content: insight.description || insight.content || 'Great food discovery ahead!',
                    type: insight.type || 'recommendation',
                    timestamp: new Date()
                  })));
                }
              } catch (parseError) {
                console.error('Error parsing AI insights:', parseError);
              }
            }
          }
        } catch (openaiError) {
          console.error('OpenAI API error:', openaiError);
        }
      }

      // Add fallback insights if AI didn't generate any
      if (insights.length === 0) {
        insights.push(
          {
            title: 'Explore New Cuisines',
            content: 'Try a cuisine you haven\'t explored yet this week. Asian fusion and Mediterranean options are trending!',
            type: 'recommendation',
            timestamp: new Date()
          },
          {
            title: 'Healthy Food Trend',
            content: 'Plant-based bowls are gaining popularity. They\'re nutritious, colorful, and Instagram-worthy!',
            type: 'trend',
            timestamp: new Date()
          },
          {
            title: 'Social Dining',
            content: 'Food experiences are better when shared. Consider inviting friends to try that new restaurant!',
            type: 'social',
            timestamp: new Date()
          }
        );
      }

    } catch (error) {
      console.error('Error generating insights:', error);
      
      // Provide basic fallback insights
      insights.push({
        title: 'Welcome to Your Food Journey',
        content: 'Start exploring restaurants, saving favorites, and chatting with our AI food experts!',
        type: 'recommendation',
        timestamp: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate insights API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}