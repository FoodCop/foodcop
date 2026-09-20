'use client';

import { useMemo, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import type { GalleryPhoto } from '../demoProfile';

interface RestaurantGalleryTabProps {
  photos?: GalleryPhoto[];
}

export default function RestaurantGalleryTab({ photos = [] }: RestaurantGalleryTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  const categories = ['All', 'Food', 'Ambience', 'Interior', 'Bar'];

  const filteredPhotos = useMemo(() => {
    if (selectedFilter === 'All') return photos;
    return photos.filter((p) => p.category === selectedFilter);
  }, [photos, selectedFilter]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <Camera size={36} className="mb-2 opacity-50" />
        <div>No gallery photos uploaded yet.</div>
      </div>
    );
  }

  return (
    <div className="fz-restaurant-gallery py-3">
      {/* Category Pills */}
      <div className="d-flex gap-2 overflow-auto mb-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              selectedFilter === cat ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            onClick={() => setSelectedFilter(cat)}
          >
            {cat} {cat === 'All' ? `(${photos.length})` : ''}
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
