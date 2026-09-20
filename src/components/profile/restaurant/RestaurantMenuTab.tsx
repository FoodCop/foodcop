'use client';

import { useMemo, useState } from 'react';
import { Bookmark, Check, Flame, Sparkles, Utensils } from 'lucide-react';
import type { MenuCategory, RestaurantDish } from '../demoProfile';

interface RestaurantMenuTabProps {
  categories?: MenuCategory[];
}

export default function RestaurantMenuTab({ categories = [] }: RestaurantMenuTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [savedDishes, setSavedDishes] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const allDishes = useMemo(() => {
    return categories.flatMap((cat) => cat.dishes.map((dish) => ({ ...dish, categoryName: cat.name })));
  }, [categories]);

  const filteredDishes = useMemo(() => {
    return allDishes.filter((dish) => {
      if (selectedCategory !== 'all') {
        const cat = categories.find((c) => c.id === selectedCategory);
        if (cat && !cat.dishes.some((d) => d.id === dish.id)) return false;
      }
      if (dietaryFilter !== 'all') {
        if (!dish.dietary?.includes(dietaryFilter as any)) return false;
      }
      return true;
    });
  }, [allDishes, categories, selectedCategory, dietaryFilter]);

  const toggleSaveDish = (dish: RestaurantDish) => {
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <Utensils size={36} className="mb-2 opacity-50" />
        <div>No menu items posted yet.</div>
      </div>
    );
  }

  return (
    <div className="fz-restaurant-menu py-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-2 bg-dark text-white rounded-pill shadow-lg"
          style={{ zIndex: 1050, fontSize: '0.85rem' }}
        >
          {toastMessage}
        </div>
      )}

      {/* Category Pills & Dietary Quick-Filters */}
      <div className="fz-menu-nav-wrap mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
          <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              className={`btn btn-sm rounded-pill ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setSelectedCategory('all')}
            >
              Full Menu ({allDishes.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn btn-sm rounded-pill ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({cat.dishes.length})
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Filter chips */}
        <div className="d-flex gap-2 overflow-auto pb-1" style={{ fontSize: '0.8rem', scrollbarWidth: 'none' }}>
          {['all', 'Vegetarian', 'Vegan', 'Gluten-Free'].map((tag) => (
            <button
              key={tag}
              type="button"
              className={`badge border text-decoration-none py-1 px-2 ${
                dietaryFilter === tag
                  ? 'bg-dark text-white border-dark'
                  : 'bg-light text-secondary border-secondary-subtle'
              }`}
              style={{ cursor: 'pointer', fontWeight: 500 }}
              onClick={() => setDietaryFilter(tag)}
            >
              {tag === 'all' ? 'All Diets' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="row g-3">
        {filteredDishes.map((dish) => {
          const isSaved = savedDishes.has(dish.id);
          return (
            <div key={dish.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border shadow-sm fz-dish-card overflow-hidden">
                <div className="position-relative" style={{ height: '190px', background: '#241f16' }}>
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-100 h-100 object-fit-cover"
                    loading="lazy"
                  />
                  {dish.isSpecialty && (
                    <span
                      className="position-absolute top-0 start-0 m-2 badge bg-warning text-dark d-flex align-items-center gap-1 shadow-sm"
                      style={{ fontSize: '0.72rem', fontWeight: 700 }}
                    >
                      <Sparkles size={12} /> CHEF SPECIAL
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0"
                    style={{ width: 34, height: 34 }}
                    onClick={() => toggleSaveDish(dish)}
                    title={isSaved ? 'Saved to Plate' : 'Save Dish'}
                    aria-label="Save dish"
                  >
                    {isSaved ? <Check size={16} className="text-success" /> : <Bookmark size={15} />}
                  </button>
                  <div
                    className="position-absolute bottom-0 start-0 w-100 p-2 text-white"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
                  >
                    <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#f1c74d' }}>
                      {dish.price}
                    </span>
                  </div>
                </div>

                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="card-title fw-bold mb-1">{dish.name}</h6>
                    <p className="card-text text-muted small mb-2" style={{ lineHeight: 1.4 }}>
                      {dish.description}
                    </p>
                  </div>

                  <div>
                    {/* Flavors & Dietary chips */}
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {dish.flavors?.map((fl) => (
                        <span
                          key={fl}
                          className="badge"
                          style={{
                            background: '#fbf7ec',
                            color: '#837a68',
                            border: '1px solid #ece4d0',
                            fontSize: '0.68rem',
                          }}
                        >
                          <Flame size={10} className="me-1 text-danger" />
                          {fl}
                        </span>
                      ))}
                      {dish.dietary?.map((dt) => (
                        <span
                          key={dt}
                          className="badge bg-success-subtle text-success border border-success-subtle"
                          style={{ fontSize: '0.68rem' }}
                        >
                          {dt}
                        </span>
                      ))}
                    </div>

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
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
