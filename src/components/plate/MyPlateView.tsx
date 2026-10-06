'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpDown,
  BookmarkMinus,
  ChefHat,
  Clapperboard,
  Compass,
  LayoutGrid,
  MapPin,
  Navigation,
  Newspaper,
  Play,
  RefreshCw,
  Salad,
  Search,
  Sparkles,
  UtensilsCrossed,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import PlateService, { type SavedPlateItem } from '@/lib/services/plateService';
import { normalizeSavedItemForUI } from '@/lib/services/savedItems';
import { directionsUrl, mapUrl } from '@/lib/maps/placeLinks';
import { useAuth } from '@/components/auth/AuthProvider';
import SavedItemDetailModal from '@/components/profile/SavedItemDetailModal';
import { Rail, SkeletonCards } from '@/components/dashboard/Rail';
import type { AppItem } from '@/types/appItem';

// My Plate: everything the user has saved anywhere in FUZO (places from Home
// and Scout, recipes from Bites, Feed likes, Trims, cards from chats), read
// from saved_items and grouped by kind. Places open their details page and
// have a Directions button (FUZO's map); recipes / feed finds open the saved
// item sheet; trims open the Trims reel. Remove has an Undo.

type PlateKind = 'places' | 'dishes' | 'recipes' | 'feed' | 'trims' | 'other';
type Filter = 'all' | PlateKind;
type Sort = 'newest' | 'oldest' | 'name';

type PlateEntry = {
  key: string;
  kind: PlateKind;
  raw: SavedPlateItem;
  item: AppItem;
  title: string;
  image: string | null;
  sub: string;
  savedAt: number;
};

const KINDS: Array<{ key: PlateKind; label: string; short: string; icon: LucideIcon; empty: string }> = [
  { key: 'places', label: 'Places', short: 'Places', icon: MapPin, empty: 'Save spots from Home or the map.' },
  { key: 'dishes', label: 'Dishes', short: 'Dishes', icon: UtensilsCrossed, empty: 'Save dishes from a restaurant\'s menu.' },
  { key: 'recipes', label: 'Recipes & Bites', short: 'Recipes', icon: ChefHat, empty: 'Save recipes from Bites.' },
  { key: 'feed', label: 'Feed finds', short: 'Feed', icon: Newspaper, empty: 'Swipe right on Feed cards to keep them.' },
  { key: 'trims', label: 'Trims', short: 'Trims', icon: Clapperboard, empty: 'Bookmark Trims to watch later.' },
  { key: 'other', label: 'More saves', short: 'More', icon: Sparkles, empty: '' },
];
const KIND_META = Object.fromEntries(KINDS.map((k) => [k.key, k])) as Record<PlateKind, (typeof KINDS)[number]>;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');

function kindOf(s: SavedPlateItem): PlateKind {
  const m = s.metadata ?? {};
  if (s.item_type === 'restaurant') return 'places';
  if (s.item_type === 'dish') return 'dishes';
  if (s.item_type === 'recipe') return 'recipes';
  if (s.item_type === 'video') return 'trims';
  if (s.item_type === 'photo' || str(m.card_type)) return 'feed';
  if (Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng)) && m.lat != null) return 'places';
  return 'other';
}

function toEntry(s: SavedPlateItem): PlateEntry {
  const m = s.metadata ?? {};
  const kind = kindOf(s);
  const item = normalizeSavedItemForUI(s);
  const image = str(m.image) || str(m.img) || str(m.image_url) || null;
  const minutes = Number(m.readyInMinutes);
  const sub =
    kind === 'places'
      ? str(m.address) || str(m.cat) || 'Saved place'
      : kind === 'dishes'
        ? [str(m.restaurantName) && `at ${str(m.restaurantName)}`, Number.isFinite(Number(m.price)) && m.price != null ? formatPrice(Number(m.price), str(m.currency) || 'USD') : ''].filter(Boolean).join(' · ') || 'Dish'
      : kind === 'recipes'
        ? [Number.isFinite(minutes) && minutes > 0 ? `${minutes} min` : '', Number(m.servings) > 0 ? `Serves ${Number(m.servings)}` : ''].filter(Boolean).join(' · ') || 'Recipe'
        : kind === 'feed'
          ? [str(m.authorName) && `by ${str(m.authorName)}`, str(m.cuisine)].filter(Boolean).join(' · ') || 'From your feed'
          : kind === 'trims'
            ? 'Studio Trim'
            : str(m.cat) || 'Saved item';
  return {
    key: s.id,
    kind,
    raw: s,
    item,
    title: item.name || 'Saved item',
    image,
    sub,
    savedAt: new Date(s.created_at).getTime() || 0,
  };
}

const formatPrice = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount}`;
  }
};

const ago = (t: number) => {
  if (!t) return '';
  const d = Math.floor((Date.now() - t) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Tapping a saved place: FUZO's map with its pop-up (a FUZO restaurant's has "View on FUZO"). */
function placeHref(e: PlateEntry): string | null {
  const id = e.raw.item_id;
  if (id.startsWith('fuzo-rest-')) {
    const restaurantId = id.slice('fuzo-rest-'.length);
    return mapUrl({ ...placeRef(e), restaurantId }) ?? `/profile/${restaurantId}`;
  }
  return mapUrl(placeRef(e));
}
const placeRef = (e: PlateEntry) => ({ name: e.title, placeId: str(e.raw.metadata?.placeId) || e.raw.item_id, lat: e.item.lat, lng: e.item.lng });

export default function MyPlateView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PlateEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [query, setQuery] = useState('');
  // Search starts as a small icon in the header; tapping it opens the field.
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };
  const [openItem, setOpenItem] = useState<PlateEntry | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: { entry: PlateEntry; index: number } } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const listTop = useRef<HTMLDivElement>(null);

  // Reset to loading when the signed-in user or a retry changes the request.
  const userId = user?.id ?? null;
  const reqKey = `${userId ?? ''}:${attempt}`;
  const [seenReq, setSeenReq] = useState(reqKey);
  if (seenReq !== reqKey) {
    setSeenReq(reqKey);
    setStatus('loading');
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    PlateService.listSavedItems().then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setStatus('error');
        return;
      }
      setEntries((res.data ?? []).map(toEntry));
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const showToast = useCallback((t: NonNullable<typeof toast>) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), t.undo ? 5000 : 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const remove = async (entry: PlateEntry) => {
    const index = entries.findIndex((e) => e.key === entry.key);
    setEntries((prev) => prev.filter((e) => e.key !== entry.key));
    if (openItem?.key === entry.key) setOpenItem(null);
    const res = await PlateService.removeFromPlate({ itemId: entry.raw.item_id, itemType: entry.raw.item_type });
    if (!res.success) {
      setEntries((prev) => {
        const next = [...prev];
        next.splice(Math.max(0, index), 0, entry);
        return next;
      });
      showToast({ text: res.error || 'Could not remove that - try again' });
      return;
    }
    showToast({ text: `Removed “${entry.title}”`, undo: { entry, index } });
  };

  const undoRemove = async () => {
    const undo = toast?.undo;
    if (!undo) return;
    setToast(null);
    const { entry, index } = undo;
    setEntries((prev) => {
      const next = [...prev];
      next.splice(Math.min(Math.max(0, index), next.length), 0, entry);
      return next;
    });
    const res = await PlateService.saveToPlate({ itemId: entry.raw.item_id, itemType: entry.raw.item_type, metadata: entry.raw.metadata });
    if (!res.success) {
      setEntries((prev) => prev.filter((e) => e.key !== entry.key));
      showToast({ text: res.error || 'Could not restore that item' });
    } else if (res.data) {
      // Same item, new row id.
      const fresh = toEntry({ ...res.data, created_at: entry.raw.created_at });
      setEntries((prev) => prev.map((e) => (e.key === entry.key ? fresh : e)));
    }
  };

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: entries.length, places: 0, dishes: 0, recipes: 0, feed: 0, trims: 0, other: 0 };
    entries.forEach((e) => (c[e.kind] += 1));
    return c;
  }, [entries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter(
      (e) => (filter === 'all' || e.kind === filter) && (!q || e.title.toLowerCase().includes(q) || e.sub.toLowerCase().includes(q)),
    );
    if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'oldest') list.sort((a, b) => a.savedAt - b.savedAt);
    else list.sort((a, b) => b.savedAt - a.savedAt);
    return list;
  }, [entries, filter, query, sort]);

  const pickFilter = (f: Filter) => {
    setFilter(f);
    // Bring the list back into view after "See all" from further down the page.
    const top = listTop.current;
    if (top && top.getBoundingClientRect().top < 0) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      top.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
  };

  // Only kinds the user has saved something in (plus All, and the selected one).
  const chips: Filter[] = ['all', ...KINDS.map((k) => k.key).filter((k) => counts[k] > 0 || filter === k)];
  const searching = query.trim().length > 0;
  const grouped = filter === 'all' && !searching;

  // The kind chip only shows where kinds mix (search across All) - a section already names its kind.
  const showKind = filter === 'all' && searching;
  const card = (e: PlateEntry) => <PlateCard key={e.key} entry={e} showKind={showKind} onOpen={() => setOpenItem(e)} onRemove={() => remove(e)} />;

  let content: React.ReactNode;
  if (!user) {
    content = (
      <div className="fz-plate__state">
        <span className="fz-plate__state-icon"><Salad size={28} /></span>
        <h2>Sign in to see your plate</h2>
        <p>Everything you save across FUZO lands here.</p>
        <Link href="/login" className="fz-plate__btn fz-plate__btn--primary">Sign in</Link>
      </div>
    );
  } else if (status === 'loading') {
    content = (
      <section className="fz-dash-rail" aria-busy="true" aria-label="Loading your saved items">
        <div className="fz-dash-rail__head">
          <div className="fz-dash-rail__heading">
            <h2 className="fz-dash-rail__title">Loading your plate…</h2>
          </div>
        </div>
        <div className="fz-dash-rail__track">
          <SkeletonCards />
        </div>
      </section>
    );
  } else if (status === 'error') {
    content = (
      <div className="fz-plate__state">
        <span className="fz-plate__state-icon"><RefreshCw size={26} /></span>
        <h2>Couldn&apos;t load your plate</h2>
        <p>Check your connection and try again.</p>
        <button type="button" className="fz-plate__btn fz-plate__btn--primary" onClick={() => setAttempt((a) => a + 1)}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  } else if (entries.length === 0) {
    content = (
      <div className="fz-plate__state">
        <span className="fz-plate__state-icon"><Salad size={30} /></span>
        <h2>Your plate is empty</h2>
        <p>Save places, recipes, feed finds and trims - they&apos;ll all wait for you here.</p>
        <div className="fz-plate__state-actions">
          <Link href="/scout" className="fz-plate__btn fz-plate__btn--primary"><Compass size={16} /> Explore places</Link>
          <Link href="/dashboard?tab=bites" className="fz-plate__btn"><ChefHat size={16} /> Browse recipes</Link>
        </div>
      </div>
    );
  } else if (visible.length === 0) {
    content = (
      <div className="fz-plate__state fz-plate__state--compact">
        <span className="fz-plate__state-icon"><Search size={24} /></span>
        <h2>Nothing matches</h2>
        <p>{searching ? `No saves match “${query.trim()}”.` : KIND_META[filter as PlateKind]?.empty || 'Nothing here yet.'}</p>
        {(searching || filter !== 'all') && (
          <button type="button" className="fz-plate__btn" onClick={() => { setQuery(''); setFilter('all'); }}>
            Show everything
          </button>
        )}
      </div>
    );
  } else if (grouped) {
    // Same panels as Home: 4 cards, then a "See all" stack that expands in place.
    content = KINDS.filter((k) => counts[k.key] > 0).map((k) => {
      const list = visible.filter((e) => e.kind === k.key);
      return (
        <Rail key={k.key} title={k.label} sub={`${list.length} saved`} previews={list.map((e) => e.image ?? undefined)}>
          {list.map(card)}
        </Rail>
      );
    });
  } else {
    const label = searching ? `Results for “${query.trim()}”` : KIND_META[filter as PlateKind]?.label ?? 'Everything';
    content = (
      <section className="fz-dash-rail is-expanded">
        <div className="fz-dash-rail__head">
          <div className="fz-dash-rail__heading">
            <h2 className="fz-dash-rail__title">{label}</h2>
            <p className="fz-dash-rail__sub">
              {visible.length} saved{searching && filter !== 'all' ? ` · ${KIND_META[filter as PlateKind].short}` : ''}
            </p>
          </div>
        </div>
        {/* Keyed by filter so a new kind pops in fresh. */}
        <div key={`${filter}|${searching}`} className="fz-dash-rail__track fz-dash-rail__track--grid">
          {visible.map(card)}
        </div>
      </section>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="fz-plate">
        <div className="fz-plate__wrap">
          <header className="fz-plate__head">
            <Link href="/dashboard" className="fz-plate__back" aria-label="Back to home" title="Home">
              <ArrowLeft size={20} strokeWidth={2.4} />
            </Link>
            <AnimatePresence initial={false} mode="popLayout">
              {searchOpen ? (
                <motion.label
                  key="search"
                  className="fz-plate__search"
                  initial={{ opacity: 0, scaleX: 0.4 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ originX: 1 }}
                >
                  <Search size={17} aria-hidden="true" />
                  <span className="visually-hidden">Search your plate</span>
                  <input
                    type="search"
                    // Opened by the user's own tap on the search icon.
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                    placeholder="Search your plate"
                  />
                  <button type="button" className="fz-plate__search-clear" onClick={closeSearch} aria-label="Close search">
                    <X size={15} />
                  </button>
                </motion.label>
              ) : (
                <motion.div
                  key="title"
                  className="fz-plate__title-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1 className="fz-plate__title">My Plate</h1>
                  <p className="fz-plate__lede">
                    {user && status === 'ready' && entries.length > 0 ? `${entries.length} saved` : 'Everything you save, in one place'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {user && status === 'ready' && entries.length > 0 && !searchOpen && (
              <div className="fz-plate__tools">
                <button type="button" className="fz-plate__icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search your plate" title="Search">
                  <Search size={18} />
                </button>
                <label className="fz-plate__sort">
                  <ArrowUpDown size={15} aria-hidden="true" />
                  <span className="visually-hidden">Sort by</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">A–Z</option>
                  </select>
                </label>
              </div>
            )}
          </header>

          {user && status === 'ready' && entries.length > 0 && (
            <>
              {/* One row; scrolls sideways when there are more kinds than fit. */}
              <div className="fz-plate__chips" role="group" aria-label="Filter by kind" ref={listTop}>
                {chips.map((f) => {
                  const Icon = f === 'all' ? LayoutGrid : KIND_META[f].icon;
                  return (
                    <button key={f} type="button" className="fz-plate__chip" aria-pressed={filter === f} onClick={() => pickFilter(f)}>
                      <Icon size={15} aria-hidden="true" />
                      {f === 'all' ? 'All' : KIND_META[f].short}
                      <span className="fz-plate__chip-count">{counts[f]}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="fz-plate__content">{content}</div>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              className="fz-plate__toast"
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{toast.text}</span>
              {toast.undo && (
                <button type="button" className="fz-plate__toast-undo" onClick={undoRemove}>
                  Undo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {openItem && (
          <SavedItemDetailModal
            item={openItem.item}
            savedItems={entries.map((e) => e.item)}
            onClose={() => setOpenItem(null)}
            onUnsave={() => remove(openItem)}
          />
        )}
      </main>
    </MotionConfig>
  );
}

// Same dark photo card as Home's rails (fz-dash-card): full-bleed photo, kind
// chip (mixed results only), title + meta at the bottom. Round frosted buttons top-right:
// Directions (places, opens the route on Scout) and Remove.
function PlateCard({ entry, showKind, onOpen, onRemove }: { entry: PlateEntry; showKind: boolean; onOpen: () => void; onRemove: () => void }) {
  const { kind, title, image, sub, item } = entry;
  const meta = KIND_META[kind];
  const KindIcon = meta.icon;
  const href =
    kind === 'places' ? placeHref(entry) : kind === 'trims' ? '/trims' : kind === 'dishes' && str(entry.raw.metadata?.restaurantId) ? `/profile/${str(entry.raw.metadata?.restaurantId)}` : null;
  const directions = kind === 'places' ? directionsUrl(placeRef(entry)) : null;
  const rating = kind === 'places' && typeof item.rating === 'number' && item.rating > 0 ? item.rating : null;
  const openLabel = `Open ${title}`;
  const saved = ago(entry.savedAt);

  return (
    <div className="fz-dash-card fz-plate-card">
      {href ? (
        <Link href={href} className="fz-dash-card__link" aria-label={openLabel} />
      ) : (
        <button type="button" className="fz-dash-card__link" onClick={onOpen} aria-label={openLabel} />
      )}

      {image ? (
        <img className="fz-dash-card__img" src={image} alt="" loading="lazy" />
      ) : (
        <span className={`fz-dash-card__img fz-plate-card__ph fz-plate-card__ph--${kind}`}>
          {kind !== 'trims' && <KindIcon size={34} aria-hidden="true" />}
        </span>
      )}
      <span className="fz-dash-card__shade" />
      {kind === 'trims' && (
        <span className="fz-dash-card__play" aria-hidden="true">
          <Play size={20} fill="currentColor" />
        </span>
      )}

      {showKind && (
        <span className="fz-dash-card__chip">
          <KindIcon size={11} aria-hidden="true" /> {meta.short}
        </span>
      )}

      <span className="fz-dash-card__body">
        <span className="fz-dash-card__title">{title}</span>
        <span className="fz-dash-card__meta">
          {rating && (
            <span className="fz-dash-card__rating">
              <Star size={11} fill="currentColor" aria-hidden="true" /> {rating.toFixed(1)}
            </span>
          )}
          <span className="fz-dash-card__sub">{sub}</span>
        </span>
        {saved && <span className="fz-plate-card__when">Saved {saved.toLowerCase()}</span>}
      </span>

      <span className="fz-plate-card__fabs">
        {directions && (
          <Link href={directions} className="fz-plate-card__fab" aria-label={`Directions to ${title}`} title="Directions">
            <Navigation size={16} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        )}
        <button type="button" className="fz-plate-card__fab fz-plate-card__fab--remove" onClick={onRemove} aria-label={`Remove ${title} from My Plate`} title="Remove">
          <BookmarkMinus size={16} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
