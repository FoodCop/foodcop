import type { AppItem } from './appItem';
import type { FriendRelationshipState } from '../lib/services/friendRequestService';

export type ChatMessageStatus = 'sending' | 'sent' | 'read' | 'error';

export interface ChatFriend {
  id: string | number;
  name: string;
  avatar: string;
  username?: string;
  email?: string;
  time?: string;
  isOnline?: boolean;
  online?: boolean;
  lastSeen?: string | null;
  unreadCount?: number;
  requestStatus?: FriendRelationshipState;
  requestId?: string;
  type?: 'dm';
}

export interface ChatGroup {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  memberCount?: number;
  type: 'group';
}

export type ChatInboxItem = ChatFriend | ChatGroup;

export interface ChatUiMessage {
  id: string;
  role: 'user' | 'ai';
  senderId?: string;
  senderName?: string;
  type: 'text' | 'share' | 'event';
  text: string;
  item?: AppItem | null;
  status?: ChatMessageStatus;
}
