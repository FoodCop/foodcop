"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  user?: {
    email: string;
    display_name: string;
    avatar_url: string;
    username: string;
  };
}

interface Masterbot {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  is_master_bot: boolean;
  is_online: boolean;
}

export function ChatDebug() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [masterbots, setMasterbots] = useState<Masterbot[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [presenceStatus, setPresenceStatus] = useState<{isOnline: boolean; lastSeen: string} | null>(null);
  const { user } = useAuth();

  const loadChatData = useCallback(async () => {
    try {
      const supabase = supabaseBrowser();
      
      console.log('Loading chat data with supabase client:', !!supabase);
      console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      // Load recent messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:users(email, display_name, avatar_url, username)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        console.error('Full error details:', JSON.stringify(messagesError, null, 2));
      } else {
        console.log('Messages loaded successfully:', messagesData?.length || 0);
        setMessages(messagesData || []);
      }

      // Load masterbots
      const { data: botsData, error: botsError } = await supabase
        .from('users')
        .select('*')
        .eq('is_master_bot', true);
      
      if (botsError) {
        console.error('Error loading masterbots:', botsError);
        console.error('Full bot error details:', JSON.stringify(botsError, null, 2));
      } else {
        console.log('Masterbots loaded successfully:', botsData?.length || 0);
        setMasterbots(botsData || []);
      }
    } catch (error) {
      console.error('Error in loadChatData:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const testRealtimeConnection = useCallback(() => {
    const supabase = supabaseBrowser();
    
    const subscription = supabase
      .channel('chat_debug')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          setConnectionStatus('Connected');
          loadChatData(); // Refresh data
        }
      )
      .subscribe((status: string) => {
        setConnectionStatus(status);
      });

    return () => subscription.unsubscribe();
  }, [loadChatData]);

  useEffect(() => {
    loadChatData();
    checkPresenceStatus();
    const unsubscribe = testRealtimeConnection();
    return unsubscribe;
  }, [loadChatData, testRealtimeConnection]);

  const sendTestMessage = async () => {
    if (!user || !newMessage.trim()) return;
    
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          content: `[TEST] ${newMessage.trim()}`,
          is_ai_generated: false
        });
      
      if (error) {
        console.error('Error sending test message:', error);
      } else {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error in sendTestMessage:', error);
    }
  };

  const triggerTestAI = async () => {
    if (masterbots.length === 0) return;
    
    try {
      const supabase = supabaseBrowser();
      const randomBot = masterbots[Math.floor(Math.random() * masterbots.length)];
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: randomBot.id,
          content: `Hello! I'm ${randomBot.display_name}. What food questions do you have?`,
          is_ai_generated: true,
          ai_model: 'test'
        });
        
      if (error) {
        console.error('Error triggering test AI:', error);
      }
    } catch (error) {
      console.error('Error in triggerTestAI:', error);
    }
  };

  const checkPresenceStatus = async () => {
    try {
      const response = await fetch('/api/user/presence');
      const data = await response.json();
      
      if (data.success) {
        setPresenceStatus({
          isOnline: data.isOnline,
          lastSeen: data.lastSeen
        });
      } else {
        console.error('Error checking presence:', data.error);
      }
    } catch (error) {
      console.error('Error checking presence:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        <p>Loading chat debug information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Real-time Connection</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm">Status: {connectionStatus}</span>
        </div>
      </div>

      {/* Presence Status */}
      <div className="bg-gray-100 p-4 rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Your Presence Status</h3>
          <button 
            onClick={checkPresenceStatus}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        {presenceStatus ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                presenceStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm">
                {presenceStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Last seen: {new Date(presenceStatus.lastSeen).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Click refresh to check status</p>
        )}
      </div>

      {/* Masterbots Status */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Masterbots ({masterbots.length})</h3>
        <div className="space-y-2">
          {masterbots.map(bot => (
            <div key={bot.id} className="flex items-center space-x-3 text-sm">
              {bot.avatar_url ? (
                <div className="w-6 h-6 relative">
                  <Image
                    src={bot.avatar_url}
                    alt={bot.display_name}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {bot.display_name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
              )}
              <span className="font-medium">{bot.display_name}</span>
              <span className="text-gray-600">@{bot.username}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                bot.is_online 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {bot.is_online ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Recent Messages ({messages.length})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className="text-sm border-b pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {msg.user?.display_name || msg.user?.email || 'Unknown'}
                </span>
                {msg.is_ai_generated && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    AI
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-700 mt-1">{msg.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Test Controls</h3>
        <div className="space-y-3">
          {/* Send Test Message */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Test message..."
              className="flex-1 p-2 border rounded text-sm"
            />
            <button
              onClick={sendTestMessage}
              disabled={!user || !newMessage.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300"
            >
              Send Test
            </button>
          </div>

          {/* Trigger AI Response */}
          <button
            onClick={triggerTestAI}
            disabled={masterbots.length === 0}
            className="w-full p-2 bg-purple-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            Trigger Random Masterbot Response
          </button>

          {/* Refresh Data */}
          <button
            onClick={loadChatData}
            className="w-full p-2 bg-gray-500 text-white rounded text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Current User Info */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Current User</h3>
        {user ? (
          <div className="text-sm">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Display Name:</strong> {(user as any)?.user_metadata?.display_name || 'Not set'}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Not authenticated</p>
        )}
      </div>

      {/* Database Info */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Database Info</h3>
        <div className="text-sm space-y-1">
          <p><strong>Table:</strong> chat_messages</p>
          <p><strong>Realtime:</strong> Enabled</p>
          <p><strong>RLS:</strong> Enabled</p>
          <p><strong>Policies:</strong> SELECT (all), INSERT/UPDATE/DELETE (own messages)</p>
        </div>
      </div>
    </div>
  );
}
