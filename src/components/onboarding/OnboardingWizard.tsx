'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
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
  PATH_OPTS,
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
import { MultiChips, ToggleButton, toggleArr } from '@/components/ui/MultiChips';

// Ported from the old app's onboarding.html: the real branching flow
// (Discover Food / Create & Inspire / Grow My Food Business), starting at
// PATH_SELECT since account creation already happened on /login. Re-skinned
// with the onboarding-* classes in src/scss/_onboarding.scss (soft rounded
// cards + pill chips, from a Claude Design mockup) and real SVG icons from
// public/SVG/ in place of emoji glyphs, instead of Romio's compiled CSS.

type Setter = (updater: (prev: OnboardingState) => OnboardingState) => void;

// Presentational only - one hero image per screen, dropped in under
// public/onboarding/<name>.png. Doesn't touch data.ts (the actual flow/
// question logic) at all. Missing files fail silently via the <img>'s
// onError below rather than showing a broken-image icon, so this is safe to
// ship before every image exists.
const SCREEN_IMAGES: Record<string, string> = {
  PATH_SELECT: '/onboarding/path-select.png',
  A_TYPE: '/onboarding/a-type.png',
  A_FLAVORS: '/onboarding/a-flavors.png',
  A_CUISINES: '/onboarding/a-cuisines.png',
  A_DIETARY: '/onboarding/a-dietary.png',
  A_QUIZ: '/onboarding/a-quiz.png',
  B_TYPE: '/onboarding/b-type.png',
  B_PROFILE: '/onboarding/b-profile.png',
  B_SPECIALTY: '/onboarding/b-specialty.png',
  B_PORTFOLIO: '/onboarding/b-portfolio.png',
  B_AUDIENCE: '/onboarding/b-audience.png',
  B_PREVIEW: '/onboarding/b-preview.png',
  C_TYPE: '/onboarding/c-type.png',
  C_PROFILE: '/onboarding/c-profile.png',
  C_CUISINE: '/onboarding/c-cuisine.png',
  C_MEDIA: '/onboarding/c-media.png',
  C_IDENTITY: '/onboarding/c-identity.png',
  C_FEATURES: '/onboarding/c-features.png',
  C_MATCHING: '/onboarding/c-matching.png',
  C_PREVIEW: '/onboarding/c-preview.png',
};

// A_RESULT's image depends on which persona computeResult() lands on, not
// just the screen key - keyed by PERSONALITY[...].title since that's already
// a stable, unique string per persona (see data.ts).
const RESULT_IMAGES: Record<string, string> = {
  'Flavor Explorer': '/onboarding/a-result-explorer.png',
  'Comfort Craver': '/onboarding/a-result-comfort.png',
  'Health Hero': '/onboarding/a-result-health.png',
  'Trend Hunter': '/onboarding/a-result-trend.png',
};

export default function OnboardingWizard() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(initialOnboardingState);
  const [history, setHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Slideshow transition: the *entire* card (not just its text) flies out on
  // a 3D arc and the next one flies in from the opposite side - a coverflow/
  // card-shuffle feel, not a plain crossfade. `mutate` is whatever state
  // change actually advances the screen (goTo/goBack below); it only runs
  // once the exit half has finished, so the content swap happens off-screen.
  const animateTransition = (mutate: () => void, direction: 'forward' | 'backward') => {
    const el = cardRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mutate();
      window.scrollTo(0, 0);
      return;
    }
    setIsAnimating(true);
    const sign = direction === 'forward' ? -1 : 1;

    gsap.to(el, {
      x: sign * 44,
      rotateY: sign * -12,
      scale: 0.94,
      opacity: 0,
      duration: 0.4,
      ease: 'power1.in',
      onComplete: () => {
        mutate();
        window.scrollTo(0, 0);
        gsap.fromTo(
          el,
          { x: sign * -44, rotateY: sign * 12, scale: 0.94, opacity: 0 },
          {
            x: 0,
            rotateY: 0,
            scale: 1,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => setIsAnimating(false),
          },
        );
      },
    });
  };

  // One-time entrance for the very first card on mount, same easing as the
  // step transitions so it doesn't feel like a different animation system.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { y: 24, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'power3.out' });
  }, []);

  const goTo = (next: string) => {
    animateTransition(() => {
      setHistory((h) => [...h, state.screen]);
      setState((s) => ({ ...s, screen: next }));
    }, 'forward');
  };
  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    animateTransition(() => {
      setHistory((h) => h.slice(0, -1));
      setState((s) => ({ ...s, screen: prev }));
    }, 'backward');
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
          flavors: state.a.flavors,
          result_emoji: r.icon,
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
    if (!canContinue(state) || isAnimating) return;
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
  const visualSrc = state.screen === 'A_RESULT' ? RESULT_IMAGES[computeResult(state).title] : SCREEN_IMAGES[state.screen];

  return (
    <div className="onboarding-page">
      <div className="onboarding-step-label">
        Step {idx} of {total}
      </div>
      <div className="onboarding-progress">
        <div className="onboarding-progress__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="onboarding-card-stack">
        <div className="onboarding-card-stack__layer onboarding-card-stack__layer--2" aria-hidden="true" />
        <div className="onboarding-card-stack__layer onboarding-card-stack__layer--1" aria-hidden="true" />
        <div className="onboarding-card" ref={cardRef}>
          {visualSrc && <OnboardingVisual src={visualSrc} key={visualSrc} />}
          <div className="onboarding-card__body">
            <Screen state={state} setState={setState} onSelectPath={(p) => setState((s) => ({ ...s, pathChoice: p }))} />
          </div>
        </div>
      </div>

      <div className="onboarding-footer">
        {showBack ? (
          <button className="onboarding-btn-back" onClick={goBack} disabled={isAnimating} type="button">
            Back
          </button>
        ) : (
          <span />
        )}
        <button className="onboarding-btn-next" onClick={handleNext} disabled={!canContinue(state) || saving || isAnimating} type="button">
          {saving ? 'Saving…' : continueLabel(state)}
        </button>
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
          <h1 className="onboarding-title">How would you like to use FUZO?</h1>
          <p className="onboarding-subtitle">Pick the path that fits you best — you can explore the others later.</p>
          <CardPicker
            value={state.pathChoice ?? ''}
            onSelect={(v) => onSelectPath(v as 'A' | 'B' | 'C')}
            options={PATH_OPTS}
            titleMap={{ A: 'Discover Food', B: 'Create & Inspire', C: 'Grow My Food Business' }}
          />
        </>
      );

    /* --- Path A: Discover Food --- */
    case 'A_TYPE':
      return (
        <>
          <h1 className="onboarding-title">What describes you best?</h1>
          <CardPicker value={state.a.type} onSelect={(v) => setState((s) => ({ ...s, a: { ...s.a, type: v } }))} options={A_TYPE_OPTS} />
        </>
      );
    case 'A_FLAVORS':
      return (
        <>
          <h1 className="onboarding-title">What flavors do you enjoy?</h1>
          <p className="onboarding-subtitle">Select up to 5.</p>
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
          <h1 className="onboarding-title">Which cuisines do you enjoy?</h1>
          <p className="onboarding-subtitle">Select up to 10.</p>
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
          <h1 className="onboarding-title">Dietary preferences</h1>
          <p className="onboarding-subtitle">Optional — select any that apply, or skip.</p>
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
          <h1 className="onboarding-title">Food personality quiz</h1>
          <p className="onboarding-subtitle">Five quick questions — answer how you actually eat, not how you wish you did.</p>
          {QUIZ_QUESTIONS.map((qq, i) => (
            <div className="onboarding-quiz-q" key={qq.key}>
              <h2 className="onboarding-quiz-q__label">
                {i + 1}. {qq.q}
              </h2>
              <div className="onboarding-chips">
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
          <h1 className="onboarding-title">Your food personality</h1>
          <p className="onboarding-subtitle">Here’s your initial taste snapshot, based on what you told us.</p>
          <div className="onboarding-result">
            <div className="onboarding-result__icon">
              <img src={r.icon} alt="" />
            </div>
            <h2 className="onboarding-result__title">{r.title}</h2>
            <p className="onboarding-result__desc">{r.desc}</p>
          </div>
          <div className="onboarding-preview">
            <PreviewRow label="Top flavors" value={state.a.flavors.join(' · ')} />
            <PreviewRow label="Top cuisines" value={state.a.cuisines.join(' · ')} />
          </div>
        </>
      );
    }

    /* --- Path B: Create & Inspire --- */
    case 'B_TYPE':
      return (
        <>
          <h1 className="onboarding-title">What best describes you?</h1>
          <CardPicker value={state.b.type} onSelect={(v) => setState((s) => ({ ...s, b: { ...s.b, type: v } }))} options={B_TYPE_OPTS} />
        </>
      );
    case 'B_PROFILE':
      return (
        <>
          <h1 className="onboarding-title">Creator profile</h1>
          <p className="onboarding-subtitle">This is how food lovers will find and recognize you.</p>
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
          <h1 className="onboarding-title">Your specialty</h1>
          <p className="onboarding-subtitle">For {state.b.type || 'your creator type'}.</p>
          {list.length ? (
            <MultiChips options={list} selected={state.b.specialty} onToggle={(v) => setState((s) => ({ ...s, b: { ...s.b, specialty: toggleArr(s.b.specialty, v) } }))} />
          ) : (
            <p className="onboarding-subtitle">Go back and choose a creator type first.</p>
          )}
        </>
      );
    }
    case 'B_PORTFOLIO':
      return (
        <>
          <h1 className="onboarding-title">Content & portfolio</h1>
          <p className="onboarding-subtitle">Optional — add a few samples so people know what to expect.</p>
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
          <h1 className="onboarding-title">Audience focus</h1>
          <p className="onboarding-subtitle">Who do you create for?</p>
          <MultiChips options={AUDIENCE} selected={state.b.audience} onToggle={(v) => setState((s) => ({ ...s, b: { ...s.b, audience: toggleArr(s.b.audience, v) } }))} />
        </>
      );
    case 'B_PREVIEW':
      return (
        <>
          <h1 className="onboarding-title">Profile preview</h1>
          <p className="onboarding-subtitle">See how your profile will appear on FUZO.</p>
          <div className="onboarding-preview">
            <PreviewRow label="Creator name" value={state.b.profile.name} />
            <PreviewRow label="Type" value={state.b.type} />
            <PreviewRow label="Location" value={state.b.profile.location} />
            <PreviewRow label="Specialty" value={state.b.specialty.join(' · ')} />
            <PreviewRow label="Audience" value={state.b.audience.join(' · ')} />
          </div>
        </>
      );

    /* --- Path C: Grow My Food Business --- */
    case 'C_TYPE':
      return (
        <>
          <h1 className="onboarding-title">What type of business do you operate?</h1>
          <CardPicker value={state.c.type} onSelect={(v) => setState((s) => ({ ...s, c: { ...s.c, type: v } }))} options={C_TYPE_OPTS} />
        </>
      );
    case 'C_PROFILE':
      return (
        <>
          <h1 className="onboarding-title">Business profile</h1>
          <p className="onboarding-subtitle">The basics food lovers and FUZO will use to reach you.</p>
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
          <h1 className="onboarding-title">Cuisine & offerings</h1>
          <p className="onboarding-subtitle">Tell us what you serve and when.</p>
          <p className="onboarding-quiz-q__label">Cuisine type</p>
          <MultiChips options={CUISINES} selected={state.c.cuisine} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, cuisine: toggleArr(s.c.cuisine, v) } }))} />
          <p className="onboarding-quiz-q__label" style={{ marginTop: '1rem' }}>Food categories</p>
          <MultiChips options={FOOD_CATEGORIES} selected={state.c.categories} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, categories: toggleArr(s.c.categories, v) } }))} />
        </>
      );
    case 'C_MEDIA':
      return (
        <>
          <h1 className="onboarding-title">Menu & media</h1>
          <p className="onboarding-subtitle">Optional — add a few samples so customers know what to expect.</p>
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
          <h1 className="onboarding-title">Business identity</h1>
          <p className="onboarding-subtitle">What best describes your business? Select all that apply.</p>
          <MultiChips options={BUSINESS_IDENTITY} selected={state.c.identity} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, identity: toggleArr(s.c.identity, v) } }))} />
        </>
      );
    case 'C_FEATURES':
      return (
        <>
          <h1 className="onboarding-title">Business features</h1>
          <p className="onboarding-subtitle">Turn on what you offer, and connect any tools you already use.</p>
          <div style={{ marginBottom: '1.375rem' }}>
            {FEATURES_LIST.map((f) => {
              const on = state.c.features[f.k];
              return (
                <div className="onboarding-switch-row" key={f.k}>
                  <span className="onboarding-switch-row__label">{f.label}</span>
                  <button
                    type="button"
                    className={`onboarding-switch${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => setState((s) => ({ ...s, c: { ...s.c, features: { ...s.c.features, [f.k]: !s.c.features[f.k] } } }))}
                  >
                    <span className="onboarding-switch__thumb" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="onboarding-quiz-q__label">Integrations</p>
          <MultiChips options={INTEGRATIONS} selected={state.c.integrations} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, integrations: toggleArr(s.c.integrations, v) } }))} />
        </>
      );
    case 'C_MATCHING':
      return (
        <>
          <h1 className="onboarding-title">Customer matching</h1>
          <p className="onboarding-subtitle">Who should discover you?</p>
          <MultiChips options={CUSTOMER_MATCH} selected={state.c.matching} onToggle={(v) => setState((s) => ({ ...s, c: { ...s.c, matching: toggleArr(s.c.matching, v) } }))} />
        </>
      );
    case 'C_PREVIEW':
      return (
        <>
          <h1 className="onboarding-title">Business preview</h1>
          <p className="onboarding-subtitle">Preview your public profile.</p>
          <div className="onboarding-preview">
            <PreviewRow label="Business name" value={state.c.profile.businessName} />
            <PreviewRow label="Type" value={state.c.type} />
            <PreviewRow label="Address" value={state.c.profile.address} />
            <PreviewRow label="Cuisine" value={state.c.cuisine.join(' · ')} />
            <PreviewRow label="Categories" value={state.c.categories.join(' · ')} />
            <PreviewRow label="Identity" value={state.c.identity.join(' · ')} />
          </div>
        </>
      );

    default:
      return null;
  }
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
    <div className="onboarding-option-list">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          className={`onboarding-option${value === o.v ? ' is-active' : ''}`}
          onClick={() => onSelect(o.v)}
        >
          <span className="onboarding-option__icon">
            <img src={o.icon} alt="" />
          </span>
          <span>
            <span className="onboarding-option__title">{titleMap?.[o.v] ?? o.v}</span>
            {o.d && <span className="onboarding-option__desc">{o.d}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}


function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div className="onboarding-field">
      <label className="onboarding-field__label">{label}</label>
      <input type="text" className="onboarding-field__input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function UploadZone({ label, files, prefix, onAdd, onRemove }: { label: string; files: string[]; prefix: string; onAdd: () => void; onRemove: (i: number) => void }) {
  return (
    <div className="onboarding-upload">
      <div className="onboarding-upload__head">
        <span className="onboarding-upload__label">{label}</span>
        <button type="button" className="onboarding-upload__add" onClick={onAdd}>
          + Add sample
        </button>
      </div>
      <div className="onboarding-upload__files">
        {files.length ? (
          files.map((f, i) => (
            <span key={`${prefix}-${i}`} className="onboarding-file-chip">
              {f}
              <button type="button" className="onboarding-file-chip__remove" onClick={() => onRemove(i)} aria-label="Remove">
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="onboarding-upload__empty">No files yet — placeholder only for this demo.</span>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="onboarding-preview-row">
      <span className="onboarding-preview-row__label">{label}</span>
      <span className="onboarding-preview-row__value">{value || '—'}</span>
    </div>
  );
}

// Hides itself if the image 404s, so screens ship fine before every image
// exists under public/onboarding/. Can't rely on <img onError> alone: on a
// fast local 404 the browser can fire the error event before React finishes
// attaching the listener (a well-known React/img race), so this also checks
// img.complete && naturalWidth === 0 in a layout effect as a fallback for
// failures that already resolved by the time this mounts. The parent keys
// this component by src, so a screen/persona change remounts it with
// broken reset to false instead of needing to reset it here.
function OnboardingVisual({ src }: { src: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) {
      setBroken(true);
    } else if (img.complete) {
      // Already cached by the time this mounts - onLoad won't fire again.
      setLoaded(true);
    }
  }, []);

  if (broken) return null;

  return (
    <div className="onboarding-card__visual">
      <img
        ref={imgRef}
        src={src}
        alt=""
        className={loaded ? 'is-loaded' : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
