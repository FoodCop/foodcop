'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildPlacePhotoUrl } from '@/lib/scout/scoutLogic';
import type { LocationState } from './useNearbyPlaces';

// "Explore <country>'s cities": round city photos with the name underneath,
// nearest first - real towns/cities in the user's country around their
// location (GPS or saved home area, same as the restaurant rows), from
// /api/places/cities.
// Tapping one opens Scout centred on that city, showing its food spots.

type City = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
  photoRef: string | null;
  distanceKm: number;
};

const cityLink = (c: City) =>
  `/scout?${new URLSearchParams({ view: 'area', name: c.name, lat: String(c.lat), lng: String(c.lng) }).toString()}`;

export function NearbyCities({ loc }: { loc: LocationState }) {
  // Results are keyed by the location they were fetched for, so a new
  // location shows the loading state again without a reset effect.
  const [result, setResult] = useState<{ key: string; country: string | null; cities: City[] } | null>(null);
  const key = loc.status === 'ready' ? `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}` : '';

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
        if (!cancelled) setResult({ key, country: data.country?.name ?? null, cities: Array.isArray(data.cities) ? data.cities : [] });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, country: null, cities: [] });
      });
    return () => {
      cancelled = true;
    };
    // `key` captures lat/lng (rounded) - refetch only when the area changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // No location (the restaurant rows already show how to fix that) or nothing nearby: hide.
  if (loc.status === 'unavailable') return null;
  const cities = result?.key === key ? result.cities : null;
  if (cities && cities.length === 0) return null;

  const here = cities?.[0];
  const country = result?.key === key ? result.country : null;
  // "Canada's cities", but "the Netherlands' cities" style for names ending in s.
  const title = country ? `Explore ${country}${country.endsWith('s') ? '’' : '’s'} cities` : 'Explore cities near you';

  return (
    <section className="fz-dash-cities" aria-labelledby="fz-dash-cities-title">
      <div className="fz-dash-cities__head">
        <h2 id="fz-dash-cities-title" className="fz-dash-cities__title">{title}</h2>
        {here && <p className="fz-dash-cities__sub">Nearest first · around {here.name}</p>}
      </div>

      <div className="fz-dash-cities__track">
        {cities === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="fz-dash-city fz-dash-city--ghost" aria-hidden="true">
                <span className="fz-dash-city__photo" />
                <span className="fz-dash-city__name" />
              </span>
            ))
          : cities.map((c, i) => (
              <Link key={c.placeId} href={cityLink(c)} className="fz-dash-city" aria-label={`Explore food in ${c.name}`}>
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
            ))}
      </div>
    </section>
  );
}
