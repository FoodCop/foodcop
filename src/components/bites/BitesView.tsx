'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Clock, Users, X, List, ChefHat, PieChart, Bookmark } from 'lucide-react';
import { fetchCuratedRecipes, type CuratedRecipe } from '@/lib/recipes/curatedRecipes';
import { BITE_DIET_FILTERS, BITE_CUISINE_FILTERS, matchesFilter } from './constants/filters';

// Bites: the Discover tab's recipe finder. Sourced entirely from
// public/data/curatedRecipes.json via fetchCuratedRecipes() - filtered/
// paginated client-side since the whole set is ~1,251 records. No AI recipe
// generation, social "Trim" extraction, or share-to-chat here; those
// belonged to a much larger legacy Studio feature that isn't part of this
// recipe-search scope. Saving is local state for now.

const PAGE_SIZE = 12;
const KEY_NUTRIENTS = ['Calories', 'Protein', 'Fat', 'Carbohydrates'];

export function BitesView() {
  const [recipes, setRecipes] = useState<CuratedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeDiet, setActiveDiet] = useState<string | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<CuratedRecipe | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetchCuratedRecipes().then((all) => {
      if (cancelled) return;
      setRecipes(all);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(0);
  }, [query, activeDiet, activeCuisine]);

  const dietFilter = BITE_DIET_FILTERS.find((f) => f.label === activeDiet) ?? null;
  const cuisineFilter = BITE_CUISINE_FILTERS.find((f) => f.label === activeCuisine) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      // Matches the title OR the dish-type tags (Dinner/Lunch/Breakfast/etc.) -
      // title-only matching meant searching "Dinner" only surfaced the handful
      // of recipes with that word literally in the title (e.g. "Skillet
      // Enchilada Dinner"), missing the hundreds of other recipes actually
      // tagged Dinner whose titles don't happen to say so.
      if (q && !r.title.toLowerCase().includes(q) && !r.dishTypes.some((t) => t.toLowerCase().includes(q))) return false;
      if (dietFilter && !matchesFilter(r.diets, dietFilter)) return false;
      if (cuisineFilter && !matchesFilter(r.cuisines, cuisineFilter)) return false;
      return true;
    });
  }, [recipes, query, dietFilter, cuisineFilter]);

  // Prefer showing the tag that actually matched the search (e.g. "Dinner")
  // over whatever happens to be first in the recipe's raw dishTypes array,
  // so the card visibly reflects what was searched for instead of showing
  // an unrelated tag like "Lunch" or "Main course" first.
  const cardTags = (recipe: CuratedRecipe) => {
    const q = query.trim().toLowerCase();
    if (!q) return recipe.dishTypes.slice(0, 2);
    const matched = recipe.dishTypes.filter((t) => t.toLowerCase().includes(q));
    const rest = recipe.dishTypes.filter((t) => !t.toLowerCase().includes(q));
    return [...matched, ...rest].slice(0, 2);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleSave = (id: number) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setQuery('');
    setActiveDiet(null);
    setActiveCuisine(null);
  };

  return (
    <div className="bites-view">
      <div className="bites-controls">
        <div className="bites-search">
          <Search size={18} className="bites-search__icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="bites-search__input"
          />
        </div>
        <button
          type="button"
          className={`bites-filter-toggle${showFilters ? ' is-active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={18} />
          {(activeDiet || activeCuisine) && <span className="bites-filter-toggle__dot" />}
        </button>
      </div>

      {showFilters && (
        <div className="bites-filter-panel">
          <div className="bites-filter-group">
            <span className="bites-filter-group__label">Dietary</span>
            <div className="bites-chips">
              {BITE_DIET_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className={`bites-chip${activeDiet === f.label ? ' is-selected' : ''}`}
                  onClick={() => setActiveDiet((v) => (v === f.label ? null : f.label))}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bites-filter-group">
            <span className="bites-filter-group__label">Cuisine</span>
            <div className="bites-chips">
              {BITE_CUISINE_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className={`bites-chip${activeCuisine === f.label ? ' is-selected' : ''}`}
                  onClick={() => setActiveCuisine((v) => (v === f.label ? null : f.label))}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <BitesSkeletonGrid />
      ) : pageItems.length === 0 ? (
        <div className="bites-empty">
          <Search size={40} className="bites-empty__icon" />
          <p className="bites-empty__text">No recipes match your search.</p>
          <button type="button" className="bites-empty__reset" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="bites-grid">
            {pageItems.map((recipe) => (
              <button type="button" key={recipe.id} className="bites-card" onClick={() => setSelected(recipe)}>
                <div className="bites-card__image" style={{ backgroundImage: `url(${recipe.image})` }}>
                  <div className="bites-card__badges">
                    <span className="bites-card__badge">
                      <Clock size={12} /> {recipe.readyInMinutes}m
                    </span>
                    <span className="bites-card__badge">
                      <Users size={12} /> {recipe.servings}
                    </span>
                  </div>
                </div>
                <div className="bites-card__body">
                  <h3 className="bites-card__title">{recipe.title}</h3>
                  <div className="bites-card__tags">
                    {cardTags(recipe).map((t) => (
                      <span key={t} className="bites-card__tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="bites-pagination">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <BitesRecipeModal
          recipe={selected}
          saved={saved.has(selected.id)}
          onToggleSave={() => toggleSave(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function BitesSkeletonGrid() {
  return (
    <div className="bites-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bites-card bites-card--skeleton" />
      ))}
    </div>
  );
}

function BitesRecipeModal({
  recipe,
  saved,
  onToggleSave,
  onClose,
}: {
  recipe: CuratedRecipe;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients');
  const keyNutrients = (recipe.nutrition?.nutrients ?? []).filter((n) => KEY_NUTRIENTS.includes(n.name));

  return (
    <div role="dialog" aria-modal="true" aria-label={recipe.title} className="bites-modal-backdrop" onClick={onClose}>
      <div className="bites-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="bites-modal__close" onClick={onClose} aria-label="Close recipe details">
          <X size={20} />
        </button>

        <div className="bites-modal__image" style={{ backgroundImage: `url(${recipe.image})` }}>
          <div className="bites-modal__image-overlay">
            <h2 className="bites-modal__title">{recipe.title}</h2>
          </div>
        </div>

        <div className="bites-modal__body">
          <div className="bites-modal__stats">
            <span>
              <Clock size={14} /> {recipe.readyInMinutes} min
            </span>
            <span>
              <Users size={14} /> {recipe.servings} servings
            </span>
          </div>

          <div className="bites-modal__tabs">
            <button type="button" className={tab === 'ingredients' ? 'is-active' : ''} onClick={() => setTab('ingredients')}>
              <List size={14} /> Ingredients
            </button>
            <button type="button" className={tab === 'steps' ? 'is-active' : ''} onClick={() => setTab('steps')}>
              <ChefHat size={14} /> Steps
            </button>
            <button type="button" className={tab === 'nutrition' ? 'is-active' : ''} onClick={() => setTab('nutrition')}>
              <PieChart size={14} /> Nutrition
            </button>
          </div>

          <div className="bites-modal__content">
            {tab === 'ingredients' &&
              (recipe.extendedIngredients.length > 0 ? (
                <ul className="bites-ingredient-list">
                  {recipe.extendedIngredients.map((ing, i) => (
                    <li key={i}>{ing.original}</li>
                  ))}
                </ul>
              ) : (
                <p className="bites-modal__fallback-text">No ingredient list available.</p>
              ))}

            {tab === 'steps' &&
              (recipe.analyzedInstructions.length > 0 ? (
                <ol className="bites-step-list">
                  {recipe.analyzedInstructions.map((step) => (
                    <li key={step.number}>
                      <span className="bites-step-list__num">{step.number}</span>
                      {step.step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="bites-modal__fallback-text">{recipe.instructions.replace(/<[^>]+>/g, '')}</p>
              ))}

            {tab === 'nutrition' &&
              (keyNutrients.length > 0 ? (
                <div className="bites-nutrition-grid">
                  {keyNutrients.map((n) => (
                    <div key={n.name} className="bites-nutrition-item">
                      <span className="bites-nutrition-item__amount">
                        {Math.round(n.amount)}
                        <small>{n.unit}</small>
                      </span>
                      <span className="bites-nutrition-item__name">{n.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="bites-modal__fallback-text">No nutrition data available.</p>
              ))}
          </div>
        </div>

        <div className="bites-modal__footer">
          <button type="button" className={`bites-save-btn${saved ? ' is-saved' : ''}`} onClick={onToggleSave}>
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
