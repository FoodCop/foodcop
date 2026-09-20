'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, ExternalLink, Globe, MapPin, Navigation, Phone, Sparkles, Star, Users } from 'lucide-react';
import type { RestaurantInfo } from '../demoProfile';

interface RestaurantInfoTabProps {
  info?: RestaurantInfo;
  restaurantName: string;
}

export default function RestaurantInfoTab({ info, restaurantName }: RestaurantInfoTabProps) {
  const [reservationGuests, setReservationGuests] = useState('2');
  const [reservationDate, setReservationDate] = useState('Today, 8:00 PM');
  const [reserved, setReserved] = useState(false);

  if (!info) {
    return <div className="text-center py-5 text-muted">No information available for this restaurant.</div>;
  }

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    setReserved(true);
  };

  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  return (
    <div className="fz-restaurant-info py-3">
      {/* Top Tagline & Quick Stats Header */}
      <div className="p-3 mb-4 rounded-3 border" style={{ background: '#fbf7ec', borderColor: '#ece4d0' }}>
        <p className="lead mb-3 text-dark fw-medium" style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
          {info.tagline}
        </p>

        <div className="d-flex flex-wrap align-items-center gap-3" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-warning text-dark d-flex align-items-center gap-1 px-2 py-1">
              <Star size={12} fill="#241f16" /> {info.rating.toFixed(2)}
            </span>
            <span className="text-muted">({info.reviewCount} reviews)</span>
          </div>

          <span className="text-secondary">·</span>
          <span className="fw-semibold text-dark">{info.priceTier}</span>
          <span className="text-secondary">·</span>

          <div className="d-flex flex-wrap gap-1">
            {info.cuisines.map((c) => (
              <span key={c} className="badge bg-white text-dark border border-secondary-subtle">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Hours & Location */}
        <div className="col-12 col-md-7">
          {/* Operating Hours */}
          <div className="card border mb-4 shadow-sm">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2 px-3">
              <div className="d-flex align-items-center gap-2 fw-semibold">
                <Clock size={16} className="text-warning-emphasis" />
                <span>Hours & Schedule</span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                Open Now
              </span>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush" style={{ fontSize: '0.88rem' }}>
                {info.hours.map((item) => {
                  const isToday = item.day.toLowerCase() === todayName.toLowerCase();
                  return (
                    <li
                      key={item.day}
                      className={`list-group-item d-flex justify-content-between align-items-center px-3 py-2 ${
                        isToday ? 'fw-bold bg-warning-subtle text-dark' : ''
                      }`}
                    >
                      <span className="d-flex align-items-center gap-2">
                        {item.day}
                        {isToday && (
                          <span className="badge bg-dark text-white" style={{ fontSize: '0.65rem' }}>
                            TODAY
                          </span>
                        )}
                      </span>
                      <span>{item.hours}</span>
                    </li>
                  );
                })}
              </ul>
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
                  <p className="text-muted small mb-0">{info.address}</p>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(info.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary rounded-pill d-flex align-items-center gap-1 text-nowrap"
                >
                  <Navigation size={13} /> Get Directions
                </a>
              </div>

              {/* Contact Links */}
              <div className="pt-2 border-top d-flex flex-wrap gap-3 small text-muted">
                <a href={`tel:${info.phone}`} className="d-flex align-items-center gap-1 text-decoration-none text-dark">
                  <Phone size={14} className="text-secondary" /> {info.phone}
                </a>
                <a
                  href={info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center gap-1 text-decoration-none text-dark"
                >
                  <Globe size={14} className="text-secondary" /> Website <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* Amenities & Highlights */}
          <div className="card border shadow-sm">
            <div className="card-header bg-transparent border-bottom py-2 px-3 fw-semibold d-flex align-items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span>Features & Amenities</span>
            </div>
            <div className="card-body p-3">
              <div className="row g-2">
                {info.amenities.map((amenity) => (
                  <div key={amenity} className="col-6 col-md-6 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                    <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Table Reservation Card */}
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
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light rounded-pill px-3"
                    onClick={() => setReserved(false)}
                  >
                    Modify Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReserve} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-white-50 mb-1 d-flex align-items-center gap-1">
                      <Users size={13} /> Party Size
                    </label>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={reservationGuests}
                      onChange={(e) => setReservationGuests(e.target.value)}
                    >
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
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                    >
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
