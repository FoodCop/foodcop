'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Clock, ExternalLink, Globe, MapPin, MessageSquare, Navigation, Phone, Sparkles, Star, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOpenStatus, useRestaurant } from '@/lib/hooks/useRestaurant';
import { DAY_KEYS, DAY_LABELS, WEEK_ORDER, formatDay, hasAnyHours } from '@/lib/restaurant/hours';
import { RestaurantService, type RestaurantReview } from '@/lib/services/restaurantService';
import RateRestaurantModal from './RateRestaurantModal';
import { Stars, StatusPill, formatCount } from './RestaurantBits';

interface RestaurantInfoTabProps {
  restaurantId: string;
  restaurantName: string;
  isOwner?: boolean;
}

// About & Hours - same layout as before, now fed by the restaurant's own
// details (Dashboard tab), real working hours with a live Open/Closed badge,
// and real ratings & reviews.
export default function RestaurantInfoTab({ restaurantId, restaurantName, isOwner = false }: RestaurantInfoTabProps) {
  const { loaded, profile, summary } = useRestaurant(restaurantId);
  const status = useOpenStatus(profile);
  const [reservationGuests, setReservationGuests] = useState('2');
  const [reservationDate, setReservationDate] = useState('Today, 8:00 PM');
  const [reserved, setReserved] = useState(false);

  if (!loaded) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    setReserved(true);
  };

  // "Today" in the restaurant's own timezone.
  let todayKey: string = DAY_KEYS[new Date().getDay()];
  try {
    const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: profile?.timezone || undefined }).format(new Date()).toLowerCase().slice(0, 3);
    if ((DAY_KEYS as readonly string[]).includes(wd)) todayKey = wd;
  } catch {
    /* fall back to the browser's day */
  }

  const hasDetails = !!(profile?.tagline || profile?.cuisines.length || profile?.price_tier);
  const directionsQuery = profile?.address || profile?.place_name || restaurantName;

  return (
    <div className="fz-restaurant-info py-3">
      {/* Top Tagline & Quick Stats Header */}
      <div className="p-3 mb-4 rounded-3 border" style={{ background: '#fbf7ec', borderColor: '#ece4d0' }}>
        {profile?.tagline && (
          <p className="lead mb-3 text-dark fw-medium" style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
            {profile.tagline}
          </p>
        )}

        <div className="d-flex flex-wrap align-items-center gap-3" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-warning text-dark d-flex align-items-center gap-1 px-2 py-1">
              <Star size={12} fill="#241f16" /> {summary.count ? summary.average.toFixed(1) : 'New'}
            </span>
            <span className="text-muted">({formatCount(summary.count)} {summary.count === 1 ? 'review' : 'reviews'})</span>
          </div>

          {status && <StatusPill status={status} />}

          {profile?.price_tier && (
            <>
              <span className="text-secondary">·</span>
              <span className="fw-semibold text-dark">{profile.price_tier}</span>
            </>
          )}

          {!!profile?.cuisines.length && (
            <>
              <span className="text-secondary">·</span>
              <div className="d-flex flex-wrap gap-1">
                {profile.cuisines.map((c) => (
                  <span key={c} className="badge bg-white text-dark border border-secondary-subtle">
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        {!hasDetails && isOwner && (
          <div className="small text-muted mt-2">Add your tagline, cuisines and price range in the Dashboard tab.</div>
        )}
      </div>

      <div className="row g-4">
        {/* Left Column: Hours, Location, Amenities, Reviews */}
        <div className="col-12 col-md-7">
          {/* Operating Hours */}
          <div className="card border mb-4 shadow-sm">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2 px-3">
              <div className="d-flex align-items-center gap-2 fw-semibold">
                <Clock size={16} className="text-warning-emphasis" />
                <span>Hours & Schedule</span>
              </div>
              <StatusPill status={status} />
            </div>
            <div className="card-body p-0">
              {hasAnyHours(profile?.hours) ? (
                <ul className="list-group list-group-flush" style={{ fontSize: '0.88rem' }}>
                  {WEEK_ORDER.map((day) => {
                    const isToday = day === todayKey;
                    return (
                      <li
                        key={day}
                        className={`list-group-item d-flex justify-content-between align-items-center px-3 py-2 ${isToday ? 'fw-bold bg-warning-subtle text-dark' : ''}`}
                      >
                        <span className="d-flex align-items-center gap-2">
                          {DAY_LABELS[day]}
                          {isToday && (
                            <span className="badge bg-dark text-white" style={{ fontSize: '0.65rem' }}>
                              TODAY
                            </span>
                          )}
                        </span>
                        <span>{formatDay(profile?.hours?.[day])}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-3 small text-muted">{isOwner ? 'Set your working hours in the Dashboard tab.' : 'Hours not listed yet.'}</div>
              )}
            </div>
          </div>

          {/* Location & Directions */}
          <div className="card border mb-4 shadow-sm">
            <div className="card-header bg-transparent border-bottom py-2 px-3 fw-semibold d-flex align-items-center gap-2">
              <MapPin size={16} className="text-danger" />
              <span>Location & Neighborhood</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <h6 className="mb-1 fw-bold">{restaurantName}</h6>
                  <p className="text-muted small mb-0">{profile?.address || 'Address not listed yet.'}</p>
                </div>
                {directionsQuery && (profile?.address || profile?.place_id) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}${profile?.place_id ? `&query_place_id=${encodeURIComponent(profile.place_id)}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary rounded-pill d-flex align-items-center gap-1 text-nowrap"
                  >
                    <Navigation size={13} /> Get Directions
                  </a>
                )}
              </div>

              {(profile?.phone || profile?.website) && (
                <div className="pt-2 border-top d-flex flex-wrap gap-3 small text-muted">
                  {profile?.phone && (
                    <a href={`tel:${profile.phone}`} className="d-flex align-items-center gap-1 text-decoration-none text-dark">
                      <Phone size={14} className="text-secondary" /> {profile.phone}
                    </a>
                  )}
                  {profile?.website && (
                    <a
                      href={/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center gap-1 text-decoration-none text-dark"
                    >
                      <Globe size={14} className="text-secondary" /> Website <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Amenities & Highlights */}
          {!!profile?.amenities.length && (
            <div className="card border mb-4 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-2 px-3 fw-semibold d-flex align-items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span>Features & Amenities</span>
              </div>
              <div className="card-body p-3">
                <div className="row g-2">
                  {profile.amenities.map((amenity) => (
                    <div key={amenity} className="col-6 col-md-6 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                      <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <ReviewsCard restaurantId={restaurantId} restaurantName={restaurantName} isOwner={isOwner} />
        </div>

        {/* Right Column: Interactive Table Reservation Card (unchanged) */}
        <div className="col-12 col-md-5">
          <div className="card border-0 shadow-lg text-white" style={{ background: '#241f16', borderRadius: '1rem' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Calendar size={18} className="text-warning" />
                <h5 className="card-title fw-bold mb-0 text-white">Reserve a Table</h5>
              </div>
              <p className="small text-white-50 mb-4">Instant dining confirmation with priority seating.</p>

              {reserved ? (
                <div className="text-center py-4">
                  <div className="display-4 mb-2">🎉</div>
                  <h6 className="fw-bold text-warning">Reservation Requested!</h6>
                  <p className="small text-white-50 mb-3">
                    Table for {reservationGuests} guests on {reservationDate}. The restaurant will confirm shortly via SMS.
                  </p>
                  <button type="button" className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => setReserved(false)}>
                    Modify Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReserve} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-white-50 mb-1 d-flex align-items-center gap-1">
                      <Users size={13} /> Party Size
                    </label>
                    <select className="form-select form-select-sm bg-dark text-white border-secondary" value={reservationGuests} onChange={(e) => setReservationGuests(e.target.value)}>
                      <option value="1">1 Person (Solo bar dining)</option>
                      <option value="2">2 Guests (Couple / Date)</option>
                      <option value="4">4 Guests (Dining table)</option>
                      <option value="6">6 Guests (Courtyard group)</option>
                      <option value="8+">8+ Guests (Chef tasting feast)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label small text-white-50 mb-1 d-flex align-items-center gap-1">
                      <Clock size={13} /> Time & Seating
                    </label>
                    <select className="form-select form-select-sm bg-dark text-white border-secondary" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)}>
                      <option value="Today, 7:30 PM">Today, 7:30 PM (Courtyard)</option>
                      <option value="Today, 8:00 PM">Today, 8:00 PM (Dining Room)</option>
                      <option value="Today, 9:00 PM">Today, 9:00 PM (Late Seating)</option>
                      <option value="Tomorrow, 1:00 PM">Tomorrow, 1:00 PM (Lunch)</option>
                      <option value="Tomorrow, 8:30 PM">Tomorrow, 8:30 PM (Dinner)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="btn btn-primary w-100 fw-bold py-2 rounded-pill">
                      Confirm Table Request
                    </button>
                  </div>

                  <div className="text-center" style={{ fontSize: '0.72rem', color: '#837a68' }}>
                    Free cancellation up to 2 hours prior · No booking fee
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ratings & Reviews ──────────────────────────────────────────────────────
function ReviewsCard({ restaurantId, restaurantName, isOwner }: { restaurantId: string; restaurantName: string; isOwner: boolean }) {
  const { user } = useAuth();
  const { summary } = useRestaurant(restaurantId);
  const [reviews, setReviews] = useState<RestaurantReview[] | null>(null);
  const [rating, setRating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    RestaurantService.listReviews(restaurantId).then((res) => {
      if (!cancelled) setReviews(res.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, reloadKey]);

  const mine = reviews?.find((r) => r.user_id === user?.id) ?? null;
  const canRate = !!user && !isOwner;

  return (
    <div className="card border shadow-sm">
      <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <MessageSquare size={16} className="text-warning-emphasis" />
          <span>Ratings & Reviews</span>
        </div>
        {canRate && (
          <button type="button" className="btn btn-sm btn-primary rounded-pill fw-bold" onClick={() => setRating(true)}>
            {mine ? 'Edit your rating' : 'Rate this Restaurant'}
          </button>
        )}
      </div>
      <div className="card-body p-3">
        {/* Summary + breakdown */}
        <div className="d-flex align-items-center gap-4 flex-wrap mb-3">
          <div className="text-center">
            <div className="fw-bold" style={{ fontSize: '2.2rem', lineHeight: 1, fontFamily: 'var(--heading-font)' }}>
              {summary.count ? summary.average.toFixed(1) : '–'}
            </div>
            <Stars value={summary.average} size={14} />
            <div className="small text-muted mt-1">
              {formatCount(summary.count)} {summary.count === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 180 }}>
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const pct = summary.count ? (summary.breakdown[n] / summary.count) * 100 : 0;
              return (
                <div key={n} className="d-flex align-items-center gap-2 small">
                  <span style={{ width: 12 }}>{n}</span>
                  <div className="flex-grow-1 rounded-pill" style={{ height: 6, background: 'rgba(36,31,22,0.08)' }}>
                    <div className="rounded-pill" style={{ width: `${pct}%`, height: '100%', background: '#f1c74d' }} />
                  </div>
                  <span className="text-muted text-end" style={{ width: 28 }}>{summary.breakdown[n]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!user && <div className="small text-muted mb-3"><Link href="/login">Sign in</Link> to rate this restaurant.</div>}

        {/* Review list */}
        {reviews === null ? (
          <div className="small text-muted">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="small text-muted">No reviews yet{canRate ? ' - be the first to rate it.' : '.'}</div>
        ) : (
          <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
            {reviews.slice(0, 20).map((r) => (
              <li key={r.id} className="border-top pt-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  {r.author?.avatarUrl ? (
                    <img src={r.author.avatarUrl} alt="" className="rounded-circle object-fit-cover" style={{ width: 32, height: 32 }} />
                  ) : (
                    <span className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32, background: '#fbf3d5' }}>
                      {(r.author?.name ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold small text-truncate">{r.author?.name ?? 'FUZO user'}{r.user_id === user?.id && ' (you)'}</div>
                    <Stars value={r.rating} size={12} />
                  </div>
                  <span className="small text-muted">{new Date(r.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {r.body && <p className="small mb-2" style={{ whiteSpace: 'pre-line' }}>{r.body}</p>}
                {r.photos.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap">
                    {r.photos.map((p) => (
                      <img key={p} src={p} alt="" className="rounded-3 object-fit-cover" style={{ width: 72, height: 72 }} loading="lazy" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {rating && user && (
        <RateRestaurantModal
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          userId={user.id}
          existing={mine}
          onClose={() => setRating(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
