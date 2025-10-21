import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { OpenAIService } from '@/lib/services/openai-service';

export async function POST(request: NextRequest) {
  try {
    const { message, botId, userId, roomId } = await request.json();

    if (!message || !botId || !userId || !roomId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, botId, userId, roomId' },
        { status: 400 }
      );
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get bot information from database
    const { data: bot, error: botError } = await supabase
      .from('users')
      .select('username, display_name, is_master_bot')
      .eq('id', botId)
      .eq('is_master_bot', true)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Master Bot not found' },
        { status: 404 }
      );
    }

    // Get recent conversation history for context
    const { data: recentMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('user_id, content, is_ai_generated')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('Error fetching conversation history:', messagesError);
    }

    // Build conversation history for AI context
    const conversationHistory = (recentMessages || [])
      .reverse() // Oldest first
      .map((msg: any) => ({
        role: msg.is_ai_generated ? 'assistant' as const : 'user' as const,
        content: msg.content
      }));

    // Generate AI response using the bot's personality
    const aiResponse = await OpenAIService.generateMasterbotResponse(
      message,
      bot.username,
      conversationHistory
    );

    // Save the AI response to the database
    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: botId,
        room_id: roomId,
        content: aiResponse,
        is_ai_generated: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving AI response:', saveError);
      return NextResponse.json(
        { error: 'Failed to save AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      messageId: savedMessage.id,
      timestamp: savedMessage.created_at,
      botName: bot.display_name
    });

  } catch (error) {
    console.error('Master Bot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}