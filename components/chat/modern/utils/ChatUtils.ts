// Chat utility functions for date formatting, status management, and UI helpers
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format timestamp for chat list display
 * Shows time for today, "Yesterday" for yesterday, and date for older
 */
export function formatChatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  // For older messages, show date
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 7) {
    return format(date, 'EEE'); // Mon, Tue, etc.
  }
  
  return format(date, 'dd/MM/yy');
}

/**
 * Format detailed timestamp for message bubbles
 */
export function formatMessageTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }
  
  return format(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Format last seen timestamp
 */
export function formatLastSeen(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  }
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  if (isToday(date)) {
    return `Today ${format(date, 'HH:mm')}`;
  }
  
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }
  
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 7) {
    return format(date, 'EEE HH:mm');
  }
  
  return format(date, 'dd/MM/yyyy');
}

/**
 * Truncate message content for preview
 */
export function truncateMessage(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Get message type display text
 */
export function getMessageTypeText(type: string): string {
  switch (type) {
    case 'image':
      return '📷 Photo';
    case 'voice':
      return '🎤 Voice message';
    case 'video':
      return '🎥 Video';
    case 'file':
      return '📎 File';
    default:
      return '';
  }
}

/**
 * Generate avatar fallback with initials
 */
export function getAvatarFallback(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Generate gradient color for avatar fallback
 */
export function getAvatarGradient(userId: string): string {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-green-600',
  ];
  
  // Use user ID to consistently assign same gradient
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Check if user is online (within last 5 minutes)
 */
export function isUserOnline(lastSeen: string): boolean {
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  
  return diffInMinutes <= 5;
}

/**
 * Sort contacts by last message timestamp
 */
export function sortContactsByLastMessage<T extends { last_message: { timestamp: string } }>(contacts: T[]): T[] {
  return [...contacts].sort((a, b) => {
    const dateA = new Date(a.last_message.timestamp);
    const dateB = new Date(b.last_message.timestamp);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter contacts by search query
 */
export function filterContacts<T extends { name: string; username: string }>(
  contacts: T[],
  query: string
): T[] {
  if (!query.trim()) {
    return contacts;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm) ||
    contact.username.toLowerCase().includes(searchTerm)
  );
}

/**
 * Generate placeholder image URL for development
 */
export function getPlaceholderAvatar(seed: string, size: number = 100): string {
  // Using a simple placeholder service
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Generate unique conversation ID for two users
 */
export function generateConversationId(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();
  return `conv_${sortedIds.join('_')}`;
}

/**
 * Check if message is from current user
 */
export function isMessageFromCurrentUser(senderId: string, currentUserId: string): boolean {
  return senderId === currentUserId;
}

/**
 * Get unread count display text
 */
export function getUnreadCountText(count: number): string {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}

/**
 * Vibrate device for haptic feedback (mobile)
 */
export function vibrateDevice(pattern: number | number[] = 100): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && 'ontouchstart' in window;
}

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
  element.scrollIntoView({ behavior, block: 'nearest' });
}