import type { MasterbotCard } from '../../../data/feed-content';
import { Favorite, Message } from '@mui/icons-material';
import { ClickableUserAvatar } from '../../../../chat/ClickableUserAvatar';
import { useDMChatStore } from '../../../../../stores/chatStore';
import { useNavigate } from 'react-router-dom';
import { SharePostButton } from '../../../SharePostButton';

interface MasterbotCardContentProps {
  card: MasterbotCard;
}

export function MasterbotCardContent({ card }: MasterbotCardContentProps) {
  const { openChat } = useDMChatStore();
  const navigate = useNavigate();
  const userId = card.userId || 'placeholder-user-id';

  const handleMessage = (userId: string) => {
    console.log('Message user:', userId);
    openChat();
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <>
      {/* Post Image */}
      <img
        src={card.imageUrl}
        alt={card.displayName}
        className="feed-card-hero"
      />

      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">💬 Saved to {card.saveCategory}</span>
      </div>

      {/* Share Button (Below Creator Info) */}
      <div className="absolute top-16 right-4">
        <SharePostButton
          cardId={card.id}
          title={card.caption.substring(0, 30) + "..."}
          imageUrl={card.imageUrl}
          type="POST"
          subtitle={card.displayName}
        />
      </div>

      {/* Creator Info at Top */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
        <ClickableUserAvatar
          userId={userId}
          userName={card.displayName}
          avatarUrl={card.avatarUrl}
          size="sm"
          onMessage={handleMessage}
          onViewProfile={handleViewProfile}
          className="border-2 border-white rounded-full"
        />
        <div className="text-white">
          <p className="leading-none">{card.displayName}</p>
          <p className="text-white/70 text-[12px]">{card.username}</p>
        </div>
      </div>

      {/* Post Info at Bottom */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <p className="text-white mb-3">{card.caption}</p>

        {card.restaurantTag && (
          <div className="mb-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white">
              📍 {card.restaurantTag}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Favorite className="w-5 h-5 text-white" />
            <span className="text-white">{card.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Message className="w-5 h-5 text-white" />
            <span className="text-white">Comment</span>
          </div>
        </div>

        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="text-white/60 text-[14px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
