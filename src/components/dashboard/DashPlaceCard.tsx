'use client';

import Link from 'next/link';
import { MapPin, Navigation, Sparkles, Star } from 'lucide-react';
import { StatusPill } from '@/components/profile/restaurant/RestaurantBits';
import type { DashPlace } from './useNearbyPlaces';

const formatKm = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

// One restaurant card in the dashboard rows. FUZO restaurants: gold "On FUZO"
// chip, real offer tag, live open/closed, link to their FUZO profile.
// Google places: taste/distance chip.
// Tapping the card opens the place on FUZO's map (Scout) with its pop-up - a
// FUZO restaurant's pop-up has "View on FUZO" for its full page. The round
// Directions button opens the route from the user's location instead. The card link is a stretched overlay so the
// button isn't nested inside it.
export default function DashPlaceCard({ place, lens }: { place: DashPlace; lens: 'match' | 'distance' }) {
  const body = (
    <>
      {place.image ? <img className="fz-dash-card__img" src={place.image} alt="" loading="lazy" /> : <span className="fz-dash-card__img fz-dash-card__img--empty" />}
      <span className="fz-dash-card__shade" />

      {place.fuzo ? (
        <span className="fz-dash-card__chip fz-dash-card__chip--gold">
          <Star size={11} fill="currentColor" /> On FUZO
        </span>
      ) : lens === 'match' && place.matchesTaste ? (
        <span className="fz-dash-card__chip fz-dash-card__chip--gold">
          <Sparkles size={11} /> Your taste
        </span>
      ) : lens === 'distance' && Number.isFinite(place.distanceMeters) ? (
        <span className="fz-dash-card__chip">
          <MapPin size={11} /> {formatKm(place.distanceMeters)}
        </span>
      ) : null}
      {place.fuzo?.offer && <span className="fz-dash-card__offer">{place.fuzo.offer}</span>}

      <span className="fz-dash-card__body">
        <span className="fz-dash-card__title">{place.name}</span>
        {place.fuzo?.status && (
          <span className="fz-dash-card__status">
            <StatusPill status={place.fuzo.status} onDark />
          </span>
        )}
        <span className="fz-dash-card__meta">
          {place.rating != null && place.rating > 0 && (
            <span className="fz-dash-card__rating">
              <Star size={11} fill="currentColor" /> {place.rating.toFixed(1)}
            </span>
          )}
          <span className="fz-dash-card__sub">
            {place.fuzo && lens === 'distance' && Number.isFinite(place.distanceMeters) ? `${formatKm(place.distanceMeters)} · ` : ''}
            {place.vicinity}
          </span>
        </span>
      </span>
    </>
  );

  const label = `${place.name}${place.fuzo ? ' on FUZO' : ''}${place.rating ? `, rated ${place.rating.toFixed(1)}` : ''}`;
  const className = `fz-dash-card${place.fuzo ? ' fz-dash-card--fuzo' : ''}${place.directionsHref ? ' fz-dash-card--has-dir' : ''}`;
  return (
    <div className={className}>
      {place.external ? (
        <a className="fz-dash-card__link" href={place.href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens Google Maps)`} />
      ) : (
        <Link className="fz-dash-card__link" href={place.href} aria-label={`${label} (opens on the map)`} />
      )}
      {body}
      {place.directionsHref && (
        <Link className="fz-dash-card__dir" href={place.directionsHref} aria-label={`Directions to ${place.name}`} title="Directions">
          <Navigation size={16} strokeWidth={2.4} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
