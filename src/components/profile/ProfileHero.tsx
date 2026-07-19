'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Loader2 } from 'lucide-react';
import type { DemoProfile } from './demoProfile';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
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
  const isOwnProfile = !!currentUserId && !isOtherUser;

  const [relationship, setRelationship] = useState<{ state: FriendRelationshipState; requestId: string | null }>({
    state: 'none',
    requestId: null,
  });
  const [friendCount, setFriendCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? null);
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? null);
  const [uploadingKind, setUploadingKind] = useState<'avatar' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarUrl(profile.avatarUrl ?? null);
    setBannerUrl(profile.bannerUrl ?? null);
  }, [profile.avatarUrl, profile.bannerUrl]);

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

  const handleImageUpload = async (file: File, kind: 'avatar' | 'banner') => {
    if (!currentUserId) return;
    setUploadError(null);
    setUploadingKind(kind);
    try {
      const result = await MediaUploadService.uploadProfileImage(file, kind);
      if (!result.success || !result.data) {
        setUploadError(result.error || 'Upload failed. Please try again.');
        return;
      }
      const url = result.data;
      const supabase = createClient();
      if (!supabase) return;

      const column = kind === 'avatar' ? 'avatar_url' : 'banner_url';
      const { error } = await supabase.from('users').update({ [column]: url }).eq('id', currentUserId);
      if (error) {
        setUploadError(error.message);
        return;
      }

      if (kind === 'avatar') {
        // SiteHeader's own avatar reads auth user_metadata, not the users
        // table column - keep both in sync or the header disagrees with
        // what everyone else (Chat/Notifications, which read the column)
        // sees for this user.
        await supabase.auth.updateUser({ data: { avatar_url: url } });
        setAvatarUrl(url);
      } else {
        setBannerUrl(url);
      }
    } finally {
      setUploadingKind(null);
    }
  };

  const followLabel: Record<FriendRelationshipState, string> = {
    none: 'Follow',
    'outgoing-pending': 'Requested',
    'incoming-pending': 'Accept',
    accepted: 'Following',
  };

  return (
    <div>
      <div
        className="position-relative bg-light"
        style={{
          height: 140,
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'linear-gradient(135deg, #fdeee9, #fdf6e3)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {isOwnProfile && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-dark bg-opacity-75 position-absolute bottom-0 end-0 m-2 rounded-pill d-flex align-items-center gap-1"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingKind === 'banner'}
            >
              {uploadingKind === 'banner' ? <Loader2 size={14} className="scout-spin" /> : <Camera size={14} />}
              Banner
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'banner');
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-start" style={{ marginTop: -48 }}>
          <div className="mt-5 pt-3">
            <div className="text-muted small">@{profile.handle}</div>
            <h5 className="mt-1 mb-0 fw-bold">{profile.name}</h5>
            <h6 className="text-primary fw-normal">{profile.role}</h6>
          </div>
          <div className="position-relative flex-shrink-0">
            <div
              className="rounded-circle bg-light d-flex align-items-center justify-content-center border border-4 border-white shadow-sm overflow-hidden"
              style={{ width: 88, height: 88 }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-100 h-100 object-fit-cover" />
              ) : (
                <span style={{ fontSize: 28, color: '#ccc' }}>👤</span>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-dark rounded-circle position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center p-0"
                  style={{ width: 28, height: 28 }}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingKind === 'avatar'}
                  aria-label="Change profile picture"
                >
                  {uploadingKind === 'avatar' ? <Loader2 size={12} className="scout-spin" /> : <Camera size={12} />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'avatar');
                    e.target.value = '';
                  }}
                />
              </>
            )}
          </div>
        </div>

        {uploadError && <div className="alert alert-danger small py-2 mt-2 mb-0">{uploadError}</div>}

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
    </div>
  );
}
