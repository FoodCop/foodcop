import { useState } from "react";
import { FriendsList, Friend } from "./components/FriendsList";
import { ChatInterface, Message } from "./components/ChatInterface";

const CURRENT_USER_ID = "user-1";

const mockFriends: Friend[] = [
  {
    id: "friend-1",
    name: "Alice Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    lastMessage: "See you tomorrow!",
    timestamp: "2:30 PM",
    online: true,
  },
  {
    id: "friend-2",
    name: "Bob Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    lastMessage: "Thanks for the help",
    timestamp: "1:15 PM",
    online: false,
  },
  {
    id: "friend-3",
    name: "Carol Williams",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    lastMessage: "That sounds great!",
    timestamp: "Yesterday",
    online: true,
  },
  {
    id: "friend-4",
    name: "David Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    lastMessage: "Let me know when you're free",
    timestamp: "Yesterday",
    online: false,
  },
];

const initialMessages: Record<string, Message[]> = {
  "friend-1": [
    {
      id: "1",
      senderId: "friend-1",
      text: "Hey! How are you doing?",
      timestamp: new Date(2025, 9, 20, 14, 10),
    },
    {
      id: "2",
      senderId: CURRENT_USER_ID,
      text: "I'm doing great! How about you?",
      timestamp: new Date(2025, 9, 20, 14, 15),
    },
    {
      id: "3",
      senderId: "friend-1",
      text: "Pretty good! Are we still on for tomorrow?",
      timestamp: new Date(2025, 9, 20, 14, 20),
    },
    {
      id: "4",
      senderId: CURRENT_USER_ID,
      text: "Absolutely! Looking forward to it.",
      timestamp: new Date(2025, 9, 20, 14, 25),
    },
    {
      id: "5",
      senderId: "friend-1",
      text: "See you tomorrow!",
      timestamp: new Date(2025, 9, 20, 14, 30),
    },
  ],
  "friend-2": [
    {
      id: "1",
      senderId: "friend-2",
      text: "Thanks for the help earlier",
      timestamp: new Date(2025, 9, 20, 13, 15),
    },
    {
      id: "2",
      senderId: CURRENT_USER_ID,
      text: "No problem! Happy to help anytime.",
      timestamp: new Date(2025, 9, 20, 13, 20),
    },
  ],
  "friend-3": [
    {
      id: "1",
      senderId: CURRENT_USER_ID,
      text: "What do you think about meeting up this weekend?",
      timestamp: new Date(2025, 9, 19, 10, 30),
    },
    {
      id: "2",
      senderId: "friend-3",
      text: "That sounds great!",
      timestamp: new Date(2025, 9, 19, 10, 45),
    },
  ],
  "friend-4": [
    {
      id: "1",
      senderId: "friend-4",
      text: "Let me know when you're free",
      timestamp: new Date(2025, 9, 19, 15, 0),
    },
  ],
};

export default function App() {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [showChat, setShowChat] = useState(false);

  const selectedFriend = mockFriends.find((f) => f.id === selectedFriendId);

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    setShowChat(true);
  };

  const handleBackToFriends = () => {
    setShowChat(false);
  };

  const handleSendMessage = (text: string, files?: File[]) => {
    if (!selectedFriendId) return;

    const media = files?.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }));

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: CURRENT_USER_ID,
      text,
      timestamp: new Date(),
      media: media && media.length > 0 ? media : undefined,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedFriendId]: [...(prev[selectedFriendId] || []), newMessage],
    }));
  };

  return (
    <div className="h-screen flex">
      {/* Friends List - Hidden on mobile when chat is open, always visible on desktop */}
      <div className={`w-full md:w-80 ${showChat ? 'hidden md:block' : 'block'}`}>
        <FriendsList
          friends={mockFriends}
          selectedFriendId={selectedFriendId || undefined}
          onSelectFriend={handleSelectFriend}
        />
      </div>
      
      {/* Chat Interface - Hidden on mobile when friends list is open, always visible on desktop */}
      <div className={`w-full md:flex-1 ${showChat ? 'block' : 'hidden md:block'}`}>
        {selectedFriend ? (
          <ChatInterface
            friend={selectedFriend}
            messages={selectedFriendId ? messages[selectedFriendId] || [] : []}
            currentUserId={CURRENT_USER_ID}
            onSendMessage={handleSendMessage}
            onBack={handleBackToFriends}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Welcome to FUZO Chat</h3>
              <p className="text-gray-500 mb-4">
                Connect with your friends and Master Bots. Select a friend to start chatting, or manage your friend list to find new connections.
              </p>
              <div className="text-sm text-gray-400">
                <p>• Chat with AI-powered Master Bots for food recommendations</p>
                <p>• Connect with friends to share your food discoveries</p>
                <p>• Share restaurants and recipes in your conversations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
