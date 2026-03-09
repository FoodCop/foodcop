/**
 * Chat Test Script
 * Sends test messages between two users to verify Supabase realtime chat
 * 
 * Usage: tsx scripts/testChat.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ConversationRow {
    id: string;
}

interface UserRow {
    id: string;
    display_name: string;
    username: string;
}

interface MessageRow {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

// Chat service functions
async function getOrCreateConversation(userId: string, otherUserId: string) {
    const [p1, p2] = [userId, otherUserId].sort();

    const { data: existing, error: fetchError } = await supabase
        .from('dm_conversations')
        .select('*')
        .or(`and(participant_1.eq.${p1},participant_2.eq.${p2})`)
        .single();

    if (existing && !fetchError) {
        return { success: true, data: existing };
    }

    const { data, error } = await supabase
        .from('dm_conversations')
        .insert({ participant_1: p1, participant_2: p2 })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
}

async function sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
        .from('dm_messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message, data: null };
    }

    await supabase
        .from('dm_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    return { success: true, data };
}

async function fetchMessages(conversationId: string) {
    const { data, error } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
}

function subscribeToMessages(conversationId: string, onMessage: (message: MessageRow) => void) {
    const channel = supabase
        .channel(`dm_messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'dm_messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload: { new: unknown }) => {
                const row = payload.new as Partial<MessageRow>;
                if (!row?.id || !row?.sender_id) return;
                onMessage({
                    id: row.id,
                    sender_id: row.sender_id,
                    content: typeof row.content === 'string' ? row.content : '',
                    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
                });
            }
        )
        .subscribe();

    return () => {
        channel.unsubscribe();
    };
}

async function main() {
    console.log('🧪 Chat Test Script Starting...\n');

    // Step 1: Get two users from the database
    console.log('📋 Fetching users...');
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, username')
        .limit(2);

    if (usersError || !users || users.length < 2) {
        console.error('❌ Error: Need at least 2 users in the database');
        console.error('Error:', usersError?.message);
        process.exit(1);
    }

    const [user1, user2] = users as UserRow[];
    console.log(`✅ Found users:`);
    console.log(`   User 1: ${user1.display_name} (@${user1.username}) - ${user1.id.slice(0, 8)}...`);
    console.log(`   User 2: ${user2.display_name} (@${user2.username}) - ${user2.id.slice(0, 8)}...`);
    console.log('');

    // Step 2: Create or get conversation
    console.log('💬 Creating/getting conversation...');
    const convResult = await getOrCreateConversation(user1.id, user2.id);

    if (!convResult.success || !convResult.data) {
        console.error('❌ Failed to create conversation:', convResult.error);
        process.exit(1);
    }

    const conversationId = (convResult.data as ConversationRow).id;
    console.log(`✅ Conversation ID: ${conversationId.slice(0, 8)}...`);
    console.log('');

    // Step 3: Subscribe User 2 to receive messages
    console.log('🔌 Subscribing User 2 to realtime messages...');
    let receivedMessages: MessageRow[] = [];

    const unsubscribe = subscribeToMessages(conversationId, (message) => {
        receivedMessages.push(message);
        console.log(`📥 User 2 received: "${message.content}" (${new Date(message.created_at).toLocaleTimeString()})`);
    });

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Subscription active');
    console.log('');

    // Step 4: Send messages from User 1
    console.log('📤 Sending messages from User 1...');
    const messages = [
        'Hello! This is a test message.',
        'Testing the realtime chat system.',
        'Can you see these messages?',
        'This is the final test message!',
    ];

    for (let i = 0; i < messages.length; i++) {
        const content = messages[i];
        console.log(`   Sending: "${content}"`);

        const result = await sendMessage(conversationId, user1.id, content);

        if (result.success) {
            console.log(`   ✅ Sent successfully`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }

        // Wait a bit between messages
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');

    // Step 5: Wait for all messages to be received
    console.log('⏳ Waiting for messages to be received via realtime...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Verify results
    console.log('');
    console.log('📊 Results:');
    console.log(`   Messages sent: ${messages.length}`);
    console.log(`   Messages received via realtime: ${receivedMessages.length}`);

    if (receivedMessages.length === messages.length) {
        console.log('   ✅ SUCCESS: All messages received!');
    } else {
        console.log(`   ⚠️  WARNING: Only ${receivedMessages.length}/${messages.length} messages received`);
    }

    // Step 7: Fetch messages from database to verify persistence
    console.log('');
    console.log('💾 Verifying message persistence...');
    const fetchResult = await fetchMessages(conversationId);

    if (fetchResult.success && fetchResult.data) {
        console.log(`✅ Found ${fetchResult.data.length} messages in database`);
        console.log('');
        console.log('📝 Conversation history:');
        (fetchResult.data as MessageRow[]).forEach((msg, index: number) => {
            const sender = msg.sender_id === user1.id ? user1.display_name : user2.display_name;
            console.log(`   ${index + 1}. [${sender}]: ${msg.content}`);
        });
    } else {
        console.log('❌ Failed to fetch messages:', fetchResult.error);
    }

    // Cleanup
    unsubscribe();
    console.log('');
    console.log('🎉 Test complete!');
    process.exit(0);
}

// Run the test
main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
