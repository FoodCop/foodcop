import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { DMChatService, DMMessage } from '../services/dmChatService';

interface User {
  id: string;
  display_name: string;
  username: string;
}

export default function TestChatPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sender, setSender] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, username')
        .limit(50);

      if (error) {
        addLog(`❌ Error loading users: ${error.message}`);
      } else {
        setUsers(data || []);
        addLog(`✅ Loaded ${data?.length || 0} users`);
      }
    };
    loadUsers();
  }, []);

  // Start conversation
  const handleStartConversation = async () => {
    if (!sender || !recipient) {
      addLog('⚠️ Select both sender and recipient');
      return;
    }
    if (sender === recipient) {
      addLog('⚠️ Sender and recipient must be different');
      return;
    }

    addLog(`📨 Creating conversation between ${sender.slice(0, 8)}... and ${recipient.slice(0, 8)}...`);
    const result = await DMChatService.getOrCreateConversation(sender, recipient);

    if (result.success && result.data) {
      setConversationId(result.data.id);
      addLog(`✅ Conversation created: ${result.data.id}`);
      // Load existing messages
      const msgResult = await DMChatService.fetchMessages(result.data.id);
      if (msgResult.success && msgResult.data) {
        setMessages(msgResult.data);
        addLog(`📥 Loaded ${msgResult.data.length} existing messages`);
      }
    } else {
      addLog(`❌ Error: ${result.error}`);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!conversationId || !message.trim()) {
      addLog('⚠️ Start a conversation and enter a message first');
      return;
    }

    addLog(`📤 Sending message from ${sender.slice(0, 8)}...`);
    const result = await DMChatService.sendMessage(conversationId, sender, message);

    if (result.success && result.data) {
      setMessages((prev) => [...prev, result.data!]);
      setMessage('');
      addLog(`✅ Message sent!`);
    } else {
      addLog(`❌ Error: ${result.error}`);
    }
  };

  // Send as recipient (swap roles)
  const handleSendAsRecipient = async () => {
    if (!conversationId || !message.trim()) {
      addLog('⚠️ Start a conversation and enter a message first');
      return;
    }

    addLog(`📤 Sending message from ${recipient.slice(0, 8)}... (recipient)`);
    const result = await DMChatService.sendMessage(conversationId, recipient, message);

    if (result.success && result.data) {
      setMessages((prev) => [...prev, result.data!]);
      setMessage('');
      addLog(`✅ Message sent!`);
    } else {
      addLog(`❌ Error: ${result.error}`);
    }
  };

  const getSenderName = (id: string) => users.find((u) => u.id === id)?.display_name || id.slice(0, 8);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 20 }}>🧪 Chat System Test</h1>

      {/* User Selection */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Sender:</label>
          <select
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            style={{ width: '100%', padding: 10, fontSize: 14 }}
          >
            <option value="">Select sender...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name} (@{u.username})
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Recipient:</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{ width: '100%', padding: 10, fontSize: 14 }}
          >
            <option value="">Select recipient...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name} (@{u.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleStartConversation}
        style={{
          padding: '10px 20px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        Start/Load Conversation
      </button>

      {/* Messages */}
      {conversationId && (
        <div style={{ marginBottom: 20 }}>
          <h3>Messages (Conv: {conversationId.slice(0, 8)}...)</h3>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 15,
              maxHeight: 300,
              overflowY: 'auto',
              background: '#f9f9f9',
            }}
          >
            {messages.length === 0 ? (
              <p style={{ color: '#888' }}>No messages yet</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    background: m.sender_id === sender ? '#4f46e5' : '#e5e5e5',
                    color: m.sender_id === sender ? 'white' : 'black',
                    borderRadius: 8,
                    maxWidth: '70%',
                    marginLeft: m.sender_id === sender ? 'auto' : 0,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                    {getSenderName(m.sender_id)}
                  </div>
                  {m.content}
                  {m.shared_item && (
                    <div style={{ marginTop: 5, padding: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 4 }}>
                      📎 {m.shared_item.type}: {m.shared_item.title}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Send Message */}
          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '10px 15px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Send as Sender
            </button>
            <button
              onClick={handleSendAsRecipient}
              style={{
                padding: '10px 15px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Send as Recipient
            </button>
          </div>
        </div>
      )}

      {/* Log */}
      <div>
        <h3>Log</h3>
        <div
          style={{
            background: '#1e1e1e',
            color: '#0f0',
            padding: 15,
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

