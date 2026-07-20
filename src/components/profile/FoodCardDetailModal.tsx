'use client';

import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import type { FoodCardRecord } from '../../lib/types/foodCard';
import { TYPE_META } from '../../lib/types/foodCard';
import { foodCardService } from '../../lib/services/foodCardService';
import { PointsService } from '../../lib/services/pointsService';
import { ChatService } from '../../lib/services/chatService';
import FriendPickerModal, { type ShareTarget } from '../chat/FriendPickerModal';
import { VideoPlayerModal } from '../ui/VideoPlayerModal';

interface FoodCardDetailModalProps {
  card: FoodCardRecord;
  currentUserId: string;
  onClose: () => void;
  onUpdated: (updated: FoodCardRecord) => void;
}

export default function FoodCardDetailModal({ card, currentUserId, onClose, onUpdated }: FoodCardDetailModalProps) {
  const [current, setCurrent] = useState(card);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);

  const meta = TYPE_META[current.card_type];
  const isVideo = current.card_type === 'BITE_VIDEO' && !!current.media_url;
  const allTags = Object.values(current.tags).flat().filter((t): t is string => typeof t === 'string' && t.length > 0);

  const handlePublish = async () => {
    setIsPublishing(true);
    const result = await foodCardService.publishCard(current.id);
    setIsPublishing(false);
    if (result.success && result.data) {
      setCurrent(result.data);
      onUpdated(result.data);
    }
  };

  const handlePickShareTarget = async (target: ShareTarget) => {
    setShowFriendPicker(false);
    setShareStatus('sending');

    const item = {
      id: current.id,
      itemType: 'food_card' as const,
      name: current.title,
      caption: current.caption || undefined,
      img: current.image_url || undefined,
      cat: meta.label,
    };

    const sent =
      target.type === 'group'
        ? await ChatService.sendGroupSharedItemMessage({
            groupId: target.group.id,
            senderId: currentUserId,
            item,
          })
        : await (async () => {
            const conversation = await ChatService.getOrCreateConversation(currentUserId, target.friend.id);
            if (!conversation.success || !conversation.data) return { success: false as const };
            return ChatService.sendSharedItemMessage({
              conversationId: conversation.data.id,
              senderId: currentUserId,
              item,
            });
          })();

    if (!sent.success || !sent.data) {
      setShareStatus('error');
      return;
    }

    await PointsService.awardPoints({
      actionType: 'share_card',
      sourceType: 'share',
      sourceId: sent.data.id,
    });

    setShareStatus('sent');
  };

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="position-relative" style={{ height: '250px', background: meta.color }}>
              {current.image_url && (
                <img
                  src={current.image_url}
                  alt={current.title}
                  className="w-100 h-100 object-fit-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {isVideo && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  aria-label="Play video"
                  className="position-absolute top-50 start-50 translate-middle"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <PlayCircle size={36} />
                </button>
              )}
              <button
                type="button"
                className="btn-close position-absolute top-0 end-0 m-3 bg-white p-2 rounded-circle shadow-sm"
                aria-label="Close"
                onClick={onClose}
              ></button>
              <span
                className="badge position-absolute bottom-0 start-0 m-3 text-white fw-bold"
                style={{ backgroundColor: meta.color }}
              >
                {meta.emoji} {meta.label}
              </span>
            </div>

            <div className="modal-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="fw-bolder mb-1">{current.title}</h3>
                  <span className={`badge ${current.status === 'PUBLISHED' ? 'bg-success' : 'bg-secondary'}`}>
                    {current.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {current.caption && <p className="text-muted fw-semibold">{current.caption}</p>}

              {allTags.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {allTags.map((tag) => (
                    <span key={tag} className="badge bg-light text-dark border">{tag}</span>
                  ))}
                </div>
              )}

              {shareStatus === 'sent' && (
                <div className="alert alert-success mt-4 mb-0">Shared! They&rsquo;ll see it in Messages.</div>
              )}
              {shareStatus === 'error' && (
                <div className="alert alert-danger mt-4 mb-0">Couldn&rsquo;t share that — try again.</div>
              )}
            </div>

            <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
              {current.status === 'DRAFT' && (
                <button
                  type="button"
                  className="btn btn-dark flex-grow-1 fw-bold rounded-pill"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Publishing...' : 'Publish to Feed'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-warning flex-grow-1 fw-bold text-dark rounded-pill"
                onClick={() => setShowFriendPicker(true)}
                disabled={shareStatus === 'sending'}
              >
                {shareStatus === 'sending' ? 'Sending...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFriendPicker && (
        <FriendPickerModal
          currentUserId={currentUserId}
          onClose={() => setShowFriendPicker(false)}
          onPick={handlePickShareTarget}
        />
      )}

      {isPlaying && current.media_url && (
        <VideoPlayerModal
          title={current.title}
          mediaUrl={current.media_url}
          onClose={() => setIsPlaying(false)}
        />
      )}
    </>
  );
}
