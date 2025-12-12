import { DMChatService, DMMessage } from '../services/dmChatService';
import { supabase } from '../services/supabase';

/**
 * Helper utilities for chat testing
 */

/**
 * Create a test conversation between two users
 */
export async function createTestConversation(
    user1Id: string,
    user2Id: string
): Promise<string | null> {
    const result = await DMChatService.getOrCreateConversation(user1Id, user2Id);
    return result.success && result.data ? result.data.id : null;
}

/**
 * Send multiple test messages with delay
 */
export async function sendTestMessages(
    conversationId: string,
    senderId: string,
    count: number,
    delayMs: number = 500
): Promise<DMMessage[]> {
    const messages: DMMessage[] = [];

    for (let i = 0; i < count; i++) {
        const result = await DMChatService.sendMessage(
            conversationId,
            senderId,
            `Test message ${i + 1} of ${count}`
        );

        if (result.success && result.data) {
            messages.push(result.data);
        }

        if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return messages;
}

/**
 * Wait for a realtime message with timeout
 */
export async function waitForRealtimeMessage(
    conversationId: string,
    messageId: string,
    timeout: number = 5000
): Promise<boolean> {
    return new Promise((resolve) => {
        let received = false;
        const startTime = Date.now();

        const channel = supabase
            .channel(`wait_${messageId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'dm_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const message = payload.new as DMMessage;
                    if (message.id === messageId) {
                        received = true;
                        channel.unsubscribe();
                        resolve(true);
                    }
                }
            )
            .subscribe();

        // Timeout handler
        const timeoutId = setTimeout(() => {
            if (!received) {
                channel.unsubscribe();
                resolve(false);
            }
        }, timeout);

        // Cleanup on success
        if (received) {
            clearTimeout(timeoutId);
        }
    });
}

/**
 * Verify message delivery
 */
export async function verifyMessageDelivery(
    conversationId: string,
    messageId: string,
    timeout: number = 5000
): Promise<{ delivered: boolean; latency?: number }> {
    const startTime = Date.now();

    // First check if message already exists
    const { data: existing } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('id', messageId)
        .single();

    if (existing) {
        return { delivered: true, latency: 0 };
    }

    // Wait for realtime delivery
    const delivered = await waitForRealtimeMessage(conversationId, messageId, timeout);
    const latency = Date.now() - startTime;

    return { delivered, latency: delivered ? latency : undefined };
}

/**
 * Get random test users from database
 */
export async function generateTestUsers(count: number = 2): Promise<Array<{
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
}>> {
    const { data, error } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url')
        .limit(count * 2);

    if (error || !data || data.length < count) {
        throw new Error(`Failed to fetch test users: ${error?.message || 'Not enough users'}`);
    }

    // Return random subset
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Cleanup test conversations and their messages
 */
export async function cleanupTestData(conversationIds: string[]): Promise<void> {
    for (const id of conversationIds) {
        // Delete messages first (foreign key constraint)
        await supabase.from('dm_messages').delete().eq('conversation_id', id);
        // Then delete conversation
        await supabase.from('dm_conversations').delete().eq('id', id);
    }
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format timestamp to readable time
 */
export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
    });
}

/**
 * Calculate statistics from an array of numbers
 */
export function calculateStats(numbers: number[]): {
    min: number;
    max: number;
    avg: number;
    median: number;
} {
    if (numbers.length === 0) {
        return { min: 0, max: 0, avg: 0, median: 0 };
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    return { min, max, avg, median };
}
