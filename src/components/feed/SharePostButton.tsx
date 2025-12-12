import { Share } from 'lucide-react';
import { UserDiscoveryModal } from '../chat/UserDiscoveryModal';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useDMChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

interface SharePostButtonProps {
    cardId: string;
    title: string;
    imageUrl?: string;
    type: string;
    subtitle?: string;
    className?: string;
    variant?: 'default' | 'light';
}

export function SharePostButton({
    cardId,
    title,
    imageUrl,
    type,
    subtitle,
    className,
    variant = 'default'
}: SharePostButtonProps) {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const { openChat, shareItem } = useDMChatStore();
    const { user } = useAuthStore();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleShare = async (userId: string) => {
        // This will be called after conversation is started by UserDiscoveryModal
        // We can then send the shared item

        // Note: UserDiscoveryModal starts conversation and calls onSelectUser(userId)
        // We assume the active conversation is now set to this user/conversation
        // But we need the conversation ID. 
        // The current implementation of UserDiscoveryModal calls startConversation which sets active conversation?
        // Let's check UserDiscoveryModal implementation. 
        // It calls startConversation then openChat then onSelectUser.
        // So the active conversation should be set.

        // We need to fetch the active conversation ID from the store.
        const state = useDMChatStore.getState();
        const conversationId = state.activeConversationId;

        if (conversationId && user?.id) {
            // Let's assume we can pass the item to be shared
            // Ideally we should use the shareItem action
            await shareItem(
                conversationId,
                user.id,
                {
                    id: cardId,
                    type: type.toUpperCase() as any, // 'RESTAURANT' | 'RECIPE' | 'VIDEO' | 'POST'
                    title: title,
                    subtitle: subtitle || '',
                    image_url: imageUrl,
                    metadata: { id: cardId }
                }
            );
        }

        setIsShareModalOpen(false);
    };

    const buttonClassName = variant === 'light' 
        ? `h-8 w-8 text-gray-700 hover:bg-gray-100 rounded-full ${className || ''}`
        : `h-8 w-8 text-white hover:bg-white/20 rounded-full ${className || ''}`;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className={buttonClassName}
                onClick={() => setIsShareModalOpen(true)}
                title="Share to Chat"
            >
                <Share className="h-4 w-4" />
            </Button>

            <UserDiscoveryModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onSelectUser={handleShare}
            />
        </>
    );
}
