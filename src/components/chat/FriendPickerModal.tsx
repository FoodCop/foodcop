'use client';

import React, { useEffect, useState } from 'react';
import { ChatService, type ChatContact } from '../../lib/services/chatService';
import { FriendRequestService } from '../../lib/services/friendRequestService';

interface FriendPickerModalProps {
  currentUserId: string;
  onClose: () => void;
  onPick: (friend: ChatContact) => void;
}

export default function FriendPickerModal({ currentUserId, onClose, onPick }: FriendPickerModalProps) {
  const [friends, setFriends] = useState<ChatContact[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [friendIdsResult, contactsResult] = await Promise.all([
        FriendRequestService.listAcceptedFriendIds(currentUserId),
        ChatService.listContacts(currentUserId),
      ]);

      if (cancelled) return;

      const friendIds = new Set(friendIdsResult.success ? friendIdsResult.data ?? [] : []);
      const contacts = contactsResult.success ? contactsResult.data ?? [] : [];
      setFriends(contacts.filter((c) => friendIds.has(c.id)));
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0">
            <h5 className="fw-bolder mb-0">Share with a Friend</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body pt-0">
            {friends === null ? (
              <div className="text-center py-4">
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center text-muted py-4">
                <div style={{ fontSize: 32 }}>🤝</div>
                <p className="fw-bold mt-2 mb-0">No friends yet</p>
                <p className="small text-muted">Accept or send a friend request in Messages first.</p>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {friends.map((friend) => (
                  <li key={friend.id} className="list-group-item px-0">
                    <button
                      type="button"
                      className="btn w-100 d-flex align-items-center gap-3 text-start p-2"
                      onClick={() => onPick(friend)}
                    >
                      <img src={friend.avatar} alt={friend.name} className="rounded-circle" style={{ width: 44, height: 44, objectFit: 'cover' }} />
                      <div>
                        <div className="fw-bold">{friend.name}</div>
                        <div className="small text-muted">@{friend.username}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
