'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { citiesNear, countriesNear } from '@/lib/geo/cities';
import type { LocationState } from './useNearbyPlaces';

// Explore row at the top of For you, with a Cities | Countries switch:
//   Cities    - "Explore <country>'s cities", nearest first.
//   Countries - "Explore countries": other countries nearest first, each
//               opening on its best-known food city.
// Round food photos with the name underneath; tapping one opens Scout centred
// on that place. Everything here is FUZO's own data and images, so this row
// never calls Google (docs/GOOGLE_COST_PLAN.md). Location = GPS or saved home
// area, the same one the restaurant rows use.

type Mode = 'cities' | 'countries';

const scoutAreaLink = (name: string, lat: number, lng: number) =>
  `/scout?${new URLSearchParams({ view: 'area', name, lat: String(lat), lng: String(lng) }).toString()}`;

/** Small flag image (Windows can't draw flag emoji, so no 🇹🇭 here). */
const flagSrc = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const FOOD_PHOTOS = ['grilled-peppers', 'noodles-wine', 'pancake-stack', 'smoky-pot', 'tandoori-red'];
/** The same place always gets the same photo. */
const foodPhoto = (name: string) => {
  const sum = [...name].reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return `/images/hero-cards/${FOOD_PHOTOS[sum % FOOD_PHOTOS.length]}.jpg`;
};

export function NearbyCities({ loc, locationSlot }: {
  loc: LocationState;
  /** Shown on the right of the header: Home's compact location control (client, 2026-10-07). */
  locationSlot?: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>('cities');
  const lat = loc.status === 'ready' ? loc.lat : null;
  const lng = loc.status === 'ready' ? loc.lng : null;

  const nearby = useMemo(() => (lat === null || lng === null ? null : citiesNear(lat, lng)), [lat, lng]);
  const countries = useMemo(
    () => (lat === null || lng === null ? null : countriesNear(lat, lng, nearby?.country?.code ?? null)),
    [lat, lng, nearby],
  );

  // No location (the restaurant rows already show how to fix that): hide.
  if (loc.status === 'unavailable') return null;

  const cities = nearby?.cities ?? null;
  const country = nearby?.country?.name ?? null;
  const here = cities?.[0];
  const isHere = (distanceKm: number) => distanceKm < 15;

  // "Canada's cities", but "the Netherlands' cities" style for names ending in s.
  const title =
    mode === 'countries'
      ? 'Explore countries'
      : country
        ? `Explore ${country}${country.endsWith('s') ? '’' : '’s'} cities`
        : 'Explore cities near you';
  const sub = mode === 'countries' ? 'Nearest first · opens on each country’s food city' : here ? `Nearest first · around ${here.name}` : null;

  const list = mode === 'cities' ? cities : countries;

  return (
    <section className="fz-dash-cities" aria-labelledby="fz-dash-cities-title">
      <div className="fz-dash-cities__head">
        <div className="fz-dash-cities__heading">
          <h2 id="fz-dash-cities-title" className="fz-dash-cities__title">{title}</h2>
          {sub && <p className="fz-dash-cities__sub">{sub}</p>}
        </div>
        {locationSlot && <div className="fz-dash-cities__loc">{locationSlot}</div>}
      </div>

      {/* Cities | Countries on its own row under the title. */}
      <div className="fz-dash-cities__modes">
        <div className="fz-dash-cities__toggle" role="tablist" aria-label="Explore by">
          {(['cities', 'countries'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={mode === m ? 'is-active' : ''}
              onClick={() => setMode(m)}
            >
              {m === 'cities' ? 'Cities' : 'Countries'}
            </button>
          ))}
        </div>
      </div>

      <div className="fz-dash-cities__track" role="tabpanel">
        {list === null ? (
          Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="fz-dash-city fz-dash-city--ghost" aria-hidden="true">
              <span className="fz-dash-city__photo" />
              <span className="fz-dash-city__name" />
            </span>
          ))
        ) : list.length === 0 ? (
          <p className="fz-dash-cities__empty">Nothing to show here yet.</p>
        ) : mode === 'cities' ? (
          (cities ?? []).map((c, i) => (
            <Link key={`${c.code}-${c.name}`} href={scoutAreaLink(c.name, c.lat, c.lng)} className="fz-dash-city" aria-label={`Explore food in ${c.name}`}>
              <span className="fz-dash-city__photo">
                <img src={foodPhoto(c.name)} alt="" loading="lazy" />
                {i === 0 && isHere(c.distanceKm) && <span className="fz-dash-city__here">You&apos;re here</span>}
              </span>
              <span className="fz-dash-city__name">{c.name}</span>
              <span className="fz-dash-city__dist">{i === 0 && isHere(c.distanceKm) ? 'Nearby' : `${c.distanceKm} km`}</span>
            </Link>
          ))
        ) : (
          (countries ?? []).map((c) => (
            <Link key={c.code} href={scoutAreaLink(c.city, c.lat, c.lng)} className="fz-dash-city" aria-label={`Explore food in ${c.name} (${c.city})`}>
              <span className="fz-dash-city__photo">
                <img src={foodPhoto(c.name)} alt="" loading="lazy" />
                <span className="fz-dash-city__flag" aria-hidden="true">
                  <img src={flagSrc(c.code)} alt="" loading="lazy" />
                </span>
              </span>
              <span className="fz-dash-city__name">{c.name}</span>
              <span className="fz-dash-city__dist">{c.city}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
