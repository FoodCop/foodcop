import { supabase } from './supabase';
import { DMChatService, DMMessage, DMConversation, SharedItem } from './dmChatService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createShareItem } from '../hooks/useShareToChat';

// Test scenario types
export type TestScenarioType =
    | 'basic_send_receive'
    | 'bidirectional_chat'
    | 'realtime_latency'
    | 'message_ordering'
    | 'multiple_conversations'
    | 'stress_test'
    | 'shared_item_test';

export interface TestUser {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
}

export interface TestResult {
    scenario: TestScenarioType;
    status: 'pass' | 'fail' | 'running';
    duration?: number;
    error?: string;
    details?: Record<string, unknown>;
    metrics?: {
        messagesSent?: number;
        messagesReceived?: number;
        averageLatency?: number;
        maxLatency?: number;
        minLatency?: number;
    };
}

export interface RealtimeEvent {
    timestamp: number;
    userId: string;
    userName: string;
    event: 'message_sent' | 'message_received' | 'subscription_started' | 'subscription_ended';
    messageId?: string;
    content?: string;
    latency?: number;
    sharedItemType?: 'restaurant' | 'recipe' | 'video';
    sharedItemTitle?: string;
}

/**
 * Automated Chat Testing Service
 * Simulates multi-user interactions to test Supabase realtime chat
 */
export class ChatTestService {
    private subscriptions: Map<string, RealtimeChannel> = new Map();
    private receivedMessages: Map<string, DMMessage[]> = new Map();
    private eventLog: RealtimeEvent[] = [];
    private messageTimestamps: Map<string, number> = new Map();

    /**
     * Check if user is authenticated
     */
    async checkAuthentication(): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                return { 
                    authenticated: false, 
                    error: error?.message || 'No authenticated user found. Please sign in to run tests.' 
                };
            }
            
            return { authenticated: true, userId: user.id };
        } catch (error) {
            return { 
                authenticated: false, 
                error: error instanceof Error ? error.message : 'Authentication check failed' 
            };
        }
    }

    /**
     * Get all available users from the database
     */
    async getAllUsers(): Promise<TestUser[]> {
        // Check authentication first
        const authCheck = await this.checkAuthentication();
        if (!authCheck.authenticated) {
            throw new Error(authCheck.error || 'Authentication required');
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, display_name, username, avatar_url, email')
            .order('display_name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching users:', error);
            throw new Error(`Failed to fetch users: ${error.message} (Code: ${error.code || 'unknown'})`);
        }

        if (!data || data.length === 0) {
            throw new Error('No users found in database');
        }

        return data.map(u => ({
            id: u.id,
            display_name: u.display_name || u.username || 'Unknown',
            username: u.username || '',
            avatar_url: u.avatar_url || undefined,
        }));
    }

    /**
     * Get random test users from the database
     */
    async getTestUsers(count: number = 2): Promise<TestUser[]> {
        // Check authentication first
        const authCheck = await this.checkAuthentication();
        if (!authCheck.authenticated) {
            throw new Error(authCheck.error || 'Authentication required');
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, display_name, username, avatar_url')
            .limit(count * 3); // Get more than needed to ensure we have enough

        if (error) {
            console.error('❌ Error fetching test users:', error);
            throw new Error(`Failed to fetch test users: ${error.message} (Code: ${error.code || 'unknown'})`);
        }

        if (!data || data.length < count) {
            throw new Error(`Not enough users found. Found ${data?.length || 0}, need ${count}`);
        }

        // Return random subset
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Get specific users by IDs
     */
    async getUsersByIds(userIds: string[]): Promise<TestUser[]> {
        const authCheck = await this.checkAuthentication();
        if (!authCheck.authenticated) {
            throw new Error(authCheck.error || 'Authentication required');
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, display_name, username, avatar_url')
            .in('id', userIds);

        if (error) {
            console.error('❌ Error fetching users by IDs:', error);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }

        if (!data || data.length !== userIds.length) {
            throw new Error(`Some users not found. Requested ${userIds.length}, found ${data?.length || 0}`);
        }

        return data.map(u => ({
            id: u.id,
            display_name: u.display_name || u.username || 'Unknown',
            username: u.username || '',
            avatar_url: u.avatar_url || undefined,
        }));
    }

    /**
     * Subscribe to messages as a specific user
     * Returns a promise that resolves when subscription is confirmed
     */
    subscribeAsUser(
        userId: string,
        userName: string,
        conversationId: string,
        onMessage: (message: DMMessage) => void
    ): Promise<() => void> {
        return new Promise((resolve, reject) => {
            const channelName = `test_${userId}_${conversationId}`;

            // Initialize received messages array for this user
            if (!this.receivedMessages.has(userId)) {
                this.receivedMessages.set(userId, []);
            }

            this.logEvent({
                timestamp: Date.now(),
                userId,
                userName,
                event: 'subscription_started',
            });

            const channel = supabase
                .channel(channelName)
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
                        const receiveTime = Date.now();

                        // Calculate latency if we have the send timestamp
                        let latency: number | undefined;
                        const sendTime = this.messageTimestamps.get(message.id);
                        if (sendTime) {
                            latency = receiveTime - sendTime;
                        }

                        this.logEvent({
                            timestamp: receiveTime,
                            userId,
                            userName,
                            event: 'message_received',
                            messageId: message.id,
                            content: message.content || undefined,
                            latency,
                            sharedItemType: message.shared_item?.type,
                            sharedItemTitle: message.shared_item?.title,
                        });

                        // Store received message
                        const userMessages = this.receivedMessages.get(userId) || [];
                        userMessages.push(message);
                        this.receivedMessages.set(userId, userMessages);

                        onMessage(message);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        // Subscription confirmed, resolve with unsubscribe function
                        this.subscriptions.set(channelName, channel);
                        resolve(() => {
                            this.logEvent({
                                timestamp: Date.now(),
                                userId,
                                userName,
                                event: 'subscription_ended',
                            });
                            channel.unsubscribe();
                            this.subscriptions.delete(channelName);
                        });
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        // Subscription failed
                        const error = `Subscription failed with status: ${status}`;
                        console.error('❌ Subscription error:', error);
                        reject(new Error(error));
                    }
                    // Other statuses (SUBSCRIBING, etc.) - wait for SUBSCRIBED
                });

            // Timeout after 5 seconds if subscription doesn't confirm
            setTimeout(() => {
                if (!this.subscriptions.has(channelName)) {
                    reject(new Error('Subscription timeout - did not receive SUBSCRIBED status'));
                }
            }, 5000);
        });
    }

    /**
     * Send a message and track the timestamp
     */
    async sendMessage(
        conversationId: string,
        senderId: string,
        senderName: string,
        content: string
    ): Promise<DMMessage | null> {
        const sendTime = Date.now();

        const result = await DMChatService.sendMessage(conversationId, senderId, content);

        if (result.success && result.data) {
            // Track send timestamp for latency calculation
            this.messageTimestamps.set(result.data.id, sendTime);

            this.logEvent({
                timestamp: sendTime,
                userId: senderId,
                userName: senderName,
                event: 'message_sent',
                messageId: result.data.id,
                content,
            });

            return result.data;
        }

        return null;
    }

    /**
     * Send a shared item and track the timestamp
     */
    async sendSharedItem(
        conversationId: string,
        senderId: string,
        senderName: string,
        sharedItem: SharedItem,
        message?: string
    ): Promise<DMMessage | null> {
        const sendTime = Date.now();

        const result = await DMChatService.shareItem(conversationId, senderId, sharedItem, message);

        if (result.success && result.data) {
            // Track send timestamp for latency calculation
            this.messageTimestamps.set(result.data.id, sendTime);

            this.logEvent({
                timestamp: sendTime,
                userId: senderId,
                userName: senderName,
                event: 'message_sent',
                messageId: result.data.id,
                content: message || `Shared ${sharedItem.type}`,
                sharedItemType: sharedItem.type,
                sharedItemTitle: sharedItem.title,
            });

            return result.data;
        }

        return null;
    }

    /**
     * Wait for a message to be received by a specific user
     */
    async waitForMessage(
        userId: string,
        messageId: string,
        timeout: number = 5000
    ): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const userMessages = this.receivedMessages.get(userId) || [];
            if (userMessages.some(m => m.id === messageId)) {
                return true;
            }
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return false;
    }

    /**
     * Run a basic send/receive test
     */
    async runBasicSendReceiveTest(userIds?: string[]): Promise<TestResult> {
        const startTime = Date.now();
        const result: TestResult = {
            scenario: 'basic_send_receive',
            status: 'running',
        };

        try {
            // Check authentication
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                throw new Error(authCheck.error || 'Authentication required');
            }

            // Get test users (use provided IDs or random)
            const [userA, userB] = userIds 
                ? await this.getUsersByIds(userIds.slice(0, 2))
                : await this.getTestUsers(2);

            // Create conversation
            const convResult = await DMChatService.getOrCreateConversation(userA.id, userB.id);
            if (!convResult.success || !convResult.data) {
                throw new Error('Failed to create conversation');
            }
            const conversationId = convResult.data.id;

            // Subscribe User B to receive messages (wait for confirmation)
            const unsubscribeB = await this.subscribeAsUser(
                userB.id,
                userB.display_name,
                conversationId,
                () => { } // Message handler not needed, we track in receivedMessages
            );

            // Small delay to ensure subscription is fully ready
            await new Promise(resolve => setTimeout(resolve, 200));

            // User A sends a message
            const message = await this.sendMessage(
                conversationId,
                userA.id,
                userA.display_name,
                'Test message from automated test'
            );

            if (!message) {
                throw new Error('Failed to send message');
            }

            // Wait for User B to receive it
            const received = await this.waitForMessage(userB.id, message.id, 5000);

            // Cleanup
            unsubscribeB();

            if (received) {
                const latency = this.getLatencyForMessage(message.id);
                result.status = 'pass';
                result.duration = Date.now() - startTime;
                result.metrics = {
                    messagesSent: 1,
                    messagesReceived: 1,
                    averageLatency: latency,
                };
                result.details = {
                    userA: userA.display_name,
                    userB: userB.display_name,
                    messageId: message.id,
                };
            } else {
                result.status = 'fail';
                result.error = 'Message not received within timeout';
            }
        } catch (error) {
            result.status = 'fail';
            result.error = error instanceof Error ? error.message : 'Unknown error';
        }

        return result;
    }

    /**
     * Run a bidirectional chat test
     */
    async runBidirectionalChatTest(messageCount: number = 5, userIds?: string[]): Promise<TestResult> {
        const startTime = Date.now();
        const result: TestResult = {
            scenario: 'bidirectional_chat',
            status: 'running',
        };

        try {
            // Check authentication
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                throw new Error(authCheck.error || 'Authentication required');
            }

            // Get test users (use provided IDs or random)
            const [userA, userB] = userIds 
                ? await this.getUsersByIds(userIds.slice(0, 2))
                : await this.getTestUsers(2);

            const convResult = await DMChatService.getOrCreateConversation(userA.id, userB.id);
            if (!convResult.success || !convResult.data) {
                throw new Error('Failed to create conversation');
            }
            const conversationId = convResult.data.id;

            // Subscribe both users (wait for confirmation)
            const unsubscribeA = await this.subscribeAsUser(userA.id, userA.display_name, conversationId, () => { });
            const unsubscribeB = await this.subscribeAsUser(userB.id, userB.display_name, conversationId, () => { });

            // Small delay to ensure subscriptions are fully ready
            await new Promise(resolve => setTimeout(resolve, 200));

            const sentMessages: DMMessage[] = [];

            // Send messages alternating between users
            for (let i = 0; i < messageCount; i++) {
                const sender = i % 2 === 0 ? userA : userB;
                const message = await this.sendMessage(
                    conversationId,
                    sender.id,
                    sender.display_name,
                    `Message ${i + 1} from ${sender.display_name}`
                );

                if (message) {
                    sentMessages.push(message);
                }

                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Wait for all messages to be received
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify both users received all messages
            const userAMessages = this.receivedMessages.get(userA.id) || [];
            const userBMessages = this.receivedMessages.get(userB.id) || [];

            const allReceived = sentMessages.every(msg =>
                userAMessages.some(m => m.id === msg.id) &&
                userBMessages.some(m => m.id === msg.id)
            );

            // Cleanup
            unsubscribeA();
            unsubscribeB();

            if (allReceived) {
                const latencies = sentMessages.map(m => this.getLatencyForMessage(m.id)).filter(l => l !== undefined) as number[];
                result.status = 'pass';
                result.duration = Date.now() - startTime;
                result.metrics = {
                    messagesSent: sentMessages.length,
                    messagesReceived: userAMessages.length + userBMessages.length,
                    averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : undefined,
                    maxLatency: latencies.length > 0 ? Math.max(...latencies) : undefined,
                    minLatency: latencies.length > 0 ? Math.min(...latencies) : undefined,
                };
            } else {
                result.status = 'fail';
                result.error = 'Not all messages were received';
            }
        } catch (error) {
            result.status = 'fail';
            result.error = error instanceof Error ? error.message : 'Unknown error';
        }

        return result;
    }

    /**
     * Run a stress test with rapid messages
     */
    async runStressTest(messageCount: number = 20, userIds?: string[]): Promise<TestResult> {
        const startTime = Date.now();
        const result: TestResult = {
            scenario: 'stress_test',
            status: 'running',
        };

        try {
            // Check authentication
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                throw new Error(authCheck.error || 'Authentication required');
            }

            // Get test users (use provided IDs or random)
            const [userA, userB] = userIds 
                ? await this.getUsersByIds(userIds.slice(0, 2))
                : await this.getTestUsers(2);

            const convResult = await DMChatService.getOrCreateConversation(userA.id, userB.id);
            if (!convResult.success || !convResult.data) {
                throw new Error('Failed to create conversation');
            }
            const conversationId = convResult.data.id;

            const unsubscribeB = await this.subscribeAsUser(userB.id, userB.display_name, conversationId, () => { });

            // Small delay to ensure subscription is fully ready
            await new Promise(resolve => setTimeout(resolve, 200));

            // Send messages rapidly
            const sendPromises = [];
            for (let i = 0; i < messageCount; i++) {
                sendPromises.push(
                    this.sendMessage(conversationId, userA.id, userA.display_name, `Stress test message ${i + 1}`)
                );
            }

            const sentMessages = (await Promise.all(sendPromises)).filter(m => m !== null) as DMMessage[];

            // Wait for messages to be received
            await new Promise(resolve => setTimeout(resolve, 3000));

            const userBMessages = this.receivedMessages.get(userB.id) || [];
            const receivedCount = sentMessages.filter(msg =>
                userBMessages.some(m => m.id === msg.id)
            ).length;

            unsubscribeB();

            const successRate = (receivedCount / sentMessages.length) * 100;

            if (successRate >= 95) { // 95% success rate threshold
                const latencies = sentMessages.map(m => this.getLatencyForMessage(m.id)).filter(l => l !== undefined) as number[];
                result.status = 'pass';
                result.duration = Date.now() - startTime;
                result.metrics = {
                    messagesSent: sentMessages.length,
                    messagesReceived: receivedCount,
                    averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : undefined,
                    maxLatency: latencies.length > 0 ? Math.max(...latencies) : undefined,
                    minLatency: latencies.length > 0 ? Math.min(...latencies) : undefined,
                };
                result.details = { successRate: `${successRate.toFixed(1)}%` };
            } else {
                result.status = 'fail';
                result.error = `Only ${successRate.toFixed(1)}% of messages received`;
            }
        } catch (error) {
            result.status = 'fail';
            result.error = error instanceof Error ? error.message : 'Unknown error';
        }

        return result;
    }

    /**
     * Run a shared item test (restaurant, recipe, video)
     */
    async runSharedItemTest(userIds?: string[]): Promise<TestResult> {
        const startTime = Date.now();
        const result: TestResult = {
            scenario: 'shared_item_test',
            status: 'running',
        };

        try {
            // Check authentication
            const authCheck = await this.checkAuthentication();
            if (!authCheck.authenticated) {
                throw new Error(authCheck.error || 'Authentication required');
            }

            // Get test users (use provided IDs or random)
            const [userA, userB] = userIds 
                ? await this.getUsersByIds(userIds.slice(0, 2))
                : await this.getTestUsers(2);

            const convResult = await DMChatService.getOrCreateConversation(userA.id, userB.id);
            if (!convResult.success || !convResult.data) {
                throw new Error('Failed to create conversation');
            }
            const conversationId = convResult.data.id;

            // Subscribe User B to receive messages
            const unsubscribeB = await this.subscribeAsUser(
                userB.id,
                userB.display_name,
                conversationId,
                () => { } // Message handler not needed, we track in receivedMessages
            );

            // Small delay to ensure subscription is fully ready
            await new Promise(resolve => setTimeout(resolve, 200));

            // Create sample shared items
            const restaurantItem = createShareItem.restaurant({
                id: 'rest-test-1',
                name: 'The Garden Bistro',
                image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
                address: 'Brooklyn, NY',
                rating: 4.5,
            });

            const recipeItem = createShareItem.recipe({
                id: 'recipe-test-1',
                title: 'Classic Carbonara',
                image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
                ready_in_minutes: 25,
                servings: 4,
            });

            const videoItem = createShareItem.video({
                id: 'video-test-1',
                title: 'How to Make Perfect Croissants at Home',
                thumbnail_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
                channel_name: 'The Pastry Lab',
                duration: '12:34',
            });

            // Send shared items
            const restaurantMessage = await this.sendSharedItem(
                conversationId,
                userA.id,
                userA.display_name,
                restaurantItem,
                'Check out this restaurant!'
            );

            await new Promise(resolve => setTimeout(resolve, 300));

            const recipeMessage = await this.sendSharedItem(
                conversationId,
                userA.id,
                userA.display_name,
                recipeItem,
                'You should try this recipe'
            );

            await new Promise(resolve => setTimeout(resolve, 300));

            const videoMessage = await this.sendSharedItem(
                conversationId,
                userA.id,
                userA.display_name,
                videoItem,
                'Great cooking tutorial!'
            );

            if (!restaurantMessage || !recipeMessage || !videoMessage) {
                throw new Error('Failed to send one or more shared items');
            }

            // Wait for all messages to be received
            await new Promise(resolve => setTimeout(resolve, 2000));

            const userBMessages = this.receivedMessages.get(userB.id) || [];

            // Verify all messages were received
            const restaurantReceived = userBMessages.some(m => m.id === restaurantMessage.id);
            const recipeReceived = userBMessages.some(m => m.id === recipeMessage.id);
            const videoReceived = userBMessages.some(m => m.id === videoMessage.id);

            // Verify shared_item data structure
            const receivedRestaurantMsg = userBMessages.find(m => m.id === restaurantMessage.id);
            const receivedRecipeMsg = userBMessages.find(m => m.id === recipeMessage.id);
            const receivedVideoMsg = userBMessages.find(m => m.id === videoMessage.id);

            const restaurantDataValid = receivedRestaurantMsg?.shared_item?.type === 'restaurant' &&
                receivedRestaurantMsg.shared_item.id === restaurantItem.id &&
                receivedRestaurantMsg.shared_item.title === restaurantItem.title;

            const recipeDataValid = receivedRecipeMsg?.shared_item?.type === 'recipe' &&
                receivedRecipeMsg.shared_item.id === recipeItem.id &&
                receivedRecipeMsg.shared_item.title === recipeItem.title;

            const videoDataValid = receivedVideoMsg?.shared_item?.type === 'video' &&
                receivedVideoMsg.shared_item.id === videoItem.id &&
                receivedVideoMsg.shared_item.title === videoItem.title;

            unsubscribeB();

            if (restaurantReceived && recipeReceived && videoReceived &&
                restaurantDataValid && recipeDataValid && videoDataValid) {
                const latencies = [
                    restaurantMessage.id,
                    recipeMessage.id,
                    videoMessage.id
                ].map(mid => this.getLatencyForMessage(mid)).filter(l => l !== undefined) as number[];

                result.status = 'pass';
                result.duration = Date.now() - startTime;
                result.metrics = {
                    messagesSent: 3,
                    messagesReceived: 3,
                    averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : undefined,
                    maxLatency: latencies.length > 0 ? Math.max(...latencies) : undefined,
                    minLatency: latencies.length > 0 ? Math.min(...latencies) : undefined,
                };
                result.details = {
                    userA: userA.display_name,
                    userB: userB.display_name,
                    itemsTested: 'restaurant, recipe, video',
                    restaurantReceived: restaurantReceived && restaurantDataValid,
                    recipeReceived: recipeReceived && recipeDataValid,
                    videoReceived: videoReceived && videoDataValid,
                };
            } else {
                result.status = 'fail';
                const failures = [];
                if (!restaurantReceived || !restaurantDataValid) failures.push('restaurant');
                if (!recipeReceived || !recipeDataValid) failures.push('recipe');
                if (!videoReceived || !videoDataValid) failures.push('video');
                result.error = `Failed to receive or validate: ${failures.join(', ')}`;
            }
        } catch (error) {
            result.status = 'fail';
            result.error = error instanceof Error ? error.message : 'Unknown error';
        }

        return result;
    }

    /**
     * Get latency for a specific message
     */
    private getLatencyForMessage(messageId: string): number | undefined {
        const event = this.eventLog.find(
            e => e.messageId === messageId && e.event === 'message_received' && e.latency !== undefined
        );
        return event?.latency;
    }

    /**
     * Log a realtime event
     */
    private logEvent(event: RealtimeEvent): void {
        this.eventLog.push(event);
    }

    /**
     * Get all logged events
     */
    getEventLog(): RealtimeEvent[] {
        return [...this.eventLog];
    }

    /**
     * Get received messages for a user
     */
    getReceivedMessages(userId: string): DMMessage[] {
        return this.receivedMessages.get(userId) || [];
    }

    /**
     * Clear all test data
     */
    clear(): void {
        // Unsubscribe from all channels
        this.subscriptions.forEach(channel => channel.unsubscribe());
        this.subscriptions.clear();
        this.receivedMessages.clear();
        this.eventLog = [];
        this.messageTimestamps.clear();
    }

    /**
     * Cleanup test conversations (optional - use with caution)
     */
    async cleanupTestConversations(conversationIds: string[]): Promise<void> {
        for (const id of conversationIds) {
            // Delete messages first
            await supabase.from('dm_messages').delete().eq('conversation_id', id);
            // Then delete conversation
            await supabase.from('dm_conversations').delete().eq('id', id);
        }
    }
}

export const chatTestService = new ChatTestService();
