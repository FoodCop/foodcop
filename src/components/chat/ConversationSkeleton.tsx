import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';

/**
 * Skeleton loader for conversation list items
 */
export function ConversationSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for message bubbles
 */
export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className={`flex-1 space-y-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48 ml-auto' : 'w-56'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConversationSkeleton;

