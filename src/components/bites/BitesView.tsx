'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, Clock, Users, Bookmark } from 'lucide-react';
import { fetchCuratedRecipes, type CuratedRecipe } from '@/lib/recipes/curatedRecipes';
import { BITE_DIET_FILTERS, BITE_CUISINE_FILTERS, matchesFilter } from './constants/filters';
import { RecipeDetailModal, handleImageError, useRecipeSaves, type RecipeModalTab } from './RecipeDetailModal';

// Bites: the Discover tab's recipe finder. Sourced entirely from
// public/data/curatedRecipes.json via fetchCuratedRecipes() - filtered/
// paginated client-side since the whole set is ~1,251 records. No AI recipe
// generation, social "Trim" extraction, or share-to-chat here; those
// belonged to a much larger legacy Studio feature that isn't part of this
// recipe-search scope. Saving goes through the same saved_items/PlateService
// pipeline every other save in the app uses (itemType 'recipe'), so a saved
// recipe survives reload and shows up in Profile Activity's Recipes filter.

const PAGE_SIZE = 12;

type ModalTab = RecipeModalTab;

export function BitesView() {
  const viewRef = useRef<HTMLDivElement>(null);
  const [recipes, setRecipes] = useState<CuratedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeDiet, setActiveDiet] = useState<string | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [modalState, setModalState] = useState<{ recipe: CuratedRecipe; tab: ModalTab } | null>(null);
  const { saved, toggleSave } = useRecipeSaves();

  const openModal = (recipe: CuratedRecipe, tab: ModalTab) => setModalState({ recipe, tab });

  useEffect(() => {
    let cancelled = false;
    fetchCuratedRecipes().then((all) => {
      if (cancelled) return;
      setRecipes(all);
      setLoading(false);
      // Shared recipe links (/dashboard?tab=bites&recipe=<id>) open that recipe.
      const sharedId = Number(new URLSearchParams(window.location.search).get('recipe'));
      const shared = sharedId ? all.find((r) => r.id === sharedId) : undefined;
      if (shared) setModalState({ recipe: shared, tab: 'ingredients' });
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Prev/Next only move the `page` index - without this the grid re-renders
  // in place and, on a tall page, the user stays scrolled wherever they were,
  // which reads as "nothing happened".
  const goToPage = (next: number) => {
    setPage(next);
    viewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setQuery('');
    setActiveDiet(null);
    setActiveCuisine(null);
  };

  return (
    <div className="bites-view" ref={viewRef}>
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
            {pageItems.map((recipe) => {
              const isSaved = saved.has(recipe.id);
              // Same card as the dashboard's For you rows (fz-dash-card): full-bleed
              // photo, dark scrim, frosted chips, title on the photo.
              return (
                <div
                  key={recipe.id}
                  role="button"
                  tabIndex={0}
                  className="fz-dash-card bites-tile"
                  aria-label={`Open recipe: ${recipe.title}`}
                  onClick={() => openModal(recipe, 'ingredients')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openModal(recipe, 'ingredients');
                    }
                  }}
                >
                  <img className="fz-dash-card__img" src={recipe.image} alt="" loading="lazy" onError={handleImageError} />
                  <span className="fz-dash-card__shade" />
                  <span className="fz-dash-card__chip">
                    <Clock size={11} /> {recipe.readyInMinutes}m
                  </span>
                  <button
                    type="button"
                    className={`bites-tile__save${isSaved ? ' is-saved' : ''}`}
                    aria-label={isSaved ? 'Remove from saved recipes' : 'Save recipe'}
                    aria-pressed={isSaved}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(recipe);
                    }}
                  >
                    <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                  <span className="fz-dash-card__body">
                    <span className="fz-dash-card__title">{recipe.title}</span>
                    <span className="fz-dash-card__meta">
                      <span className="fz-dash-card__sub">
                        <Users size={11} className="me-1" />
                        {recipe.servings} servings{recipe.dishTypes[0] ? ` · ${recipe.dishTypes[0]}` : ''}
                      </span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="bites-pagination">
              <button type="button" disabled={page === 0} onClick={() => goToPage(page - 1)}>
                Prev
              </button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => goToPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modalState && (
        <RecipeDetailModal
          recipe={modalState.recipe}
          initialTab={modalState.tab}
          saved={saved.has(modalState.recipe.id)}
          onToggleSave={() => toggleSave(modalState.recipe)}
          onClose={() => {
            setModalState(null);
            // Drop a shared link's ?recipe= so a refresh doesn't reopen it.
            const url = new URL(window.location.href);
            if (url.searchParams.has('recipe')) {
              url.searchParams.delete('recipe');
              window.history.replaceState(window.history.state, '', url);
            }
          }}
        />
      )}
    </div>
  );
}

function BitesSkeletonGrid() {
  return (
    <div className="bites-grid" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="fz-dash-card fz-dash-card--skeleton" />
      ))}
    </div>
  );
}
