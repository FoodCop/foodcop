'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { AppItem } from '../../types/appItem';
import PlateService from '../../lib/services/plateService';
import { normalizeSavedItemForUI } from '../../lib/services/savedItems';
import SavedItemDetailModal from './SavedItemDetailModal';

interface ActivityTabProps {
  userId?: string;
  isCurrentUser?: boolean;
}

export default function ActivityTab({ userId, isCurrentUser = true }: ActivityTabProps) {
  const [savedItems, setSavedItems] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AppItem | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'places' | 'recipes' | 'videos' | 'posts'>('places');

  const filteredItems = useMemo(() => {
    if (activeFilterTab === 'places') return savedItems.filter((i) => !i.id?.startsWith('recipe-') && !i.id?.startsWith('video-') && !i.id?.startsWith('post-'));
    if (activeFilterTab === 'recipes') return savedItems.filter((i) => i.id?.startsWith('recipe-'));
    if (activeFilterTab === 'videos') return savedItems.filter((i) => i.id?.startsWith('video-'));
    if (activeFilterTab === 'posts') return savedItems.filter((i) => i.id?.startsWith('post-'));
    return [];
  }, [savedItems, activeFilterTab]);

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

  if (isLoading) {
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
        {['places', 'recipes', 'videos', 'posts'].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link rounded-pill fw-bold text-uppercase py-2 ${
                activeFilterTab === tab ? 'active bg-warning text-dark' : 'text-secondary'
              }`}
              onClick={() => setActiveFilterTab(tab as any)}
              style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {filteredItems.length === 0 ? (
        <div className="text-center text-muted py-5 bg-light rounded-4">
          <div style={{ fontSize: 32 }}>🍽️</div>
          <div className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
            No {activeFilterTab} saved yet
          </div>
        </div>
      ) : (
        <div className="row g-3 py-2">
          {filteredItems.map((item) => (
            <div key={item.id} className="col-6 col-md-4">
              <button
                type="button"
                className="card border-0 shadow-sm rounded-4 overflow-hidden w-100 text-start position-relative h-100"
                style={{ aspectRatio: '1/1' }}
                onClick={() => setSelectedItem(item)}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-100 h-100 object-fit-cover"
                />
                <div
                  className="position-absolute bottom-0 start-0 w-100 p-3"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  }}
                >
                  <p className="text-white fw-bolder mb-1 text-truncate" style={{ fontSize: '0.85rem' }}>
                    {item.name}
                  </p>
                  <span className="badge bg-warning text-dark text-uppercase" style={{ fontSize: '0.6rem' }}>
                    {item.cat}
                  </span>
                </div>
              </button>
            </div>
          ))}
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
    </div>
  );
}
