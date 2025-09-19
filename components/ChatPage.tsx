import { useEffect, useState } from "react";
import { ChatConversation } from "./chat/ChatConversation";
import { ChatList } from "./chat/ChatList";
import { ChatSearch } from "./chat/ChatSearch";
import {
  MasterBotIntegration,
  useMasterBotChat,
} from "./chat/MasterBotIntegration";
import { NewChatModal } from "./chat/NewChatModal";
import { StreamChatIntegration } from "./chat/StreamChatIntegration";

export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
  type: "text" | "image" | "file";
  status: "sending" | "sent" | "delivered" | "read";
  attachments?: {
    url: string;
    type: string;
    name?: string;
  }[];
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
}

type ChatView =
  | "list"
  | "conversation"
  | "search"
  | "new-chat"
  | "master-bots"
  | "stream-chat";

export function ChatPage() {
  const [currentView, setCurrentView] = useState<ChatView>("list");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: "current-user",
    name: "You",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    online: true,
  });
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Master Bot Integration
  const { activeBotId, showBotChat, startBotChat, closeBotChat } =
    useMasterBotChat();

  // Load conversations from real data source
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call to fetch conversations
      // For now, show empty state
      setConversations([]);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView("conversation");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedConversation(null);
  };

  const handleNewChat = () => {
    setIsNewChatModalOpen(true);
  };

  const handleCloseNewChatModal = () => {
    setIsNewChatModalOpen(false);
  };

  const handleSearch = () => {
    setCurrentView("search");
  };

  const handleMasterBots = () => {
    setCurrentView("master-bots");
  };

  const handleStreamChat = () => {
    setCurrentView("stream-chat");
  };

  const handleBackToMasterBots = () => {
    setCurrentView("master-bots");
  };

  const handleBackToStreamChat = () => {
    setCurrentView("stream-chat");
  };

  // Master Bot Chat Handlers
  const handleStartBotChat = (botId: string) => {
    startBotChat(botId);
    setCurrentView("conversation");
  };

  const handleCloseBotChat = () => {
    closeBotChat();
    setCurrentView("list");
  };

  if (currentView === "conversation" && selectedConversation) {
    return (
      <ChatConversation
        conversation={selectedConversation}
        currentUser={currentUser}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === "search") {
    return (
      <ChatSearch
        conversations={conversations}
        onBack={handleBackToList}
        onConversationSelect={handleConversationSelect}
      />
    );
  }

  if (currentView === "new-chat") {
    return (
      <NewChatModal
        onClose={handleCloseNewChatModal}
        onConversationSelect={handleConversationSelect}
      />
    );
  }

  if (currentView === "master-bots") {
    return (
      <MasterBotIntegration
        onBack={handleBackToList}
        onStartBotChat={handleStartBotChat}
        onStreamChat={handleStreamChat}
      />
    );
  }

  if (currentView === "stream-chat") {
    return (
      <StreamChatIntegration
        onBack={handleBackToMasterBots}
        onStartBotChat={handleStartBotChat}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatList
        conversations={conversations}
        currentUser={currentUser}
        loading={loading}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onSearch={handleSearch}
        onMasterBots={handleMasterBots}
        onStreamChat={handleStreamChat}
      />

      {/* Master Bot Chat Overlay */}
      {showBotChat && activeBotId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md h-96 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Master Bot Chat</h3>
              <button
                onClick={handleCloseBotChat}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4">
              <p className="text-gray-600">
                Chat with Master Bot {activeBotId} coming soon...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <NewChatModal
          onClose={handleCloseNewChatModal}
          onConversationSelect={handleConversationSelect}
        />
      )}
    </div>
  );
}
