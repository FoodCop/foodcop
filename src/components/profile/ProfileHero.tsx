'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DemoProfile } from './demoProfile';
import { useAuth } from '@/components/auth/AuthProvider';
import { FriendRequestService, type FriendRelationshipState } from '@/lib/services/friendRequestService';

// Ported from Soziety's user-profile.html .main-profile / .social-bar /
// .list-button structure, re-skinned onto Bootstrap flex/card utilities.
// Follow now reuses the same friend_requests system Chat already uses
// (mutual accept/decline) rather than a separate one-way follow, per direct
// decision - so "Following"/"Followers" collapse into one real "Friends"
// count instead of two numbers that would otherwise always be identical.
export default function ProfileHero({ profile, userId }: { profile: DemoProfile; userId?: string }) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isOtherUser = !!userId && !!currentUserId && userId !== currentUserId;

  const [relationship, setRelationship] = useState<{ state: FriendRelationshipState; requestId: string | null }>({
    state: 'none',
    requestId: null,
  });
  const [friendCount, setFriendCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isOtherUser || !currentUserId || !userId) return;
    let cancelled = false;
    FriendRequestService.getRelationship(currentUserId, userId).then((result) => {
      if (!cancelled && result.success && result.data) {
        setRelationship({ state: result.data.state, requestId: result.data.request?.id ?? null });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOtherUser, currentUserId, userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    FriendRequestService.listAcceptedFriendIds(userId).then((result) => {
      if (!cancelled && result.success && result.data) setFriendCount(result.data.length);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, relationship.state]);

  const handleFollowClick = async () => {
    if (!currentUserId || !userId || isUpdating) return;
    setIsUpdating(true);
    try {
      if (relationship.state === 'none') {
        const result = await FriendRequestService.sendRequest(currentUserId, userId);
        if (result.success && result.data) setRelationship({ state: 'outgoing-pending', requestId: result.data.id });
      } else if (relationship.state === 'incoming-pending' && relationship.requestId) {
        const result = await FriendRequestService.acceptRequest(relationship.requestId);
        if (result.success) setRelationship((prev) => ({ ...prev, state: 'accepted' }));
      } else if (relationship.requestId) {
        // outgoing-pending -> cancel the request; accepted -> unfollow.
        // Both are a real delete of the same row.
        const result = await FriendRequestService.cancelRequest(relationship.requestId);
        if (result.success) setRelationship({ state: 'none', requestId: null });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const followLabel: Record<FriendRelationshipState, string> = {
    none: 'Follow',
    'outgoing-pending': 'Requested',
    'incoming-pending': 'Accept',
    accepted: 'Following',
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="text-muted small">@{profile.handle}</div>
          <h5 className="mt-1 mb-0 fw-bold">{profile.name}</h5>
          <h6 className="text-primary fw-normal">{profile.role}</h6>
        </div>
        <div
          className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 64, height: 64 }}
        >
          <span style={{ fontSize: 22, color: '#ccc' }}>👤</span>
        </div>
      </div>

      {isOtherUser && (
        <div className="d-flex gap-2 mt-3">
          <button
            type="button"
            className={`btn btn-sm ${relationship.state === 'none' || relationship.state === 'incoming-pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={handleFollowClick}
            disabled={isUpdating}
          >
            {followLabel[relationship.state]}
          </button>
          {profile.type === 'restaurant' ? (
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary">
                Order
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary">
                Website
              </button>
            </>
          ) : (
            <Link href={`/messages?userId=${userId}`} className="btn btn-sm btn-outline-secondary">
              Message
            </Link>
          )}
        </div>
      )}

      <div className="d-flex gap-4 mt-4 border-top pt-3">
        <div className="text-center">
          <div className="fw-bold">{profile.bites}</div>
          <div className="text-muted small">Bites</div>
        </div>
        <div className="text-center">
          <div className="fw-bold">{friendCount}</div>
          <div className="text-muted small">Friends</div>
        </div>
      </div>
    </div>
  );
}
