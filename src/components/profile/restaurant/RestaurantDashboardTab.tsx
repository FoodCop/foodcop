'use client';

import { useMemo, useRef, useState } from 'react';
import { Clock, Copy, Crosshair, Edit3, Images, Loader2, MapPin, Plus, Search, Store, Trash2, Utensils, X } from 'lucide-react';
import { patchRestaurant, refreshRestaurant, useOpenStatus, useRestaurant } from '@/lib/hooks/useRestaurant';
import {
  GALLERY_CATEGORIES,
  GALLERY_MAX,
  RestaurantService,
  SERVICE_OPTIONS,
  isMissingAboutColumns,
  isMissingGalleryColumn,
  type GalleryCategory,
  type MenuItem,
  type RestaurantGalleryPhoto,
  type RestaurantProfile,
} from '@/lib/services/restaurantService';
import { PlacesService, type ScoutPlaceRaw } from '@/lib/services/placesService';
import { DAY_LABELS, DEFAULT_DAY, WEEK_ORDER, type DayKey, type WeeklyHours } from '@/lib/restaurant/hours';
import MenuItemEditor from './MenuItemEditor';
import LocationPickerModal from '../LocationPickerModal';
import { StatusPill, VegMark, formatPrice } from './RestaurantBits';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'SGD', 'JPY'];
const PRICE_TIERS = ['$', '$$', '$$$', '$$$$'] as const;
const browserTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};
const allTimezones = (): string[] => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone');
  } catch {
    return [browserTz(), 'UTC'];
  }
};
const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

// Restaurant Dashboard - owner-only tab on their own restaurant profile.
// 1. Business details + Google place link + working hours (drives the live
//    Open/Closed status everywhere).  2. Menu management (add / edit / delete /
//    availability) with a live customer preview while editing.
export default function RestaurantDashboardTab({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
  const { loaded, profile, menu, error } = useRestaurant(restaurantId);

  if (!loaded) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fz-restaurant-dashboard py-3">
      {error && (
        <div className="alert alert-warning small rounded-4">
          {error} Until it&apos;s applied, changes here can&apos;t be saved.
        </div>
      )}
      <BusinessDetails restaurantId={restaurantId} restaurantName={restaurantName} profile={profile} />
      <GalleryManager restaurantId={restaurantId} gallery={profile?.gallery ?? []} />
      <MenuManager restaurantId={restaurantId} menu={menu} currency={profile?.currency ?? 'USD'} />
    </div>
  );
}

// ── 1. Business details + hours ────────────────────────────────────────────
function BusinessDetails({ restaurantId, restaurantName, profile }: { restaurantId: string; restaurantName: string; profile: RestaurantProfile | null }) {
  const [form, setForm] = useState(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const status = useOpenStatus(profile);

  // Re-sync the form when the saved profile changes (first load, after save).
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (syncedProfile !== profile) {
    setSyncedProfile(profile);
    setForm(toForm(profile));
  }

  const set = <K extends keyof ReturnType<typeof toForm>>(key: K, value: ReturnType<typeof toForm>[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setDay = (day: DayKey, patch: Partial<typeof DEFAULT_DAY>) =>
    setForm((f) => ({ ...f, hours: { ...f.hours, [day]: { ...(f.hours[day] ?? DEFAULT_DAY), ...patch } } }));
  const copyMondayToAll = () =>
    setForm((f) => ({ ...f, hours: Object.fromEntries(WEEK_ORDER.map((d) => [d, { ...(f.hours.mon ?? DEFAULT_DAY) }])) as WeeklyHours }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const base = {
      place_id: form.place_id,
      place_name: form.place_name,
      tagline: form.tagline.trim() || null,
      cuisines: splitList(form.cuisines),
      price_tier: form.price_tier || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      amenities: splitList(form.amenities),
      hours: form.hours,
      timezone: form.timezone,
      currency: form.currency,
      lat: form.lat,
      lng: form.lng,
    };
    let res = await RestaurantService.saveProfile(restaurantId, {
      ...base,
      description: form.description.trim() || null,
      services: form.services,
    });
    // Database not updated yet: save everything else, and say what's waiting.
    let aboutPending = false;
    if (!res.success && isMissingAboutColumns(res.error)) {
      aboutPending = true;
      res = await RestaurantService.saveProfile(restaurantId, base);
    }
    setSaving(false);
    if (!res.success) {
      setMessage({ ok: false, text: res.error ?? 'Could not save.' });
      return;
    }
    await refreshRestaurant(restaurantId, 'profile');
    setMessage(
      aboutPending
        ? { ok: false, text: 'Saved, except "About" and service options - they need the database update (npx supabase db push).' }
        : { ok: true, text: 'Saved. Your open/closed status is now live.' },
    );
  };

  return (
    <div className="card border shadow-sm mb-4">
      <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <Store size={16} className="text-warning-emphasis" />
          <span>Business details &amp; hours</span>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="card-body p-3">
        <PlaceLinker
          placeName={form.place_name}
          onPick={(place) =>
            setForm((f) => ({
              ...f,
              place_id: place.place_id ?? null,
              place_name: place.name,
              address: f.address || place.formatted_address || place.vicinity || '',
              phone: f.phone || place.formatted_phone_number || '',
              website: f.website || place.website || '',
              lat: f.lat ?? place.geometry?.location?.lat ?? null,
              lng: f.lng ?? place.geometry?.location?.lng ?? null,
            }))
          }
          onClear={() => setForm((f) => ({ ...f, place_id: null, place_name: null }))}
          defaultQuery={restaurantName}
        />

        {/* Map location - what puts the restaurant on Scout (even if it isn't on Google). */}
        <div className="p-3 rounded-3 border mt-3" style={{ background: '#fbf7ec', borderColor: '#ece4d0' }}>
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <div>
              <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                <Crosshair size={15} className="text-warning-emphasis" /> Location on map
              </div>
              <div className="small text-muted">
                {form.lat != null && form.lng != null
                  ? `Pinned at ${form.lat.toFixed(5)}, ${form.lng.toFixed(5)} - customers will see you on Scout.`
                  : 'Not set yet. Set it so customers can find you on the Scout map.'}
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-dark rounded-pill px-3 d-flex align-items-center gap-1" onClick={() => setPickingLocation(true)}>
              {savingLocation ? <Loader2 size={14} className="scout-spin" /> : <MapPin size={14} />} {form.lat != null ? 'Move pin' : 'Set on map'}
            </button>
          </div>
        </div>
        {pickingLocation && (
          <LocationPickerModal
            initialLat={form.lat}
            initialLng={form.lng}
            onClose={() => setPickingLocation(false)}
            onConfirm={async ({ lat, lng, address }) => {
              setForm((f) => ({ ...f, lat, lng, address: f.address || (/^-?\d/.test(address) ? '' : address) }));
              setPickingLocation(false);
              // Save the pin right away - choosing a spot on the map should stick
              // without also having to press "Save details & hours".
              setSavingLocation(true);
              setMessage(null);
              const res = await RestaurantService.saveProfile(restaurantId, { lat, lng });
              setSavingLocation(false);
              if (!res.success || !res.data) {
                setMessage({ ok: false, text: res.error ?? 'Could not save your location.' });
                return;
              }
              // Keep any other unsaved edits in the form: mark this profile as
              // already synced before updating the shared store.
              const next = { ...(profile ?? res.data), lat: res.data.lat, lng: res.data.lng };
              setSyncedProfile(next);
              patchRestaurant(restaurantId, { profile: next });
              setMessage({ ok: true, text: 'Location saved - you now appear on the Scout map.' });
            }}
          />
        )}

        <div className="row g-3 mt-1">
          <div className="col-12">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-tagline">Tagline</label>
            <input id="rp-tagline" className="form-control form-control-sm" maxLength={200} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="One line about your place" />
          </div>
          <div className="col-12">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-about">
              About <span className="text-muted fw-normal">(shown on your profile and the map)</span>
            </label>
            <textarea
              id="rp-about"
              className="form-control form-control-sm"
              rows={4}
              maxLength={1500}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Your story, signature dishes, the vibe - what should diners know?"
            />
            <div className="small text-muted text-end mt-1">{form.description.length}/1500</div>
          </div>
          <div className="col-12 col-md-8">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-cuisines">Cuisines <span className="text-muted fw-normal">(comma separated)</span></label>
            <input id="rp-cuisines" className="form-control form-control-sm" value={form.cuisines} onChange={(e) => set('cuisines', e.target.value)} placeholder="North Indian, Mughlai" />
          </div>
          <div className="col-6 col-md-2">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-price">Price</label>
            <select id="rp-price" className="form-select form-select-sm" value={form.price_tier} onChange={(e) => set('price_tier', e.target.value as typeof form.price_tier)}>
              <option value="">—</option>
              {PRICE_TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-currency">Currency</label>
            <select id="rp-currency" className="form-select form-select-sm" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              {[...new Set([form.currency, ...CURRENCIES])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-address">Address</label>
            <input id="rp-address" className="form-control form-control-sm" maxLength={300} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="col-12 col-md-6">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-phone">Phone</label>
            <input id="rp-phone" className="form-control form-control-sm" maxLength={40} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="col-12 col-md-6">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-web">Website</label>
            <input id="rp-web" className="form-control form-control-sm" maxLength={300} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
          </div>
          <div className="col-12">
            <label className="fw-bold text-dark mb-1 d-block" htmlFor="rp-amen">Amenities <span className="text-muted fw-normal">(comma separated)</span></label>
            <input id="rp-amen" className="form-control form-control-sm" value={form.amenities} onChange={(e) => set('amenities', e.target.value)} placeholder="Outdoor seating, Wi-Fi, Parking" />
          </div>
          <div className="col-12">
            <span className="fw-bold text-dark mb-1 d-block" id="rp-services">Service options</span>
            <div className="fz-activity-subtabs fz-activity-subtabs--inline" role="group" aria-labelledby="rp-services">
              {SERVICE_OPTIONS.map(({ key, label }) => {
                const on = form.services.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`fz-activity-subtab fz-activity-subtab--sm${on ? ' fz-activity-subtab--active' : ''}`}
                    aria-pressed={on}
                    onClick={() => set('services', on ? form.services.filter((s) => s !== key) : [...form.services, key])}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Working hours */}
        <div className="d-flex align-items-center justify-content-between mt-4 mb-2 flex-wrap gap-2">
          <div className="fw-bold text-dark d-flex align-items-center gap-2">
            <Clock size={16} className="text-warning-emphasis" /> Working hours
          </div>
          <div className="d-flex align-items-center gap-2">
            <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} aria-label="Timezone">
              {[...new Set([form.timezone, ...allTimezones()])].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill text-nowrap d-flex align-items-center gap-1" onClick={copyMondayToAll}>
              <Copy size={13} /> Copy Monday to all
            </button>
          </div>
        </div>
        <ul className="list-group list-group-flush border rounded-3" style={{ fontSize: '0.88rem' }}>
          {WEEK_ORDER.map((day) => {
            const d = form.hours[day] ?? { ...DEFAULT_DAY, closed: true };
            return (
              <li key={day} className="list-group-item d-flex align-items-center gap-3 flex-wrap px-3 py-2">
                <span className="fw-semibold" style={{ width: 96 }}>{DAY_LABELS[day]}</span>
                <div className="form-check form-switch m-0">
                  <input id={`h-${day}`} className="form-check-input" type="checkbox" checked={!d.closed} onChange={(e) => setDay(day, { closed: !e.target.checked })} />
                  <label className="form-check-label small" htmlFor={`h-${day}`}>{d.closed ? 'Closed' : 'Open'}</label>
                </div>
                {!d.closed && (
                  <div className="d-flex align-items-center gap-2 ms-auto">
                    <input type="time" className="form-control form-control-sm" value={d.open} onChange={(e) => setDay(day, { open: e.target.value })} aria-label={`${DAY_LABELS[day]} opens`} />
                    <span className="text-muted">to</span>
                    <input type="time" className="form-control form-control-sm" value={d.close} onChange={(e) => setDay(day, { close: e.target.value })} aria-label={`${DAY_LABELS[day]} closes`} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="small text-muted mt-2">Closing earlier than opening (e.g. 6 PM – 2 AM) means past midnight. Same open and close time = open 24 hours.</div>

        {message && <div className={`small mt-3 ${message.ok ? 'text-success' : 'text-danger'}`}>{message.text}</div>}
        <div className="mt-3">
          <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save details & hours'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Photo gallery ─────────────────────────────────────────────────────────
// What diners see in the profile's Gallery tab and the map pop-up's Photos.
// Changes save straight away (upload, category, caption, remove).
function GalleryManager({ restaurantId, gallery }: { restaurantId: string; gallery: RestaurantGalleryPhoto[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const persist = async (next: RestaurantGalleryPhoto[], done: string) => {
    const res = await RestaurantService.saveProfile(restaurantId, { gallery: next });
    if (!res.success) {
      setMessage({
        ok: false,
        text: isMissingGalleryColumn(res.error)
          ? 'The gallery needs the database update first (npx supabase db push).'
          : res.error ?? 'Could not save the gallery.',
      });
      return false;
    }
    await refreshRestaurant(restaurantId, 'profile');
    setMessage({ ok: true, text: done });
    return true;
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = GALLERY_MAX - gallery.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (!picked.length) {
      setMessage({ ok: false, text: `The gallery holds up to ${GALLERY_MAX} photos.` });
      return;
    }
    setMessage(null);
    const added: RestaurantGalleryPhoto[] = [];
    for (let i = 0; i < picked.length; i++) {
      setBusy(`Uploading ${i + 1} of ${picked.length}…`);
      const res = await RestaurantService.uploadImage(picked[i]);
      if (res.success && res.data) added.push({ url: res.data, category: 'Food' });
    }
    setBusy(null);
    if (!added.length) {
      setMessage({ ok: false, text: 'Those photos could not be uploaded - try again.' });
      return;
    }
    await persist([...gallery, ...added], `${added.length} photo${added.length === 1 ? '' : 's'} added.`);
  };

  const update = (i: number, patch: Partial<RestaurantGalleryPhoto>) =>
    persist(gallery.map((p, idx) => (idx === i ? { ...p, ...patch } : p)), 'Gallery updated.');
  const remove = (i: number) => persist(gallery.filter((_, idx) => idx !== i), 'Photo removed.');

  return (
    <div className="card border shadow-sm mb-4">
      <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <Images size={16} className="text-warning-emphasis" />
          <span>Photo gallery</span>
          <span className="text-muted fw-normal small">
            {gallery.length}/{GALLERY_MAX}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy || gallery.length >= GALLERY_MAX}
        >
          {busy ? <Loader2 size={14} className="scout-spin" /> : <Plus size={14} />} Add photos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="d-none"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      <div className="card-body p-3">
        <p className="small text-muted mb-3">Shown in your Gallery tab and on the map when people open your place. Your best food, the space, the bar.</p>
        {busy && <div className="small text-muted mb-2" role="status">{busy}</div>}
        {message && <div className={`small mb-2 ${message.ok ? 'text-success' : 'text-danger'}`} role="status">{message.text}</div>}
        {gallery.length === 0 ? (
          <div className="text-center text-muted small py-4 rounded-3 border" style={{ borderStyle: 'dashed' }}>
            No photos yet - add a few so diners can see your place.
          </div>
        ) : (
          <ul className="fz-gallery-manager">
            {gallery.map((photo, i) => (
              <li key={`${photo.url}-${i}`} className="fz-gallery-manager__item">
                <div className="fz-gallery-manager__thumb">
                  <img src={photo.url} alt={photo.caption || `Gallery photo ${i + 1}`} loading="lazy" />
                  <button type="button" className="fz-gallery-manager__remove" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`} title="Remove">
                    <X size={14} />
                  </button>
                </div>
                <select
                  className="form-select form-select-sm"
                  value={photo.category}
                  onChange={(e) => update(i, { category: e.target.value as GalleryCategory })}
                  aria-label={`Category for photo ${i + 1}`}
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  className="form-control form-control-sm"
                  defaultValue={photo.caption ?? ''}
                  maxLength={80}
                  placeholder="Caption (optional)"
                  aria-label={`Caption for photo ${i + 1}`}
                  onBlur={(e) => {
                    const caption = e.target.value.trim();
                    if (caption !== (photo.caption ?? '')) update(i, { caption: caption || undefined });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function toForm(p: RestaurantProfile | null) {
  const hours: WeeklyHours = {};
  WEEK_ORDER.forEach((d) => (hours[d] = p?.hours?.[d] ?? { ...DEFAULT_DAY, closed: !p }));
  return {
    place_id: p?.place_id ?? null,
    place_name: p?.place_name ?? null,
    tagline: p?.tagline ?? '',
    cuisines: (p?.cuisines ?? []).join(', '),
    price_tier: (p?.price_tier ?? '') as NonNullable<RestaurantProfile['price_tier']> | '',
    address: p?.address ?? '',
    phone: p?.phone ?? '',
    website: p?.website ?? '',
    amenities: (p?.amenities ?? []).join(', '),
    description: p?.description ?? '',
    services: (p?.services ?? []) as string[],
    hours,
    timezone: p?.timezone && p.timezone !== 'UTC' ? p.timezone : browserTz(),
    currency: p?.currency ?? 'USD',
    lat: (p?.lat ?? null) as number | null,
    lng: (p?.lng ?? null) as number | null,
  };
}

/** Link the restaurant to its Google place - that's how customers' posts get tagged to it. */
function PlaceLinker({ placeName, onPick, onClear, defaultQuery }: { placeName: string | null; onPick: (p: ScoutPlaceRaw) => void; onClear: () => void; defaultQuery: string }) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<ScoutPlaceRaw[] | null>(null);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const coords = await new Promise<{ lat: number; lng: number }>((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: 0, lng: 0 });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: 0, lng: 0 }),
        { timeout: 4000 },
      );
    });
    const res = await PlacesService.searchByText(query, coords.lat, coords.lng);
    setResults(res.data?.results?.slice(0, 5) ?? []);
    setSearching(false);
  };

  return (
    <div className="p-3 rounded-3 border" style={{ background: '#fbf7ec', borderColor: '#ece4d0' }}>
      <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
        <MapPin size={15} className="text-danger" /> Google listing
      </div>
      {placeName ? (
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="small">
            Linked to <strong>{placeName}</strong>. Customer posts at this place appear in Mentions &amp; Tags. FUZO checks that you own this listing before your details replace Google&apos;s on the map.
          </span>
          <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={onClear}>Change</button>
        </div>
      ) : (
        <>
          <div className="small text-muted mb-2">Link your place so customers&apos; posts there show up in Mentions &amp; Tags.</div>
          <div className="d-flex gap-2">
            <input className="form-control form-control-sm" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Restaurant name and city" />
            <button type="button" className="btn btn-sm btn-dark rounded-pill px-3 d-flex align-items-center gap-1" onClick={search} disabled={searching}>
              {searching ? <Loader2 size={14} className="scout-spin" /> : <Search size={14} />} Find
            </button>
          </div>
          {results && (
            <ul className="list-group mt-2">
              {results.length === 0 && <li className="list-group-item small text-muted">No matches - try adding the city.</li>}
              {results.map((r) => (
                <li key={r.place_id ?? r.name} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2" role="button" onClick={() => onPick(r)}>
                  <span className="small">
                    <strong>{r.name}</strong>
                    <span className="text-muted d-block">{r.formatted_address || r.vicinity}</span>
                  </span>
                  <span className="badge bg-warning text-dark">Link</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// ── 2. Menu management ─────────────────────────────────────────────────────
function MenuManager({ restaurantId, menu, currency }: { restaurantId: string; menu: MenuItem[]; currency: string }) {
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(menu.map((m) => m.category))], [menu]);
  const grouped = useMemo(() => categories.map((c) => ({ category: c, items: menu.filter((m) => m.category === c) })), [categories, menu]);

  const toggleAvailability = async (item: MenuItem) => {
    setError(null);
    const next = !item.is_available;
    patchRestaurant(restaurantId, { menu: menu.map((m) => (m.id === item.id ? { ...m, is_available: next } : m)) });
    const res = await RestaurantService.setAvailability(restaurantId, item.id, next);
    if (!res.success) {
      setError(res.error ?? 'Could not update availability.');
      await refreshRestaurant(restaurantId, 'menu');
    }
  };

  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Delete "${item.name}" from your menu?`)) return;
    setBusyId(item.id);
    setError(null);
    const res = await RestaurantService.deleteMenuItem(restaurantId, item.id);
    setBusyId(null);
    if (!res.success) setError(res.error ?? 'Could not delete.');
    await refreshRestaurant(restaurantId, 'menu');
  };

  return (
    <div className="card border shadow-sm">
      <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <Utensils size={16} className="text-warning-emphasis" />
          <span>Menu ({menu.length})</span>
        </div>
        {!editing && (
          <button type="button" className="btn btn-sm btn-primary rounded-pill fw-bold d-flex align-items-center gap-1" onClick={() => setEditing('new')}>
            <Plus size={14} /> Add menu item
          </button>
        )}
      </div>
      <div className="card-body p-3">
        {editing && (
          <MenuItemEditor
            key={editing === 'new' ? 'new' : editing.id}
            restaurantId={restaurantId}
            item={editing === 'new' ? null : editing}
            categories={categories}
            currency={currency}
            onCancel={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await refreshRestaurant(restaurantId, 'menu');
            }}
          />
        )}

        {error && <div className="text-danger small mb-3">{error}</div>}

        {menu.length === 0 && !editing ? (
          <div className="text-center py-4 text-muted">
            <Utensils size={32} className="mb-2 opacity-50" />
            <div className="mb-3">Your menu is empty.</div>
            <button type="button" className="btn btn-sm btn-primary rounded-pill fw-bold px-3" onClick={() => setEditing('new')}>
              + Add your first item
            </button>
          </div>
        ) : (
          grouped.map(({ category, items }) => (
            <div key={category} className="mb-3">
              <div className="small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: '0.05em' }}>{category}</div>
              <ul className="list-group">
                {items.map((item) => (
                  <li key={item.id} className="list-group-item d-flex align-items-center gap-3 px-3 py-2">
                    <div className="rounded-3 overflow-hidden flex-shrink-0 bg-light" style={{ width: 48, height: 48 }}>
                      {item.image_url ? <img src={item.image_url} alt="" className="w-100 h-100 object-fit-cover" /> : <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted"><Utensils size={16} /></div>}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold d-flex align-items-center gap-2 text-truncate">
                        <VegMark isVeg={item.is_veg} />
                        <span className="text-truncate">{item.name}</span>
                      </div>
                      <div className="small text-muted">
                        {formatPrice(item.price, currency)}
                        {item.is_recommended && ' · Recommended'}
                        {item.is_popular && ' · Popular'}
                      </div>
                    </div>
                    <div className="form-check form-switch m-0" title={item.is_available ? 'Available' : 'Unavailable'}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={item.is_available}
                        onChange={() => toggleAvailability(item)}
                        aria-label={`${item.name} available`}
                      />
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>
                      <Edit3 size={14} />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} onClick={() => remove(item)} disabled={busyId === item.id} aria-label={`Delete ${item.name}`}>
                      {busyId === item.id ? <Loader2 size={14} className="scout-spin" /> : <Trash2 size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
