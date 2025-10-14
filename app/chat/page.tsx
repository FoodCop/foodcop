'use client';

import { ChatDebug } from "@/components/debug/ChatDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { ChatInterface } from "@/components/chat/modern/ChatInterface";
import { ChatContact, UserStory } from "@/components/chat/modern/utils/ChatTypes";

export default function ChatPage() {
  const handleContactClick = (contact: ChatContact) => {
    console.log('Contact clicked:', contact);
    // TODO: Navigate to individual chat
  };

  const handleStoryClick = (story: UserStory) => {
    console.log('Story clicked:', story);
    // TODO: Open story viewer
  };

  const handleNewContact = () => {
    console.log('New contact clicked');
    // TODO: Open new contact dialog
  };

  const handleNewGroup = () => {
    console.log('New group clicked');
    // TODO: Open new group dialog
  };

  const handleCamera = () => {
    console.log('Camera clicked');
    // TODO: Open camera interface
  };

  return (
    <main className="h-screen">
      {/* Modern Chat Interface */}
      <ChatInterface
        onContactClick={handleContactClick}
        onStoryClick={handleStoryClick}
        onNewContact={handleNewContact}
        onNewGroup={handleNewGroup}
        onCamera={handleCamera}
      />
      
      {/* Debug Section - Hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50">
          <details className="cursor-pointer">
            <summary className="font-semibold text-sm mb-2">Debug Info</summary>
            <div className="space-y-2 text-xs">
              <SimpleUserStatus />
              <ChatDebug />
            </div>
          </details>
        </div>
      )}
    </main>
  );
}
