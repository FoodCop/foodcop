'use client';

import React from 'react';
import { X, Star, Clock, MapPin, Bookmark, Share2, Navigation, Globe, Phone, Check, ChevronDown } from 'lucide-react';
import type { ScoutPlace } from '@/types/scout';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ScoutPlaceModalProps {
  place: ScoutPlace;
  modalTab: string;
  setModalTab: (tab: string) => void;
  isLoadingDetails: boolean;
  isSaved?: boolean;
  onClose: () => void;
  onAction: (place: ScoutPlace, action: 'save' | 'share') => void;
  onContribute?: (place: ScoutPlace) => Promise<void>;
}

export const ScoutPlaceModal = ({
  place,
  modalTab,
  setModalTab,
  isLoadingDetails,
  isSaved = false,
  onClose,
  onAction,
  onContribute,
}: ScoutPlaceModalProps) => {

  const containerRef = useFocusTrap(true);
  const [editedName, setEditedName] = React.useState(place.name);
  const [editedCat, setEditedCat] = React.useState(place.cat);
  const [editedNotes, setEditedNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const priceStr = place.priceLevel ? '$'.repeat(place.priceLevel) : null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${place.name}`}
      className="scout-modal"
    >
      {/* Close button */}
      <div className="scout-modal__close-wrap">
        <button onClick={onClose} className="scout-modal__close">
          <X size={20} />
        </button>
      </div>

      {/* Hero Image */}
      <div className="scout-modal__hero">
        <img
          src={place.img}
          alt={place.name}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'; }}
        />
        <div className="scout-modal__hero-scrim" />
      </div>

      <div className="scout-modal__sheet">
        {/* Title & Quick Info */}
        <div className="scout-modal__title-block">
          {place.isNewFind ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="scout-modal__new-badge">New Discovery</span>
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Name this spot..."
                className="scout-modal__name-input"
              />
            </div>
          ) : (
            <>
              <h2 className="scout-modal__title">{place.name}</h2>
              <div className="scout-modal__rating-row">
                <span style={{ fontWeight: 700, color: '#1c1917' }}>{place.rating}</span>
                <div className="scout-modal__stars">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= Math.floor(place.rating) ? "currentColor" : "none"} />)}
                </div>
                <span>({place.reviews?.toLocaleString()})</span>
                {priceStr && <span>· {priceStr}</span>}
              </div>
              <div className="scout-modal__cat">{place.cat}</div>
            </>
          )}

          {isLoadingDetails && <p className="scout-modal__loading">Updating live details...</p>}
        </div>

        {/* Action Row */}
        {!place.isNewFind && (
          <div className="scout-modal__actions">
            <button
              className="scout-modal__action scout-modal__action--primary"
              onClick={() => {
                const params = new URLSearchParams({ api: '1', destination: `${place.lat},${place.lng}` });
                if (place.placeId) params.set('destination_place_id', place.placeId);
                window.open(`https://www.google.com/maps/dir/?${params.toString()}`, '_blank', 'noopener,noreferrer');
              }}
            >
              <div className="scout-modal__action-icon"><Navigation size={18} /></div>
              <span>Directions</span>
            </button>
            <button onClick={() => onAction(place, 'save')} className="scout-modal__action">
              <div className="scout-modal__action-icon"><Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} /></div>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button onClick={() => onAction(place, 'share')} className="scout-modal__action">
              <div className="scout-modal__action-icon"><Share2 size={18} /></div>
              <span>Share</span>
            </button>
          </div>
        )}

        {/* Primary Actions (Reserve / Order) */}
        {!place.isNewFind && (place.reservable || place.takeout || place.delivery) && (
          <div className="scout-modal__primary-actions">
            {place.reservable && (
              <button
                onClick={() => window.open(place.website || `https://www.google.com/search?q=${encodeURIComponent(place.name + ' reservations')}`, '_blank')}
                className="scout-modal__reserve"
              >
                <Bookmark size={16} /> Reserve a table
              </button>
            )}
            {(place.takeout || place.delivery) && (
              <button
                onClick={() => window.open(place.website || `https://www.google.com/search?q=${encodeURIComponent(place.name + ' order online')}`, '_blank')}
                className="scout-modal__order"
              >
                Order online
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="scout-modal__tabs">
          {['overview', 'photos', 'reviews', 'about'].map(tab => (
            <button
              key={tab}
              onClick={() => setModalTab(tab)}
              className={`scout-modal__tab${modalTab === tab ? ' is-active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="scout-modal__content">
          {/* OVERVIEW */}
          {modalTab === 'overview' && (
            <>
              {place.editorialSummary && (
                <p className="scout-modal__summary">{place.editorialSummary}</p>
              )}

              <div className="scout-modal__flags">
                {place.dineIn !== undefined && (
                  <div className={`scout-modal__flag${place.dineIn === false ? ' is-off' : ''}`}>
                    {place.dineIn ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                    <span>Dine-in</span>
                  </div>
                )}
                {place.takeout !== undefined && (
                  <div className={`scout-modal__flag${place.takeout === false ? ' is-off' : ''}`}>
                    {place.takeout ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                    <span>Takeaway</span>
                  </div>
                )}
                {place.delivery !== undefined && (
                  <div className={`scout-modal__flag${place.delivery === false ? ' is-off' : ''}`}>
                    {place.delivery ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                    <span>Delivery</span>
                  </div>
                )}
              </div>

              <div className="scout-modal__divider" />

              <div className="scout-modal__info-list">
                <div className="scout-modal__info-row">
                  <MapPin size={20} />
                  <p>{place.address}</p>
                </div>

                <div className="scout-modal__info-row">
                  <Clock size={20} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p>
                        {place.currentOpeningHours?.open_now ? (
                          <span className="scout-modal__open-now">Open now</span>
                        ) : (
                          <span className="scout-modal__closed">Closed</span>
                        )}
                      </p>
                      <ChevronDown size={16} style={{ color: '#a8a29e' }} />
                    </div>
                  </div>
                </div>

                {place.website && (
                  <div className="scout-modal__info-row">
                    <Globe size={20} />
                    <a
                      href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}
                    >
                      {place.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  </div>
                )}

                {place.phone && (
                  <div className="scout-modal__info-row">
                    <Phone size={20} />
                    <p>{place.phone}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PHOTOS */}
          {modalTab === 'photos' && (
            <>
              {place.photos && place.photos.length > 0 ? (
                <div className="scout-modal__photos-grid">
                  {place.photos.map((photoUrl, idx) => (
                    <div key={idx} className="scout-modal__photo">
                      <img
                        src={photoUrl}
                        alt={`${place.name} photo ${idx + 1}`}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400'; }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="scout-modal__empty-photos">No photos available.</div>
              )}

              {(place.menuLink || place.website) && (
                <div className="scout-modal__menu-link-wrap">
                  <p className="scout-modal__menu-hint">Looking for the menu?</p>
                  <a
                    href={place.menuLink || place.website}
                    target="_blank"
                    rel="noreferrer"
                    className="scout-modal__menu-link"
                  >
                    View website menu
                  </a>
                </div>
              )}
            </>
          )}

          {/* REVIEWS */}
          {modalTab === 'reviews' && (
            <>
              <div className="scout-modal__rating-summary">
                <div className="scout-modal__rating-big">{place.rating}</div>
                <div>
                  <div className="scout-modal__stars" style={{ marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} fill={star <= Math.floor(place.rating) ? "currentColor" : "none"} />)}
                  </div>
                  <div style={{ fontSize: 12, color: '#a8a29e' }}>{place.reviews?.toLocaleString()} reviews</div>
                </div>
              </div>

              {(place.userReviews || []).map((review) => (
                <div key={`${review.user}-${review.time}`} className="scout-modal__review">
                  <div className="scout-modal__review-user">
                    <div className="scout-modal__review-avatar">
                      {review.user.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{review.user}</div>
                      <div style={{ fontSize: 12, color: '#a8a29e' }}>{review.time}</div>
                    </div>
                  </div>
                  <div className="scout-modal__stars">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={12} fill={star <= review.rating ? "currentColor" : "none"} />)}
                  </div>
                  {review.text && <p className="scout-modal__review-text">{review.text}</p>}
                </div>
              ))}
            </>
          )}

          {/* ABOUT */}
          {modalTab === 'about' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 className="scout-modal__section-title">Service options</h3>
                <div className="scout-modal__flag-grid">
                  {place.takeout !== undefined && (
                    <div className="scout-modal__flag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {place.takeout ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                      <span className={place.takeout ? '' : 'is-off'}>Takeaway</span>
                    </div>
                  )}
                  {place.delivery !== undefined && (
                    <div className="scout-modal__flag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {place.delivery ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                      <span className={place.delivery ? '' : 'is-off'}>Delivery</span>
                    </div>
                  )}
                  {place.dineIn !== undefined && (
                    <div className="scout-modal__flag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {place.dineIn ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                      <span className={place.dineIn ? '' : 'is-off'}>Dine-in</span>
                    </div>
                  )}
                </div>
              </div>

              {(place.servesBeer !== undefined || place.servesWine !== undefined || place.servesVegetarianFood !== undefined) && (
                <>
                  <div className="scout-modal__divider" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h3 className="scout-modal__section-title">Offerings</h3>
                    <div className="scout-modal__flag-grid">
                      {place.servesBeer !== undefined && (
                        <div className="scout-modal__flag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {place.servesBeer ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                          <span className={place.servesBeer ? '' : 'is-off'}>Beer</span>
                        </div>
                      )}
                      {place.servesWine !== undefined && (
                        <div className="scout-modal__flag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {place.servesWine ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                          <span className={place.servesWine ? '' : 'is-off'}>Wine</span>
                        </div>
                      )}
                      {place.servesVegetarianFood !== undefined && (
                        <div className="scout-modal__flag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {place.servesVegetarianFood ? <Check size={16} className="is-yes" /> : <X size={16} className="is-no" />}
                          <span className={place.servesVegetarianFood ? '' : 'is-off'}>Vegetarian food</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer for new finds */}
        {place.isNewFind && (
          <div className="scout-modal__contribute-footer">
            <button
              onClick={async () => {
                if (onContribute) {
                  setIsSubmitting(true);
                  await onContribute({ ...place, name: editedName, cat: editedCat, notes: editedNotes });
                  setIsSubmitting(false);
                  onClose();
                }
              }}
              disabled={isSubmitting || !editedName.trim()}
              className="scout-modal__contribute-btn"
            >
              {isSubmitting ? 'Contributing...' : 'Add to FUZO'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
