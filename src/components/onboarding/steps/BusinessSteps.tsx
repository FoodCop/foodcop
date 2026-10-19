'use client';

import { useEffect, useId, useState } from 'react';
import { CakeSlice, ChefHat, Coffee, Copy, Loader2, PartyPopper, Plus, Salad, ShoppingBasket, Trash2, Truck, UtensilsCrossed } from 'lucide-react';
import { LocationStep } from '@/components/create/flow/LocationStep';
import type { PostPlace } from '@/lib/services/postService';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '@/lib/onboarding/policy';
import { BUSINESS_CUISINES, CATEGORY_CONFIG, ONBOARDING_SERVICES, PRICE_TIERS, branchKind, normaliseWebsite } from '@/lib/onboarding/business';
import { DAY_LABELS, WEEK_ORDER, type DayHours, type DayKey, type WeeklyHours } from '@/lib/restaurant/hours';
import { BusinessOnboardingService, type BranchInput, type BusinessProfile } from '@/lib/services/businessOnboardingService';
import { Chips } from './Chips';

// Food business screens B-01 to B-04 (client spec v1): category, details,
// locations and branches, operations. What each category is asked lives in
// lib/onboarding/business.ts. Each screen saves on Continue; the parent moves
// on (and Back returns through them).

type Submit = (label: string, busy: boolean) => React.ReactNode;
interface StepProps {
  profile: BusinessProfile;
  onSaved: () => void;
  renderSubmit: Submit;
}

const ERR = 'That didn’t save. Check your connection and try again.';
const errorText = (code?: string) =>
  code === 'needs_update' ? 'Business setup needs the latest database update (npx supabase db push). Ask your admin to run it.' : ERR;

function ErrorLine({ text }: { text: string | null }) {
  return text ? (
    <p className="fz-onb__error" role="alert">
      {text}
    </p>
  ) : null;
}

// ── B-01 Choose your business type ─────────────────────────────────────────
const CATEGORY_UI: Record<BusinessCategory, { Icon: typeof Coffee; text: string }> = {
  restaurant: { Icon: UtensilsCrossed, text: 'Dine-in, with a menu' },
  cafe: { Icon: Coffee, text: 'Coffee, drinks, light bites' },
  bakery: { Icon: CakeSlice, text: 'Breads, cakes, pastries' },
  food_truck: { Icon: Truck, text: 'On the move' },
  cloud_kitchen: { Icon: ChefHat, text: 'Delivery only' },
  catering_company: { Icon: PartyPopper, text: 'Food for events' },
  meal_prep: { Icon: Salad, text: 'Ready meals, plans' },
  specialty_food: { Icon: ShoppingBasket, text: 'Artisan products' },
};

export function CategoryStep({ profile, onSaved, renderSubmit }: StepProps) {
  const [value, setValue] = useState<BusinessCategory | null>(profile.category);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = BUSINESS_CATEGORIES.map((c) => c.id);
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value) return setError('Choose the type that fits best.');
        setBusy(true);
        const r = await BusinessOnboardingService.saveCategory(value);
        setBusy(false);
        if (!r.success) return setError(errorText(r.error));
        onSaved();
      }}
    >
      <div className="fz-step-cats" role="radiogroup" aria-label="Business type">
        {BUSINESS_CATEGORIES.map(({ id, label }, i) => {
          const { Icon, text } = CATEGORY_UI[id];
          const on = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on || (!value && i === 0) ? 0 : -1}
              className={`fz-step-cat${on ? ' is-on' : ''}`}
              onClick={() => {
                setValue(id);
                setError(null);
              }}
              onKeyDown={(e) => {
                const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const n = (i + d + ids.length) % ids.length;
                setValue(ids[n]);
                (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
              }}
            >
              <span className="fz-step-cat__icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <strong>{label}</strong>
              <span>{text}</span>
            </button>
          );
        })}
      </div>
      <ErrorLine text={error} />
      {renderSubmit('Continue', busy)}
    </form>
  );
}

// ── B-02 Business details ────────────────────────────────────────────────────
export function DetailsStep({ profile, onSaved, renderSubmit }: StepProps) {
  const id = useId();
  const [f, setF] = useState({
    name: profile.name,
    contactName: profile.contactName,
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    phone: profile.phone,
    website: profile.website,
  });
  const [bad, setBad] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((v) => ({ ...v, [k]: e.target.value }));
    setBad(null);
    setError(null);
  };
  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="fz-step-field">
      <label htmlFor={`${id}-${k}`}>{label}</label>
      <input id={`${id}-${k}`} value={f[k]} onChange={set(k)} aria-invalid={bad === k} {...props} />
    </div>
  );

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const miss = (k: keyof typeof f, msg: string) => {
          setBad(k);
          setError(msg);
        };
        if (!f.name.trim()) return miss('name', 'Enter the business name.');
        if (!f.contactName.trim()) return miss('contactName', 'Enter the name of the owner or main contact.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contactEmail.trim())) return miss('contactEmail', 'Enter a valid contact email.');
        const website = f.website.trim() ? normaliseWebsite(f.website) : null;
        if (f.website.trim() && !website) return miss('website', 'Enter a website like yourbusiness.com.');
        setBusy(true);
        const r = await BusinessOnboardingService.saveDetails({ ...f, website });
        setBusy(false);
        if (!r.success) return setError(errorText(r.error));
        onSaved();
      }}
    >
      {field('name', 'Business name', { autoComplete: 'organization', maxLength: 80 })}
      <p className="fz-step-section">Contact person · private</p>
      {field('contactName', 'Owner or main contact', { autoComplete: 'name', maxLength: 120 })}
      {field('contactEmail', 'Contact email', { type: 'email', autoComplete: 'email', maxLength: 200 })}
      {field('contactPhone', 'Contact phone (optional)', { type: 'tel', autoComplete: 'tel', maxLength: 40 })}
      <p className="fz-step-section">On your profile · optional</p>
      {field('phone', 'Public phone', { type: 'tel', maxLength: 40, placeholder: 'For customers to call' })}
      {field('website', 'Website', { type: 'url', inputMode: 'url', maxLength: 300, placeholder: 'yourbusiness.com' })}
      <p className="fz-step-private">FUZO uses the contact details to reach you about your account and verification. They aren&rsquo;t shown publicly.</p>
      <ErrorLine text={error} />
      {renderSubmit('Continue', busy)}
    </form>
  );
}

// ── B-03 Location and branches ───────────────────────────────────────────────
interface LocDraft {
  key: string;
  id?: string;
  name: string;
  place: PostPlace | null;
  area: string;
}

const placeOf = (b: BranchInput): PostPlace | null =>
  b.lat != null && b.lng != null ? { lat: b.lat, lng: b.lng, address: b.address, name: b.name || b.address } : null;
let seq = 0;
const newKey = () => `loc-${++seq}`;

export function LocationsStep({ profile, onSaved, renderSubmit }: StepProps) {
  const id = useId();
  const category = profile.category ?? 'restaurant';
  const model = CATEGORY_CONFIG[category].location;
  const existing = profile.branches;
  const [main, setMain] = useState<LocDraft>(() => {
    const m = existing.find((b) => b.isMain) ?? existing[0];
    return { key: newKey(), id: m?.id, name: m?.name ?? '', place: m ? placeOf(m) : null, area: m?.serviceArea ?? '' };
  });
  const [extra, setExtra] = useState<LocDraft[]>(() =>
    existing.filter((b) => b !== (existing.find((x) => x.isMain) ?? existing[0])).map((b) => ({ key: newKey(), id: b.id, name: b.name, place: placeOf(b), area: b.serviceArea ?? '' })),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const taken = (p: PostPlace | null) => !!p?.restaurantId;

  const toInput = (d: LocDraft, isMain: boolean): BranchInput => {
    const hasAddress = !!d.place;
    const hasArea = !!d.area.trim();
    return {
      id: d.id,
      name: d.name,
      isMain,
      kind: branchKind(category, hasAddress, hasArea),
      address: d.place ? d.place.address || d.place.name || 'Pinned location' : null,
      serviceArea: hasArea ? d.area : null,
      lat: d.place?.lat ?? null,
      lng: d.place?.lng ?? null,
      addressPublic: !model.addressHidden,
      placeId: d.place?.placeId ?? null,
    };
  };

  const check = (d: LocDraft, label: string): string | null => {
    if (model.placeRequired && !d.place) return `Add the ${label.toLowerCase()}.`;
    if (model.areaRequired && !d.area.trim()) return `Add the ${(model.areaLabel ?? 'area').toLowerCase()}.`;
    if (!d.place && !d.area.trim()) return model.areaLabel ? `Add a location or the ${model.areaLabel.toLowerCase()}.` : `Add the ${label.toLowerCase()}.`;
    return null;
  };

  const count = 1 + extra.length;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = check(main, model.placeLabel) ?? extra.map((d, i) => check(d, `location ${i + 2}`)).find(Boolean) ?? null;
        if (problem) return setError(problem);
        setBusy(true);
        const r = await BusinessOnboardingService.saveBranches(
          [toInput(main, true), ...extra.map((d) => toInput(d, false))],
          existing.map((b) => b.id!).filter(Boolean),
        );
        setBusy(false);
    if (!r.success) return setError(errorText(r.error));
    onSaved();
  };

  // A <div>, not a <form>: the place picker has its own search form inside,
  // and forms can't nest (Enter in the search box would submit this screen).
  return (
    <div>
      <LocationStep value={main.place} onChange={(place) => setMain((m) => ({ ...m, place }))} label={model.placeLabel} required={model.placeRequired} />
      {taken(main.place) && <p className="fz-step-note">This place is already on FUZO. If it&rsquo;s yours, carry on - FUZO checks it when you send your documents.</p>}
      {model.addressHidden && <p className="fz-step-private">This address stays private. Your profile shows your area instead.</p>}
      {model.areaLabel && (
        <div className="fz-step-field">
          <label htmlFor={`${id}-area`}>
            {model.areaLabel}
            {!model.areaRequired && ' (optional)'}
          </label>
          <input id={`${id}-area`} value={main.area} maxLength={300} placeholder={model.areaPlaceholder} onChange={(e) => setMain((m) => ({ ...m, area: e.target.value }))} />
        </div>
      )}

      {model.branches && (
        <div className="fz-step-branches">
          <p className="fz-step-section">
            {count === 1 ? '1 location' : `${count} locations`}
            <span> · more can be added later</span>
          </p>
          {extra.map((d, i) => (
            <fieldset key={d.key} className="fz-step-branch">
              <legend>Location {i + 2}</legend>
              <button type="button" className="fz-step-branch__remove" aria-label={`Remove location ${i + 2}`} onClick={() => setExtra((x) => x.filter((y) => y.key !== d.key))}>
                <Trash2 size={16} />
              </button>
              <div className="fz-step-field">
                <label htmlFor={`${id}-${d.key}-name`}>Name (optional)</label>
                <input
                  id={`${id}-${d.key}-name`}
                  value={d.name}
                  maxLength={120}
                  placeholder="e.g. Queen St West"
                  onChange={(e) => setExtra((x) => x.map((y) => (y.key === d.key ? { ...y, name: e.target.value } : y)))}
                />
              </div>
              <LocationStep
                value={d.place}
                onChange={(place) => setExtra((x) => x.map((y) => (y.key === d.key ? { ...y, place } : y)))}
                label="Where it is"
                required={model.kind === 'address'}
              />
              {model.kind !== 'address' && (
                <div className="fz-step-field">
                  <label htmlFor={`${id}-${d.key}-area`}>{model.areaLabel}</label>
                  <input
                    id={`${id}-${d.key}-area`}
                    value={d.area}
                    maxLength={300}
                    onChange={(e) => setExtra((x) => x.map((y) => (y.key === d.key ? { ...y, area: e.target.value } : y)))}
                  />
                </div>
              )}
            </fieldset>
          ))}
          {count < 10 && (
            <button type="button" className="fz-step-add" onClick={() => setExtra((x) => [...x, { key: newKey(), name: '', place: null, area: '' }])}>
              <Plus size={16} aria-hidden="true" /> Add another location
            </button>
          )}
        </div>
      )}

      <ErrorLine text={error} />
      <form noValidate onSubmit={save}>
        {renderSubmit('Continue', busy)}
      </form>
    </div>
  );
}

// ── Weekly hours ──────────────────────────────────────────────────────────────
const OPEN_DAY: DayHours = { closed: false, open: '09:00', close: '21:00' };

export function defaultHours(): WeeklyHours {
  return Object.fromEntries(WEEK_ORDER.map((d) => [d, { ...OPEN_DAY }])) as WeeklyHours;
}

export function HoursEditor({ value, onChange, label }: { value: WeeklyHours; onChange: (h: WeeklyHours) => void; label: string }) {
  const setDay = (day: DayKey, patch: Partial<DayHours>) => onChange({ ...value, [day]: { ...(value[day] ?? OPEN_DAY), ...patch } });
  return (
    <fieldset className="fz-step-hours">
      <legend>{label}</legend>
      <ul>
        {WEEK_ORDER.map((day) => {
          const d = value[day] ?? { ...OPEN_DAY, closed: true };
          return (
            <li key={day}>
              <button
                type="button"
                role="switch"
                aria-checked={!d.closed}
                aria-label={`${DAY_LABELS[day]}: ${d.closed ? 'closed' : 'open'}`}
                className={`fz-step-switch${d.closed ? '' : ' is-on'}`}
                onClick={() => setDay(day, { closed: !d.closed })}
              >
                <i aria-hidden="true" />
              </button>
              <span className="fz-step-hours__day" aria-hidden="true">
                {DAY_LABELS[day].slice(0, 3)}
              </span>
              {d.closed ? (
                <span className="fz-step-hours__closed">Closed</span>
              ) : (
                <span className="fz-step-hours__times">
                  <input type="time" value={d.open} aria-label={`${DAY_LABELS[day]} opens`} onChange={(e) => setDay(day, { open: e.target.value })} />
                  <span aria-hidden="true">–</span>
                  <input type="time" value={d.close} aria-label={`${DAY_LABELS[day]} closes`} onChange={(e) => setDay(day, { close: e.target.value })} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="fz-step-add fz-step-add--quiet"
        onClick={() => onChange(Object.fromEntries(WEEK_ORDER.map((d) => [d, { ...(value.mon ?? OPEN_DAY) }])) as WeeklyHours)}
      >
        <Copy size={14} aria-hidden="true" /> Use Monday&rsquo;s hours every day
      </button>
      <p className="fz-step-private">Closing before opening (e.g. 6 PM – 2 AM) means past midnight. Same open and close time = open 24 hours.</p>
    </fieldset>
  );
}

// ── B-04 How your business operates ───────────────────────────────────────────
export function OperationsStep({ profile, onSaved, onLater, renderSubmit }: StepProps & { onLater: () => void }) {
  const id = useId();
  const category = profile.category ?? 'restaurant';
  const cfg = CATEGORY_CONFIG[category];
  const hasHours = Object.keys(profile.hours ?? {}).length > 0;
  const [cuisines, setCuisines] = useState<string[]>(profile.cuisines);
  const [services, setServices] = useState<string[]>(profile.services.filter((s) => s === 'dine_in' || s === 'takeaway'));
  const [price, setPrice] = useState<string[]>(profile.priceTier ? [profile.priceTier] : []);
  const [ops, setOps] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(cfg.choices.map((c) => [c.key, ((profile.operations[c.key] as string[] | undefined) ?? []).filter((v) => c.options.includes(v))])),
  );
  const [stops, setStops] = useState<string>((profile.operations.stops as string | undefined) ?? '');
  const [withHours, setWithHours] = useState(cfg.hours === 'required' || hasHours);
  const [hours, setHours] = useState<WeeklyHours>(hasHours ? profile.hours : defaultHours());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (cfg.hours === 'required' && WEEK_ORDER.every((d) => hours[d]?.closed !== false)) return setError('Open at least one day, or use “Complete more details later”.');
        setBusy(true);
        const operations: Record<string, unknown> = { ...ops };
        if (cfg.stops && stops.trim()) operations.stops = stops.trim().slice(0, 600);
        const r = await BusinessOnboardingService.saveOperations({
          cuisines: cfg.cuisines ? cuisines : profile.cuisines,
          // Delivery and reservations are their own questions next (B-05, B-07).
          services: [...services, ...profile.services.filter((s) => s === 'delivery' || s === 'reservations')],
          priceTier: cfg.price ? price[0] ?? null : profile.priceTier,
          operations,
          hours: withHours ? hours : null,
        });
        setBusy(false);
        if (!r.success) return setError(errorText(r.error));
        onSaved();
      }}
    >
      {cfg.cuisines && (
        <div className="fz-step-group">
          <p className="fz-step-group__label">
            Cuisines <span>optional · up to 5</span>
          </p>
          <Chips label="Cuisines" options={BUSINESS_CUISINES} value={cuisines} onChange={setCuisines} max={5} />
        </div>
      )}
      {cfg.choices.map((c) => (
        <div className="fz-step-group" key={c.key}>
          <p className="fz-step-group__label">
            {c.label} <span>optional · pick any</span>
          </p>
          <Chips label={c.label} options={c.options} value={ops[c.key] ?? []} onChange={(v) => setOps((o) => ({ ...o, [c.key]: v }))} />
        </div>
      ))}
      {cfg.services && (
        <div className="fz-step-group">
          <p className="fz-step-group__label">
            Service <span>optional</span>
          </p>
          <Chips
            label="Service"
            options={ONBOARDING_SERVICES.map((s) => s.key)}
            labelFor={(k) => ONBOARDING_SERVICES.find((s) => s.key === k)?.label ?? k}
            value={services}
            onChange={setServices}
          />
        </div>
      )}
      {cfg.price && (
        <div className="fz-step-group">
          <p className="fz-step-group__label">
            Price range <span>optional</span>
          </p>
          <Chips single label="Price range" options={PRICE_TIERS} value={price} onChange={setPrice} />
        </div>
      )}
      {cfg.stops && (
        <div className="fz-step-field">
          <label htmlFor={`${id}-stops`}>Regular stops (optional)</label>
          <textarea
            id={`${id}-stops`}
            rows={3}
            maxLength={600}
            value={stops}
            placeholder="e.g. Tue-Thu: Union Station 11-2 · Sat: Evergreen market"
            onChange={(e) => setStops(e.target.value)}
          />
        </div>
      )}

      {cfg.hours === 'optional' && (
        <label className="fz-step-toggle">
          <input type="checkbox" checked={withHours} onChange={(e) => setWithHours(e.target.checked)} />
          <span className="fz-step-toggle__box" aria-hidden="true" />
          Add {cfg.hoursLabel.toLowerCase()}
        </label>
      )}
      {withHours && <HoursEditor value={hours} onChange={setHours} label={cfg.hoursLabel} />}

      <ErrorLine text={error} />
      {renderSubmit('Continue', busy)}
      <button type="button" className="fz-onb__skip" onClick={onLater} disabled={busy}>
        Complete more details later
      </button>
    </form>
  );
}

// ── Loader: fetches the business profile for whichever screen is showing ──────
export function BusinessScreen({ children }: { children: (profile: BusinessProfile) => React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    BusinessOnboardingService.load().then((r) => {
      if (off) return;
      if (r.success && r.data) setProfile(r.data);
      else setError(errorText(r.error));
    });
    return () => {
      off = true;
    };
  }, []);
  if (error) return <ErrorLine text={error} />;
  if (!profile)
    return (
      <div className="fz-onb__state" role="status" aria-label="Loading">
        <Loader2 size={24} className="fz-onb__spin" aria-hidden="true" />
      </div>
    );
  return <>{children(profile)}</>;
}

