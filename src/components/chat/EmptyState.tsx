import { ReactNode } from 'react';
import { cn } from '../ui/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable empty state component for chat interfaces
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full text-gray-400 px-4 py-12',
        className
      )}
    >
      <div className="mb-4 animate-fade-in">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2 animate-fade-in-delay">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-center text-gray-500 mb-4 animate-fade-in-delay-2 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2 animate-fade-in-delay-3">{action}</div>
      )}
    </div>
  );
}

/**
 * Empty state for no conversations
 */
export function NoConversationsEmptyState({
  onStartChat,
}: {
  onStartChat?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <div className="h-16 w-16 rounded-full bg-fuzo-orange-100 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-fuzo-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
      }
      title="No conversations yet"
      description="Start chatting by sharing something with a friend or finding new people to message!"
      action={
        onStartChat && (
          <button
            onClick={onStartChat}
            className="px-4 py-2 bg-[var(--button-bg-default)] text-[var(--button-text)] rounded-full hover:bg-[var(--button-bg-hover)] active:bg-[var(--button-bg-active)] transition-colors font-medium text-sm"
            aria-label="Start a new conversation"
          >
            Start Chatting
          </button>
        )
      }
    />
  );
}

/**
 * Empty state for no messages in a conversation
 */
export function NoMessagesEmptyState() {
  return (
    <EmptyState
      icon={
        <div className="h-16 w-16 rounded-full bg-fuzo-orange-100 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-fuzo-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      }
      title="No messages yet"
      description="Say hello and start the conversation! 👋"
    />
  );
}

/**
 * Empty state for no message requests
 */
export function NoMessageRequestsEmptyState() {
  return (
    <EmptyState
      icon={
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      }
      title="No message requests"
      description="When someone sends you a message, it will appear here"
    />
  );
}

export default EmptyState;

