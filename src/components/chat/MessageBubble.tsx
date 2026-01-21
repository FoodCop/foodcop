import { DMMessage, SharedItem } from '../../services/dmChatService';
import { cn } from '../ui/utils';
import { MessageStatusIcon, MessageStatus } from './MessageStatusIcon';

interface MessageBubbleProps {
  message: DMMessage;
  isOwn: boolean;
  onSharedItemClick?: (item: SharedItem) => void;
  status?: MessageStatus;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  isOwn,
  onSharedItemClick,
  status = 'delivered', // Default to delivered for existing messages
  onRetry,
}: MessageBubbleProps) {
  const hasSharedItem = message.shared_item !== null;

  return (
    <div
      className={cn(
        'flex w-full mb-2',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-fuzo-orange-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        )}
      >
        {/* Shared Item Card */}
        {hasSharedItem && message.shared_item && (
          <button
            onClick={() => onSharedItemClick?.(message.shared_item!)}
            className={cn(
              'w-full mb-2 rounded-xl overflow-hidden text-left',
              'border border-gray-200 bg-white',
              'hover:bg-gray-50 transition-colors'
            )}
          >
            {message.shared_item.image_url && (
              <img
                src={message.shared_item.image_url}
                alt={message.shared_item.title}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {message.shared_item.type}
                </span>
              </div>
              <p className="font-semibold text-gray-900 line-clamp-1">
                {message.shared_item.title}
              </p>
              {message.shared_item.subtitle && (
                <p className="text-sm text-gray-500 line-clamp-1">
                  {message.shared_item.subtitle}
                </p>
              )}
            </div>
          </button>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Timestamp and Status */}
        <div className="flex items-center gap-1.5 mt-1">
          <p
            className={cn(
              'text-[10px]',
              isOwn ? 'text-fuzo-orange-100' : 'text-gray-400'
            )}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {isOwn && status && (
            <MessageStatusIcon
              status={status}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;

