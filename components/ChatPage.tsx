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

  // Master Bot Integration
  const { activeBotId, showBotChat, startBotChat, closeBotChat } =
    useMasterBotChat();

  // Mock data for demonstration
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: "conv-1",
        participants: [
          currentUser,
          {
            id: "user-1",
            name: "Sarah Chen",
            avatar:
              "https://images.unsplash.com/photo-1494790108755-2616b381b5d4?w=100&h=100&fit=crop&crop=face",
            online: true,
          },
        ],
        lastMessage: {
          id: "msg-1",
          text: "That ramen place you recommended was amazing! 🍜",
          userId: "user-1",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          type: "text",
          status: "read",
        },
        unreadCount: 2,
        updatedAt: new Date(Date.now() - 5 * 60 * 1000),
        type: "direct",
      },
      {
        id: "conv-2",
        participants: [
          currentUser,
          {
            id: "user-2",
            name: "Marcus Rodriguez",
            avatar:
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
            online: false,
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
        lastMessage: {
          id: "msg-2",
          text: "Want to check out that new pizza spot this weekend?",
          userId: "current-user",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: "text",
          status: "read",
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "direct",
      },
      {
        id: "conv-3",
        participants: [
          currentUser,
          {
            id: "user-3",
            name: "Emma Thompson",
            avatar:
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
            online: true,
          },
          {
            id: "user-4",
            name: "Alex Kim",
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
            online: false,
          },
        ],
        lastMessage: {
          id: "msg-3",
          text: "Group dinner plans are set! 🎉",
          userId: "user-3",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          type: "text",
          status: "delivered",
        },
        unreadCount: 1,
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        type: "group",
        name: "Foodie Squad",
        avatar: "🍽️",
      },
      {
        id: "conv-4",
        participants: [
          currentUser,
          {
            id: "user-5",
            name: "David Park",
            avatar:
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
            online: true,
          },
        ],
        lastMessage: {
          id: "msg-4",
          text: "Thanks for the restaurant recommendation!",
          userId: "user-5",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          type: "text",
          status: "read",
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: "direct",
      },
    ];

    setConversations(mockConversations);
  }, [currentUser]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView("conversation");

    // Mark messages as read
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      )
    );
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedConversation(null);
  };

  const handleOpenSearch = () => {
    setCurrentView("search");
  };

  const handleBackToListFromSearch = () => {
    setCurrentView("list");
  };

  const handleNewChat = () => {
    setIsNewChatModalOpen(true);
  };

  const handleStartNewConversation = (user: User) => {
    // Check if conversation already exists
    const existingConv = conversations.find(
      (conv) =>
        conv.type === "direct" &&
        conv.participants.some((p) => p.id === user.id)
    );

    if (existingConv) {
      handleSelectConversation(existingConv);
    } else {
      // Create new conversation
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        participants: [currentUser, user],
        unreadCount: 0,
        updatedAt: new Date(),
        type: "direct",
      };

      setConversations((prev) => [newConversation, ...prev]);
      handleSelectConversation(newConversation);
    }

    setIsNewChatModalOpen(false);
  };

  const handleMasterBotsView = () => {
    setCurrentView("master-bots");
  };

  const handleBackFromMasterBots = () => {
    setCurrentView("list");
  };

  const handleStreamChatView = () => {
    setCurrentView("stream-chat");
  };

  const handleBackFromStreamChat = () => {
    setCurrentView("list");
  };

  // If master bot chat is active, show it
  if (showBotChat) {
    return (
      <div className="min-h-screen bg-background">
        <MasterBotIntegration
          showChatInterface={true}
          currentBotId={activeBotId || undefined}
          onCloseBotChat={closeBotChat}
        />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "list":
        return (
          <ChatList
            conversations={conversations}
            currentUser={currentUser}
            onSelectConversation={handleSelectConversation}
            onOpenSearch={handleOpenSearch}
            onNewChat={handleNewChat}
            onMasterBots={handleMasterBotsView}
            onStreamChat={handleStreamChatView}
          />
        );

      case "conversation":
        return selectedConversation ? (
          <ChatConversation
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={handleBackToList}
          />
        ) : null;

      case "search":
        return (
          <ChatSearch
            currentUser={currentUser}
            onBack={handleBackToListFromSearch}
            onStartConversation={handleStartNewConversation}
          />
        );

      case "master-bots":
        return (
          <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBackFromMasterBots}
                  className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                >
                  ←
                </button>
                <h1 className="text-xl font-bold text-[#0B1F3A]">
                  Master Bot League
                </h1>
              </div>
              <MasterBotIntegration
                onBotSelect={startBotChat}
                showChatInterface={false}
              />
            </div>
          </div>
        );

      case "stream-chat":
        return (
          <StreamChatIntegration
            onBack={handleBackFromStreamChat}
            onBotSelect={startBotChat}
          />
        );

      default:
        return (
          <ChatList
            conversations={conversations}
            currentUser={currentUser}
            onSelectConversation={handleSelectConversation}
            onOpenSearch={handleOpenSearch}
            onNewChat={handleNewChat}
            onMasterBots={handleMasterBotsView}
            onStreamChat={handleStreamChatView}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}

      {isNewChatModalOpen && (
        <NewChatModal
          isOpen={isNewChatModalOpen}
          onClose={() => setIsNewChatModalOpen(false)}
          onStartConversation={handleStartNewConversation}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
