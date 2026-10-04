'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildPlacePhotoUrl } from '@/lib/scout/scoutLogic';
import type { LocationState } from './useNearbyPlaces';

// Explore row at the top of For you, with a Cities | Countries switch:
//   Cities    - "Explore <country>'s cities": real towns/cities in the user's
//               country around their location (/api/places/cities).
//   Countries - "Explore countries": other countries nearest first, each
//               opening on its best-known food city (/api/places/countries).
// Round photos with the name underneath; tapping one opens Scout centred on
// that place, showing its food spots. Location = GPS or saved home area, the
// same one the restaurant rows use.

type Mode = 'cities' | 'countries';

type City = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
  photoRef: string | null;
  distanceKm: number;
};

type Country = {
  code: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  photoRef: string | null;
  distanceKm: number;
};

const scoutAreaLink = (name: string, lat: number, lng: number) =>
  `/scout?${new URLSearchParams({ view: 'area', name, lat: String(lat), lng: String(lng) }).toString()}`;

/** Small flag image (Windows can't draw flag emoji, so no 🇹🇭 here). */
const flagSrc = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

export function NearbyCities({ loc }: { loc: LocationState }) {
  const [mode, setMode] = useState<Mode>('cities');
  // Results are keyed by the location they were fetched for, so a new
  // location shows the loading state again without a reset effect.
  const [cityResult, setCityResult] = useState<{ key: string; country: { name: string; code: string } | null; cities: City[] } | null>(null);
  const [countryResult, setCountryResult] = useState<{ key: string; countries: Country[] } | null>(null);
  const key = loc.status === 'ready' ? `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}` : '';

  // Cities (also tells us the user's country, used to leave it out of Countries).
  useEffect(() => {
    if (loc.status !== 'ready') return;
    let cancelled = false;
    fetch('/api/places/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCityResult({ key, country: data.country ?? null, cities: Array.isArray(data.cities) ? data.cities : [] });
      })
      .catch(() => {
        if (!cancelled) setCityResult({ key, country: null, cities: [] });
      });
    return () => {
      cancelled = true;
    };
    // `key` captures lat/lng (rounded) - refetch only when the area changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Countries - only fetched once the Countries view is opened.
  const homeCode = cityResult?.key === key ? cityResult.country?.code ?? '' : null;
  useEffect(() => {
    if (mode !== 'countries' || loc.status !== 'ready' || homeCode === null) return;
    let cancelled = false;
    fetch('/api/places/countries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng, excludeCode: homeCode }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCountryResult({ key, countries: Array.isArray(data.countries) ? data.countries : [] });
      })
      .catch(() => {
        if (!cancelled) setCountryResult({ key, countries: [] });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, key, homeCode]);

  // No location (the restaurant rows already show how to fix that): hide.
  if (loc.status === 'unavailable') return null;

  const cities = cityResult?.key === key ? cityResult.cities : null;
  const countries = countryResult?.key === key ? countryResult.countries : null;
  const country = cityResult?.key === key ? cityResult.country?.name ?? null : null;
  const here = cities?.[0];

  // "Canada's cities", but "the Netherlands' cities" style for names ending in s.
  const title =
    mode === 'countries'
      ? 'Explore countries'
      : country
        ? `Explore ${country}${country.endsWith('s') ? '’' : '’s'} cities`
        : 'Explore cities near you';
  const sub = mode === 'countries' ? 'Nearest first · opens on each country’s food city' : here ? `Nearest first · around ${here.name}` : null;

  const list = mode === 'cities' ? cities : countries;
  const loading = list === null;

  return (
    <section className="fz-dash-cities" aria-labelledby="fz-dash-cities-title">
      <div className="fz-dash-cities__head">
        <div className="fz-dash-cities__heading">
          <h2 id="fz-dash-cities-title" className="fz-dash-cities__title">{title}</h2>
          {sub && <p className="fz-dash-cities__sub">{sub}</p>}
        </div>
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
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="fz-dash-city fz-dash-city--ghost" aria-hidden="true">
              <span className="fz-dash-city__photo" />
              <span className="fz-dash-city__name" />
            </span>
          ))
        ) : list.length === 0 ? (
          <p className="fz-dash-cities__empty">Nothing to show here yet.</p>
        ) : mode === 'cities' ? (
          (list as City[]).map((c, i) => (
            <Link key={c.placeId} href={scoutAreaLink(c.name, c.lat, c.lng)} className="fz-dash-city" aria-label={`Explore food in ${c.name}`}>
              <span className="fz-dash-city__photo">
                {c.photoRef ? (
                  <img src={buildPlacePhotoUrl(c.photoRef, undefined, 300)} alt="" loading="lazy" />
                ) : (
                  <span className="fz-dash-city__initial" aria-hidden="true">{c.name.charAt(0)}</span>
                )}
                {i === 0 && c.distanceKm < 15 && <span className="fz-dash-city__here">You&apos;re here</span>}
              </span>
              <span className="fz-dash-city__name">{c.name}</span>
              <span className="fz-dash-city__dist">{i === 0 && c.distanceKm < 15 ? 'Nearby' : `${c.distanceKm} km`}</span>
            </Link>
          ))
        ) : (
          (list as Country[]).map((c) => (
            <Link key={c.code} href={scoutAreaLink(c.city, c.lat, c.lng)} className="fz-dash-city" aria-label={`Explore food in ${c.name} (${c.city})`}>
              <span className="fz-dash-city__photo">
                {c.photoRef ? (
                  <img src={buildPlacePhotoUrl(c.photoRef, undefined, 300)} alt="" loading="lazy" />
                ) : (
                  <span className="fz-dash-city__initial" aria-hidden="true">{c.name.charAt(0)}</span>
                )}
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
