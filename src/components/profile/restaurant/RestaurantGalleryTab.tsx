'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, Eye, EyeOff, Image as ImageIcon, Users, X } from 'lucide-react';
import { useRestaurant } from '@/lib/hooks/useRestaurant';
import { verifiedPlaceId } from '@/lib/services/restaurantService';
import { CommunityPhotosService, type CommunityPhoto } from '@/lib/services/communityPhotosService';

// The owner's photos (Dashboard -> Photo gallery) plus "Visitors" photos:
// Restaurant posts FUZO members made here (client, 2026-10-14; plan Phase 6).
// The owner can hide a visitor photo from their gallery and restore it.
type GalleryItem = {
  id: string;
  url: string;
  title: string;
  category: string;
  community?: CommunityPhoto;
};

const VISITORS = 'Visitors';

interface RestaurantGalleryTabProps {
  /** The restaurant whose gallery (restaurant_profiles.gallery, set in the Dashboard) to show. */
  restaurantId: string;
  isOwner?: boolean;
  onManage?: () => void;
}

export default function RestaurantGalleryTab({ restaurantId, isOwner = false, onManage }: RestaurantGalleryTabProps) {
  const { loaded, profile } = useRestaurant(restaurantId);
  const placeId = verifiedPlaceId(profile);
  const [community, setCommunity] = useState<{ key: string; photos: CommunityPhoto[] } | null>(null);
  const [hideError, setHideError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const communityKey = `${restaurantId}|${placeId ?? ''}|${isOwner}`;

  useEffect(() => {
    if (!loaded || !restaurantId) return;
    let cancelled = false;
    CommunityPhotosService.list({ restaurantId, placeId }, { includeHidden: isOwner }).then((res) => {
      if (!cancelled) setCommunity({ key: communityKey, photos: res.success ? res.data ?? [] : [] });
    });
    return () => {
      cancelled = true;
    };
  }, [loaded, restaurantId, placeId, isOwner, communityKey]);
  // null while this restaurant's visitor photos are still loading.
  const communityPhotos = community?.key === communityKey ? community.photos : null;

  const photos: GalleryItem[] = useMemo(
    () => [
      ...(profile?.gallery ?? []).map((p, i) => ({ id: `${i}-${p.url}`, url: p.url, title: p.caption ?? '', category: p.category as string })),
      ...(communityPhotos ?? []).map((c) => ({ id: c.key, url: c.url, title: c.caption ?? '', category: VISITORS, community: c })),
    ],
    [profile?.gallery, communityPhotos],
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePhoto = photos.find((p) => p.id === activeId) ?? null;

  const categories = ['All', ...['Food', 'Ambience', 'Interior', 'Bar', VISITORS].filter((c) => photos.some((p) => p.category === c))];

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId]);

  const toggleHidden = async (photo: CommunityPhoto) => {
    setBusy(true);
    setHideError(null);
    const res = await CommunityPhotosService.setHidden(restaurantId, photo, !photo.hidden);
    setBusy(false);
    if (!res.success) {
      setHideError(/restaurant_gallery_hidden|schema cache|PGRST/i.test(res.error ?? '') ? 'This needs the latest database update.' : 'Could not update. Please try again.');
      return;
    }
    setCommunity((c) => c && { ...c, photos: c.photos.map((p) => (p.key === photo.key ? { ...p, hidden: !photo.hidden } : p)) });
  };

  const filteredPhotos = useMemo(() => {
    if (selectedFilter === 'All') return photos;
    return photos.filter((p) => p.category === selectedFilter);
  }, [photos, selectedFilter]);

  if (!loaded || (photos.length === 0 && communityPhotos === null)) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading gallery…</span>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <Camera size={36} className="mb-2 opacity-50" />
        <div className="mb-3">No photos yet. Photos visitors post here show up too.</div>
        {isOwner && onManage && (
          <button type="button" className="btn btn-sm btn-primary rounded-pill fw-bold px-3" onClick={onManage}>
            Add photos in Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fz-restaurant-gallery py-3">
      {/* Category Pills */}
      <div className="fz-activity-subtabs fz-activity-subtabs--inline mb-4" role="group" aria-label="Photo categories">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`fz-activity-subtab${selectedFilter === cat ? ' fz-activity-subtab--active' : ''}`}
            aria-pressed={selectedFilter === cat}
            onClick={() => setSelectedFilter(cat)}
          >
            <span>{cat}</span>
            {cat === 'All' && <span className="fz-activity-subtab__count">({photos.length})</span>}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="row g-3">
        {filteredPhotos.map((photo) => (
          <div key={photo.id} className="col-6 col-md-4 col-lg-3">
            <div
              className="position-relative rounded-3 overflow-hidden shadow-sm"
              style={{
                height: '220px',
                cursor: 'pointer',
                background: '#241f16',
                transition: 'transform 0.2s ease',
                opacity: photo.community?.hidden ? 0.45 : 1,
              }}
              onClick={() => setActiveId(photo.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveId(photo.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${photo.title || photo.category}${photo.community ? ` - by ${photo.community.author.name}` : ''}${photo.community?.hidden ? ' (hidden)' : ''}`}
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-100 h-100 object-fit-cover"
                loading="lazy"
              />
              <div
                className="position-absolute bottom-0 start-0 w-100 p-2 text-white"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
              >
                <span className="badge bg-dark bg-opacity-75 text-warning mb-1" style={{ fontSize: '0.65rem' }}>
                  {photo.community?.hidden ? 'Hidden' : photo.category}
                </span>
                <div
                  className="small text-truncate fw-medium"
                  style={{ fontSize: '0.78rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {photo.community ? `by ${photo.community.author.name}` : photo.title}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 1060,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setActiveId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
        >
          <div
            className="position-relative bg-dark rounded-4 overflow-hidden text-white shadow-2xl"
            style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-dark position-absolute top-0 end-0 m-3 rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ zIndex: 10, background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setActiveId(null)}
              aria-label="Close image modal"
            >
              <X size={18} />
            </button>

            <div style={{ maxHeight: '70vh', background: '#000' }} className="d-flex align-items-center justify-content-center">
              <img
                src={activePhoto.url}
                alt={activePhoto.title}
                className="w-100 h-100 object-fit-contain"
                style={{ maxHeight: '68vh' }}
              />
            </div>

            <div className="p-3 bg-dark border-top border-secondary">
              <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <div className="min-w-0">
                  {activePhoto.title && <h6 className="mb-1 text-white fw-bold">{activePhoto.title}</h6>}
                  <span className="badge bg-warning text-dark">{activePhoto.category}</span>
                  {activePhoto.community && (
                    <Link href={`/profile/${activePhoto.community.author.id}`} className="ms-2 small text-white-50">
                      by {activePhoto.community.author.name}
                    </Link>
                  )}
                </div>
                {activePhoto.community && isOwner ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-light rounded-pill fw-bold d-flex align-items-center gap-1 px-3"
                    style={{ minHeight: 40 }}
                    disabled={busy}
                    onClick={() => toggleHidden(activePhoto.community!)}
                  >
                    {activePhoto.community.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                    {activePhoto.community.hidden ? 'Show in gallery' : 'Hide from gallery'}
                  </button>
                ) : (
                  <div className="text-white-50 small d-flex align-items-center gap-1">
                    {activePhoto.community ? <Users size={14} /> : <ImageIcon size={14} />}
                    {activePhoto.community ? 'Visitor photo' : 'Restaurant Gallery'}
                  </div>
                )}
              </div>
              {activePhoto.community && isOwner && (
                <p className="small text-white-50 mb-0 mt-2" role="status">
                  {hideError ??
                    (activePhoto.community.hidden
                      ? "Hidden from your gallery. It stays on the visitor's own profile."
                      : 'Hiding removes it from your gallery only.')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
