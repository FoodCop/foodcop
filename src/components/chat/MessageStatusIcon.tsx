import { Check, DoneAll, Loop, ErrorOutline } from '@mui/icons-material';
import { cn } from '../ui/utils';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusIconProps {
    status: MessageStatus;
    className?: string;
    onRetry?: () => void;
}

export function MessageStatusIcon({
    status,
    className,
    onRetry
}: MessageStatusIconProps) {
    const baseClasses = 'inline-flex items-center justify-center';

    switch (status) {
        case 'sending':
            return (
                <div className={cn(baseClasses, className)} title="Sending...">
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                </div>
            );

        case 'sent':
            return (
                <div className={cn(baseClasses, className)} title="Sent">
                    <Check className="h-3 w-3 text-gray-400" />
                </div>
            );

        case 'delivered':
            return (
                <div className={cn(baseClasses, className)} title="Delivered">
                    <CheckCheck className="h-3 w-3 text-gray-400" />
                </div>
            );

        case 'read':
            return (
                <div className={cn(baseClasses, className)} title="Read">
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                </div>
            );

        case 'failed':
            return (
                <button
                    onClick={onRetry}
                    className={cn(
                        baseClasses,
                        'cursor-pointer hover:opacity-80 transition-opacity',
                        className
                    )}
                    title="Failed to send. Click to retry"
                >
                    <AlertCircle className="h-3 w-3 text-red-500" />
                </button>
            );

        default:
            return null;
    }
}

export default MessageStatusIcon;
