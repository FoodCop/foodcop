import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Channel } from "stream-chat";
import { useMasterBots } from "../hooks/useMasterBots";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useAIStreamChat } from "./AIStreamChatProvider";

interface StreamChatIntegrationProps {
  onBack: () => void;
  onBotSelect?: (botId: string) => void;
}

export function StreamChatIntegration({
  onBack,
  onBotSelect,
}: StreamChatIntegrationProps) {
  const [pendingInvites, setPendingInvites] = useState<Channel[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const { masterBots: bots } = useMasterBots();
  const {
    client,
    isConnected,
    isConnecting,
    error,
    queryChannels,
    sendAIMessage,
    aiEnabled,
    toggleAI,
  } = useAIStreamChat();

  // Load channels when connected
  const loadChannels = useCallback(async () => {
    if (!isConnected || !queryChannels) return;

    try {
      // Query channels with proper filters
      const allChannels = await queryChannels(
        { type: "messaging" }, // Valid channel type filter
        [{ last_message_at: -1 }] // Sort by last message
      );
      setChannels(allChannels);

      // Query pending invites with proper filter
      const pending = await queryChannels(
        { type: "messaging", invite: "pending" },
        [{ created_at: -1 }]
      );
      setPendingInvites(pending);

      // Auto-accept pending invites
      for (const ch of pending) {
        try {
          await ch.acceptInvite();
        } catch (err) {
          console.error("Failed to accept invite:", err);
        }
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  }, [isConnected, queryChannels]);

  // Load channels when connected
  useEffect(() => {
    if (isConnected) {
      loadChannels();
    }
  }, [isConnected, loadChannels]);

  // Set up message listeners when client is available
  useEffect(() => {
    if (!client || !isConnected) return;

    const handleNewMessage = (event: any) => {
      if (selectedChannel && event.channel_id === selectedChannel.id) {
        setMessages((prev) => [...prev, event.message]);
      }
    };

    client.on("message.new", handleNewMessage);

    return () => {
      client.off("message.new", handleNewMessage);
    };
  }, [client, isConnected, selectedChannel]);

  const handleChannelSelect = async (channel: Channel) => {
    setSelectedChannel(channel);

    try {
      // Load messages for this channel
      const state = await channel.watch();
      setMessages(state.messages || []);
    } catch (error) {
      console.error("Failed to load channel messages:", error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!selectedChannel || !messageText.trim()) return;

    try {
      // Get bot specialty for AI enhancement
      const botId =
        selectedChannel.id?.replace("messaging-", "").split("-")[0] || "";
      const bot = bots.find((b) => b.id === botId);
      const botSpecialty = bot?.bio || "Food Expert";

      // Use AI-enhanced message sending
      await sendAIMessage(selectedChannel.id!, messageText, botSpecialty);
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

  if (isConnecting) {
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

  if (error) {
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
            <div className="text-red-500 mb-4">Warning</div>
            <p className="text-red-600 mb-4">
              Failed to connect to Stream Chat
            </p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#F14C35] hover:bg-[#d63e2a]"
            >
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="text-gray-500 mb-4">Chat</div>
            <p className="text-gray-600">Stream Chat not connected</p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedChannel) {
    // Chat interface
    const botId =
      selectedChannel.id?.replace("messaging-", "").split("-")[0] || "";
    const bot = bots.find((b) => b.id === botId);

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSelectedChannel(null)}
                className="mr-3 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar className="w-10 h-10 mr-3">
                <img
                  src={bot?.avatar_url || ""}
                  alt={bot?.display_name || "Bot"}
                  className="w-full h-full object-cover"
                />
              </Avatar>
              <div>
                <h2 className="font-semibold text-[#0B1F3A]">
                  {bot?.display_name || "Bot"}
                </h2>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAI}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  aiEnabled
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {aiEnabled ? "AI Bot On" : "AI Bot Off"}
              </button>
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
                    Invited to {invite.id || "chat"}
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
              .filter((ch) => ch.id?.includes("bot"))
              .map((channel) => {
                const botId =
                  channel.id?.replace("messaging-", "")?.split("-")[0] || "";
                const bot = bots.find((b) => b.id === botId);

                return (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelSelect(channel)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Avatar className="w-10 h-10 mr-3">
                      <img
                        src={bot?.avatar_url || ""}
                        alt={bot?.display_name || "Bot"}
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-[#0B1F3A]">
                        {bot?.display_name || "Bot"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {bot?.bio || "Food expert"}
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
