import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Generate AI response (simplified for now)
    const aiResponse = await generateAIResponse(message, masterbotData);

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

// Simple AI response generator (to be enhanced with OpenAI later)
async function generateAIResponse(userMessage: string, masterbot: any): Promise<string> {
  // For now, return a simple response based on masterbot personality
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
    ]
  };

  const botResponses = responses[masterbot.username as keyof typeof responses] || [
    "That's interesting! Tell me more about your food experience.",
    "Great choice! I'd love to help you explore more culinary adventures.",
    "Delicious! Food is such a wonderful way to connect with others."
  ];

  return botResponses[Math.floor(Math.random() * botResponses.length)];
}