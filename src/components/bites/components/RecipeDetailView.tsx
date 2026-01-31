import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Star, Bookmark, ChefHat } from 'lucide-react';
import type { Recipe } from './RecipeCard';
import { SpoonacularService } from '../../../services/spoonacular';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onSave: () => void;
}

export function RecipeDetailView({ recipe, onBack, onSave }: Readonly<RecipeDetailViewProps>) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions' | 'nutrition'>('overview');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [fullRecipe, setFullRecipe] = useState<Recipe>(recipe);
  const [nutritionData, setNutritionData] = useState<{ name: string; amount: number; unit: string }[]>([]);

  useEffect(() => {
    // Load full recipe details with nutrition
    const loadFullDetails = async () => {
      const result = await SpoonacularService.getRecipeInformation(recipe.id, true);
      if (result.success && result.data) {
        setFullRecipe(result.data);
        if (result.data.nutrition?.nutrients) {
          setNutritionData(result.data.nutrition.nutrients.slice(0, 10));
        }
      }
    };
    loadFullDetails();
  }, [recipe.id]);

  const toggleIngredient = (id: number) => {
    const newSet = new Set(checkedIngredients);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCheckedIngredients(newSet);
  };

  const getSteps = () => {
    if (fullRecipe.analyzedInstructions && fullRecipe.analyzedInstructions.length > 0) {
      return fullRecipe.analyzedInstructions[0].steps;
    }
    // Fallback: parse instructions text
    if (fullRecipe.instructions) {
      const steps = fullRecipe.instructions
        .split(/\d+\.|Step \d+/gi)
        .filter(s => s.trim().length > 0)
        .map((step, index) => ({
          number: index + 1,
          step: step.trim().replace(/<[^>]*>/g, ''),
        }));
      return steps;
    }
    return [];
  };

  const steps = getSteps();

  const getMacros = () => {
    if (!nutritionData.length) return { protein: 0, carbs: 0, fat: 0 };
    
    const protein = nutritionData.find(n => n.name.toLowerCase() === 'protein')?.amount || 0;
    const carbs = nutritionData.find(n => n.name.toLowerCase() === 'carbohydrates')?.amount || 0;
    const fat = nutritionData.find(n => n.name.toLowerCase() === 'fat')?.amount || 0;
    
    return { protein, carbs, fat };
  };

  const macros = getMacros();
  const totalMacros = macros.protein + macros.carbs + macros.fat;

  return (
    <div className="min-h-screen bg-[var(--color-neutral-bg-light)]">
      <header className="sticky top-0 bg-white border-b border-[var(--color-border)] z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-neutral-text)]" />
          </button>
          <h2 className="text-lg font-bold text-[var(--color-neutral-text)]">Recipe Details</h2>
          <div className="w-10 h-10" /> {/* Spacer for layout balance */}
        </div>
      </header>

      <main className="pb-6">
        <section className="relative">
          <div className="h-72 overflow-hidden">
            <img
              src={fullRecipe.image}
              alt={fullRecipe.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
            <Star className="w-4 h-4 text-[var(--color-primary)] fill-[var(--color-primary)]" />
            <span className="text-base font-bold text-[var(--color-neutral-text)]">{((fullRecipe.healthScore || 50) / 20).toFixed(1)}</span>
            <span className="text-sm text-[var(--color-neutral-text-lighter)]">({fullRecipe.aggregateLikes || 0})</span>
          </div>
        </section>

        <section className="px-4 py-5 bg-white">
          <h1 className="text-2xl font-bold text-[var(--color-neutral-text)] mb-2">{fullRecipe.title}</h1>
          <p className="text-sm text-[var(--color-neutral-text-lighter)] mb-4">
            {fullRecipe.summary?.replace(/<[^>]*>/g, '').slice(0, 150)}...
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-10)] flex items-center justify-center mx-auto mb-1">
                <Clock className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <p className="text-xs text-[var(--color-neutral-text-lighter)]">Time</p>
              <p className="text-sm font-bold text-[var(--color-neutral-text)]">{fullRecipe.readyInMinutes} min</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-10)] flex items-center justify-center mx-auto mb-1">
                <ChefHat className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <p className="text-xs text-[var(--color-neutral-text-lighter)]">Difficulty</p>
              <p className="text-sm font-bold text-[var(--color-neutral-text)]">
                {fullRecipe.readyInMinutes < 30 ? 'Easy' : fullRecipe.readyInMinutes < 60 ? 'Medium' : 'Hard'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-10)] flex items-center justify-center mx-auto mb-1">
                <span className="text-lg">🔥</span>
              </div>
              <p className="text-xs text-[var(--color-neutral-text-lighter)]">Calories</p>
              <p className="text-sm font-bold text-[var(--color-neutral-text)]">~{Math.round((fullRecipe.pricePerServing || 200) / 3)}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-[var(--color-border)] sticky top-[60px] z-40">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === 'overview'
                  ? 'text-[var(--color-neutral-text)] border-b-3 border-[var(--color-primary)]'
                  : 'text-[var(--color-neutral-text-lighter)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === 'ingredients'
                  ? 'text-[var(--color-neutral-text)] border-b-3 border-[var(--color-primary)]'
                  : 'text-[var(--color-neutral-text-lighter)]'
              }`}
            >
              Ingredients
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === 'instructions'
                  ? 'text-[var(--color-neutral-text)] border-b-3 border-[var(--color-primary)]'
                  : 'text-[var(--color-neutral-text-lighter)]'
              }`}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === 'nutrition'
                  ? 'text-[var(--color-neutral-text)] border-b-3 border-[var(--color-primary)]'
                  : 'text-[var(--color-neutral-text-lighter)]'
              }`}
            >
              Nutrition
            </button>
          </div>
        </section>

        {activeTab === 'overview' && (
          <section className="px-4 py-5">
            <h3 className="text-lg font-bold text-[var(--color-neutral-text)] mb-3">Nutrition Overview</h3>
            {totalMacros > 0 && (
              <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-neutral-text)]">Macros Distribution</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-neutral-text-lighter)]">Protein</span>
                      <span className="font-semibold text-[var(--color-neutral-text)]">{macros.protein.toFixed(0)}g ({((macros.protein / totalMacros) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-[var(--color-neutral-bg-light)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)]"
                        style={{ width: `${(macros.protein / totalMacros) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-neutral-text-lighter)]">Carbohydrates</span>
                      <span className="font-semibold text-[var(--color-neutral-text)]">{macros.carbs.toFixed(0)}g ({((macros.carbs / totalMacros) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-[var(--color-neutral-bg-light)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-warning)]"
                        style={{ width: `${(macros.carbs / totalMacros) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-neutral-text-lighter)]">Fats</span>
                      <span className="font-semibold text-[var(--color-neutral-text)]">{macros.fat.toFixed(0)}g ({((macros.fat / totalMacros) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-[var(--color-neutral-bg-light)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-neutral-text-light)]"
                        style={{ width: `${(macros.fat / totalMacros) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {fullRecipe.diets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fullRecipe.diets.map((diet) => (
                  <span key={diet} className="px-3 py-1.5 rounded-full bg-white border border-[var(--color-border)] text-sm font-medium text-[var(--color-neutral-text)]">
                    {diet}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'ingredients' && (
          <section className="px-4 py-5 space-y-3">
            {fullRecipe.extendedIngredients.map((ingredient, index) => (
              <div
                key={`${ingredient.id}-${index}`}
                className="bg-white rounded-xl border border-[var(--color-border)] p-4 flex items-start gap-3 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={checkedIngredients.has(ingredient.id)}
                  onChange={() => toggleIngredient(ingredient.id)}
                  className="mt-1 w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${checkedIngredients.has(ingredient.id) ? 'line-through text-[var(--color-neutral-text-lighter)]' : 'text-[var(--color-neutral-text)]'}`}>
                    {ingredient.name || ingredient.original}
                  </p>
                  <p className="text-xs text-[var(--color-neutral-text-lighter)] mt-0.5">
                    {ingredient.amount && ingredient.unit
                      ? `${ingredient.amount} ${ingredient.unit}`
                      : ingredient.original}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'instructions' && (
          <section className="px-4 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-neutral-text)]">Cooking Instructions</h3>
              <div className="px-3 py-1.5 rounded-lg bg-[var(--color-warning-light)] text-sm font-medium text-[var(--color-warning-dark)] flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {fullRecipe.readyInMinutes} min
              </div>
            </div>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.number} className="bg-white rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-neutral-text-lighter)] flex items-center justify-center text-base font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-[var(--color-neutral-text)] leading-relaxed">{step.step}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {steps.length > 0 && (
              <div className="mt-6 bg-[var(--color-warning-light)] border border-[var(--color-warning)] rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="text-lg">💡</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-neutral-text)] mb-1">Pro Tip</h4>
                    <p className="text-sm text-[var(--color-neutral-text-lighter)]">
                      Read through all instructions before starting to ensure you have all equipment ready.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'nutrition' && (
          <section className="px-4 py-5">
            <h3 className="text-lg font-bold text-[var(--color-neutral-text)] mb-4">Nutrition Facts</h3>
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
              <div className="space-y-3">
                {nutritionData.map((nutrient, index) => (
                  <div
                    key={`${nutrient.name}-${index}`}
                    className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-[var(--color-neutral-text)]">{nutrient.name}</span>
                    <span className="text-sm font-semibold text-[var(--color-neutral-text-lighter)]">
                      {nutrient.amount.toFixed(1)} {nutrient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] p-4">
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="flex-1 py-3 rounded-full bg-[var(--button-bg-active)] text-[var(--button-text)] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[var(--button-bg-hover)] transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            Save to Plate
          </button>
          <button className="flex-1 py-3 rounded-full bg-[var(--button-bg-default)] text-[var(--button-text)] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[var(--button-bg-hover)] transition-colors">
            <ChefHat className="w-4 h-4" />
            Start Cooking
          </button>
        </div>
      </footer>
    </div>
  );
}

export default RecipeDetailView;
