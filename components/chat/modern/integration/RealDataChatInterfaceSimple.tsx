'use client';

import React, { useState, useEffect } from 'react';
import { useChatAuth } from './ChatAuthProvider';
import { ChatHeader } from '../headers/ChatHeader';
import { StoriesBar } from '../lists/StoriesBar';
import { ContactsList } from '../lists/ContactsList';
import { ChatFloatingActions } from '../lists/ChatFloatingActions';
import { ChatConversationView } from '../conversations/ChatConversationView';
import { ChatContact, UserStory, Message, Conversation } from '../utils/ChatTypes';
import { filterContacts, sortContactsByLastMessage } from '../utils/ChatUtils';

interface RealDataChatInterfaceProps {
  onContactClick?: (contact: ChatContact) => void;
  onStoryClick?: (story: UserStory) => void;
  onNewContact?: () => void;
  onNewGroup?: () => void;
  onCamera?: () => void;
  className?: string;
}

export function RealDataChatInterface({
  onContactClick,
  onStoryClick,
  onNewContact,
  onNewGroup,
  onCamera,
  className = ''
}: RealDataChatInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const { 
    user: chatUser, 
    isLoading: userLoading, 
    error: userError,
    loadContacts, 
    loadMessages, 
    sendMessage, 
    loadStories,
    subscribeToMessages 
  } = useChatAuth();

  // Load contacts when component mounts or user changes
  useEffect(() => {
    async function fetchContacts() {
      if (!chatUser) return;
      
      setIsLoadingContacts(true);
      try {
        const contactsData = await loadContacts();
        setContacts(sortContactsByLastMessage(contactsData));
        
        // Calculate unread notifications
        const unreadCount = contactsData.reduce((total: number, contact: ChatContact) => total + contact.unread_count, 0);
        setUnreadNotifications(unreadCount);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    }

    fetchContacts();
  }, [chatUser, loadContacts]);

  // Load stories when user changes
  useEffect(() => {
    async function fetchStories() {
      if (!chatUser) return;
      
      try {
        const storiesData = await loadStories();
        setStories(storiesData);
      } catch (error) {
        console.error('Error loading stories:', error);
      }
    }

    fetchStories();
  }, [chatUser, loadStories]);

  // Filter contacts based on search query
  const filteredContacts = filterContacts(contacts, searchQuery);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'notifications':
        console.log('Open notifications');
        break;
      case 'menu':
        console.log('Open menu');
        break;
      case 'settings':
        console.log('Open settings');
        break;
      case 'new-group':
        onNewGroup?.();
        break;
      case 'new-contact':
        onNewContact?.();
        break;
      default:
        console.log('Menu action:', action);
    }
  };

  const handleContactClick = async (contact: ChatContact) => {
    setSelectedContact(contact);
    setIsLoadingMessages(true);
    
    try {
      // Create room ID for private chat
      const roomId = `private_${[chatUser?.id, contact.id].sort().join('_')}`;
      const messages = await loadMessages(roomId);
      setConversationMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setConversationMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
    
    onContactClick?.(contact);
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
    setConversationMessages([]);
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'restaurant' | 'recipe' = 'text') => {
    if (!selectedContact || !chatUser || !content.trim()) return;

    // Create room ID for private chat
    const roomId = `private_${[chatUser.id, selectedContact.id].sort().join('_')}`;
    
    try {
      const newMessage = await sendMessage(content, roomId, type);
      if (newMessage) {
        setConversationMessages(prev => [...prev, newMessage]);
        
        // Update the contact's last message
        setContacts(prev => prev.map(contact => 
          contact.id === selectedContact.id 
            ? {
                ...contact,
                last_message: {
                  content,
                  timestamp: newMessage.timestamp,
                  sender_id: chatUser.id,
                  type
                }
              }
            : contact
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReaction = (messageId: string, reaction: string) => {
    // TODO: Implement message reactions with real API
    setConversationMessages(prev => prev.map(message => {
      if (message.id === messageId) {
        const existingReactions = message.reactions || [];
        const userReaction = existingReactions.find((r: any) => r.user_id === chatUser?.id);
        
        if (userReaction) {
          // Update existing reaction or remove if same
          if (userReaction.emoji === reaction) {
            return {
              ...message,
              reactions: existingReactions.filter((r: any) => r.user_id !== chatUser?.id)
            };
          } else {
            return {
              ...message,
              reactions: existingReactions.map((r: any) => 
                r.user_id === chatUser?.id ? { ...r, emoji: reaction } : r
              )
            };
          }
        } else {
          // Add new reaction
          return {
            ...message,
            reactions: [...existingReactions, {
              user_id: chatUser?.id || '',
              user_name: chatUser?.display_name || '',
              emoji: reaction,
              timestamp: new Date().toISOString()
            }]
          };
        }
      }
      return message;
    }));
  };

  const handleStoryClick = (story: UserStory) => {
    onStoryClick?.(story);
  };

  const handleAddStory = () => {
    console.log('Add story clicked');
    // TODO: Implement story creation
  };

  const handleCameraClick = () => {
    onCamera?.();
  };

  const handleNewContact = () => {
    onNewContact?.();
  };

  const handleNewGroup = () => {
    onNewGroup?.();
  };

  const handleNewChat = () => {
    console.log('New chat clicked');
    // TODO: Implement new chat creation
  };

  // Subscribe to real-time messages when a contact is selected
  useEffect(() => {
    if (!selectedContact || !chatUser) return;

    const roomId = `private_${[chatUser.id, selectedContact.id].sort().join('_')}`;
    const unsubscribe = subscribeToMessages(roomId, (newMessage: Message) => {
      // Only add message if it's not from current user (avoid duplicates)
      if (newMessage.sender_id !== chatUser.id) {
        setConversationMessages(prev => [...prev, newMessage]);
      }
    });

    return unsubscribe;
  }, [selectedContact, chatUser, subscribeToMessages]);

  // Loading state
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Chat</h3>
          <p className="text-gray-600">Setting up your chat experience...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (userError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Chat</h3>
          <p className="text-gray-600">{userError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!chatUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 text-4xl">💬</div>
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-600">Please sign in to access the chat system.</p>
        </div>
      </div>
    );
  }

  // Show conversation view if a contact is selected
  if (selectedContact) {
    const mockConversation: Conversation = {
      id: `${chatUser.id}-${selectedContact.id}`,
      type: 'individual',
      name: selectedContact.name,
      participants: [chatUser.id, selectedContact.id],
      avatar_url: selectedContact.avatar_url,
      last_message: conversationMessages[conversationMessages.length - 1],
      unread_count: 0,
      muted: false,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return (
      <div className={`h-screen flex flex-col bg-white ${className}`}>
        <ChatConversationView
          conversation={mockConversation}
          currentUser={{
            id: chatUser.id,
            name: chatUser.display_name,
            username: chatUser.username,
            avatar_url: chatUser.avatar_url,
            last_message: {
              content: '',
              timestamp: new Date().toISOString(),
              sender_id: chatUser.id,
              type: 'text'
            },
            unread_count: 0,
            is_online: chatUser.is_online,
            last_seen: chatUser.last_seen,
            story_active: false
          }}
          otherUser={selectedContact}
          messages={conversationMessages}
          onSendMessage={handleSendMessage}
          onReaction={handleReaction}
          onBack={handleBackToContacts}
          isTyping={isTyping}
          typingUser={selectedContact.name}
        />
      </div>
    );
  }

  // Main chat interface
  return (
    <div className={`h-screen flex flex-col bg-white ${className}`}>
      {/* Header - simplified to match existing interface */}
      <ChatHeader
        onSearchChange={handleSearchChange}
        onMenuAction={handleMenuAction}
        unreadNotifications={unreadNotifications}
      />

      {/* Stories Bar - simplified to match existing interface */}
      <StoriesBar
        stories={stories}
        onStoryClick={handleStoryClick}
        onAddStoryClick={handleAddStory}
        currentUserId={chatUser.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Contacts List */}
        <div className="flex-1 overflow-hidden">
          <ContactsList
            contacts={filteredContacts}
            onContactClick={handleContactClick}
            onCameraClick={handleCameraClick}
            searchQuery={searchQuery}
          />
          
          {/* Loading state for contacts */}
          {isLoadingContacts && contacts.length === 0 && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-600">Loading your contacts...</p>
              </div>
            </div>
          )}
          
          {/* No contacts state */}
          {!isLoadingContacts && contacts.length === 0 && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 text-4xl">👥</div>
                <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
                <p className="text-gray-600 mb-4">Start connecting with people to begin chatting!</p>
                <button 
                  onClick={handleNewContact}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Friends
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Actions */}
        <ChatFloatingActions
          onNewContact={handleNewContact}
          onNewGroup={handleNewGroup}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}