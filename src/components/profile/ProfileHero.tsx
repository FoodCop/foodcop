'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileText,
  Hamburger,
  Loader2,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Repeat2,
  RotateCcw,
  Star,
  Users,
} from 'lucide-react';
import { type UserProfile } from './demoProfile';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import { FriendRequestService, type FriendRelationshipState } from '@/lib/services/friendRequestService';
import ProfileHighlightsService, { type ProfileHighlight, type HighlightItemRef } from '@/lib/services/profileHighlightsService';
import HighlightEditorModal from './HighlightEditorModal';
import HighlightViewerModal from './HighlightViewerModal';
import FoodCardDetailModal from './FoodCardDetailModal';
import SavedItemDetailModal from './SavedItemDetailModal';
import ShareSheet, { sharePayloadFromItem, type SharePayload } from '@/components/share/ShareSheet';
import type { AppItem } from '@/types/appItem';
import { SOCIAL_ICONS } from './settings/SocialLinksEditor';
import { StatusPill, formatCount } from './restaurant/RestaurantBits';
import RateRestaurantModal from './restaurant/RateRestaurantModal';
import SocialLinksSheet from './SocialLinksSheet';
import { useOpenStatus, useRestaurant } from '@/lib/hooks/useRestaurant';
import { RSVPService } from '@/lib/services/rsvpService';
import { SOCIAL_META, SOCIAL_PLATFORMS, SocialLinksService, type SocialLinks } from '@/lib/services/socialLinksService';


interface DisplayHighlight {
  id: string;
  title: string;
  subtitle: string;
  cover_image_url: string;
  raw?: ProfileHighlight;
}

export default function ProfileHero({
  profile,
  userId,
  restricted = false,
  onRelationshipChange,
}: {
  profile: UserProfile;
  userId?: string;
  /** Private profile the viewer can't see into yet: header + Follow/Message only, no highlights or post counts. */
  restricted?: boolean;
  /** Fired when a follow/accept/unfollow changes the relationship, so the page can re-check access. */
  onRelationshipChange?: (state: FriendRelationshipState) => void;
}) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isOtherUser = !!userId && !!currentUserId && userId !== currentUserId;
  const isOwnProfile = !!currentUserId && !isOtherUser;

  const [relationship, setRelationship] = useState<{ state: FriendRelationshipState; requestId: string | null }>({
    state: 'none',
    requestId: null,
  });
  const [friendCount, setFriendCount] = useState(profile.friends ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '/images/profile/avatar.jpg');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || '/images/profile/hero_banner.jpg');

  // Follow new values from the page (friend count, avatar/banner) - adjusted
  // during render rather than in an effect, so there's no extra render pass.
  const [seenProps, setSeenProps] = useState({ friends: profile.friends, avatar: profile.avatarUrl, banner: profile.bannerUrl });
  if (seenProps.friends !== profile.friends || seenProps.avatar !== profile.avatarUrl || seenProps.banner !== profile.bannerUrl) {
    setSeenProps({ friends: profile.friends, avatar: profile.avatarUrl, banner: profile.bannerUrl });
    if (seenProps.friends !== profile.friends && typeof profile.friends === 'number') setFriendCount(profile.friends);
    if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
    if (profile.bannerUrl) setBannerUrl(profile.bannerUrl);
  }
  const [uploadingKind, setUploadingKind] = useState<'avatar' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [highlights, setHighlights] = useState<ProfileHighlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);
  const [editingHighlight, setEditingHighlight] = useState<ProfileHighlight | 'new' | null>(null);
  const [viewingHighlight, setViewingHighlight] = useState<ProfileHighlight | null>(null);
  const [viewingDetail, setViewingDetail] = useState<HighlightItemRef | null>(null);

  const isRestaurant = profile.type === 'restaurant';
  const restaurant = useRestaurant(userId, isRestaurant);
  const openStatus = useOpenStatus(isRestaurant ? restaurant.profile : null);
  const [isRating, setIsRating] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [editingSocials, setEditingSocials] = useState(false);
  // Meetups you're going to (own profile only - RSVPs are visible just inside each chat).
  const [meetups, setMeetups] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    SocialLinksService.get(userId).then((res) => {
      if (!cancelled) setSocialLinks(res.data ?? {});
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const linkedPlatforms = SOCIAL_PLATFORMS.filter((p) => socialLinks[p]);

  useEffect(() => {
    if (!isOwnProfile || isRestaurant || !userId) return;
    let cancelled = false;
    RSVPService.countGoing(userId).then((res) => {
      if (!cancelled) setMeetups(res.success ? (res.data ?? 0) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, isRestaurant, userId]);

  // Active card index for the 3D Fan Carousel (default index 1 is "Ramen Week", front and center)
  const [activeIndex, setActiveIndex] = useState(1);

  const refetchHighlights = useCallback(async () => {
    if (!userId || restricted) {
      setIsLoadingHighlights(false);
      return;
    }
    setIsLoadingHighlights(true);
    const result = await ProfileHighlightsService.listForUser(userId);
    setHighlights(result.success && result.data ? result.data : []);
    setIsLoadingHighlights(false);
  }, [userId, restricted]);

  useEffect(() => {
    // Deferred a microtask so the loading flag isn't set synchronously inside the effect.
    Promise.resolve().then(refetchHighlights);
  }, [refetchHighlights]);

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
    FriendRequestService.getFriendCount(userId).then((result) => {
      if (!cancelled && result.success && typeof result.data === 'number') setFriendCount(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, relationship.state, profile.friends]);

  const handleFollowClick = async () => {
    if (!currentUserId || !userId || isUpdating) return;
    setIsUpdating(true);
    try {
      if (relationship.state === 'none') {
        const result = await FriendRequestService.sendRequest(currentUserId, userId);
        if (result.success && result.data) {
          setRelationship({ state: 'outgoing-pending', requestId: result.data.id });
          onRelationshipChange?.('outgoing-pending');
        }
      } else if (relationship.state === 'incoming-pending' && relationship.requestId) {
        const result = await FriendRequestService.acceptRequest(relationship.requestId);
        if (result.success) {
          setRelationship((prev) => ({ ...prev, state: 'accepted' }));
          onRelationshipChange?.('accepted');
        }
      } else if (relationship.requestId) {
        const result = await FriendRequestService.cancelRequest(relationship.requestId);
        if (result.success) {
          setRelationship({ state: 'none', requestId: null });
          onRelationshipChange?.('none');
        }
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
        await supabase.auth.updateUser({ data: { avatar_url: url } });
        setAvatarUrl(url);
      } else {
        setBannerUrl(url);
      }
    } finally {
      setUploadingKind(null);
    }
  };

  // Share asks where: FUZO friends/groups or other apps (ShareSheet).
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const handleShareDetail = (item: AppItem) => setSharing(sharePayloadFromItem(item));

  // Convert real user highlights to carousel items
  const displayHighlights: DisplayHighlight[] = highlights.map((h) => ({
    id: h.id,
    title: h.title,
    subtitle: `${h.items?.length ?? 1} cards`,
    cover_image_url: h.cover_image_url || '/images/profile/ramen.jpg',
    raw: h,
  }));

  const totalItems = displayHighlights.length;
  // activeIndex can outlive a shorter list (e.g. after deleting a highlight) - always wrap it.
  const activeSlot = totalItems > 0 ? ((activeIndex % totalItems) + totalItems) % totalItems : 0;
  const activeItem = totalItems > 0 ? displayHighlights[activeSlot] : null;
  const pannedAt = useRef(0);

  const wrap = (i: number) => ((i % totalItems) + totalItems) % totalItems;
  const handlePrev = () => {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => wrap(wrap(prev) - 1));
  };

  const handleNext = () => {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => wrap(wrap(prev) + 1));
  };

  const handleCardClick = (index: number) => {
    if (index === activeSlot) {
      const item = displayHighlights[index];
      if (item?.raw) {
        setViewingHighlight(item.raw);
      } else {
        // Demo highlight viewer mock
        setViewingHighlight({
          id: item.id,
          user_id: userId || 'demo',
          title: item.title,
          cover_image_url: item.cover_image_url,
          items: [],
          position: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      setActiveIndex(index);
    }
  };

  // Compute 3D positioning class for fan layout
  const getCardClass = (index: number) => {
    let diff = index - activeSlot;
    if (diff > totalItems / 2) diff -= totalItems;
    if (diff < -totalItems / 2) diff += totalItems;

    if (diff === 0) return 'fz-highlights-section__card--center';
    if (diff === -1) return 'fz-highlights-section__card--left-1';
    if (diff === 1) return 'fz-highlights-section__card--right-1';
    if (diff === -2) return 'fz-highlights-section__card--left-2';
    if (diff === 2) return 'fz-highlights-section__card--right-2';
    return 'fz-highlights-section__card--hidden';
  };

  return (
    <div className="fz-profile-top">
      {/* ─────────────────────────────────────────────────────────────
          1. FULL-BLEED HERO BANNER WITH INTEGRATED NAV
      ───────────────────────────────────────────────────────────── */}
      <div className={`fz-hero-flip${flipped ? ' is-flipped' : ''}`}>
      <div className="fz-hero-flip__inner">
      <section className="fz-phero fz-hero-flip__face" inert={flipped}>
        {/* Banner photo: back (top-left) + change-banner camera (bottom-right, own profile). */}
        <div className="fz-phero__banner" style={{ backgroundImage: `url(${bannerUrl || '/images/profile/hero_banner.jpg'})` }}>
          {/* Profile has no navbar - this is the way home (the dashboard). */}
          <Link href="/dashboard" className="fz-phero__icon-btn fz-phero__back" aria-label="Back to home" title="Home">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </Link>
          {isOwnProfile && (
            <>
              <button
                type="button"
                className="fz-phero__icon-btn fz-phero__banner-btn"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingKind === 'banner'}
                aria-label="Change banner photo"
                title="Change banner photo"
              >
                {uploadingKind === 'banner' ? <Loader2 size={18} className="scout-spin" /> : <Camera size={18} />}
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

        <div className="fz-phero__body">
          {/* Avatar with gold ring, overlapping the banner */}
          <div className="fz-phero__avatar">
            <img
              src={avatarUrl || DEFAULT_AVATAR}
              alt={profile.name}
              onError={(e) => applyFallbackAvatar(e.currentTarget)}
              // A broken URL can fail before hydration attaches onError - check on mount too.
              ref={(img) => {
                if (img && img.complete && img.naturalWidth === 0) applyFallbackAvatar(img);
              }}
            />
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  className="fz-phero__avatar-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingKind === 'avatar'}
                  aria-label="Change profile picture"
                  title="Change profile picture"
                >
                  {uploadingKind === 'avatar' ? <Loader2 size={15} className="scout-spin" /> : <Camera size={15} />}
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

          {/* Name + level, handle · role, bio | edit / follow actions */}
          <div className="fz-phero__head">
            <div className="fz-phero__id">
              <div className="fz-phero__name-row">
                <h1 className="fz-phero__name">{profile.name}</h1>
                <span className="fz-phero__level">
                  <Crown size={14} strokeWidth={2.4} aria-hidden="true" />
                  LEVEL {profile.level ?? 1}
                </span>
              </div>
              <p className="fz-phero__handle">
                <span>@{profile.handle}</span>
                <span className="fz-phero__dot" aria-hidden="true">•</span>
                <span>{profile.role}</span>
                {profile.location && (
                  <>
                    <span className="fz-phero__dot" aria-hidden="true">•</span>
                    <span>{profile.location}</span>
                  </>
                )}
              </p>
              {profile.bio && <p className="fz-phero__bio">{profile.bio}</p>}
            </div>

            <div className="fz-phero__actions">
              {isOtherUser ? (
                <>
                  <button type="button" className="fz-phero__follow" onClick={handleFollowClick} disabled={isUpdating}>
                    {relationship.state === 'none'
                      ? 'Follow'
                      : relationship.state === 'incoming-pending'
                      ? 'Accept'
                      : relationship.state === 'outgoing-pending'
                      ? 'Requested'
                      : 'Following'}
                  </button>
                  <Link href={`/messages?userId=${userId}`} className="fz-phero__square-btn" aria-label={`Message ${profile.name}`} title="Message">
                    <MessageCircle size={19} />
                    <span className="fz-phero__btn-label">Message</span>
                  </Link>
                  {isRestaurant && (
                    <button type="button" className="fz-phero__square-btn" onClick={() => setIsRating(true)} aria-label={`Rate ${profile.name}`} title="Rate">
                      <Star size={19} />
                      <span className="fz-phero__btn-label">Rate</span>
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Stat tiles + Socials (flips the card to the user's social profiles) */}
          <div className="fz-phero__stats">
            <ul className="fz-phero__tiles">
              {isRestaurant ? (
                <>
                  <li className="fz-phero__tile">
                    <Star size={20} className="fz-phero__tile-icon fz-phero__tile-icon--bites" aria-hidden="true" />
                    <span className="fz-phero__tile-text">
                      <strong>{restaurant.summary.count ? restaurant.summary.average.toFixed(1) : 'New'}</strong>
                      <span>Rating</span>
                    </span>
                  </li>
                  <li className="fz-phero__tile">
                    <MessageSquareText size={20} className="fz-phero__tile-icon fz-phero__tile-icon--posts" aria-hidden="true" />
                    <span className="fz-phero__tile-text">
                      <strong>{formatCount(restaurant.summary.count)}</strong>
                      <span>{restaurant.summary.count === 1 ? 'Review' : 'Reviews'}</span>
                    </span>
                  </li>
                  {openStatus && (
                    <li className="fz-phero__tile fz-phero__tile--status">
                      <StatusPill status={openStatus} />
                    </li>
                  )}
                </>
              ) : (
                <>
                  {/* Post/bite counts would reveal a private profile's activity, so they're hidden until access is granted. */}
                  {!restricted && (
                    <>
                      <li className="fz-phero__tile">
                        <Hamburger size={20} className="fz-phero__tile-icon fz-phero__tile-icon--bites" aria-hidden="true" />
                        <span className="fz-phero__tile-text">
                          <strong>{profile.bites}</strong>
                          <span>Bites</span>
                        </span>
                      </li>
                      <li className="fz-phero__tile">
                        <FileText size={20} className="fz-phero__tile-icon fz-phero__tile-icon--posts" aria-hidden="true" />
                        <span className="fz-phero__tile-text">
                          <strong>{profile.posts}</strong>
                          <span>Posts</span>
                        </span>
                      </li>
                    </>
                  )}
                  <li className="fz-phero__tile">
                    <Users size={20} className="fz-phero__tile-icon fz-phero__tile-icon--friends" aria-hidden="true" />
                    <span className="fz-phero__tile-text">
                      <strong>{friendCount}</strong>
                      <span>Friends</span>
                    </span>
                  </li>
                  {/* Meetups you're going to - RSVPs are private to each chat, so only shown to you. */}
                  {isOwnProfile && meetups !== null && (
                    <li className="fz-phero__tile">
                      <CalendarCheck size={20} className="fz-phero__tile-icon fz-phero__tile-icon--meetups" aria-hidden="true" />
                      <span className="fz-phero__tile-text">
                        <strong>{meetups}</strong>
                        <span>Meetups</span>
                      </span>
                    </li>
                  )}
                </>
              )}
            </ul>
            <button
              type="button"
              className="fz-phero__socials"
              onClick={() => setFlipped(true)}
              aria-label={`Show ${profile.name}'s social profiles`}
            >
              <Repeat2 size={20} strokeWidth={2.4} aria-hidden="true" />
              <span className="fz-phero__socials-label">Socials</span>
            </button>
          </div>
        </div>
      </section>

      {/* Back of the card (the Socials button flips to it): the user's other social profiles. */}
      <section
        className="fz-hero-flip__face fz-hero-flip__back"
        aria-label={`${profile.name}'s social profiles`}
        inert={!flipped}
      >
        <div
          className="fz-hero-flip__back-bg"
          style={{ backgroundImage: `url(${bannerUrl || '/images/profile/hero_banner.jpg'})` }}
          aria-hidden="true"
        />
        <div className="fz-hero-flip__back-head">
          <img
            className="fz-hero-flip__back-avatar"
            src={avatarUrl || DEFAULT_AVATAR}
            alt=""
            onError={(e) => applyFallbackAvatar(e.currentTarget)}
            ref={(img) => {
              if (img && img.complete && img.naturalWidth === 0) applyFallbackAvatar(img);
            }}
          />
          <div className="fz-hero-flip__back-title">
            <span className="fz-hero-flip__back-eyebrow">Find me on</span>
            <strong>{profile.name}</strong>
          </div>
          {isOwnProfile && (
            <button
              type="button"
              className="fz-hero-flip__back-close"
              onClick={() => setEditingSocials(true)}
              aria-label="Edit your social profiles"
              title="Edit socials"
            >
              <Pencil size={15} strokeWidth={2.4} />
            </button>
          )}
          <button
            type="button"
            className="fz-hero-flip__back-close"
            onClick={() => setFlipped(false)}
            aria-label="Flip back to profile"
            title="Flip back"
          >
            <RotateCcw size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="fz-hero-flip__socials">
          {(isOwnProfile ? SOCIAL_PLATFORMS : linkedPlatforms).map((p) => {
            const Icon = SOCIAL_ICONS[p];
            const handle = socialLinks[p];
            const content = (
              <>
                <span className={`fz-social-badge fz-social-badge--${p}`} aria-hidden="true">
                  <Icon size={17} />
                </span>
                <span className="fz-hero-flip__social-text">
                  <span className="fz-hero-flip__social-name">{SOCIAL_META[p].label}</span>
                  <span className="fz-hero-flip__social-handle">{handle ? `@${handle}` : 'Add yours'}</span>
                </span>
                {handle ? <ArrowUpRight size={16} className="fz-hero-flip__social-go" /> : <Plus size={16} className="fz-hero-flip__social-go" />}
              </>
            );
            return handle ? (
              <a
                key={p}
                className="fz-hero-flip__social"
                href={SOCIAL_META[p].urlFor(handle)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            ) : (
              <button
                key={p}
                type="button"
                className="fz-hero-flip__social fz-hero-flip__social--empty"
                onClick={() => setEditingSocials(true)}
              >
                {content}
              </button>
            );
          })}
          {!isOwnProfile && linkedPlatforms.length === 0 && (
            <p className="fz-hero-flip__empty">{profile.name} hasn&apos;t linked any social profiles yet.</p>
          )}
        </div>
      </section>
      </div>
      </div>

      {uploadError && <div className="alert alert-danger small py-2 m-3">{uploadError}</div>}

      {editingSocials && currentUserId && (
        <SocialLinksSheet userId={currentUserId} onClose={() => setEditingSocials(false)} onSaved={setSocialLinks} />
      )}

      {isRating && isRestaurant && userId && currentUserId && (
        <RateRestaurantModal
          restaurantId={userId}
          restaurantName={profile.name}
          userId={currentUserId}
          onClose={() => setIsRating(false)}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. HIGHLIGHTS SECTION (3D FAN CAROUSEL)
      ───────────────────────────────────────────────────────────── */}
      {restricted ? null : isLoadingHighlights && highlights.length === 0 ? (
        // Same footprint as the real reel, so the page doesn't jump when it loads.
        <section className="fz-highlights-section" aria-busy="true" aria-label="Loading highlights">
          <div className="fz-highlights-section__inner">
            <div className="fz-highlights-section__header">
              <span className="fz-highlights-section__label">HIGHLIGHTS</span>
            </div>
            <div className="fz-highlights-section__carousel-stage" aria-hidden="true">
              {['left-1', 'right-1', 'center'].map((pos) => (
                <div key={pos} className={`fz-highlights-section__card fz-highlights-section__card--${pos} fz-highlights-section__card--skeleton`} />
              ))}
            </div>
          </div>
        </section>
      ) : displayHighlights.length === 0 ? (
        isOwnProfile ? (
          <section className="fz-highlights-section">
            <div className="fz-highlights-section__inner">
              <div className="fz-highlights-section__header">
                <span className="fz-highlights-section__label">HIGHLIGHTS</span>
              </div>
              <div className="fz-highlights-section__empty">
                <span className="fz-highlights-section__empty-icon" aria-hidden="true">
                  <Plus size={20} />
                </span>
                <div className="fz-highlights-section__empty-text">
                  <strong>Create your first highlight reel</strong>
                  <span>Curate your top food finds, favourite spots and dining moments.</span>
                </div>
                <button type="button" className="fz-highlights-section__empty-btn" onClick={() => setEditingHighlight('new')}>
                  <Plus size={15} /> Create highlight
                </button>
              </div>
            </div>
          </section>
        ) : null
      ) : (
        <section className="fz-highlights-section" aria-roledescription="carousel" aria-label="Highlights">
          <div className="fz-highlights-section__inner">
            {/* Header: title + current card (also announced) + Add / arrows */}
            <div className="fz-highlights-section__header">
              <div className="fz-highlights-section__heading">
                <span className="fz-highlights-section__label">HIGHLIGHTS</span>
                {activeItem && (
                  <span className="fz-highlights-section__now" aria-live="polite">
                    {totalItems > 1 ? `${activeSlot + 1} of ${totalItems} · ` : ''}
                    {activeItem.title}
                  </span>
                )}
              </div>
              <div className="fz-highlights-section__nav-btns">
                {isOwnProfile && (
                  <button
                    type="button"
                    className="fz-highlights-section__add-btn"
                    onClick={() => setEditingHighlight('new')}
                    aria-label="Add Highlight"
                    title="Add Highlight"
                  >
                    <Plus size={15} />
                    <span>Add</span>
                  </button>
                )}
                {totalItems > 1 && (
                  <>
                    <button
                      type="button"
                      className="fz-highlights-section__nav-btn"
                      onClick={handlePrev}
                      aria-label="Previous Highlight"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className="fz-highlights-section__nav-btn"
                      onClick={handleNext}
                      aria-label="Next Highlight"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3D Fan Carousel Stage - swipe left/right on touch (Framer Motion pan). */}
            <motion.div
              className="fz-highlights-section__carousel-stage"
              onPanStart={() => {
                pannedAt.current = Date.now();
              }}
              onPanEnd={(_, info) => {
                pannedAt.current = Date.now();
                if (Math.abs(info.offset.x) < 40 || Math.abs(info.offset.x) < Math.abs(info.offset.y)) return;
                if (info.offset.x < 0) handleNext();
                else handlePrev();
              }}
            >
              {displayHighlights.map((item, index) => {
                const cardClass = getCardClass(index);
                const isCenter = cardClass === 'fz-highlights-section__card--center';
                return (
                  <div
                    key={item.id}
                    className={`fz-highlights-section__card ${cardClass}`}
                    onClick={() => {
                      // A swipe ends with a click on whichever card was under the finger - ignore it.
                      if (Date.now() - pannedAt.current < 350) return;
                      handleCardClick(index);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(index);
                      }
                    }}
                    // Only the front card is a keyboard stop; the arrows move between cards.
                    role={isCenter ? 'button' : undefined}
                    tabIndex={isCenter ? 0 : -1}
                    aria-label={isCenter ? `Open highlight: ${item.title}` : undefined}
                    aria-hidden={isCenter ? undefined : true}
                  >
                    <img src={item.cover_image_url} alt="" draggable={false} />
                    {/* Progressive blur gradient & dark fade overlays */}
                    <div className="fz-highlights-section__card__blur" />
                    <div className="fz-highlights-section__card__gradient" />
                    <div className="fz-highlights-section__card__content">
                      <h3 className="fz-highlights-section__card__title">{item.title}</h3>
                      <p className="fz-highlights-section__card__subtitle">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* Highlight Editor Modal */}
      {editingHighlight && (
        <HighlightEditorModal
          userId={currentUserId || userId || 'demo-user'}
          editing={editingHighlight === 'new' ? undefined : editingHighlight}
          onClose={() => setEditingHighlight(null)}
          onSaved={refetchHighlights}
          onDeleted={refetchHighlights}
        />
      )}

      {/* Highlight Viewer Modal */}
      {viewingHighlight && (
        <HighlightViewerModal
          highlight={viewingHighlight}
          isOwnProfile={isOwnProfile}
          onClose={() => setViewingHighlight(null)}
          onEdit={() => {
            setEditingHighlight(viewingHighlight);
            setViewingHighlight(null);
          }}
          onViewDetails={(item) => {
            setViewingHighlight(null);
            setViewingDetail(item);
          }}
        />
      )}

      {/* Card Details Modal */}
      {viewingDetail && viewingDetail.kind === 'card' && (
        <FoodCardDetailModal
          card={viewingDetail.data}
          currentUserId={currentUserId || ''}
          onClose={() => setViewingDetail(null)}
          onUpdated={() => setViewingDetail(null)}
        />
      )}

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      {/* Saved Item Details Modal */}
      {viewingDetail && viewingDetail.kind === 'saved' && (
        <SavedItemDetailModal
          item={viewingDetail.data}
          onClose={() => setViewingDetail(null)}
          onShareRequest={handleShareDetail}
        />
      )}
    </div>
  );
}

// Swap a broken avatar for the default one (instead of showing alt text in the ring).
const DEFAULT_AVATAR = '/images/profile/avatar.jpg';
function applyFallbackAvatar(img: HTMLImageElement) {
  if (!img.src.endsWith(DEFAULT_AVATAR)) img.src = DEFAULT_AVATAR;
}
