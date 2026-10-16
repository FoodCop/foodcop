'use client';

import { useEffect, useState } from 'react';
import { RestaurantService, type MenuItem } from '@/lib/services/restaurantService';

// "Food name" (client, 2026-10-14): picked from the restaurant's FUZO menu
// when it has one, otherwise typed in. Shared by the Food photo post and the
// Food review video.

interface FoodNameFieldProps {
  /** The FUZO restaurant the post is at (its menu is offered), if any. */
  restaurantId: string | null;
  restaurantName?: string | null;
  title: string;
  menuItemId: string | null;
  onChange: (patch: { title: string; menuItemId: string | null }) => void;
  /** Field id prefix (unique on the page). */
  id: string;
}

export function FoodNameField({ restaurantId, restaurantName, title, menuItemId, onChange, id }: FoodNameFieldProps) {
  const [menu, setMenu] = useState<{ for: string; items: MenuItem[] } | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    RestaurantService.listMenu(restaurantId).then((res) => {
      if (!cancelled) setMenu({ for: restaurantId, items: res.success ? (res.data ?? []).filter((m) => m.is_available) : [] });
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);
  const menuItems = restaurantId && menu?.for === restaurantId ? menu.items : [];

  return (
    <section className="cf-field" aria-labelledby={`${id}-label`}>
      <h3 id={`${id}-label`} className="cf-field__label">
        Food name <span className="cf-field__req" aria-hidden="true">*</span>
      </h3>
      {menuItems.length > 0 && (
        <>
          <p className="cf-field__hint">Pick it from {restaurantName ?? 'the'} menu, or type it below.</p>
          <div className="studio-tag-options" role="group" aria-label="Menu dishes">
            {menuItems.slice(0, 30).map((m) => (
              <button
                key={m.id}
                type="button"
                className={`studio-tag-chip${menuItemId === m.id ? ' is-selected' : ''}`}
                aria-pressed={menuItemId === m.id}
                onClick={() => (menuItemId === m.id ? onChange({ menuItemId: null, title: '' }) : onChange({ menuItemId: m.id, title: m.name }))}
              >
                {m.name}
              </button>
            ))}
          </div>
        </>
      )}
      <input
        className="cf-input"
        value={title}
        onChange={(e) => onChange({ title: e.target.value, menuItemId: null })}
        placeholder={menuItems.length ? 'Or type another dish' : 'e.g. Butter chicken'}
        maxLength={120}
        aria-label="Food name"
      />
    </section>
  );
}

export default FoodNameField;
