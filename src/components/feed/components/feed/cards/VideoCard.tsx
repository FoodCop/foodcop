import type { VideoCard } from '../../../data/feed-content';
import { PlayArrow, Visibility } from '@mui/icons-material';
import { ClickableUserAvatar } from '../../../../chat/ClickableUserAvatar';
import { useDMChatStore } from '../../../../../stores/chatStore';
import { useNavigate } from 'react-router-dom';
import { SharePostButton } from '../../../SharePostButton';

interface VideoCardContentProps {
  card: VideoCard;
}

export function VideoCardContent({ card }: VideoCardContentProps) {
  const { openChat } = useDMChatStore();
  const navigate = useNavigate();
  const creatorId = card.creatorId || 'placeholder-creator-id';

  const handleMessage = (userId: string) => {
    console.log('Message user:', userId);
    openChat();
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <>
      {/* Video Thumbnail */}
      <img
        src={card.thumbnailUrl}
        alt={card.title}
        className="feed-card-hero"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/90" />

      {/* Save Category Badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500 rounded-full">
        <span className="text-white">🎬 Saved to {card.saveCategory}</span>
      </div>

      {/* Share Button (Left of Duration) */}
      <div className="absolute top-4 right-16 px-3 py-1.5">
        <SharePostButton
          cardId={card.id}
          title={card.title}
          imageUrl={card.thumbnailUrl}
          type="VIDEO"
          subtitle={card.creator}
        />
      </div>

      {/* Duration Badge */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-full">
        <span className="text-white">{card.duration}</span>
      </div>

      {/* Play Button Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
          <PlayArrow className="w-10 h-10 text-orange-500 ml-1" style={{ color: '#f97316' }} />
        </div>
      </div>

      {/* Video Info */}
      <div className="absolute bottom-8 left-0 right-0 text-white px-6 py-6">
        <div className="flex items-center gap-2 mb-3">
          {card.creatorImage && (
            <ClickableUserAvatar
              userId={creatorId}
              userName={card.creator}
              avatarUrl={card.creatorImage}
              size="md"
              onMessage={handleMessage}
              onViewProfile={handleViewProfile}
              className="border-2 border-white rounded-full"
            />
          )}
          <div>
            <p className="text-white">{card.creator}</p>
            <div className="flex items-center gap-1.5">
              <Visibility className="w-3 h-3 text-white/70" />
              <span className="text-white/70 text-[12px]">
                {card.views >= 1000000
                  ? `${(card.views / 1000000).toFixed(1)}M`
                  : `${(card.views / 1000).toFixed(0)}K`} views
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-white mb-2">{card.title}</h2>

        <p className="text-white/90 mb-3">{card.description}</p>

        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-[12px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
