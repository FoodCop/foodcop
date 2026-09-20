'use client';

import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Search, SlidersHorizontal, Clock, Users, X, List, ChefHat, PieChart, Bookmark } from 'lucide-react';
import { fetchCuratedRecipes, type CuratedRecipe } from '@/lib/recipes/curatedRecipes';
import { BITE_DIET_FILTERS, BITE_CUISINE_FILTERS, matchesFilter } from './constants/filters';
import { PlateService } from '@/lib/services/plateService';
import { useAuth } from '@/components/auth/AuthProvider';

// Inline placeholder shown when a recipe's source image 404s (the curated
// dataset points at third-party CDN URLs we don't control) - a plate/utensils
// glyph on the app's cream surface, so a broken image reads as "no photo"
// instead of an empty tile with badges floating over nothing.
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23fbf7ec'/%3E%3Ccircle cx='100' cy='100' r='42' fill='none' stroke='%23ece4d0' stroke-width='6'/%3E%3Cpath d='M78 70v34M78 70a8 8 0 0 1 0 16M70 70v20M86 70v20M126 70v60M126 70a10 10 0 0 1 0 30' fill='none' stroke='%23ece4d0' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

function handleImageError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src === FALLBACK_IMAGE) return;
  img.src = FALLBACK_IMAGE;
  img.classList.add('bites-img--fallback');
}

// Bites: the Discover tab's recipe finder. Sourced entirely from
// public/data/curatedRecipes.json via fetchCuratedRecipes() - filtered/
// paginated client-side since the whole set is ~1,251 records. No AI recipe
// generation, social "Trim" extraction, or share-to-chat here; those
// belonged to a much larger legacy Studio feature that isn't part of this
// recipe-search scope. Saving goes through the same saved_items/PlateService
// pipeline every other save in the app uses (itemType 'recipe'), so a saved
// recipe survives reload and shows up in Profile Activity's Recipes filter.

const PAGE_SIZE = 12;
const KEY_NUTRIENTS = ['Calories', 'Protein', 'Fat', 'Carbohydrates'];

type ModalTab = 'ingredients' | 'steps' | 'nutrition';

export function BitesView() {
  const { user } = useAuth();
  const viewRef = useRef<HTMLDivElement>(null);
  const [recipes, setRecipes] = useState<CuratedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeDiet, setActiveDiet] = useState<string | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [modalState, setModalState] = useState<{ recipe: CuratedRecipe; tab: ModalTab } | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const openModal = (recipe: CuratedRecipe, tab: ModalTab) => setModalState({ recipe, tab });

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

  // Load which recipes the signed-in user has already saved, so the toggle
  // reflects real state instead of always starting unsaved.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const result = await PlateService.listSavedItems();
      if (result.success && result.data) {
        const ids = new Set(
          result.data.filter((i) => i.item_type === 'recipe').map((i) => Number(i.item_id)),
        );
        setSaved(ids);
      }
    })();
  }, [user?.id]);

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

  const toggleSave = async (recipe: CuratedRecipe) => {
    const id = recipe.id;
    const wasSaved = saved.has(id);

    // Optimistic toggle, reverted below if the write fails.
    setSaved((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    const result = wasSaved
      ? await PlateService.removeFromPlate({ itemId: String(id), itemType: 'recipe' })
      : await PlateService.saveToPlate({
          itemId: String(id),
          itemType: 'recipe',
          // Full recipe content, not just the tile summary - otherwise Profile's
          // SavedItemDetailModal (which reads metadata.generatedRecipe/nutrition/
          // servings) has nothing to show and every tab reads "No X available",
          // even though the source data was right here at save time.
          metadata: {
            title: recipe.title,
            image: recipe.image,
            cat: 'Recipe',
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            dishTypes: recipe.dishTypes,
            nutrition: recipe.nutrition,
            generatedRecipe: {
              ingredients: recipe.extendedIngredients.map((ing) => ing.original),
              instructions:
                recipe.analyzedInstructions.length > 0
                  ? recipe.analyzedInstructions.map((step) => `${step.number}. ${step.step}`).join('\n')
                  : recipe.instructions.replace(/<[^>]+>/g, ''),
            },
          },
        });

    if (!result.success) {
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
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
              return (
                <div
                  key={recipe.id}
                  role="button"
                  tabIndex={0}
                  className="bites-card"
                  onClick={() => openModal(recipe, 'ingredients')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openModal(recipe, 'ingredients');
                    }
                  }}
                >
                  <div className="bites-card__image">
                    <div
                      className="bites-card__image-backdrop"
                      aria-hidden="true"
                      style={{ backgroundImage: `url(${recipe.image})` }}
                    />
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      loading="lazy"
                      className="bites-card__image-fg"
                      onError={handleImageError}
                    />
                    <button
                      type="button"
                      className={`bites-card__save${isSaved ? ' is-saved' : ''}`}
                      aria-label={isSaved ? 'Remove from saved recipes' : 'Save recipe'}
                      aria-pressed={isSaved}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(recipe);
                      }}
                    >
                      <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                    <div className="bites-card__badges">
                      <span className="bites-card__badge">
                        <Clock size={12} /> {recipe.readyInMinutes}m
                      </span>
                      <span className="bites-card__badge">
                        <Users size={12} /> {recipe.servings}
                      </span>
                    </div>
                    <div className="bites-card__image-overlay">
                      <h3 className="bites-card__title" title={recipe.title}>
                        {recipe.title}
                      </h3>
                    </div>
                  </div>
                  <div className="bites-card__actions">
                    <button
                      type="button"
                      className="bites-card__action"
                      aria-label={`View ingredients for ${recipe.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(recipe, 'ingredients');
                      }}
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      className="bites-card__action"
                      aria-label={`View steps for ${recipe.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(recipe, 'steps');
                      }}
                    >
                      <ChefHat size={16} />
                    </button>
                    <button
                      type="button"
                      className="bites-card__action"
                      aria-label={`View nutrition for ${recipe.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(recipe, 'nutrition');
                      }}
                    >
                      <PieChart size={16} />
                    </button>
                  </div>
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
        <BitesRecipeModal
          recipe={modalState.recipe}
          initialTab={modalState.tab}
          saved={saved.has(modalState.recipe.id)}
          onToggleSave={() => toggleSave(modalState.recipe)}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

function BitesSkeletonGrid() {
  return (
    <div className="bites-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bites-card bites-card--skeleton">
          <div className="bites-card__image bites-skel__shimmer" />
          <div className="bites-card__actions">
            <span className="bites-skel__action bites-skel__shimmer" />
            <span className="bites-skel__action bites-skel__shimmer" />
            <span className="bites-skel__action bites-skel__shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BitesRecipeModal({
  recipe,
  initialTab,
  saved,
  onToggleSave,
  onClose,
}: {
  recipe: CuratedRecipe;
  initialTab: ModalTab;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ModalTab>(initialTab);
  const keyNutrients = (recipe.nutrition?.nutrients ?? []).filter((n) => KEY_NUTRIENTS.includes(n.name));

  return (
    <div role="dialog" aria-modal="true" aria-label={recipe.title} className="bites-modal-backdrop" onClick={onClose}>
      <div className="bites-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="bites-modal__close" onClick={onClose} aria-label="Close recipe details">
          <X size={20} />
        </button>

        <div className="bites-modal__image">
          <div
            className="bites-modal__image-backdrop"
            aria-hidden="true"
            style={{ backgroundImage: `url(${recipe.image})` }}
          />
          <img
            src={recipe.image}
            alt={recipe.title}
            className="bites-modal__image-fg"
            onError={handleImageError}
          />
          <div className="bites-modal__image-overlay">
            <h2 className="bites-modal__title">{recipe.title}</h2>
          </div>
        </div>

        <div className="bites-modal__body">
          <div className="bites-modal__info">
            <div className="bites-modal__stats">
              <span>
                <Clock size={14} /> {recipe.readyInMinutes} min
              </span>
              <span>
                <Users size={14} /> {recipe.servings} servings
              </span>
            </div>

            {recipe.dishTypes.length > 0 && (
              <div className="bites-modal__tags">
                {recipe.dishTypes.slice(0, 4).map((t) => (
                  <span key={t} className="bites-modal__tag">
                    {t}
                  </span>
                ))}
              </div>
            )}
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
