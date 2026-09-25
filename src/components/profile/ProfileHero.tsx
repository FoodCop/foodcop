'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Loader2, Plus, Repeat2, RotateCcw } from 'lucide-react';
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
import { SOCIAL_ICONS } from './settings/SocialLinksEditor';
import { SOCIAL_META, SOCIAL_PLATFORMS, SocialLinksService, type SocialLinks } from '@/lib/services/socialLinksService';

// The hero card flips to show the user's other social profiles - a mobile-only
// interaction (desktop keeps the wide banner with its Edit Profile / Banner buttons).
const MOBILE_QUERY = '(max-width: 768px)';
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

export type ActivityCategory = 'places' | 'recipes' | 'videos' | 'posts';
export type ProfileNavTarget = { tab: 'settings' } | { tab: 'activity'; category: ActivityCategory };

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
  onNavigate,
  restricted = false,
  onRelationshipChange,
}: {
  profile: UserProfile;
  userId?: string;
  onNavigate?: (target: ProfileNavTarget) => void;
  /** Private profile the viewer can't see into yet: header + Follow/Message only, no highlights or post counts. */
  restricted?: boolean;
  /** Fired when a follow/accept/unfollow changes the relationship, so the page can re-check access. */
  onRelationshipChange?: (state: FriendRelationshipState) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isOtherUser = !!userId && !!currentUserId && userId !== currentUserId;
  const isOwnProfile = !!currentUserId && !isOtherUser;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('light');

  const [relationship, setRelationship] = useState<{ state: FriendRelationshipState; requestId: string | null }>({
    state: 'none',
    requestId: null,
  });
  const [friendCount, setFriendCount] = useState(profile.friends ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof profile.friends === 'number') {
      setFriendCount(profile.friends);
    }
  }, [profile.friends]);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '/images/profile/avatar.jpg');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || '/images/profile/hero_banner.jpg');
  const [uploadingKind, setUploadingKind] = useState<'avatar' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [highlights, setHighlights] = useState<ProfileHighlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);
  const [editingHighlight, setEditingHighlight] = useState<ProfileHighlight | 'new' | null>(null);
  const [viewingHighlight, setViewingHighlight] = useState<ProfileHighlight | null>(null);
  const [viewingDetail, setViewingDetail] = useState<HighlightItemRef | null>(null);

  const isMobile = useIsMobile();
  const [flipped, setFlipped] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const isFlipped = isMobile && flipped;

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
    refetchHighlights();
  }, [refetchHighlights]);

  useEffect(() => {
    if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
    if (profile.bannerUrl) setBannerUrl(profile.bannerUrl);
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

  const handleShareDetail = async (item: { name?: string; title?: string }) => {
    const name = item.name || item.title || 'this find';
    const text = `Check out ${name} on FUZO!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'FUZO', text });
      } catch {
        // user cancelled
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard fallback
    }
  };

  // Convert real user highlights to carousel items
  const displayHighlights: DisplayHighlight[] = highlights.map((h) => ({
    id: h.id,
    title: h.title,
    subtitle: `${h.items?.length ?? 1} cards`,
    cover_image_url: h.cover_image_url || '/images/profile/ramen.jpg',
    raw: h,
  }));

  const totalItems = displayHighlights.length;
  const activeItem = totalItems > 0 ? displayHighlights[((activeIndex % totalItems) + totalItems) % totalItems] : null;

  const handlePrev = () => {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const handleNext = () => {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalItems);
  };

  const handleCardClick = (index: number) => {
    if (index === activeIndex) {
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
    let diff = index - activeIndex;
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
    <div>
      {/* ─────────────────────────────────────────────────────────────
          1. FULL-BLEED HERO BANNER WITH INTEGRATED NAV
      ───────────────────────────────────────────────────────────── */}
      <div className={`fz-hero-flip${isFlipped ? ' is-flipped' : ''}`}>
      <div className="fz-hero-flip__inner">
      <section
        className="fz-hero-full-banner fz-hero-flip__face"
        style={{ backgroundImage: `url(${bannerUrl || '/images/profile/hero_banner.jpg'})` }}
        inert={isFlipped}
      >
        <div className="fz-hero-full-banner__overlay" />

        {/* Header: Top-Left Back Arrow with Centered Brand Logo */}
        <header className="fz-hero-full-banner__nav">
          <button
            type="button"
            onClick={handleBack}
            className="fz-hero-full-banner__back-btn"
            aria-label="Back to previous screen"
            title="Back to previous screen"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <Link href="/" className="fz-hero-full-banner__logo" aria-label="FUZO Home">
            <img src="/fuzo_logo.svg" alt="FUZO" />
          </Link>
        </header>

        {/* Bottom Profile Info & Actions */}
        <div className="fz-hero-full-banner__bottom">
          <div className="fz-hero-full-banner__profile-info">
            {/* Avatar with Gold Ring */}
            <div className="fz-hero-full-banner__avatar-wrap">
              <img
                src={avatarUrl || '/images/profile/avatar.jpg'}
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
                    className="fz-hero-full-banner__avatar-btn"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingKind === 'avatar'}
                    aria-label="Change profile picture"
                  >
                    {uploadingKind === 'avatar' ? <Loader2 size={13} className="scout-spin" /> : <Camera size={13} />}
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

            {/* Name, Level, Handle, Location, Stats */}
            <div className="fz-hero-full-banner__text-meta">
              <div className="fz-hero-full-banner__name-row">
                <h1 className="fz-hero-full-banner__name">{profile.name}</h1>
                <span className="fz-hero-full-banner__level-badge">LEVEL {profile.level ?? 1}</span>
              </div>

              <div className="fz-hero-full-banner__subtitle">
                <span>@{profile.handle}</span>
                <span className="fz-hero-full-banner__dot">·</span>
                <span>{profile.role}</span>
                {profile.location && (
                  <>
                    <span className="fz-hero-full-banner__dot">·</span>
                    <span>{profile.location}</span>
                  </>
                )}
              </div>

              {profile.bio && <p className="fz-hero-full-banner__bio">{profile.bio}</p>}

              {/* On mobile the stats row is the flip trigger (back = social profiles). */}
              <StatsRow
                asButton={isMobile}
                onClick={() => setFlipped(true)}
                label={`Show ${profile.name}'s social profiles`}
              >
                {/* Post/bite counts would reveal a private profile's activity, so they're hidden until access is granted. */}
                {!restricted && (
                  <>
                    <div className="fz-hero-full-banner__stat">
                      <strong>{profile.bites}</strong>
                      <span>Bites</span>
                    </div>
                    <div className="fz-hero-full-banner__stat">
                      <strong>{profile.posts}</strong>
                      <span>Posts</span>
                    </div>
                  </>
                )}
                <div className="fz-hero-full-banner__stat">
                  <strong>{friendCount}</strong>
                  <span>Friends</span>
                </div>
                {isMobile && (
                  <span className="fz-hero-full-banner__flip-hint" aria-hidden="true">
                    <Repeat2 size={13} strokeWidth={2.4} />
                    Socials
                  </span>
                )}
              </StatsRow>
            </div>
          </div>

          {/* Action Buttons (Follow / Message) */}
          <div className="fz-hero-full-banner__actions">
            {isOtherUser ? (
              <>
                <button
                  type="button"
                  className="fz-hero-full-banner__btn-follow"
                  onClick={handleFollowClick}
                  disabled={isUpdating}
                >
                  {relationship.state === 'none'
                    ? 'Follow'
                    : relationship.state === 'incoming-pending'
                    ? 'Accept'
                    : relationship.state === 'outgoing-pending'
                    ? 'Requested'
                    : 'Following'}
                </button>
                <Link href={`/messages?userId=${userId}`} className="fz-hero-full-banner__btn-message">
                  Message
                </Link>
              </>
            ) : isOwnProfile ? (
              <>
                <button
                  type="button"
                  className="fz-hero-full-banner__btn-follow"
                  onClick={() => onNavigate?.({ tab: 'settings' })}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="fz-hero-full-banner__btn-message"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingKind === 'banner'}
                >
                  {uploadingKind === 'banner' ? <Loader2 size={14} className="scout-spin me-1" /> : null}
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
            ) : (
              // Default / demo preview mode matching the screenshot exactly
              <>
                <button type="button" className="fz-hero-full-banner__btn-follow">
                  Follow
                </button>
                <button type="button" className="fz-hero-full-banner__btn-message">
                  Message
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Back of the card (mobile only): the user's other social profiles. */}
      <section
        className="fz-hero-flip__face fz-hero-flip__back"
        aria-label={`${profile.name}'s social profiles`}
        inert={!isFlipped}
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
                onClick={() => {
                  setFlipped(false);
                  onNavigate?.({ tab: 'settings' });
                }}
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

      {/* ─────────────────────────────────────────────────────────────
          2. HIGHLIGHTS SECTION (3D FAN CAROUSEL)
      ───────────────────────────────────────────────────────────── */}
      {restricted ? null : displayHighlights.length === 0 ? (
        isOwnProfile ? (
          <section className="fz-highlights-section py-3">
            <div className="fz-highlights-section__inner">
              <div className="fz-highlights-section__header">
                <span className="fz-highlights-section__label">HIGHLIGHTS</span>
              </div>
              <div
                className="p-4 text-center rounded-3 border d-flex flex-column align-items-center justify-content-center my-2"
                style={{ background: '#fffefb', borderColor: '#ece4d0' }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                  style={{ width: 44, height: 44, background: '#fbf7ec' }}
                >
                  <Plus size={20} className="text-warning-emphasis" />
                </div>
                <h6 className="fw-bold mb-1 text-dark">Create Your First Highlight Reel</h6>
                <p className="text-muted small mb-3" style={{ maxWidth: 420 }}>
                  Curate your top food discoveries, favorite spots, and dining moments into a showcase reel.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                  onClick={() => setEditingHighlight('new')}
                >
                  <Plus size={15} /> Create Highlight
                </button>
              </div>
            </div>
          </section>
        ) : null
      ) : (
        <section className="fz-highlights-section">
          <div className="fz-highlights-section__inner">
            {/* Header with HIGHLIGHTS and round arrow buttons */}
            <div className="fz-highlights-section__header">
              <span className="fz-highlights-section__label">HIGHLIGHTS</span>
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

            {/* 3D Fan Carousel Stage */}
            <div className="fz-highlights-section__carousel-stage">
              {displayHighlights.map((item, index) => {
                const cardClass = getCardClass(index);
                return (
                  <div
                    key={item.id}
                    className={`fz-highlights-section__card ${cardClass}`}
                    onClick={() => handleCardClick(index)}
                    role="button"
                    tabIndex={0}
                  >
                    <img src={item.cover_image_url} alt={item.title} />
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
            </div>

            {/* Caption underneath the cards */}
            {activeItem && (
              <p className="fz-highlights-section__caption">
                Click a card or use the arrows — {activeItem.title}
              </p>
            )}
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

// Stats row - a real <button> on mobile (it flips the hero card), a plain div elsewhere.
function StatsRow({
  asButton,
  onClick,
  label,
  children,
}: {
  asButton: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  if (!asButton) return <div className="fz-hero-full-banner__stats-row">{children}</div>;
  return (
    <button type="button" className="fz-hero-full-banner__stats-row fz-hero-full-banner__stats-row--btn" onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}
