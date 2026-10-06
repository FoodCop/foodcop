'use client';

import { useEffect, useState, useMemo, useCallback, useRef, useSyncExternalStore } from 'react';
import type { AppItem } from '../../types/appItem';
import PlateService from '../../lib/services/plateService';
import { normalizeSavedItemForUI } from '../../lib/services/savedItems';
import SavedItemDetailModal from './SavedItemDetailModal';
import ShareSheet, { sharePayloadFromItem, type SharePayload } from '@/components/share/ShareSheet';
import FoodCardDetailModal from './FoodCardDetailModal';
import CreateCardModal from '../create/CreateCardModal';
import { TYPE_META, type FoodCardFamily, type FoodCardRecord } from '../../lib/types/foodCard';
import { useAuth } from '../auth/AuthProvider';
import ProfileFoodMap, { type ProfileMapPlace } from './ProfileFoodMap';
import { ChevronDown, ChevronRight, ChevronUp, Grid3x3, MapPin, Plus } from 'lucide-react';

export type ActivityCategory = 'all' | 'places' | 'recipes' | 'videos' | 'posts';
export type SubCategoryKey = 'places' | 'recipes' | 'videos' | 'posts';

interface ActivityTabProps {
  userId?: string;
  isCurrentUser?: boolean;
  initialCategory?: ActivityCategory;
  myCards: FoodCardRecord[];
  isLoadingCards: boolean;
  refetchCards: () => void | Promise<void>;
}

type ActivityTile = {
  id: string;
  category: SubCategoryKey;
} & (
  | { kind: 'saved'; item: AppItem }
  | { kind: 'card'; item: FoodCardRecord }
);

const CATEGORY_TO_FAMILY: Record<SubCategoryKey, FoodCardFamily> = {
  places: 'restaurant',
  recipes: 'recipe',
  videos: 'video',
  posts: 'discovery',
};

const FAMILY_TO_CATEGORY: Record<FoodCardFamily, SubCategoryKey> = {
  restaurant: 'places',
  recipe: 'recipes',
  video: 'videos',
  discovery: 'posts',
};

const savedItemCategory = (item: AppItem): SubCategoryKey => {
  if (item.id?.startsWith('recipe-') || item.itemType === 'recipe' || item.itemType === 'dish') return 'recipes';
  if (item.id?.startsWith('video-') || item.itemType === 'video') return 'videos';
  if (item.id?.startsWith('post-') || item.itemType === 'post') return 'posts';
  return 'places';
};

const CATEGORIES: Array<{ key: ActivityCategory; label: string; singular: string }> = [
  { key: 'all', label: 'All', singular: 'bite' },
  { key: 'places', label: 'Places', singular: 'place' },
  { key: 'recipes', label: 'Recipes', singular: 'recipe' },
  { key: 'videos', label: 'Videos', singular: 'video' },
  { key: 'posts', label: 'Posts', singular: 'post' },
];

const SECTION_KEYS: SubCategoryKey[] = ['places', 'recipes', 'videos', 'posts'];

const SECTION_LABELS: Record<SubCategoryKey, string> = {
  places: 'Places & Spots',
  recipes: 'Recipes & Home Bites',
  videos: 'Bite Videos',
  posts: 'Food Reviews & Notes',
};

// Cards are highlight-sized (CSS: repeat(auto-fill, var(--hl-w))), so the
// number per row depends on the width - read it back from the rendered grid so
// "show more" always adds whole rows. Card width also follows the viewport
// height, hence the window resize listener next to the ResizeObserver.
// First guess before the grid exists (mirrors --hl-h/--hl-w in _profile.scss and
// the panel paddings), so the first paint already shows about the right count.
function guessColumns() {
  if (typeof window === 'undefined') return 4;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = vw <= 768;
  const cardH = phone ? Math.min(240, Math.max(150, Math.min(vh * 0.26, vw * 0.54))) : Math.min(310, Math.max(190, vh * 0.29));
  const gap = phone ? 12 : 16;
  const width = Math.min(vw, 1480) - (phone ? 53 : 93);
  return Math.max(1, Math.floor((width + gap) / (cardH * 0.73 + gap)));
}

function useCardColumns() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [cols, setCols] = useState(guessColumns);
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      const grid = el.querySelector('.fz-activity-grid');
      if (!grid) return;
      const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (tracks > 0) setCols(tracks);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [el]);
  return [setEl, cols] as const;
}

// Phones get a compact "All" view: each section is a fanned stack of a few
// photos (like a hand of playing cards) that opens that section's own tab.
const PHONE_QUERY = '(max-width: 768px)';
function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
function useIsPhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

const STACK_SIZE = 4;
const tilePhoto = (tile: ActivityTile): string | null =>
  tile.kind === 'card' ? tile.item.image_url || tile.item.media_url || null : tile.item.img || null;

function SectionStack({ tiles, label, onOpen }: { tiles: ActivityTile[]; label: string; onOpen: () => void }) {
  const photos = tiles.map(tilePhoto).filter((p): p is string => !!p).slice(0, STACK_SIZE);
  const count = tiles.length;
  return (
    <button type="button" className="fz-activity-stack" onClick={onOpen} aria-label={`See all ${count} in ${label}`}>
      <span className={`fz-activity-stack__pile fz-activity-stack__pile--${Math.max(photos.length, 1)}`} aria-hidden="true">
        {photos.length > 0 ? (
          photos.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" className={`fz-activity-stack__print fz-activity-stack__print--${i + 1}`} />
          ))
        ) : (
          <span className="fz-activity-stack__print fz-activity-stack__print--1 fz-activity-stack__print--blank" />
        )}
      </span>
      <span className="fz-activity-stack__text">
        <span className="fz-activity-stack__label">See all</span>
        <span className="fz-activity-stack__count">{count} {count === 1 ? 'item' : 'items'}</span>
      </span>
      <span className="fz-activity-stack__go" aria-hidden="true">
        <ChevronRight size={18} strokeWidth={2.6} />
      </span>
    </button>
  );
}

function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'recently';
  const time = new Date(dateString).getTime();
  if (isNaN(time)) return 'recently';
  const diffMs = Date.now() - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths >= 1) return `${diffMonths}mo`;
  if (diffWeeks >= 1) return `${diffWeeks}w`;
  if (diffDays >= 1) return `${diffDays}d`;
  if (diffHours >= 1) return `${diffHours}h`;
  if (diffMin >= 1) return `${diffMin}m`;
  return 'just now';
}

function getCardBadgeLabel(cardType?: string): string {
  if (!cardType) return 'POST';
  switch (cardType) {
    case 'RESTAURANT_VISIT':
      return 'RESTAURANT';
    case 'CAFE_VISIT':
      return 'CAFÉ';
    case 'STREET_FOOD':
      return 'STREET FOOD';
    case 'BITE_VIDEO':
      return 'BITE VIDEO';
    case 'RECIPE':
      return 'RECIPE';
    case 'HOME_COOKING':
      return 'RECIPE';
    case 'DESSERT':
      return 'DESSERT';
    case 'DRINK':
      return 'DRINK';
    case 'FOOD_REVIEW':
      return 'REVIEW';
    case 'FOOD_EXPLORATION':
      return 'EXPLORATION';
    case 'FOOD_RECOMMENDATION':
      return 'RECOMMENDATION';
    case 'FOOD_COLLECTION':
      return 'COLLECTION';
    default:
      return cardType.replace(/_/g, ' ').toUpperCase();
  }
}

function ActivityCardItem({
  tile,
  onSelectCard,
  onSelectItem,
}: {
  tile: ActivityTile;
  onSelectCard: (card: FoodCardRecord) => void;
  onSelectItem: (item: AppItem) => void;
}) {
  if (tile.kind === 'card') {
    const card = tile.item;
    const photo = card.image_url || card.media_url;
    const badge = getCardBadgeLabel(card.card_type);
    const source =
      card.tags?.cuisine?.[0] ||
      card.caption ||
      (card.place_id ? 'Place' : TYPE_META[card.card_type]?.label || 'Food note');
    const time = formatTimeAgo(card.created_at);

    return (
      <button
        type="button"
        className="fz-activity-card"
        onClick={() => onSelectCard(card)}
      >
        {photo ? (
          <img
            src={photo}
            alt={card.title}
            className="fz-activity-card__photo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="fz-activity-card__fallback-photo" />
        )}

        <span className="fz-activity-card__badge">{badge}</span>

        {card.status === 'DRAFT' && (
          <span className="fz-activity-card__draft-badge">Draft</span>
        )}

        <div className="fz-activity-card__overlay">
          <div className="fz-activity-card__title">{card.title}</div>
          <div className="fz-activity-card__subtitle">
            {source} · {time}
          </div>
        </div>
      </button>
    );
  }

  // Saved item
  const item = tile.item;
  const photo = item.img;
  const badge = item.cat ? item.cat.toUpperCase() : 'SAVED';
  const source = item.address || item.cat || 'Saved place';
  const itemDate =
    item.eventDate ||
    (typeof item.metadata?.saved_at === 'string' ? item.metadata.saved_at : null) ||
    (typeof item.metadata?.created_at === 'string' ? item.metadata.created_at : null);
  const time = itemDate ? formatTimeAgo(itemDate) : 'Recently';

  return (
    <button
      type="button"
      className="fz-activity-card"
      onClick={() => onSelectItem(item)}
    >
      {photo ? (
        <img
          src={photo}
          alt={item.name || item.title || 'Saved find'}
          className="fz-activity-card__photo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="fz-activity-card__fallback-photo" />
      )}

      <span className="fz-activity-card__badge">{badge}</span>

      <div className="fz-activity-card__overlay">
        <div className="fz-activity-card__title">{item.name || item.title || 'Saved find'}</div>
        <div className="fz-activity-card__subtitle">
          {source} · {time}
        </div>
      </div>
    </button>
  );
}

export default function ActivityTab({
  userId,
  isCurrentUser = true,
  initialCategory,
  myCards,
  isLoadingCards,
  refetchCards,
}: ActivityTabProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [activeTab, setActiveTab] = useState<ActivityCategory>(initialCategory ?? 'all');
  // Limits are counted in rows so every row is full whatever the column count.
  const [containerRef, cols] = useCardColumns();
  const isPhone = useIsPhone();
  const subtabsRef = useRef<HTMLDivElement>(null);
  // Open one section's own tab (from a phone section stack) and bring it into view.
  const openSection = (key: SubCategoryKey) => {
    setActiveTab(key);
    setCategoryRows(2);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    subtabsRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  };
  const rowSize = cols === 1 ? 3 : cols;
  const [sectionRows, setSectionRows] = useState<Record<SubCategoryKey, number>>({
    places: 1,
    recipes: 1,
    videos: 1,
    posts: 1,
  });
  const [categoryRows, setCategoryRows] = useState(2);
  const [placesView, setPlacesView] = useState<'grid' | 'map'>('grid');

  const [savedItems, setSavedItems] = useState<AppItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AppItem | null>(null);
  const [selectedCard, setSelectedCard] = useState<FoodCardRecord | null>(null);
  const [creatingFamily, setCreatingFamily] = useState<FoodCardFamily | null>(null);

  const refetchSaved = useCallback(async () => {
    try {
      const result = await (isCurrentUser || !userId
        ? PlateService.listSavedItems()
        : PlateService.listSavedItemsByUserId(userId));

      if (result.success && result.data) {
        setSavedItems(result.data.map(normalizeSavedItemForUI));
      } else {
        setSavedItems([]);
      }
    } catch (error) {
      console.error('Failed to load saved items', error);
    }
  }, [userId, isCurrentUser]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await (isCurrentUser || !userId
          ? PlateService.listSavedItems()
          : PlateService.listSavedItemsByUserId(userId));

        if (!isMounted) return;
        if (result.success && result.data) {
          setSavedItems(result.data.map(normalizeSavedItemForUI));
        } else {
          setSavedItems([]);
        }
      } catch (error) {
        console.error('Failed to load saved items', error);
      } finally {
        if (isMounted) setIsLoadingSaved(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId, isCurrentUser]);

  const tiles = useMemo<ActivityTile[]>(() => {
    const cardTiles: ActivityTile[] = (myCards || []).map((card) => ({
      id: `card-${card.id}`,
      kind: 'card',
      category: FAMILY_TO_CATEGORY[TYPE_META[card.card_type]?.family || 'discovery'],
      item: card,
    }));
    const savedTiles: ActivityTile[] = (savedItems || []).map((item) => ({
      id: `saved-${item.id || item.itemId}`,
      kind: 'saved',
      category: savedItemCategory(item),
      item,
    }));
    return [...cardTiles, ...savedTiles];
  }, [myCards, savedItems]);

  const mapPlaces = useMemo<ProfileMapPlace[]>(() => {
    return tiles
      .filter((tile) => tile.category === 'places')
      .map((tile): ProfileMapPlace | null => {
        const lat = tile.kind === 'saved' ? tile.item.lat : tile.item.lat;
        const lng = tile.kind === 'saved' ? tile.item.lng : tile.item.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return {
          id: tile.id,
          name: tile.kind === 'saved' ? tile.item.name || tile.item.title || 'Saved place' : tile.item.title,
          lat,
          lng,
        };
      })
      .filter((p): p is ProfileMapPlace => p !== null);
  }, [tiles]);

  const handleSave = async (item: AppItem) => {
    const result = await PlateService.saveToPlate({
      itemId: item.itemId || item.id || '',
      itemType: (item.itemType as Parameters<typeof PlateService.saveToPlate>[0]['itemType']) || 'other',
      metadata: item.metadata,
    });
    if (result.success) {
      await refetchSaved();
    }
  };

  const handleUnsave = async (item: AppItem) => {
    const result = await PlateService.removeFromPlate({
      itemId: item.itemId || item.id || '',
      itemType: (item.itemType as Parameters<typeof PlateService.removeFromPlate>[0]['itemType']) || 'other',
    });
    if (result.success) {
      setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  // Share asks where: FUZO friends/groups or other apps (ShareSheet).
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const handleShare = (item: AppItem) => setSharing(sharePayloadFromItem(item));

  if (isLoadingCards || isLoadingSaved) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div
          className="rounded-circle"
          style={{
            width: 36,
            height: 36,
            border: '3px solid #f1c74d',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }}
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fz-activity-container">
      {/* Sub-tabs inside Activity */}
      <div ref={subtabsRef} className="fz-activity-subtabs">
        {CATEGORIES.map(({ key, label }) => {
          const count =
            key === 'all'
              ? tiles.length
              : tiles.filter((t) => t.category === key).length;

          return (
            <button
              key={key}
              type="button"
              className={`fz-activity-subtab${activeTab === key ? ' fz-activity-subtab--active' : ''}`}
              onClick={() => {
                setActiveTab(key);
                setCategoryRows(2);
              }}
            >
              <span>{label}</span>
              <span className="fz-activity-subtab__count">({count})</span>
            </button>
          );
        })}
      </div>

      {tiles.length === 0 ? (
        <div className="fz-activity-panel text-center py-5">
          <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
          <h4 style={{ fontWeight: 800, color: '#241f16', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
            No activity yet
          </h4>
          <p className="text-muted" style={{ maxWidth: 380, margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            {isCurrentUser
              ? 'Share your first food review, favorite restaurant visit, or home-cooked recipe to build your activity feed.'
              : 'This user has not published any bites or places yet.'}
          </p>
          {isCurrentUser && (
            <button
              type="button"
              className="btn rounded-pill px-4 py-2 fw-bold"
              style={{ background: '#f1c74d', borderColor: '#f1c74d', color: '#241f16' }}
              onClick={() => setCreatingFamily('restaurant')}
            >
              + Create First Card
            </button>
          )}
        </div>
      ) : activeTab === 'all' ? (
        /* "All" view with grouped sections */
        <div className="fz-activity-sections">
          {SECTION_KEYS.map((secKey) => {
            const secTiles = tiles.filter((t) => t.category === secKey);
            if (secTiles.length === 0) return null;

            const limit = (sectionRows[secKey] ?? 1) * rowSize;
            const visibleTiles = secTiles.slice(0, limit);
            const hasMore = limit < secTiles.length;
            const isExpanded = limit > rowSize && !hasMore;
            const catMeta = CATEGORIES.find((c) => c.key === secKey);

            if (isPhone) {
              return (
                <div key={secKey} className="fz-activity-section fz-activity-section--stack">
                  <div className="fz-activity-section__head">
                    <h4 className="fz-activity-section__title">
                      <span>{SECTION_LABELS[secKey]}</span>
                      <span className="fz-activity-section__count">{secTiles.length}</span>
                    </h4>
                  </div>
                  <SectionStack tiles={secTiles} label={catMeta?.label ?? SECTION_LABELS[secKey]} onOpen={() => openSection(secKey)} />
                </div>
              );
            }

            return (
              <div key={secKey} className="fz-activity-section">
                <div className="fz-activity-section__head">
                  <h4 className="fz-activity-section__title">
                    <span>{SECTION_LABELS[secKey]}</span>
                    <span className="fz-activity-section__count">{secTiles.length}</span>
                  </h4>
                  <div className="d-flex align-items-center gap-2">
                    {secKey === 'places' && (
                      <div className="fz-view-switch">
                        <button
                          type="button"
                          className={`fz-view-btn${placesView === 'grid' ? ' fz-view-btn--active' : ''}`}
                          onClick={() => setPlacesView('grid')}
                          title="Grid view"
                        >
                          <Grid3x3 size={13} />
                          <span>Grid</span>
                        </button>
                        <button
                          type="button"
                          className={`fz-view-btn${placesView === 'map' ? ' fz-view-btn--active' : ''}`}
                          onClick={() => setPlacesView('map')}
                          title="Map view"
                        >
                          <MapPin size={13} />
                          <span>Map</span>
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="fz-activity-section__view-all ms-1"
                      aria-label={`View all ${catMeta?.label}`}
                      onClick={() => {
                        setActiveTab(secKey);
                        setCategoryRows(2);
                      }}
                    >
                      View all<span className="d-none d-sm-inline"> in {catMeta?.label}</span> →
                    </button>
                  </div>
                </div>

                {secKey === 'places' && placesView === 'map' ? (
                  <div className="mb-3">
                    <ProfileFoodMap
                      places={mapPlaces}
                      onSelect={(id) => {
                        const tile = tiles.find((t) => t.id === id);
                        if (!tile) return;
                        if (tile.kind === 'saved') setSelectedItem(tile.item);
                        else setSelectedCard(tile.item);
                      }}
                      onAdd={isCurrentUser ? () => setCreatingFamily('restaurant') : undefined}
                    />
                  </div>
                ) : (
                  <div className="fz-activity-grid">
                    {visibleTiles.map((tile) => (
                      <ActivityCardItem
                        key={tile.id}
                        tile={tile}
                        onSelectCard={setSelectedCard}
                        onSelectItem={setSelectedItem}
                      />
                    ))}
                  </div>
                )}

                {placesView === 'grid' && secTiles.length > rowSize && (
                  <div className="d-flex justify-content-center mt-3">
                    {hasMore ? (
                      <button
                        type="button"
                        className="fz-show-more-btn"
                        onClick={() =>
                          setSectionRows((prev) => ({
                            ...prev,
                            [secKey]: (prev[secKey] ?? 1) + 1,
                          }))
                        }
                      >
                        <span>Show more {catMeta?.label}</span>
                        <span className="opacity-75">({secTiles.length - limit} more)</span>
                        <ChevronDown size={15} />
                      </button>
                    ) : isExpanded ? (
                      <button
                        type="button"
                        className="fz-show-more-btn"
                        onClick={() =>
                          setSectionRows((prev) => ({
                            ...prev,
                            [secKey]: 1,
                          }))
                        }
                      >
                        <span>Show less</span>
                        <ChevronUp size={15} />
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {isCurrentUser && (
            <div className="text-center pt-2 pb-4">
              <button
                type="button"
                className="btn rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
                style={{ background: '#f1c74d', borderColor: '#f1c74d', color: '#241f16' }}
                onClick={() => setCreatingFamily('restaurant')}
              >
                <Plus size={18} strokeWidth={2.6} />
                <span>Add New Bite or Place</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Specific Category Filter View */
        <div className="fz-activity-panel">
          {(() => {
            const filteredTiles = tiles.filter((t) => t.category === activeTab);
            // The owner's "+ New" card takes the last slot, so rows still end flush.
            const createSlot = isCurrentUser && rowSize > 1 ? 1 : 0;
            const categoryLimit = categoryRows * rowSize - createSlot;
            const initialLimit = 2 * rowSize - createSlot;
            const visibleTiles = filteredTiles.slice(0, categoryLimit);
            const hasMore = categoryLimit < filteredTiles.length;
            const isExpanded = categoryLimit > initialLimit && !hasMore;
            const catMeta = CATEGORIES.find((c) => c.key === activeTab);

            if (filteredTiles.length === 0) {
              return (
                <div className="text-center py-5">
                  <div style={{ fontSize: 38, marginBottom: 10 }}>🍽️</div>
                  <h5 style={{ fontWeight: 700, color: '#241f16', marginBottom: 6 }}>
                    No {catMeta?.label.toLowerCase()} yet
                  </h5>
                  <p className="text-muted" style={{ maxWidth: 360, margin: '0 auto 1.25rem', fontSize: '0.88rem' }}>
                    {isCurrentUser
                      ? `Start adding your favorite ${catMeta?.label.toLowerCase()} to build your profile.`
                      : `This user hasn't shared any ${catMeta?.label.toLowerCase()} yet.`}
                  </p>
                  {isCurrentUser && (
                    <button
                      type="button"
                      className="btn rounded-pill px-4 py-2 fw-bold"
                      style={{ background: '#f1c74d', borderColor: '#f1c74d', color: '#241f16' }}
                      onClick={() => setCreatingFamily(CATEGORY_TO_FAMILY[activeTab as SubCategoryKey])}
                    >
                      + Add a {catMeta?.singular}
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div>
                {activeTab === 'places' && (
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="text-muted small" style={{ fontSize: '0.84rem' }}>
                      {filteredTiles.length} {filteredTiles.length === 1 ? 'place' : 'places'} found
                    </div>
                    <div className="fz-view-switch ms-auto">
                      <button
                        type="button"
                        className={`fz-view-btn${placesView === 'grid' ? ' fz-view-btn--active' : ''}`}
                        onClick={() => setPlacesView('grid')}
                        title="Grid view"
                      >
                        <Grid3x3 size={14} />
                        <span>Grid</span>
                      </button>
                      <button
                        type="button"
                        className={`fz-view-btn${placesView === 'map' ? ' fz-view-btn--active' : ''}`}
                        onClick={() => setPlacesView('map')}
                        title="Map view"
                      >
                        <MapPin size={14} />
                        <span>Map</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'places' && placesView === 'map' ? (
                  <div className="mb-4">
                    <ProfileFoodMap
                      places={mapPlaces}
                      onSelect={(id) => {
                        const tile = tiles.find((t) => t.id === id);
                        if (!tile) return;
                        if (tile.kind === 'saved') setSelectedItem(tile.item);
                        else setSelectedCard(tile.item);
                      }}
                      onAdd={isCurrentUser ? () => setCreatingFamily('restaurant') : undefined}
                    />
                  </div>
                ) : (
                  <div className="fz-activity-grid">
                    {visibleTiles.map((tile) => (
                      <ActivityCardItem
                        key={tile.id}
                        tile={tile}
                        onSelectCard={setSelectedCard}
                        onSelectItem={setSelectedItem}
                      />
                    ))}

                    {isCurrentUser && (
                      <button
                        type="button"
                        className="fz-activity-card fz-activity-card--create"
                        onClick={() =>
                          setCreatingFamily(CATEGORY_TO_FAMILY[activeTab as SubCategoryKey])
                        }
                        title={`Add New ${catMeta?.singular}`}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: '#f1c74d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#241f16',
                            marginBottom: 6,
                          }}
                        >
                          <Plus size={24} strokeWidth={2.6} />
                        </div>
                        <span>New {catMeta?.singular}</span>
                      </button>
                    )}
                  </div>
                )}

                {(! (activeTab === 'places' && placesView === 'map')) && filteredTiles.length > initialLimit && (
                  <div className="d-flex justify-content-center mt-4">
                    {hasMore ? (
                      <button
                        type="button"
                        className="fz-show-more-btn"
                        onClick={() => setCategoryRows((prev) => prev + 2)}
                      >
                        <span>Show more {catMeta?.label}</span>
                        <span className="opacity-75">({filteredTiles.length - categoryLimit} remaining)</span>
                        <ChevronDown size={15} />
                      </button>
                    ) : isExpanded ? (
                      <button
                        type="button"
                        className="fz-show-more-btn"
                        onClick={() => setCategoryRows(2)}
                      >
                        <span>Show less</span>
                        <ChevronUp size={15} />
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      {selectedItem && (
        <SavedItemDetailModal
          item={selectedItem}
          savedItems={savedItems}
          onClose={() => setSelectedItem(null)}
          onSave={handleSave}
          onUnsave={handleUnsave}
          onShareRequest={handleShare}
        />
      )}

      {selectedCard && (
        <FoodCardDetailModal
          card={selectedCard}
          currentUserId={currentUserId || ''}
          onClose={() => setSelectedCard(null)}
          onUpdated={(updated) => {
            setSelectedCard(updated);
            refetchCards();
          }}
        />
      )}

      {creatingFamily && (
        <CreateCardModal
          initialFamily={creatingFamily}
          onClose={() => {
            setCreatingFamily(null);
            refetchCards();
          }}
        />
      )}
    </div>
  );
}
