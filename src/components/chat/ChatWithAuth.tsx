import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ChatService } from './services/chatService';
import ChatLayout from './components/ChatLayout';

interface ChatWithAuthProps {
  className?: string;
}

export default function ChatWithAuth({ className }: ChatWithAuthProps) {
  const { user, session, loading: authLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const chatService = ChatService.getInstance();

  useEffect(() => {
    if (user && session && !isConnected && !isConnecting) {
      connectToChat();
    } else if (!user && isConnected) {
      disconnectFromChat();
    }
  }, [user, session, isConnected, isConnecting]);

  const connectToChat = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('🔗 ChatWithAuth: Connecting user to chat service');
      
      // Get user profile from main app database
      const profile = await chatService.getUserProfile(user!.id);
      setUserProfile(profile);
      
      // Connect user to Stream Chat
      await chatService.connectUserToChat(user!, profile);
      setIsConnected(true);
      
      console.log('✅ ChatWithAuth: Successfully connected to chat service');
    } catch (error) {
      console.error('❌ ChatWithAuth: Failed to connect to chat service:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to chat');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromChat = async () => {
    try {
      console.log('🔌 ChatWithAuth: Disconnecting from chat service');
      await chatService.disconnectUser();
      setIsConnected(false);
      setUserProfile(null);
      console.log('✅ ChatWithAuth: Disconnected from chat service');
    } catch (error) {
      console.error('❌ ChatWithAuth: Error disconnecting from chat:', error);
    }
  };

  // Show loading state while authenticating or connecting
  if (authLoading || isConnecting) {
    return (
      <div className={`flex items-center justify-center h-screen bg-gray-50 ${className || ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading...' : 'Connecting to chat...'}
          </p>
        </div>
      </div>
    );
  }

  // Show auth required message if not authenticated
  if (!user || !session) {
    return (
      <div className={`flex items-center justify-center h-screen bg-gray-50 ${className || ''}`}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 mb-4">
            Please sign in to access the chat feature
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show error state if connection failed
  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen bg-gray-50 ${className || ''}`}>
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={connectToChat}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show chat interface if connected
  if (isConnected) {
    return (
      <div className={className}>
        <ChatLayout 
          currentUser={user}
          onSignOut={disconnectFromChat}
        />
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className={`flex items-center justify-center h-screen bg-gray-50 ${className || ''}`}>
      <div className="text-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}