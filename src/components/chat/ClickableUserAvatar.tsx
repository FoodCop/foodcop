import { useState, useRef, MouseEvent } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { UserQuickMenu } from './UserQuickMenu';

interface ClickableUserAvatarProps {
    userId: string;
    userName: string;
    avatarUrl?: string;
    size?: 'sm' | 'md' | 'lg';
    onMessage: (userId: string) => void;
    onViewProfile: (userId: string) => void;
    className?: string;
}

const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
};

export function ClickableUserAvatar({
    userId,
    userName,
    avatarUrl,
    size = 'md',
    onMessage,
    onViewProfile,
    className,
}: ClickableUserAvatarProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const avatarRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        // Get avatar position for menu placement
        const rect = avatarRef.current?.getBoundingClientRect();
        if (rect) {
            setMenuPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom,
            });
        }

        setShowMenu(true);
    };

    return (
        <>
            <button
                ref={avatarRef}
                onClick={handleClick}
                className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
                title={`${userName} - Click for options`}
            >
                <Avatar className={sizeClasses[size]}>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-fuzo-orange-100 text-fuzo-orange-600">
                        {userName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
            </button>

            {showMenu && (
                <UserQuickMenu
                    userId={userId}
                    userName={userName}
                    position={menuPosition}
                    onMessage={onMessage}
                    onViewProfile={onViewProfile}
                    onClose={() => setShowMenu(false)}
                />
            )}
        </>
    );
}

export default ClickableUserAvatar;
