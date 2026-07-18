'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { AppItem } from '../../types/appItem';
import PlateService from '../../lib/services/plateService';
import { normalizeSavedItemForUI } from '../../lib/services/savedItems';
import SavedItemDetailModal from './SavedItemDetailModal';
import FoodCardDetailModal from './FoodCardDetailModal';
import { foodCardService } from '../../lib/services/foodCardService';
import { TYPE_META, type FoodCardFamily, type FoodCardRecord } from '../../lib/types/foodCard';
import { useAuth } from '../auth/AuthProvider';

interface ActivityTabProps {
  userId?: string;
  isCurrentUser?: boolean;
}

type ActivityCategory = 'places' | 'recipes' | 'videos' | 'posts';

const CATEGORY_FILTERS: Array<{ key: ActivityCategory; label: string }> = [
  { key: 'places', label: 'Places' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'videos', label: 'Videos' },
  { key: 'posts', label: 'Posts' },
];

// Cards and saved items are different things (authored content vs. a
// bookmark board), but they were rendering as two visually-redundant
// grids each with their own near-identical filter row. Unified here onto
// one filter/grid, keyed off the same 4-category taxonomy the saved-items
// filter already used - card families map onto it 1:1 (restaurant->places,
// recipe->recipes, video->videos, discovery->posts). A small bookmark
// badge on saved tiles is the only thing left to tell the two apart.
const FAMILY_TO_CATEGORY: Record<FoodCardFamily, ActivityCategory> = {
  restaurant: 'places',
  recipe: 'recipes',
  video: 'videos',
  discovery: 'posts',
};

const savedItemCategory = (item: AppItem): ActivityCategory => {
  if (item.id?.startsWith('recipe-')) return 'recipes';
  if (item.id?.startsWith('video-')) return 'videos';
  if (item.id?.startsWith('post-')) return 'posts';
  return 'places';
};

type ActivityTile =
  | { kind: 'saved'; category: ActivityCategory; item: AppItem }
  | { kind: 'card'; category: ActivityCategory; item: FoodCardRecord };

export default function ActivityTab({ userId, isCurrentUser = true }: ActivityTabProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const targetUserId = isCurrentUser || !userId ? currentUserId : userId;

  const [savedItems, setSavedItems] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AppItem | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<ActivityCategory>('places');

  const [myCards, setMyCards] = useState<FoodCardRecord[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [selectedCard, setSelectedCard] = useState<FoodCardRecord | null>(null);

  const fetchMyCards = useCallback(async () => {
    if (!targetUserId) {
      setIsLoadingCards(false);
      return;
    }
    setIsLoadingCards(true);
    try {
      const result = await foodCardService.listMyCards(targetUserId);
      setMyCards(result.success && result.data ? result.data : []);
    } finally {
      setIsLoadingCards(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchMyCards();
  }, [fetchMyCards]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [userId, isCurrentUser]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const tiles = useMemo<ActivityTile[]>(() => {
    const savedTiles: ActivityTile[] = savedItems.map((item) => ({
      kind: 'saved',
      category: savedItemCategory(item),
      item,
    }));
    const cardTiles: ActivityTile[] = myCards.map((card) => ({
      kind: 'card',
      category: FAMILY_TO_CATEGORY[TYPE_META[card.card_type].family],
      item: card,
    }));
    return [...savedTiles, ...cardTiles];
  }, [savedItems, myCards]);

  const filteredTiles = useMemo(
    () => tiles.filter((tile) => tile.category === activeFilterTab),
    [tiles, activeFilterTab],
  );

  const handleSave = async (item: AppItem) => {
    const result = await PlateService.saveToPlate({
      itemId: item.itemId || item.id || '',
      itemType: (item.itemType as any) || 'other',
      metadata: item.metadata,
    });
    if (result.success) {
      await fetchItems(); // Refetch to get the updated list
    }
  };

  const handleUnsave = async (item: AppItem) => {
    const result = await PlateService.removeFromPlate({
      itemId: item.itemId || item.id || '',
      itemType: (item.itemType as any) || 'other',
    });
    if (result.success) {
      setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleShare = (item: AppItem) => {
    // Note: To be wired up with a sharing UI in the future.
    console.log('Share requested for', item.name);
    alert(`Share dialog would open for ${item.name}`);
  };

  if (isLoading || isLoadingCards) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="nav nav-pills nav-fill mb-4 bg-light rounded-pill p-1 shadow-sm">
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link rounded-pill fw-bold text-uppercase py-2 ${
                activeFilterTab === key ? 'active bg-warning text-dark' : 'text-secondary'
              }`}
              onClick={() => setActiveFilterTab(key)}
              style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      {filteredTiles.length === 0 ? (
        <div className="text-center text-muted py-5 bg-light rounded-4">
          <div style={{ fontSize: 32 }}>🍽️</div>
          <div className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
            No {activeFilterTab} yet
          </div>
        </div>
      ) : (
        <div className="row g-3 py-2">
          {filteredTiles.map((tile) =>
            tile.kind === 'saved' ? (
              <div key={`saved-${tile.item.id}`} className="col-6 col-md-4">
                <button
                  type="button"
                  className="card border-0 shadow-sm rounded-4 overflow-hidden w-100 text-start position-relative h-100"
                  style={{ aspectRatio: '1/1' }}
                  onClick={() => setSelectedItem(tile.item)}
                >
                  <img src={tile.item.img} alt={tile.item.name} className="w-100 h-100 object-fit-cover" />
                  <span
                    className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 end-0 m-2"
                    style={{ fontSize: '0.85rem', lineHeight: 1 }}
                    title="Saved"
                  >
                    🔖
                  </span>
                  <div
                    className="position-absolute bottom-0 start-0 w-100 p-3"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
                  >
                    <p className="text-white fw-bolder mb-1 text-truncate" style={{ fontSize: '0.85rem' }}>
                      {tile.item.name}
                    </p>
                    <span className="badge bg-warning text-dark text-uppercase" style={{ fontSize: '0.6rem' }}>
                      {tile.item.cat}
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              (() => {
                const meta = TYPE_META[tile.item.card_type];
                return (
                  <div key={`card-${tile.item.id}`} className="col-6 col-md-4">
                    <button
                      type="button"
                      className="card border-0 shadow-sm rounded-4 overflow-hidden w-100 text-start position-relative h-100"
                      style={{ aspectRatio: '1/1', background: meta.color }}
                      onClick={() => setSelectedCard(tile.item)}
                    >
                      {tile.item.image_url && (
                        <img
                          src={tile.item.image_url}
                          alt={tile.item.title}
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div
                        className="position-absolute bottom-0 start-0 w-100 p-3"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
                      >
                        <p className="text-white fw-bolder mb-1 text-truncate" style={{ fontSize: '0.85rem' }}>
                          {tile.item.title}
                        </p>
                        <span
                          className="badge text-white text-uppercase"
                          style={{ fontSize: '0.6rem', backgroundColor: meta.color }}
                        >
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                      {tile.item.status === 'DRAFT' && (
                        <span className="badge bg-secondary position-absolute top-0 start-0 m-2">Draft</span>
                      )}
                    </button>
                  </div>
                );
              })()
            ),
          )}
        </div>
      )}

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
            setMyCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedCard(updated);
          }}
        />
      )}
    </div>
  );
}
