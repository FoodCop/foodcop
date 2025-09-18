import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { getAllMasterBots } from "../constants/masterBotsData";
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

  const bots = getAllMasterBots();

  useEffect(() => {
    const initStreamChat = async () => {
      try {
        const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_KEY);

        // For now, we'll use a test user - in production, this would be the actual logged-in user
        const testUser = {
          id: import.meta.env.VITE_TEST_USER_ID || "test_user_123",
          name: "Test User",
        };

        // Generate a token (in production, this should be done server-side)
        const token = client.createToken(testUser.id);

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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedChannel(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Avatar className="w-10 h-10">
              <img
                src={
                  bot?.avatar ||
                  "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=100&h=100&fit=crop&crop=face"
                }
                alt={bot?.name || "Bot"}
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div>
              <h2 className="font-semibold text-[#0B1F3A]">
                {bot?.name || "Bot"}
              </h2>
              <p className="text-sm text-gray-600">
                {bot?.specialty[0] || "Food Expert"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user.id.startsWith("mb_")
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user.id.startsWith("mb_")
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
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim()}
              className="bg-[#F14C35] hover:bg-[#E03A28] text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Channel list
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
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#0B1F3A] mb-3">
              Pending Invites ({pendingInvites.length})
            </h2>
            <div className="space-y-2">
              {pendingInvites.map((channel) => {
                const botId = channel.id
                  .replace("messaging-", "")
                  .split("-")[0];
                const bot = bots.find((b) => b.id === botId);

                return (
                  <Card
                    key={channel.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <img
                          src={
                            bot?.avatar ||
                            "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=100&h=100&fit=crop&crop=face"
                          }
                          alt={bot?.name || "Bot"}
                          className="w-full h-full object-cover"
                        />
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0B1F3A]">
                          {bot?.name || "Bot"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {bot?.specialty[0] || "Food Expert"}
                        </p>
                        <p className="text-xs text-[#F14C35] font-medium">
                          New invite - Click to accept
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-[#F14C35] rounded-full"></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Channels */}
        <div>
          <h2 className="text-lg font-semibold text-[#0B1F3A] mb-3">
            Active Chats
          </h2>
          {channels.length === 0 ? (
            <Card className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active chats yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Run the setup script to get started with bot DMs
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {channels.map((channel) => {
                const botId = channel.id
                  .replace("messaging-", "")
                  .split("-")[0];
                const bot = bots.find((b) => b.id === botId);
                const lastMessage =
                  channel.state.messages[channel.state.messages.length - 1];

                return (
                  <Card
                    key={channel.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <img
                          src={
                            bot?.avatar ||
                            "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=100&h=100&fit=crop&crop=face"
                          }
                          alt={bot?.name || "Bot"}
                          className="w-full h-full object-cover"
                        />
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0B1F3A]">
                          {bot?.name || "Bot"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lastMessage?.text || "No messages yet"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lastMessage
                            ? new Date(
                                lastMessage.created_at
                              ).toLocaleTimeString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <Card className="p-4 mt-6 bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 border-[#F14C35]/20">
          <h3 className="font-semibold text-[#0B1F3A] mb-2">
            Setup Instructions
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            To start chatting with masterbots, run the setup script:
          </p>
          <code className="block bg-gray-100 p-2 rounded text-xs font-mono">
            npm run setup:masterbot-dms
          </code>
        </Card>
      </div>
    </div>
  );
}

