'use client';

import { useMemo, useState } from 'react';
import { Bookmark, Check, Settings2, Utensils } from 'lucide-react';
import { useRestaurant } from '@/lib/hooks/useRestaurant';
import type { MenuItem } from '@/lib/services/restaurantService';
import { MenuItemCard } from './RestaurantBits';

interface RestaurantMenuTabProps {
  restaurantId: string;
  isOwner?: boolean;
  /** Owner only: jump to the Dashboard tab to add/edit items. */
  onManage?: () => void;
}

type DietFilter = 'all' | 'veg' | 'nonveg' | 'available';

// Customer-facing menu, now backed by the restaurant's real menu_items
// (managed from the Dashboard tab). Same layout as before: category pills,
// quick filters, then the dish card grid.
export default function RestaurantMenuTab({ restaurantId, isOwner = false, onManage }: RestaurantMenuTabProps) {
  const { loaded, menu, profile } = useRestaurant(restaurantId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [savedDishes, setSavedDishes] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const currency = profile?.currency ?? 'USD';

  const categories = useMemo(() => {
    const names = [...new Set(menu.map((m) => m.category))];
    return names.map((name) => ({ name, count: menu.filter((m) => m.category === name).length }));
  }, [menu]);

  const filteredDishes = useMemo(
    () =>
      menu
        .filter((dish) => selectedCategory === 'all' || dish.category === selectedCategory)
        .filter((dish) =>
          dietFilter === 'veg' ? dish.is_veg : dietFilter === 'nonveg' ? !dish.is_veg : dietFilter === 'available' ? dish.is_available : true,
        )
        // Available first, then recommended/popular, keeping menu order otherwise.
        .sort((a, b) => Number(b.is_available) - Number(a.is_available) || Number(b.is_recommended || b.is_popular) - Number(a.is_recommended || a.is_popular)),
    [menu, selectedCategory, dietFilter],
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const toggleSaveDish = (dish: MenuItem) => {
    setSavedDishes((prev) => {
      const next = new Set(prev);
      if (next.has(dish.id)) {
        next.delete(dish.id);
        showToast(`Removed "${dish.name}" from your plate.`);
      } else {
        next.add(dish.id);
        showToast(`Saved "${dish.name}" to your plate!`);
      }
      return next;
    });
  };

  if (!loaded) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading menu…</span>
        </div>
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <Utensils size={36} className="mb-2 opacity-50" />
        <div className="mb-3">No menu items posted yet.</div>
        {isOwner && onManage && (
          <button type="button" className="btn btn-sm btn-primary rounded-pill fw-bold px-3" onClick={onManage}>
            + Add menu items
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fz-restaurant-menu py-3">
      {toastMessage && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-2 bg-dark text-white rounded-pill shadow-lg" style={{ zIndex: 1050, fontSize: '0.85rem' }}>
          {toastMessage}
        </div>
      )}

      {/* Category Pills & quick filters */}
      <div className="fz-menu-nav-wrap mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
          <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              className={`btn btn-sm rounded-pill ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setSelectedCategory('all')}
            >
              Full Menu ({menu.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`btn btn-sm rounded-pill text-nowrap ${selectedCategory === cat.name ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
          {isOwner && onManage && (
            <button type="button" className="btn btn-sm btn-outline-dark rounded-pill d-flex align-items-center gap-1" onClick={onManage}>
              <Settings2 size={14} /> Manage menu
            </button>
          )}
        </div>

        <div className="d-flex gap-2 overflow-auto pb-1" style={{ fontSize: '0.8rem', scrollbarWidth: 'none' }}>
          {(
            [
              ['all', 'All'],
              ['veg', 'Veg'],
              ['nonveg', 'Non-veg'],
              ['available', 'Available now'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`badge border text-decoration-none py-1 px-2 ${dietFilter === key ? 'bg-dark text-white border-dark' : 'bg-light text-secondary border-secondary-subtle'}`}
              style={{ cursor: 'pointer', fontWeight: 500 }}
              onClick={() => setDietFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredDishes.length === 0 ? (
        <div className="text-center py-4 text-muted small">Nothing matches this filter.</div>
      ) : (
        <div className="row g-3">
          {filteredDishes.map((dish) => {
            const isSaved = savedDishes.has(dish.id);
            return (
              <div key={dish.id} className="col-12 col-md-6 col-lg-4">
                <MenuItemCard
                  item={dish}
                  currency={currency}
                  footer={
                    <button
                      type="button"
                      className="btn btn-sm w-100 btn-outline-dark rounded-pill d-flex align-items-center justify-content-center gap-1"
                      onClick={() => toggleSaveDish(dish)}
                    >
                      {isSaved ? (
                        <>
                          <Check size={14} className="text-success" /> Saved to Plate
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} /> Save to Plate
                        </>
                      )}
                    </button>
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
