import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OpenAIService } from '@/lib/services/openai-service';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/chat/ai - Get AI chat messages with masterbot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const masterbot = searchParams.get('masterbot');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!masterbot) {
      return NextResponse.json({ 
        success: false, 
        error: 'Masterbot parameter is required' 
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

    // Create room ID for AI chat
    const aiRoomId = `ai_${user.id}_${masterbot}`;

    // Fetch AI chat messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users(id, email, display_name, avatar_url, username)
      `)
      .eq('room_id', aiRoomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI messages:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch AI messages',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      roomId: aiRoomId,
      masterbot
    });

  } catch (error) {
    console.error('AI chat API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/chat/ai - Send message to AI and get response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { masterbot, message } = body;

    if (!masterbot || !message?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Masterbot and message are required' 
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

    // Create room ID for AI chat
    const aiRoomId = `ai_${user.id}_${masterbot}`;

    // Get masterbot configuration
    const { data: masterbotData, error: masterbotError } = await supabase
      .from('master_bots')
      .select('*')
      .eq('username', masterbot)
      .single();

    if (masterbotError || !masterbotData) {
      console.error('Error fetching masterbot:', masterbotError);
      return NextResponse.json({ 
        success: false, 
        error: 'Masterbot not found' 
      }, { status: 404 });
    }

    // Insert user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        content: message.trim(),
        room_id: aiRoomId,
        is_ai_generated: false
      })
      .select(`
        *,
        user:users(id, email, display_name, avatar_url, username)
      `)
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save user message' 
      }, { status: 500 });
    }

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('content, is_ai_generated')
      .eq('room_id', aiRoomId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Convert to conversation history format
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = (recentMessages || [])
      .reverse()
      .map(msg => ({
        role: msg.is_ai_generated ? 'assistant' : 'user',
        content: msg.content
      }));

    // Generate AI response with conversation context
    const aiResponse = await generateAIResponse(message, masterbotData, conversationHistory);

    // Insert AI response
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: masterbotData.id, // Use masterbot's user ID
        content: aiResponse,
        room_id: aiRoomId,
        is_ai_generated: true
      })
      .select(`
        *,
        user:users(id, email, display_name, avatar_url, username)
      `)
      .single();

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save AI response' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userMessage,
      aiMessage,
      roomId: aiRoomId
    });

  } catch (error) {
    console.error('AI chat POST API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Enhanced AI response generator using OpenAI
async function generateAIResponse(userMessage: string, masterbot: any, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<string> {
  try {
    // Use OpenAI service to generate intelligent responses
    const response = await OpenAIService.generateMasterbotResponse(
      userMessage,
      masterbot.username,
      conversationHistory
    );
    
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback to simple responses if OpenAI fails
    const responses = {
      'tako': [
        "That sounds delicious! I love experimenting with Japanese flavors. 🐙",
        "Tako here! Have you tried adding some umami to that dish?",
        "Interesting choice! In Japan, we often pair that with..."
      ],
      'chef-sophia': [
        "Excellent choice! The technique you're describing reminds me of classical French methods.",
        "Chef Sophia here - have you considered the temperature control for that recipe?",
        "That's a wonderful dish! I'd suggest pairing it with..."
      ],
      'street-food-samurai': [
        "Street food warrior here! That sounds like authentic street cuisine!",
        "Yo! That's exactly the kind of bold flavor I love to see!",
        "Street-style cooking is all about that authentic taste - you're on the right track!"
      ],
      'coffee-pilgrim-omar': [
        "Omar here! That sounds like a perfect coffee pairing opportunity.",
        "Have you considered what coffee would complement that flavor profile?",
        "Coffee pilgrim approved! That's exactly the kind of experience I love."
      ],
      'adventure-rafa': [
        "Adventure time! That sounds like an exciting culinary challenge!",
        "Rafael here - I love your adventurous spirit with food!",
        "That's the kind of bold flavor adventure I'm talking about!"
      ]
    };

    const botResponses = responses[masterbot.username as keyof typeof responses] || [
      "That's interesting! Tell me more about your food experience.",
      "Great choice! I'd love to help you explore more culinary adventures.",
      "Delicious! Food is such a wonderful way to connect with others."
    ];

    return botResponses[Math.floor(Math.random() * botResponses.length)];
  }
}