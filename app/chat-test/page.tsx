'use client';

import React, { useState } from 'react';
import { ModernChatInterfaceRealData } from '@/components/chat/modern/ModernChatInterfaceWithRealData';
import { ChatIntegrationTest } from '@/components/chat/modern/integration/ChatIntegrationTest';

export default function ChatTestPage() {
  const [showTests, setShowTests] = useState(false);

  return (
    <div className="h-screen w-full">
      {/* Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowTests(!showTests)}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          {showTests ? 'Show Chat' : 'Show Tests'}
        </button>
      </div>

      {showTests ? (
        <div className="h-full p-4 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Phase 7: Real Data Integration Tests</h1>
            <ChatIntegrationTest />
          </div>
        </div>
      ) : (
        <ModernChatInterfaceRealData 
          onContactClick={(contact: any) => console.log('Contact clicked:', contact)}
          onStoryClick={(story: any) => console.log('Story clicked:', story)}
          onNewContact={() => console.log('New contact')}
          onNewGroup={() => console.log('New group')}
          onCamera={() => console.log('Camera')}
        />
      )}
    </div>
  );
}