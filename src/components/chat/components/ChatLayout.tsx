import { useState } from 'react';
import { Channel } from 'stream-chat';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

interface ChatLayoutProps {
  currentUser: any;
  onSignOut?: () => void;
}

export default function ChatLayout({ currentUser, onSignOut }: ChatLayoutProps) {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200">
        <Sidebar 
          activeChannel={activeChannel}
          onChannelSelect={setActiveChannel}
          currentUser={currentUser}
          onSignOut={onSignOut}
        />
      </div>
      
      {/* Chat Window */}
      <div className="flex-1">
        {activeChannel ? (
          <ChatWindow 
            channel={activeChannel} 
            currentUser={currentUser}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-4 opacity-20">
                <svg viewBox="0 0 303 172" className="w-full h-full text-gray-400">
                  <path
                    fill="currentColor"
                    d="M229.1 60.5c-4.5-11.8-12.2-21.8-22.1-28.8-9.9-7-21.4-10.8-33.2-10.8H76.2c-11.8 0-23.3 3.8-33.2 10.8-9.9 7-17.6 17-22.1 28.8-2 5.2-3 10.6-3 16.1v65.7c0 5.5 1 10.9 3 16.1 4.5 11.8 12.2 21.8 22.1 28.8 9.9 7 21.4 10.8 33.2 10.8h97.6c11.8 0 23.3-3.8 33.2-10.8 9.9-7 17.6-17 22.1-28.8 2-5.2 3-10.6 3-16.1V76.6c0-5.5-1-10.9-3-16.1zm-24.9 58.5l-42.4 23.1c-1.2.7-2.6 1-4 1s-2.8-.3-4-1l-42.4-23.1c-2.3-1.3-3.7-3.6-3.7-6.2V85.2c0-2.6 1.4-4.9 3.7-6.2l42.4-23.1c1.2-.7 2.6-1 4-1s2.8.3 4 1l42.4 23.1c2.3 1.3 3.7 3.6 3.7 6.2v27.6c0 2.6-1.4 4.9-3.7 6.2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                FUZO Chat
              </h3>
              <p className="text-gray-500">
                Select a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}