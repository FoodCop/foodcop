import type { RestaurantCard } from '../../../data/feed-content';
import { Place, Star } from '@mui/icons-material';
import { ClickableUserAvatar } from '../../../../chat/ClickableUserAvatar';
import { useDMChatStore } from '../../../../../stores/chatStore';
import { useNavigate } from 'react-router-dom';
import { SharePostButton } from '../../../SharePostButton';

interface RestaurantCardContentProps {
  card: RestaurantCard;
}

export function RestaurantCardContent({ card }: RestaurantCardContentProps) {
  const { startConversation, openChat } = useDMChatStore();
  const navigate = useNavigate();
  // Use a placeholder ID if none provided, to demonstrate functionality:
  const ownerId = card.ownerId || 'placeholder-owner-id';

  const handleMessage = async (userId: string) => {
    // For demo/placeholder, we will just open chat.
    console.log('Message user:', userId);
    openChat();
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <>
      {/* Restaurant Image */}
      <img
        src={card.imageUrl}
        alt={card.name}
        className="feed-card-hero"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/90" />

      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">📍 Saved to {card.saveCategory}</span>
      </div>

      {/* Share Button */}
      <div className="absolute top-4 right-4">
        <SharePostButton
          cardId={card.id}
          title={card.name}
          imageUrl={card.imageUrl}
          type="RESTAURANT"
          subtitle={card.cuisine}
        />
      </div>

      {/* Restaurant Info */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white">{card.name}</h2>
          <span className="text-white opacity-90">{card.priceRange}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" style={{ color: '#facc15' }} />
            <span className="text-white">{card.rating}</span>
          </div>
          <span className="text-white/60">({card.reviewCount})</span>
          <span className="text-white/60">•</span>
          <span className="text-white/90">{card.cuisine}</span>
        </div>

        <div className="flex items-center gap-1 text-white/90 mb-2">
          <Place className="w-4 h-4" />
          <span>{card.distance}</span>
        </div>

        {card.description && (
          <p className="text-white/80 line-clamp-2 mb-2">{card.description}</p>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Owner Profile Picture */}
      {card.ownerImage && (
        <div className="absolute bottom-6 right-6">
          <ClickableUserAvatar
            userId={ownerId}
            userName={card.ownerName || 'Owner'}
            avatarUrl={card.ownerImage}
            size="lg"
            onMessage={handleMessage}
            onViewProfile={handleViewProfile}
            className="border-4 border-white shadow-lg rounded-full"
          />
        </div>
      )}
    </>
  );
}

