import { cn } from '../ui/utils';

interface UnreadBadgeProps {
    count: number;
    className?: string;
    max?: number; // Maximum number to display before showing "99+"
}

export function UnreadBadge({ count, className, max = 99 }: UnreadBadgeProps) {
    if (count <= 0) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
        <div
            className={cn(
                'absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm animate-in zoom-in-50 duration-200',
                className
            )}
        >
            {displayCount}
        </div>
    );
}

export default UnreadBadge;
