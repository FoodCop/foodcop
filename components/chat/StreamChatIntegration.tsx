import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useMasterBots } from "../hooks/useMasterBots";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface StreamChatIntegrationProps {
  onBack: () => void;
  onBotSelect: (botId: string) => void;
}

export function StreamChatIntegration({
  onBack,
  onBotSelect,
}: StreamChatIntegrationProps) {
  const [streamClient, setStreamClient] = useState<StreamChat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const { masterBots: bots, loading: botsLoading } = useMasterBots();

  useEffect(() => {
    const initStreamChat = async () => {
      try {
        const apiKey = import.meta.env.VITE_STREAM_CHAT_API_KEY;
        const apiSecret = import.meta.env.VITE_STREAM_CHAT_API_SECRET;

        if (!apiKey) {
          throw new Error("Stream Chat API Key not found");
        }

        // Initialize client with API Key only (for client-side)
        const client = StreamChat.getInstance(apiKey);

        // For now, we'll use a test user - in production, this would be the actual logged-in user
        const testUser = {
          id: import.meta.env.VITE_TEST_USER_ID || "test_user_123",
          name: "Test User",
        };

        // Generate a proper token using the API Secret
        // Note: In production, this should be done server-side for security
        let token: string;

        if (apiSecret) {
          // Use the API Secret to generate a proper token
          const tempClient = StreamChat.getInstance(apiKey, apiSecret);
          token = tempClient.createToken(testUser.id);
        } else {
          // Fallback to development token if no secret available
          console.warn("No API Secret found, using development token");
          token = "development_token_" + testUser.id;
        }

        await client.connectUser(testUser, token);

        setStreamClient(client);
        setIsConnected(true);

        // Auto-accept pending invites
        const pending = await client.queryChannels({ invite: "pending" });
        setPendingInvites(pending);

        for (const ch of pending) {
          await ch.acceptInvite({ message: { text: "Accepted! 👋" } });
        }

        // Load channels
        const allChannels = await client.queryChannels({});
        setChannels(allChannels);

        // Set up message listeners
        client.on("message.new", (event) => {
          if (selectedChannel && event.channel_id === selectedChannel.id) {
            setMessages((prev) => [...prev, event.message]);
          }
        });
      } catch (error) {
        console.error("Stream Chat connection failed:", error);
      }
    };

    initStreamChat();

    return () => {
      if (streamClient) {
        streamClient.disconnectUser();
      }
    };
  }, []);

  const handleChannelSelect = async (channel: any) => {
    setSelectedChannel(channel);

    // Load messages for this channel
    const state = await channel.watch();
    setMessages(state.messages || []);
  };

  const sendMessage = async () => {
    if (!selectedChannel || !messageText.trim()) return;

    try {
      await selectedChannel.sendMessage({
        text: messageText,
      });
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <button
              onClick={onBack}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-[#0B1F3A]">Master Bot DMs</h1>
          </div>
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F14C35] mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to Stream Chat...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedChannel) {
    // Chat interface
    const botId = selectedChannel.id.replace("messaging-", "").split("-")[0];
    const bot = bots.find((b) => b.id === botId);

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedChannel(null)}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Avatar
              src={bot?.avatar_url || ""}
              alt={bot?.bot_name || "Bot"}
              className="w-10 h-10 mr-3"
            />
            <div>
              <h2 className="font-semibold text-[#0B1F3A]">
                {bot?.bot_name || "Bot"}
              </h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 p-4 space-y-4 overflow-y-auto"
          style={{ height: "calc(100vh - 140px)" }}
        >
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${
                message.user?.id?.startsWith("mb_")
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user?.id?.startsWith("mb_")
                    ? "bg-gray-100 text-gray-900"
                    : "bg-[#F14C35] text-white"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35]"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim()}
              className="bg-[#F14C35] hover:bg-[#d63e2a]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[#0B1F3A]">Master Bot DMs</h1>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold text-[#0B1F3A] mb-2">
              Pending Invites
            </h3>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">
                    Invited to {invite.data?.name || "chat"}
                  </span>
                  <span className="text-xs text-green-600">Accepted</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bot Channels */}
        <Card className="p-4">
          <h3 className="font-semibold text-[#0B1F3A] mb-4">Available Bots</h3>
          <div className="space-y-2">
            {channels
              .filter((ch) => ch.data?.name?.includes("Bot"))
              .map((channel) => {
                const botId = channel.id
                  .replace("messaging-", "")
                  .split("-")[0];
                const bot = bots.find((b) => b.id === botId);

                return (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelSelect(channel)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Avatar
                      src={bot?.avatar_url || ""}
                      alt={bot?.bot_name || "Bot"}
                      className="w-10 h-10 mr-3"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-[#0B1F3A]">
                        {bot?.bot_name || channel.data?.name || "Bot"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {bot?.specialties?.join(", ") || "Food expert"}
                      </p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
          </div>
        </Card>

        {/* Create New Chat */}
        <Card className="p-4 mt-4">
          <button
            onClick={() => {
              // For now, just show a message
              alert("Create new chat functionality coming soon!");
            }}
            className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#F14C35] hover:bg-[#F14C35]/5 transition-colors"
          >
            <MessageCircle className="w-5 h-5 mr-2 text-gray-400" />
            <span className="text-gray-600">Start New Conversation</span>
          </button>
        </Card>
      </div>
    </div>
  );
}
