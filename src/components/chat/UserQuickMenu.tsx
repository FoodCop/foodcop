import { Message, Person, Close } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import { cn } from '../ui/utils';

interface UserQuickMenuProps {
    userId: string;
    userName: string;
    position?: { x: number; y: number };
    onMessage: (userId: string) => void;
    onViewProfile: (userId: string) => void;
    onClose: () => void;
    className?: string;
}

export function UserQuickMenu({
    userId,
    userName,
    position,
    onMessage,
    onViewProfile,
    onClose,
    className,
}: UserQuickMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Add delay to prevent immediate close from the click that opened the menu
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleMessage = () => {
        onMessage(userId);
        onClose();
    };

    const handleViewProfile = () => {
        onViewProfile(userId);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-[9998] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                ref={menuRef}
                className={cn(
                    'fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden',
                    'animate-in zoom-in-95 fade-in duration-200',
                    className
                )}
                style={
                    position
                        ? {
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            transform: 'translate(-50%, 8px)',
                        }
                        : {
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }
                }
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm truncate pr-2">
                            {userName}
                        </p>
                        <button
                            onClick={onClose}
                            className="shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                            aria-label="Close menu"
                        >
                            <Close sx={{ fontSize: 12, color: '#6B7280' }} />
                        </button>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="py-1 min-w-[180px]">
                    <button
                        onClick={handleMessage}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Message className="h-4 w-4 text-fuzo-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Message</span>
                    </button>
                    <button
                        onClick={handleViewProfile}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Person className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">View Profile</span>
                    </button>
                </div>
            </div>
        </>
    );
}

export default UserQuickMenu;
