'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, Settings2, Utensils } from 'lucide-react';
import { useRestaurant } from '@/lib/hooks/useRestaurant';
import type { MenuItem } from '@/lib/services/restaurantService';
import { MenuItemCard } from './RestaurantBits';
import PlateService from '@/lib/services/plateService';
import { useAuth } from '@/components/auth/AuthProvider';

interface RestaurantMenuTabProps {
  restaurantId: string;
  /** Shown on the saved dish in My Plate ("at <restaurant>"). */
  restaurantName?: string;
  isOwner?: boolean;
  /** Owner only: jump to the Dashboard tab to add/edit items. */
  onManage?: () => void;
}

type DietFilter = 'all' | 'veg' | 'nonveg' | 'available';

// Customer-facing menu, now backed by the restaurant's real menu_items
// (managed from the Dashboard tab). Same layout as before: category pills,
// quick filters, then the dish card grid.
export default function RestaurantMenuTab({ restaurantId, restaurantName, isOwner = false, onManage }: RestaurantMenuTabProps) {
  const { user } = useAuth();
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

  // Which of this menu's dishes are already on the user's plate.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    PlateService.listSavedItems().then((res) => {
      if (cancelled || !res.success) return;
      setSavedDishes(new Set((res.data ?? []).filter((s) => s.item_type === 'dish').map((s) => s.item_id)));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Saves to saved_items (type "dish") - it shows up on My Plate under Dishes.
  const toggleSaveDish = async (dish: MenuItem) => {
    if (!userId) {
      showToast('Sign in to save dishes to your plate.');
      return;
    }
    const wasSaved = savedDishes.has(dish.id);
    const flip = (on: boolean) =>
      setSavedDishes((prev) => {
        const next = new Set(prev);
        if (on) next.add(dish.id);
        else next.delete(dish.id);
        return next;
      });
    flip(!wasSaved);
    const res = wasSaved
      ? await PlateService.removeFromPlate({ itemId: dish.id, itemType: 'dish' })
      : await PlateService.saveToPlate({
          itemId: dish.id,
          itemType: 'dish',
          metadata: {
            title: dish.name,
            image: dish.image_url ?? undefined,
            cat: dish.category,
            description: dish.description ?? undefined,
            price: dish.price,
            currency,
            is_veg: dish.is_veg,
            restaurantId,
            restaurantName: restaurantName ?? undefined,
          },
        });
    if (!res.success) {
      flip(wasSaved);
      showToast(res.error || 'Could not update your plate - try again.');
      return;
    }
    showToast(wasSaved ? `Removed "${dish.name}" from your plate.` : `Saved "${dish.name}" to your plate!`);
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
          {/* Same pills as the person profile's Activity sections. */}
          <div className="fz-activity-subtabs fz-activity-subtabs--inline" role="group" aria-label="Menu sections">
            <button
              type="button"
              className={`fz-activity-subtab${selectedCategory === 'all' ? ' fz-activity-subtab--active' : ''}`}
              aria-pressed={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            >
              <span>Full Menu</span>
              <span className="fz-activity-subtab__count">({menu.length})</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`fz-activity-subtab${selectedCategory === cat.name ? ' fz-activity-subtab--active' : ''}`}
                aria-pressed={selectedCategory === cat.name}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span>{cat.name}</span>
                <span className="fz-activity-subtab__count">({cat.count})</span>
              </button>
            ))}
          </div>
          {isOwner && onManage && (
            <button type="button" className="btn btn-sm btn-outline-dark rounded-pill d-flex align-items-center gap-1" onClick={onManage}>
              <Settings2 size={14} /> Manage menu
            </button>
          )}
        </div>

        <div className="fz-activity-subtabs fz-activity-subtabs--inline" role="group" aria-label="Filter dishes">
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
              className={`fz-activity-subtab fz-activity-subtab--sm${dietFilter === key ? ' fz-activity-subtab--active' : ''}`}
              aria-pressed={dietFilter === key}
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
