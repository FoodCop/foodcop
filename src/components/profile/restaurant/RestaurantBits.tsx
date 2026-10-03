'use client';

import { Star, ThumbsUp, Flame, Utensils } from 'lucide-react';
import type { OpenStatus } from '@/lib/restaurant/hours';
import type { MenuItemDraft } from '@/lib/services/restaurantService';

// Small shared pieces of the restaurant view. Built from the existing
// Bootstrap + menu-card markup so the look stays the same as before.

export function formatPrice(price: number | string, currency = 'USD') {
  const n = Number(price);
  if (!Number.isFinite(n)) return '';
  const digits = n % 1 === 0 ? 0 : 2;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: 2 }).format(n);
  } catch {
    return n.toFixed(digits);
  }
}

export function formatCount(n: number) {
  return n.toLocaleString();
}

/** Read-only stars (supports halves for averages). */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="fz-stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="fz-stars__star" style={{ width: size, height: size }}>
            <Star size={size} className="fz-stars__empty" />
            <span className="fz-stars__fill" style={{ width: `${fill * 100}%` }}>
              <Star size={size} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** 🟢 Open now / 🔴 Closed pill - same badge look as the Info tab's old "Open Now". */
export function StatusPill({ status, onDark = false }: { status: OpenStatus | null; onDark?: boolean }) {
  if (!status) return null;
  return (
    <span
      className={`fz-open-pill ${status.isOpen ? 'is-open' : 'is-closed'}${onDark ? ' on-dark' : ''}`}
      title={status.detail}
    >
      <span className="fz-open-pill__dot" aria-hidden="true" />
      {status.label}
    </span>
  );
}

/** Veg / non-veg mark (green square-dot / red square-triangle, like Indian menus). */
export function VegMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span className={`fz-veg-mark ${isVeg ? 'is-veg' : 'is-nonveg'}`} title={isVeg ? 'Vegetarian' : 'Non-vegetarian'} aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
      <span />
    </span>
  );
}

/**
 * One menu item, as customers see it. Same card as the original menu tab
 * (photo + price strip on top, name/description/chips below) plus veg mark,
 * availability and Recommended/Popular labels. Also used as the live preview
 * in the Restaurant Dashboard, so owners see exactly what customers will.
 */
export function MenuItemCard({ item, currency = 'USD', footer }: { item: Omit<MenuItemDraft, 'id'>; currency?: string; footer?: React.ReactNode }) {
  const unavailable = !item.is_available;
  return (
    <div className={`card h-100 border shadow-sm fz-dish-card overflow-hidden${unavailable ? ' is-unavailable' : ''}`}>
      <div className="position-relative" style={{ height: '190px', background: '#241f16' }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-100 h-100 object-fit-cover" loading="lazy" />
        ) : (
          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50">
            <Utensils size={32} />
          </div>
        )}
        <div className="position-absolute top-0 start-0 m-2 d-flex flex-wrap gap-1">
          {item.is_recommended && (
            <span className="badge bg-warning text-dark d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
              <ThumbsUp size={12} /> RECOMMENDED
            </span>
          )}
          {item.is_popular && (
            <span className="badge bg-dark text-white d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
              <Flame size={12} className="text-warning" /> POPULAR
            </span>
          )}
        </div>
        {unavailable && <span className="fz-dish-card__soldout">Currently unavailable</span>}
        <div
          className="position-absolute bottom-0 start-0 w-100 p-2 text-white"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
        >
          <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#f1c74d' }}>
            {formatPrice(item.price, currency)}
          </span>
        </div>
      </div>

      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <h6 className="card-title fw-bold mb-1 d-flex align-items-center gap-2">
            <VegMark isVeg={item.is_veg} />
            <span>{item.name || 'Item name'}</span>
          </h6>
          {item.description && (
            <p className="card-text text-muted small mb-2" style={{ lineHeight: 1.4 }}>
              {item.description}
            </p>
          )}
        </div>
        <div>
          <div className="d-flex flex-wrap gap-1 mb-2">
            <span className="badge" style={{ background: '#fbf7ec', color: '#837a68', border: '1px solid #ece4d0', fontSize: '0.68rem' }}>
              {item.category || 'Category'}
            </span>
            <span
              className={`badge border ${item.is_available ? 'bg-success-subtle text-success border-success-subtle' : 'bg-danger-subtle text-danger border-danger-subtle'}`}
              style={{ fontSize: '0.68rem' }}
            >
              {item.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
