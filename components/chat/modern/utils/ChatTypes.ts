// Modern Chat System TypeScript Definitions
// Based on Figma Design System and existing FUZO infrastructure

export interface ChatContact {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  last_message: {
    content: string;
    timestamp: string;
    sender_id: string;
    type: 'text' | 'image' | 'voice' | 'video' | 'file';
  };
  unread_count: number;
  is_online: boolean;
  last_seen: string;
  story_active: boolean;
  is_group?: boolean;
  group_member_count?: number;
  is_master_bot?: boolean;
}

export interface UserStory {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string;
  story_count: number;
  last_story_time: string;
  viewed: boolean;
  is_close_friend: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'file';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reply_to?: string;
  reactions?: MessageReaction[];
  media_url?: string;
  media_metadata?: {
    duration?: number;
    size?: number;
    dimensions?: { width: number; height: number };
    filename?: string;
  };
}

export interface MessageReaction {
  emoji: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  type: 'individual' | 'group';
  name: string;
  avatar_url?: string;
  participants: string[];
  last_message?: Message;
  unread_count: number;
  muted: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Group-specific fields
  group_description?: string;
  group_admin_ids?: string[];
  group_settings?: {
    allow_members_to_add: boolean;
    allow_members_to_edit_info: boolean;
    show_member_add_history: boolean;
  };
}

export interface ChatUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  email: string;
  is_online: boolean;
  last_seen: string;
  status_message?: string;
  privacy_settings: {
    show_online_status: boolean;
    show_last_seen: boolean;
    show_read_receipts: boolean;
  };
}

export interface TypingStatus {
  user_id: string;
  user_name: string;
  conversation_id: string;
  timestamp: string;
}

// Tab types for conversation view
export type ConversationTab = 'CHAT' | 'GALLERY' | 'ABOUT';

// Theme colors from Figma design
export const CHAT_COLORS = {
  primary: 'linear-gradient(135deg, #FF6B35, #F7931E)',
  secondary: '#FF6B35',
  accent: '#F7931E',
  background: '#FEFFFA',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  online: '#4CAF50',
  offline: '#BDBDBD',
  unread: '#FF3B30',
  divider: '#E5E5E5',
} as const;

// Chat event types for real-time updates
export type ChatEventType = 
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'user_typing'
  | 'user_stopped_typing'
  | 'user_online'
  | 'user_offline'
  | 'conversation_created'
  | 'conversation_updated'
  | 'member_added'
  | 'member_removed';

export interface ChatEvent {
  type: ChatEventType;
  conversation_id: string;
  user_id: string;
  data: any;
  timestamp: string;
}

// Mock data for development and testing
export const MOCK_STORIES: UserStory[] = [
  {
    id: '1',
    user_id: 'user1',
    user_name: 'Peter',
    avatar_url: '/api/placeholder/100/100',
    story_count: 3,
    last_story_time: '2025-10-11T23:10:00Z',
    viewed: false,
    is_close_friend: true,
  },
  {
    id: '2',
    user_id: 'user2', 
    user_name: 'Catherine',
    avatar_url: '/api/placeholder/100/100',
    story_count: 1,
    last_story_time: '2025-10-11T22:30:00Z',
    viewed: false,
    is_close_friend: false,
  },
  {
    id: '3',
    user_id: 'user3',
    user_name: 'F.R.I.E.N.D.S',
    avatar_url: '/api/placeholder/100/100',
    story_count: 2,
    last_story_time: '2025-10-11T20:15:00Z',
    viewed: true,
    is_close_friend: false,
  },
];

export const MOCK_CONTACTS: ChatContact[] = [
  {
    id: 'contact1',
    name: 'Peter',
    username: 'peter_foodie',
    avatar_url: '/api/placeholder/100/100',
    last_message: {
      content: 'Good morning Babe 😘😘',
      timestamp: '2025-10-11T23:10:00Z',
      sender_id: 'contact1',
      type: 'text',
    },
    unread_count: 2,
    is_online: true,
    last_seen: '2025-10-11T23:10:00Z',
    story_active: true,
  },
  {
    id: 'contact2',
    name: 'Catherine Piaz',
    username: 'catherine_chef',
    avatar_url: '/api/placeholder/100/100',
    last_message: {
      content: 'Hey!!',
      timestamp: '2025-10-11T23:10:00Z',
      sender_id: 'contact2',
      type: 'text',
    },
    unread_count: 1,
    is_online: true,
    last_seen: '2025-10-11T23:05:00Z',
    story_active: true,
  },
  {
    id: 'contact3',
    name: 'F.R.I.E.N.D.S',
    username: 'friends_group',
    avatar_url: '/api/placeholder/100/100',
    last_message: {
      content: 'Where are you Lara !!',
      timestamp: '2025-10-11T22:10:00Z',
      sender_id: 'contact4',
      type: 'text',
    },
    unread_count: 3,
    is_online: false,
    last_seen: '2025-10-11T22:10:00Z',
    story_active: true,
    is_group: true,
    group_member_count: 6,
  },
  {
    id: 'contact4',
    name: 'Ron',
    username: 'ron_burger',
    avatar_url: '/api/placeholder/100/100',
    last_message: {
      content: 'No mention!!',
      timestamp: '2025-10-11T17:30:00Z',
      sender_id: 'contact4',
      type: 'text',
    },
    unread_count: 0,
    is_online: false,
    last_seen: '2025-10-11T18:00:00Z',
    story_active: false,
  },
  {
    id: 'contact5',
    name: 'Lexi',
    username: 'lexi_sweets',
    avatar_url: '/api/placeholder/100/100',
    last_message: {
      content: 'Okay',
      timestamp: '2025-10-11T17:30:00Z',
      sender_id: 'current_user',
      type: 'text',
    },
    unread_count: 0,
    is_online: false,
    last_seen: '2025-10-11T18:30:00Z',
    story_active: false,
  },
  {
    id: 'contact6',
    name: 'Angelina',
    username: 'angel_baker',
    avatar_url: '/api/placeholder/100/100',
    last_message: {
      content: 'Bye',
      timestamp: '2025-10-11T17:30:00Z',
      sender_id: 'contact6',
      type: 'text',
    },
    unread_count: 0,
    is_online: false,
    last_seen: '2025-10-11T19:00:00Z',
    story_active: false,
  },
];

// Mock conversation messages for testing
export const MOCK_MESSAGES: { [contactId: string]: Message[] } = {
  contact1: [
    {
      id: 'msg1',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'contact1',
      sender_name: 'Peter',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Hwjdjgdj huyy sjdguy',
      type: 'text',
      timestamp: '2025-10-11T09:00:00Z',
      status: 'read',
    },
    {
      id: 'msg2',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'contact1',
      sender_name: 'Peter',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Duis aute irure dolor in efefefff reprehenderit in',
      type: 'text',
      timestamp: '2025-10-11T09:05:00Z',
      status: 'read',
    },
    {
      id: 'msg3',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'contact1',
      sender_name: 'Peter',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Godcasc sdvsdvvds',
      type: 'text',
      timestamp: '2025-10-11T10:00:00Z',
      status: 'read',
    },
    {
      id: 'msg4',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'current_user',
      sender_name: 'You',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt et dolore magna aliqua.',
      type: 'text',
      timestamp: '2025-10-11T10:30:00Z',
      status: 'read',
    },
    {
      id: 'msg5',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'current_user',
      sender_name: 'You',
      content: 'Okay',
      type: 'text',
      timestamp: '2025-10-11T11:00:00Z',
      status: 'delivered',
    },
    {
      id: 'msg6',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'contact1',
      sender_name: 'Peter',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Godcasc sdvsdvvds',
      type: 'text',
      timestamp: '2025-10-11T23:00:00Z',
      status: 'delivered',
    },
    {
      id: 'msg7',
      conversation_id: 'conv_current_user_contact1',
      sender_id: 'contact1',
      sender_name: 'Peter',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Good morning Babe 😘😘',
      type: 'text',
      timestamp: '2025-10-11T23:10:00Z',
      status: 'delivered',
    },
  ],
  contact2: [
    {
      id: 'msg_cath1',
      conversation_id: 'conv_current_user_contact2',
      sender_id: 'contact2',
      sender_name: 'Catherine Piaz',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Hey!!',
      type: 'text',
      timestamp: '2025-10-11T23:10:00Z',
      status: 'delivered',
    },
  ],
  contact5: [
    {
      id: 'msg_lexi1',
      conversation_id: 'conv_current_user_contact5',
      sender_id: 'contact5',
      sender_name: 'Lexi',
      sender_avatar: '/api/placeholder/100/100',
      content: 'Want to try that new sushi place?',
      type: 'text',
      timestamp: '2025-10-11T16:30:00Z',
      status: 'read',
    },
    {
      id: 'msg_lexi2',
      conversation_id: 'conv_current_user_contact5',
      sender_id: 'current_user',
      sender_name: 'You',
      content: 'Okay',
      type: 'text',
      timestamp: '2025-10-11T17:30:00Z',
      status: 'read',
    },
  ],
};

// Phase 4: Advanced Features - New Interfaces

// Media and Attachments interfaces
export interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  file: File;
  url: string;
  thumbnail?: string;
  size: number;
  duration?: number; // for audio/video files
  dimensions?: { width: number; height: number };
  metadata?: {
    filename: string;
    mimeType: string;
    uploadProgress?: number;
    compressed?: boolean;
  };
}

export interface MediaPickerOptions {
  maxFiles: number;
  maxFileSize: number; // in bytes
  allowedTypes: ('image' | 'video' | 'audio' | 'document')[];
  enableCamera: boolean;
  enableCompression: boolean;
  compressionQuality: number; // 0-1
}

export interface VoiceRecording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  waveformData: number[];
  isRecording: boolean;
  isPaused: boolean;
  timestamp: string;
}

export interface MediaViewerState {
  isOpen: boolean;
  currentIndex: number;
  media: MediaFile[];
  showControls: boolean;
  zoom: number;
  canDelete?: boolean;
  canShare?: boolean;
}

// Status and Presence interfaces
export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  last_seen: string;
  custom_status?: string;
  activity?: string; // typing, recording, etc.
}

export interface ReadReceipt {
  message_id: string;
  user_id: string;
  delivered_at: string;
  read_at?: string;
}

export interface PresenceSettings {
  show_online_status: boolean;
  show_last_seen: boolean;
  show_activity_status: boolean;
  auto_away_minutes: number;
  invisible_mode: boolean;
}

export interface ReadReceiptSettings {
  send_read_receipts: boolean;
  require_read_receipts: boolean;
  show_delivery_status: boolean;
}

// Activity tracking
export interface UserActivity {
  user_id: string;
  conversation_id: string;
  activity_type: 'typing' | 'recording_voice' | 'selecting_media' | 'idle';
  started_at: string;
  updated_at: string;
}

// Media compression utilities
export interface CompressionOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

// Voice message interfaces
export interface VoiceMessageControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
}

// Camera and device access
export interface CameraCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  supportedFormats: string[];
  maxResolution?: { width: number; height: number };
}

// File validation
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  suggestedCompression?: CompressionOptions;
}