'use client';

import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { ChatService, type ChatContact, type ChatGroup } from '../../lib/services/chatService';
import { FriendRequestService } from '../../lib/services/friendRequestService';

// Same placeholder used for groups with no avatar_url in the Messages inbox
// (src/app/(main)/messages/page.tsx's GROUP_FALLBACK_AVATAR) - kept as a
// local copy since that constant isn't exported.
const GROUP_FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=150&q=80';

export type ShareTarget =
  | { type: 'dm'; friend: ChatContact }
  | { type: 'group'; group: ChatGroup };

interface FriendPickerModalProps {
  currentUserId: string;
  onClose: () => void;
  onPick: (target: ShareTarget) => void;
}

export default function FriendPickerModal({ currentUserId, onClose, onPick }: FriendPickerModalProps) {
  const [friends, setFriends] = useState<ChatContact[] | null>(null);
  const [groups, setGroups] = useState<ChatGroup[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [friendIdsResult, contactsResult, groupsResult] = await Promise.all([
        FriendRequestService.listAcceptedFriendIds(currentUserId),
        ChatService.listContacts(currentUserId),
        ChatService.listGroups(currentUserId),
      ]);

      if (cancelled) return;

      const friendIds = new Set(friendIdsResult.success ? friendIdsResult.data ?? [] : []);
      const contacts = contactsResult.success ? contactsResult.data ?? [] : [];
      setFriends(contacts.filter((c) => friendIds.has(c.id)));
      setGroups(groupsResult.success ? groupsResult.data ?? [] : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const isLoading = friends === null || groups === null;
  const hasNothing = !isLoading && friends!.length === 0 && (groups?.length ?? 0) === 0;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0">
            <h5 className="fw-bolder mb-0">Share</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body pt-0">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : hasNothing ? (
              <div className="text-center text-muted py-4">
                <div style={{ fontSize: 32 }}>🤝</div>
                <p className="fw-bold mt-2 mb-0">No friends yet</p>
                <p className="small text-muted">Accept or send a friend request in Messages first.</p>
              </div>
            ) : (
              <>
                {groups!.length > 0 && (
                  <>
                    <p className="text-uppercase text-muted small fw-bold mb-1 mt-2">Groups</p>
                    <ul className="list-group list-group-flush mb-2">
                      {groups!.map((group) => (
                        <li key={group.id} className="list-group-item px-0">
                          <button
                            type="button"
                            className="btn w-100 d-flex align-items-center gap-3 text-start p-2"
                            onClick={() => onPick({ type: 'group', group })}
                          >
                            <img
                              src={group.avatarUrl || GROUP_FALLBACK_AVATAR}
                              alt={group.name}
                              className="rounded-circle"
                              style={{ width: 44, height: 44, objectFit: 'cover' }}
                            />
                            <div>
                              <div className="fw-bold d-flex align-items-center gap-1">
                                <Users size={14} />
                                {group.name}
                              </div>
                              <div className="small text-muted">Group</div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {friends!.length > 0 && (
                  <>
                    {groups!.length > 0 && <p className="text-uppercase text-muted small fw-bold mb-1">Friends</p>}
                    <ul className="list-group list-group-flush">
                      {friends!.map((friend) => (
                        <li key={friend.id} className="list-group-item px-0">
                          <button
                            type="button"
                            className="btn w-100 d-flex align-items-center gap-3 text-start p-2"
                            onClick={() => onPick({ type: 'dm', friend })}
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
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
