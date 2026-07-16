'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  FLAVORS,
  CUISINES,
  DIETARY,
  FOOD_CATEGORIES,
  AUDIENCE,
  CUSTOMER_MATCH,
  BUSINESS_IDENTITY,
  INTEGRATIONS,
  A_TYPE_OPTS,
  B_TYPE_OPTS,
  C_TYPE_OPTS,
  SPECIALTY_MAP,
  QUIZ_QUESTIONS,
  FEATURES_LIST,
  initialOnboardingState,
  courseIndex,
  courseTotal,
  nextScreenFor,
  canContinue,
  continueLabel,
  computeResult,
  type OnboardingState,
  type CardOpt,
} from '@/lib/onboarding/data';

// Ported from the old app's onboarding.html: the real branching flow
// (Discover Food / Create & Inspire / Grow My Food Business), starting at
// PATH_SELECT since account creation already happened on /login. Re-skinned
// onto plain Bootstrap form/list-group/toggle-button markup (master CSS)
// instead of Romio's compiled CSS.

type Setter = (updater: (prev: OnboardingState) => OnboardingState) => void;

export default function OnboardingWizard() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(initialOnboardingState);
  const [history, setHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const goTo = (next: string) => {
    setHistory((h) => [...h, state.screen]);
    setState((s) => ({ ...s, screen: next }));
    window.scrollTo(0, 0);
  };
  const goBack = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const copy = [...h];
      const prev = copy.pop()!;
      setState((s) => ({ ...s, screen: prev }));
      return copy;
    });
    window.scrollTo(0, 0);
  };

  const finalize = async () => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/dashboard');
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/dashboard');
      return;
    }

    if (state.pathChoice === 'A') {
      const r = computeResult(state);
      await supabase.from('users').update({ profile_type: 'foodlover', profile_subtype: state.a.type, is_onboarded: true }).eq('id', user.id);
      await supabase.from('taste_profiles').upsert(
        {
          user_id: user.id,
          cuisines: state.a.cuisines,
          dietary: state.a.dietary,
          result_emoji: r.emoji,
          result_title: r.title,
          result_desc: r.desc,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    } else if (state.pathChoice === 'B') {
      await supabase
        .from('users')
        .update({
          profile_type: 'creator',
          profile_subtype: state.b.type,
          display_name: state.b.profile.name,
          bio: state.b.profile.bio,
          location: state.b.profile.location,
          website: state.b.profile.website,
          is_onboarded: true,
        })
        .eq('id', user.id);
    } else if (state.pathChoice === 'C') {
      await supabase
        .from('users')
        .update({
          profile_type: 'business',
          profile_subtype: state.c.type,
          display_name: state.c.profile.businessName,
          location: state.c.profile.address,
          phone: state.c.profile.phone,
          email: state.c.profile.email,
          is_onboarded: true,
        })
        .eq('id', user.id);
    }
    await supabase.from('user_stats').upsert({ user_id: user.id }, { onConflict: 'user_id' });
    router.push('/dashboard');
  };

  const handleNext = async () => {
    if (!canContinue(state)) return;
    const next = nextScreenFor(state);
    if (next === 'DONE') {
      setSaving(true);
      await finalize();
      setSaving(false);
      return;
    }
    goTo(next);
  };

  const idx = courseIndex(state);
  const total = courseTotal(state);
  const pct = total ? Math.round((idx / total) * 100) : 0;
  const showBack = history.length > 0;

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-9 col-md-7 col-lg-6 py-3">
          <div className="text-muted small mb-1">
            Step {idx} of {total}
          </div>
          <div className="progress mb-4" style={{ height: 6 }}>
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>

          <Screen state={state} setState={setState} onSelectPath={(p) => setState((s) => ({ ...s, pathChoice: p }))} />

          <div className="d-flex justify-content-between gap-2 py-4">
            {showBack ? (
              <button className="btn btn-outline-secondary" onClick={goBack} type="button">
                Back
              </button>
            ) : (
              <span />
            )}
            <button className="btn btn-primary" onClick={handleNext} disabled={!canContinue(state) || saving} type="button">
              {saving ? 'Saving…' : continueLabel(state)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen({
  state,
  setState,
  onSelectPath,
}: {
  state: OnboardingState;
  setState: Setter;
  onSelectPath: (p: 'A' | 'B' | 'C') => void;
}) {
  switch (state.screen) {
    case 'PATH_SELECT':
      return (
        <>
          <h1 className="h4 fw-bold">How would you like to use FUZO?</h1>
          <p className="text-muted">Pick the path that fits you best — you can explore the others later.</p>
          <CardPicker
            value={state.pathChoice ?? ''}
            onSelect={(v) => onSelectPath(v as 'A' | 'B' | 'C')}
            options={[
              { v: 'A', emoji: '🍽️', d: 'Explore restaurants, dishes, reviews and food experiences.' },
              { v: 'B', emoji: '👨‍🍳', d: 'Share your culinary expertise, recipes, reviews and food content.' },
              { v: 'C', emoji: '🏪', d: 'Promote your food business and connect with food lovers.' },
            ]}
            titleMap={{ A: 'Discover Food', B: 'Create & Inspire', C: 'Grow My Food Business' }}
          />
        </>
      );

    /* --- Path A: Discover Food --- */
    case 'A_TYPE':
      return (
        <>
          <h1 className="h4 fw-bold">What describes you best?</h1>
          <CardPicker value={state.a.type} onSelect={(v) => setState((s) => ({ ...s, a: { ...s.a, type: v } }))} options={A_TYPE_OPTS} />
        </>
      );
    case 'A_FLAVORS':
      return (
        <>
          <h1 className="h4 fw-bold">What flavors do you enjoy?</h1>
          <p className="text-muted">Select up to 5.</p>
          <MultiChips
            options={FLAVORS}
            selected={state.a.flavors}
            max={5}
            onToggle={(v) => setState((s) => ({ ...s, a: { ...s.a, flavors: toggleArr(s.a.flavors, v, 5) } }))}
          />
        </>
      );
    case 'A_CUISINES':
      return (
        <>
          <h1 className="h4 fw-bold">Which cuisines do you enjoy?</h1>
          <p className="text-muted">Select up to 10.</p>
          <MultiChips
            options={CUISINES}
            selected={state.a.cuisines}
            max={10}
            onToggle={(v) => setState((s) => ({ ...s, a: { ...s.a, cuisines: toggleArr(s.a.cuisines, v, 10) } }))}
          />
        </>
      );
    case 'A_DIETARY':
      return (
        <>
          <h1 className="h4 fw-bold">Dietary preferences</h1>
          <p className="text-muted">Optional — select any that apply, or skip.</p>
          <MultiChips
            options={DIETARY}
            selected={state.a.dietary}
            onToggle={(v) =>
              setState((s) => {
                let arr = s.a.dietary;
                if (arr.includes(v)) arr = arr.filter((x) => x !== v);
                else if (v === 'No Restrictions') arr = ['No Restrictions'];
                else arr = [...arr.filter((x) => x !== 'No Restrictions'), v];
                return { ...s, a: { ...s.a, dietary: arr } };
              })
            }
          />
        </>
      );
    case 'A_QUIZ':
      return (
        <>
          <h1 className="h4 fw-bold">Food personality quiz</h1>
          <p className="text-muted">Five quick questions — answer how you actually eat, not how you wish you did.</p>
          {QUIZ_QUESTIONS.map((qq, i) => (
            <div className="mb-4" key={qq.key}>
              <h2 className="h6 fw-bold">
                {i + 1}. {qq.q}
              </h2>
              <div className="d-flex flex-wrap gap-2">
                {qq.opts.map((opt) => (
                  <ToggleButton
                    key={opt}
                    id={`${qq.key}-${opt}`}
                    label={opt}
                    checked={state.a.quiz[qq.key] === opt}
                    type="radio"
                    name={qq.key}
                    onChange={() => setState((s) => ({ ...s, a: { ...s.a, quiz: { ...s.a.quiz, [qq.key]: opt } } }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      );
    case 'A_RESULT': {
      const r = computeResult(state);
      return (
        <>
          <h1 className="h4 fw-bold">Your food personality</h1>
          <p className="text-muted">Here’s your initial taste snapshot, based on what you told us.</p>
          <div className="text-center my-4">
            <div style={{ fontSize: 48 }}>{r.emoji}</div>
            <h2 className="h5 fw-bold">{r.title}</h2>
            <p className="text-muted">{r.desc}</p>
          </div>
          <PreviewRow label="Top flavors" value={state.a.flavors.join(' · ')} />
          <PreviewRow label="Top cuisines" value={state.a.cuisines.join(' · ')} />
        </>
      );
    }

    /* --- Path B: Create & Inspire --- */
    case 'B_TYPE':
      return (
        <>
          <h1 className="h4 fw-bold">What best describes you?</h1>
          <CardPicker value={state.b.type} onSelect={(v) => setState((s) => ({ ...s, b: { ...s.b, type: v } }))} options={B_TYPE_OPTS} />
        </>
      );
    case 'B_PROFILE':
      return (
        <>
          <h1 className="h4 fw-bold">Creator profile</h1>
          <p className="text-muted">This is how food lovers will find and recognize you.</p>
          <TextField label="Creator name" value={state.b.profile.name} placeholder="e.g. Spice Trail Maya" onChange={(v) => setState((s) => ({ ...s, b: { ...s.b, profile: { ...s.b.profile, name: v } } }))} />
          <TextField label="Bio" value={state.b.profile.bio} placeholder="Tell food lovers what you're about…" onChange={(v) => setState((s) => ({ ...s, b: { ...s.b, profile: { ...s.b.profile, bio: v } } }))} />
          <TextField label="Location" value={state.b.profile.location} placeholder="Toronto, ON" onChange={(v) => setState((s) => ({ ...s, b: { ...s.b, profile: { ...s.b.profile, location: v } } }))} />
          <TextField label="Website (optional)" value={state.b.profile.website} placeholder="yourwebsite.com" onChange={(v) => setState((s) => ({ ...s, b: { ...s.b, profile: { ...s.b.profile, website: v } } }))} />
        </>
      );
    case 'B_SPECIALTY': {
      const list = SPECIALTY_MAP[state.b.type] || [];
      return (
        <>
          <h1 className="h4 fw-bold">Your specialty</h1>
          <p className="text-muted">For {state.b.type || 'your creator type'}.</p>
          {list.length ? (
            <MultiChips options={list} selected={state.b.specialty} onToggle={(v) => setState((s) => ({ ...s, b: { ...s.b, specialty: toggleArr(s.b.specialty, v) } }))} />
          ) : (
            <p className="text-muted">Go back and choose a creator type first.</p>
          )}
        </>
      );
    }
    case 'B_PORTFOLIO':
      return (
        <>
          <h1 className="h4 fw-bold">Content & portfolio</h1>
          <p className="text-muted">Optional — add a few samples so people know what to expect.</p>
          {(['photos', 'videos', 'recipes', 'menus', 'serviceImages'] as const).map((k) => (
            <UploadZone
              key={k}
              label={k === 'serviceImages' ? 'Service Images' : k[0].toUpperCase() + k.slice(1)}
              files={state.b.portfolio[k]}
              prefix={k}
              onAdd={() => setState((s) => ({ ...s, b: { ...s.b, portfolio: { ...s.b.portfolio, [k]: [...s.b.portfolio[k], `${k}_${s.b.portfolio[k].length + 1}.jpg`] } } }))}
              onRemove={(i) => setState((s) => ({ ...s, b: { ...s.b, portfolio: { ...s.b.portfolio, [k]: s.b.portfolio[k].filter((_, idx) => idx !== i) } } }))}
            />
          ))}
        </>
      );
    case 'B_AUDIENCE':
      return (
        <>
          <h1 className="h4 fw-bold">Audience focus</h1>
          <p className="text-muted">Who do you create for?</p>
          <MultiChips options={AUDIENCE} selected={state.b.audience} onToggle={(v) => setState((s) => ({ ...s, b: { ...s.b, audience: toggleArr(s.b.audience, v) } }))} />
        </>
      );
    case 'B_PREVIEW':
      return (
        <>
          <h1 className="h4 fw-bold">Profile preview</h1>
          <p className="text-muted">See how your profile will appear on FUZO.</p>
          <PreviewRow label="Creator name" value={state.b.profile.name} />
          <PreviewRow label="Type" value={state.b.type} />
          <PreviewRow label="Location" value={state.b.profile.location} />
          <PreviewRow label="Specialty" value={state.b.specialty.join(' · ')} />
          <PreviewRow label="Audience" value={state.b.audience.join(' · ')} />
        </>
      );

    /* --- Path C: Grow My Food Business --- */
    case 'C_TYPE':
      return (
        <>
          <h1 className="h4 fw-bold">What type of business do you operate?</h1>
          <CardPicker value={state.c.type} onSelect={(v) => setState((s) => ({ ...s, c: { ...s.c, type: v } }))} options={C_TYPE_OPTS} />
        </>
      );
    case 'C_PROFILE':
      return (
        <>
          <h1 className="h4 fw-bold">Business profile</h1>
          <p className="text-muted">The basics food lovers and FUZO will use to reach you.</p>
          <TextField label="Business name" value={state.c.profile.businessName} placeholder="e.g. Maya's Spice Trail Kitchen" onChange={(v) => setState((s) => ({ ...s, c: { ...s.c, profile: { ...s.c.profile, businessName: v } } }))} />
          <TextField label="Owner / contact name" value={state.c.profile.contact} placeholder="Maya Singh" onChange={(v) => setState((s) => ({ ...s, c: { ...s.c, profile: { ...s.c.profile, contact: v } } }))} />
          <TextField label="Phone" value={state.c.profile.phone} placeholder="(416) 555-0123" onChange={(v) => setState((s) => ({ ...s, c: { ...s.c, profile: { ...s.c.profile, phone: v } } }))} />
          <TextField label="Email" value={state.c.profile.email} placeholder="hello@business.com" onChange={(v) => setState((s) => ({ ...s, c: { ...s.c, profile: { ...s.c.profile, email: v } } }))} />
          <TextField label="Address" value={state.c.profile.address} placeholder="123 Queen St W, Toronto, ON" onChange={(v) => setState((s) => ({ ...s, c: { ...s.c, profile: { ...s.c.profile, address: v } } }))} />
        </>
      );
    case 'C_CUISINE':
      return (
        <>
          <h1 className="h4 fw-bold">Cuisine & offerings</h1>
          <p className="text-muted">Tell us what you serve and when.</p>
          <p className="fw-bold small mb-2">Cuisine type</p>
          <MultiChips options={CUISINES} selected={state.c.cuisine} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, cuisine: toggleArr(s.c.cuisine, v) } }))} />
          <p className="fw-bold small mt-3 mb-2">Food categories</p>
          <MultiChips options={FOOD_CATEGORIES} selected={state.c.categories} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, categories: toggleArr(s.c.categories, v) } }))} />
        </>
      );
    case 'C_MEDIA':
      return (
        <>
          <h1 className="h4 fw-bold">Menu & media</h1>
          <p className="text-muted">Optional — add a few samples so customers know what to expect.</p>
          {(['menu', 'photos', 'dishes'] as const).map((k) => (
            <UploadZone
              key={k}
              label={k[0].toUpperCase() + k.slice(1)}
              files={state.c.media[k]}
              prefix={k}
              onAdd={() => setState((s) => ({ ...s, c: { ...s.c, media: { ...s.c.media, [k]: [...s.c.media[k], `${k}_${s.c.media[k].length + 1}.jpg`] } } }))}
              onRemove={(i) => setState((s) => ({ ...s, c: { ...s.c, media: { ...s.c.media, [k]: s.c.media[k].filter((_, idx) => idx !== i) } } }))}
            />
          ))}
        </>
      );
    case 'C_IDENTITY':
      return (
        <>
          <h1 className="h4 fw-bold">Business identity</h1>
          <p className="text-muted">What best describes your business? Select all that apply.</p>
          <MultiChips options={BUSINESS_IDENTITY} selected={state.c.identity} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, identity: toggleArr(s.c.identity, v) } }))} />
        </>
      );
    case 'C_FEATURES':
      return (
        <>
          <h1 className="h4 fw-bold">Business features</h1>
          <p className="text-muted">Turn on what you offer, and connect any tools you already use.</p>
          {FEATURES_LIST.map((f) => (
            <div className="form-check form-switch mb-2" key={f.k}>
              <input
                className="form-check-input"
                id={`feat-${f.k}`}
                type="checkbox"
                role="switch"
                checked={state.c.features[f.k]}
                onChange={() => setState((s) => ({ ...s, c: { ...s.c, features: { ...s.c.features, [f.k]: !s.c.features[f.k] } } }))}
              />
              <label htmlFor={`feat-${f.k}`} className="form-check-label">
                {f.label}
              </label>
            </div>
          ))}
          <p className="fw-bold small mt-3 mb-2">Integrations</p>
          <MultiChips options={INTEGRATIONS} selected={state.c.integrations} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, integrations: toggleArr(s.c.integrations, v) } }))} />
        </>
      );
    case 'C_MATCHING':
      return (
        <>
          <h1 className="h4 fw-bold">Customer matching</h1>
          <p className="text-muted">Who should discover you?</p>
          <MultiChips options={CUSTOMER_MATCH} selected={state.c.matching} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, matching: toggleArr(s.c.matching, v) } }))} />
        </>
      );
    case 'C_PREVIEW':
      return (
        <>
          <h1 className="h4 fw-bold">Business preview</h1>
          <p className="text-muted">Preview your public profile.</p>
          <PreviewRow label="Business name" value={state.c.profile.businessName} />
          <PreviewRow label="Type" value={state.c.type} />
          <PreviewRow label="Address" value={state.c.profile.address} />
          <PreviewRow label="Cuisine" value={state.c.cuisine.join(' · ')} />
          <PreviewRow label="Categories" value={state.c.categories.join(' · ')} />
          <PreviewRow label="Identity" value={state.c.identity.join(' · ')} />
        </>
      );

    default:
      return null;
  }
}

function toggleArr(arr: string[], value: string, max?: number): string[] {
  if (arr.includes(value)) return arr.filter((v) => v !== value);
  if (max && arr.length >= max) return arr;
  return [...arr, value];
}

function CardPicker({
  value,
  onSelect,
  options,
  titleMap,
}: {
  value: string;
  onSelect: (v: string) => void;
  options: CardOpt[];
  titleMap?: Record<string, string>;
}) {
  return (
    <div className="list-group mb-3">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          className={`list-group-item list-group-item-action d-flex gap-3 align-items-start${value === o.v ? ' active' : ''}`}
          onClick={() => onSelect(o.v)}
        >
          <span style={{ fontSize: 24 }}>{o.emoji}</span>
          <span>
            <span className="fw-bold d-block">{titleMap?.[o.v] ?? o.v}</span>
            {o.d && <span className="small">{o.d}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function ToggleButton({
  id,
  label,
  checked,
  onChange,
  type = 'checkbox',
  name,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  type?: 'checkbox' | 'radio';
  name?: string;
}) {
  return (
    <>
      <input
        type={type}
        className="btn-check"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        autoComplete="off"
      />
      <label className="btn btn-outline-primary btn-sm" htmlFor={id}>
        {label}
      </label>
    </>
  );
}

function MultiChips({ options, selected, max, onToggle }: { options: readonly string[]; selected: string[]; max?: number; onToggle: (v: string) => void }) {
  const atMax = !!(max && selected.length >= max);
  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {options.map((opt, i) => {
          const on = selected.includes(opt);
          return (
            <span key={opt} className={!on && atMax ? 'opacity-50' : ''}>
              <ToggleButton id={`chip-${i}-${opt}`} label={opt} checked={on} onChange={() => onToggle(opt)} />
            </span>
          );
        })}
      </div>
      {max && (
        <p className="text-muted small">
          {selected.length} / {max} selected
        </p>
      )}
    </>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input type="text" className="form-control" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function UploadZone({ label, files, prefix, onAdd, onRemove }: { label: string; files: string[]; prefix: string; onAdd: () => void; onRemove: (i: number) => void }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <span className="fw-bold small">{label}</span>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAdd}>
          + Add sample
        </button>
      </div>
      <div className="d-flex flex-wrap gap-2 mt-2">
        {files.length ? (
          files.map((f, i) => (
            <span key={`${prefix}-${i}`} className="badge text-bg-light border">
              {f}{' '}
              <button type="button" className="btn-close btn-sm" style={{ fontSize: 8 }} onClick={() => onRemove(i)} aria-label="Remove" />
            </span>
          ))
        ) : (
          <span className="text-muted small">No files yet — placeholder only for this demo.</span>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="d-flex justify-content-between border-bottom py-2">
      <span className="fw-bold small">{label}</span>
      <span className="text-muted small text-end">{value || '—'}</span>
    </div>
  );
}
