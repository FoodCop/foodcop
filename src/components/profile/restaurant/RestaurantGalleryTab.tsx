'use client';

import { useMemo, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import type { GalleryPhoto } from '../demoProfile';
import { useRestaurant } from '@/lib/hooks/useRestaurant';

interface RestaurantGalleryTabProps {
  /** The restaurant whose gallery (restaurant_profiles.gallery, set in the Dashboard) to show. */
  restaurantId: string;
  isOwner?: boolean;
  onManage?: () => void;
}

export default function RestaurantGalleryTab({ restaurantId, isOwner = false, onManage }: RestaurantGalleryTabProps) {
  const { loaded, profile } = useRestaurant(restaurantId);
  const photos: GalleryPhoto[] = useMemo(
    () => (profile?.gallery ?? []).map((p, i) => ({ id: `${i}-${p.url}`, url: p.url, title: p.caption ?? '', category: p.category })),
    [profile?.gallery],
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  const categories = ['All', ...['Food', 'Ambience', 'Interior', 'Bar'].filter((c) => photos.some((p) => p.category === c))];

  const filteredPhotos = useMemo(() => {
    if (selectedFilter === 'All') return photos;
    return photos.filter((p) => p.category === selectedFilter);
  }, [photos, selectedFilter]);

  if (!loaded) {
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
        <div className="mb-3">No gallery photos uploaded yet.</div>
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
              }}
              onClick={() => setActivePhoto(photo)}
              role="button"
              tabIndex={0}
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
                  {photo.category}
                </span>
                <div
                  className="small text-truncate fw-medium"
                  style={{ fontSize: '0.78rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {photo.title}
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
          onClick={() => setActivePhoto(null)}
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
              onClick={() => setActivePhoto(null)}
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
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1 text-white fw-bold">{activePhoto.title}</h6>
                  <span className="badge bg-warning text-dark">{activePhoto.category}</span>
                </div>
                <div className="text-white-50 small d-flex align-items-center gap-1">
                  <ImageIcon size={14} /> Restaurant Gallery
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
