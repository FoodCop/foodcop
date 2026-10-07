'use client';

import { useCallback, useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Check, ChefHat, Clock, List, PieChart, Share2, Users, X } from 'lucide-react';
import type { CuratedRecipe } from '@/lib/recipes/curatedRecipes';
import { PlateService } from '@/lib/services/plateService';
import { useAuth } from '@/components/auth/AuthProvider';
import ShareSheet, { type SharePayload } from '@/components/share/ShareSheet';
import { htmlToText } from '@/lib/utils/text';

// Shared recipe pieces used by the Bites tab (BitesView) and the dashboard's
// "Your Taste" row: the detail modal (ingredients / steps / nutrition + save)
// and the saved-recipes state, so both places behave identically.

// Inline placeholder shown when a recipe's source image 404s (the curated
// dataset points at third-party CDN URLs we don't control) - a plate/utensils
// glyph on the app's cream surface, so a broken image reads as "no photo"
// instead of an empty tile with badges floating over nothing.
export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23fbf7ec'/%3E%3Ccircle cx='100' cy='100' r='42' fill='none' stroke='%23ece4d0' stroke-width='6'/%3E%3Cpath d='M78 70v34M78 70a8 8 0 0 1 0 16M70 70v20M86 70v20M126 70v60M126 70a10 10 0 0 1 0 30' fill='none' stroke='%23ece4d0' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

export function handleImageError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src === FALLBACK_IMAGE) return;
  img.src = FALLBACK_IMAGE;
  img.classList.add('bites-img--fallback');
}

const KEY_NUTRIENTS = ['Calories', 'Protein', 'Fat', 'Carbohydrates'];

export type RecipeModalTab = 'ingredients' | 'steps' | 'nutrition';

/** Which recipes the signed-in user has saved, plus an optimistic save/unsave toggle. */
export function useRecipeSaves() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Set<number>>(new Set());

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

  const toggleSave = useCallback(async (recipe: CuratedRecipe) => {
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
                  : htmlToText(recipe.instructions),
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
  }, [saved]);

  return { saved, toggleSave };
}

export function RecipeDetailModal(props: {
  recipe: CuratedRecipe;
  initialTab: RecipeModalTab;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  // Portal to <body>: the dashboard's tab bar, dock and animated panels create
  // their own stacking layers, so rendering in place let them sit on top.
  if (typeof document === 'undefined') return null;
  return createPortal(<RecipeDetailDialog {...props} />, document.body);
}

function RecipeDetailDialog({
  recipe,
  initialTab,
  saved,
  onToggleSave,
  onClose,
}: {
  recipe: CuratedRecipe;
  initialTab: RecipeModalTab;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<RecipeModalTab>(initialTab);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const keyNutrients = (recipe.nutrition?.nutrients ?? []).filter((n) => KEY_NUTRIENTS.includes(n.name));
  const tags = recipe.dishTypes.slice(0, 3);

  // Escape closes (unless the share sheet is open on top); page doesn't scroll behind.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sharing) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, sharing]);

  const toggleChecked = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const openShare = () =>
    setSharing({
      title: recipe.title,
      subtitle: `Recipe · ${recipe.readyInMinutes} min · ${recipe.servings} servings`,
      image: recipe.image,
      url: `/dashboard?tab=bites&recipe=${recipe.id}`,
      text: `Try this recipe on FUZO: ${recipe.title}`,
      item: {
        id: String(recipe.id),
        itemId: String(recipe.id),
        itemType: 'recipe',
        type: 'recipe',
        title: recipe.title,
        cat: 'Recipe',
        img: recipe.image,
        description: `${recipe.readyInMinutes} min · ${recipe.servings} servings`,
      },
    });

  const TABS: { key: RecipeModalTab; label: string; icon: ReactNode; count?: number }[] = [
    { key: 'ingredients', label: 'Ingredients', icon: <List size={14} />, count: recipe.extendedIngredients.length || undefined },
    { key: 'steps', label: 'Steps', icon: <ChefHat size={14} />, count: recipe.analyzedInstructions.length || undefined },
    { key: 'nutrition', label: 'Nutrition', icon: <PieChart size={14} /> },
  ];

  return (
    <>
    <div className="fz-recipe" role="presentation" onClick={onClose}>
      <div className="fz-recipe__dialog" role="dialog" aria-modal="true" aria-labelledby="fz-recipe-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fz-recipe__close" onClick={onClose} aria-label="Close recipe details">
          <X size={18} />
        </button>

        {/* Photo with the title on it - the same look as the recipe card. */}
        <div className="fz-recipe__media">
          <img className="fz-recipe__img" src={recipe.image} alt="" onError={handleImageError} />
          <span className="fz-recipe__shade" aria-hidden="true" />
          <div className="fz-recipe__hero">
            <div className="fz-recipe__chips">
              <span><Clock size={12} /> {recipe.readyInMinutes} min</span>
              <span><Users size={12} /> {recipe.servings} servings</span>
            </div>
            <h2 id="fz-recipe-title" className="fz-recipe__title">{recipe.title}</h2>
          </div>
        </div>

        <div className="fz-recipe__panel">
          {tags.length > 0 && (
            <div className="fz-recipe__tags">
              {tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}

          <div className="fz-recipe__tabs" role="tablist" aria-label="Recipe details">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={tab === t.key ? 'is-active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
                {t.count !== undefined && <span className="fz-recipe__count">{t.count}</span>}
              </button>
            ))}
          </div>

          <div className="fz-recipe__content" role="tabpanel">
            {tab === 'ingredients' &&
              (recipe.extendedIngredients.length > 0 ? (
                <>
                  <p className="fz-recipe__hint">Tap to tick off what you have.</p>
                  <ul className="fz-recipe__ingredients">
                    {recipe.extendedIngredients.map((ing, i) => (
                      <li key={i}>
                        <button type="button" className={checked.has(i) ? 'is-checked' : ''} onClick={() => toggleChecked(i)} aria-pressed={checked.has(i)}>
                          <span className="fz-recipe__tick" aria-hidden="true">{checked.has(i) && <Check size={12} strokeWidth={3.5} />}</span>
                          {ing.original}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="fz-recipe__fallback">No ingredient list available.</p>
              ))}

            {tab === 'steps' &&
              (recipe.analyzedInstructions.length > 0 ? (
                <ol className="fz-recipe__steps">
                  {recipe.analyzedInstructions.map((step) => (
                    <li key={step.number}>
                      <span className="fz-recipe__step-num">{step.number}</span>
                      <p>{step.step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="fz-recipe__fallback">{htmlToText(recipe.instructions) || 'No steps available.'}</p>
              ))}

            {tab === 'nutrition' &&
              (keyNutrients.length > 0 ? (
                <div className="fz-recipe__nutrition">
                  {keyNutrients.map((n) => (
                    <div key={n.name} className={`fz-recipe__nutrient fz-recipe__nutrient--${n.name.toLowerCase()}`}>
                      <span className="fz-recipe__nutrient-amount">
                        {Math.round(n.amount)}
                        <small>{n.unit}</small>
                      </span>
                      <span className="fz-recipe__nutrient-name">{n.name === 'Carbohydrates' ? 'Carbs' : n.name}</span>
                    </div>
                  ))}
                  <p className="fz-recipe__hint">Per serving.</p>
                </div>
              ) : (
                <p className="fz-recipe__fallback">No nutrition data available.</p>
              ))}
          </div>

          <div className="fz-recipe__footer">
            <button type="button" className={`fz-recipe__save${saved ? ' is-saved' : ''}`} onClick={onToggleSave} aria-pressed={saved}>
              <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved to your plate' : 'Save recipe'}
            </button>
            <button type="button" className="fz-recipe__share" onClick={openShare} aria-label="Share recipe">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Outside .fz-recipe so clicks on the share backdrop don't bubble (through the portal) and close the recipe. */}
    <ShareSheet payload={sharing} onClose={() => setSharing(null)} />
    </>
  );
}
