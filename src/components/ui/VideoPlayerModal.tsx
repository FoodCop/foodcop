'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getYoutubeVideoId } from '@/lib/utils/studioHelpers';

interface VideoPlayerModalProps {
  title: string;
  mediaUrl: string;
  onClose: () => void;
}

// Plays a video inline over the app instead of navigating away to youtube.com
// or a bare file URL - used by the Dashboard's "Watch & Cook" rail and by
// FoodCardDetailModal for BITE_VIDEO cards. Detects a YouTube URL (embeds via
// iframe) vs a direct file URL (real Supabase Storage upload or any other
// hosted mp4 - native <video>) so one component serves both media_url shapes
// food_cards can hold.
export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ title, mediaUrl, onClose }) => {
  const youtubeId = getYoutubeVideoId(mediaUrl);

  return createPortal(
    <div role="dialog" aria-modal="true" className="video-player-modal">
      <button onClick={onClose} aria-label="Close" className="video-player-modal__close">
        <X size={24} />
      </button>
      <div className="video-player-modal__stage">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-player-modal__frame"
          />
        ) : (
          <video src={mediaUrl} controls autoPlay playsInline className="video-player-modal__video" />
        )}
      </div>
      <p className="video-player-modal__title">{title}</p>
    </div>,
    document.body,
  );
};

export default VideoPlayerModal;
