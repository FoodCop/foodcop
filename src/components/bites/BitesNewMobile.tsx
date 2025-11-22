import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Star, Clock, Flame, Bookmark, Send } from 'lucide-react';
import { SpoonacularService } from '../../services/spoonacular';
import { savedItemsService } from '../../services/savedItemsService';
import { useAuth } from '../auth/AuthProvider';
import { toastHelpers } from '../../utils/toastHelpers';
import type { Recipe } from './components/RecipeCard';
import RecipeDetailView from './components/RecipeDetailView';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import BitesDesktop from './BitesDesktop';
import { MinimalHeader } from '../common/MinimalHeader';

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  diets?: string[];
  cuisines?: string[];
  summary?: string;
  instructions?: string;
  extendedIngredients?: {
    id: number;
    original: string;
    name?: string;
    amount?: number;
    unit?: string;
  }[];
  sourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: {
    name: string;
    steps: {
      number: number;
      step: string;
      ingredients?: { id: number; name: string; image: string }[];
      equipment?: { id: number; name: string; image: string }[];
    }[];
  }[];
  preparationMinutes?: number;
  cookingMinutes?: number;
  spoonacularScore?: number;
}

const CATEGORIES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'fa-solid fa-sun', type: 'breakfast' },
  { id: 'lunch', label: 'Lunch', icon: 'fa-solid fa-utensils', type: 'main course' },
  { id: 'dinner', label: 'Dinner', icon: 'fa-solid fa-moon', type: 'main course' },
  { id: 'dessert', label: 'Dessert', icon: 'fa-solid fa-cake-candles', type: 'dessert' },
  { id: 'vegan', label: 'Vegan', icon: 'fa-solid fa-leaf', diet: 'vegan' },
  { id: 'keto', label: 'Keto', icon: 'fa-solid fa-seedling', diet: 'ketogenic' },
  { id: 'glutenFree', label: 'Gluten Free', icon: '🌾', diet: 'gluten free' },
  { id: 'quick', label: 'Quick', icon: '⚡', maxReadyTime: 30 },
];

const DIETARY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'ketogenic', label: 'Keto' },
  { id: 'gluten free', label: 'Gluten-Free' },
  { id: 'paleo', label: 'Paleo' },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
  { id: 'dessert', label: 'Dessert' },
];

export default function BitesNewMobile() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState('all');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'search' | 'detail' | 'category'>('home');

  useEffect(() => {
    loadInitialRecipes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear search results when search is cleared
      setSearchResults([]);
      setViewMode('home');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedDiet, selectedMealType]);

  const loadInitialRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load recommended recipes
      const recommendedResult = await SpoonacularService.searchRecipes({
        query: 'popular',
        number: 6,
      });

      // Load trending recipes
      const trendingResult = await SpoonacularService.getRandomRecipes(6, 'popular');

      if (recommendedResult.success && recommendedResult.data?.results) {
        setRecommendedRecipes(transformRecipes(recommendedResult.data.results));
      }

      if (trendingResult.success && trendingResult.data?.recipes) {
        setTrendingRecipes(transformRecipes(trendingResult.data.recipes));
      }
    } catch (err) {
      console.error('Failed to load recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setViewMode('search');

    try {
      const params: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query: searchQuery,
        number: 12,
      };

      if (selectedDiet !== 'all') {
        params.diet = selectedDiet;
      }

      if (selectedMealType) {
        params.type = selectedMealType;
      }

      const result = await SpoonacularService.searchRecipes(params);

      if (result.success && result.data?.results) {
        setSearchResults(transformRecipes(result.data.results));
      } else {
        setError(result.error || 'Failed to search recipes');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category: typeof CATEGORIES[0]) => {
    setLoading(true);
    setError(null);
    setSelectedCategory(category.id);
    setViewMode('category');

    try {
      const params: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        number: 12,
      };

      if (category.type) params.type = category.type;
      if (category.diet) params.diet = category.diet;
      if (category.maxReadyTime) params.maxReadyTime = category.maxReadyTime;

      const result = await SpoonacularService.searchRecipes(params);

      if (result.success && result.data?.results) {
        setSearchResults(transformRecipes(result.data.results));
      }
    } catch (err) {
      console.error('Category load error:', err);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const transformRecipes = (recipes: SpoonacularRecipe[]): Recipe[] => {
    return recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 4,
      diets: recipe.diets || [],
      cuisines: recipe.cuisines || [],
      summary: recipe.summary || '',
      instructions: recipe.instructions || '',
      extendedIngredients: recipe.extendedIngredients || [],
      sourceUrl: recipe.sourceUrl,
      aggregateLikes: recipe.aggregateLikes,
      healthScore: recipe.healthScore,
      pricePerServing: recipe.pricePerServing,
      analyzedInstructions: recipe.analyzedInstructions,
      preparationMinutes: recipe.preparationMinutes,
      cookingMinutes: recipe.cookingMinutes,
    }));
  };

  const handleRecipeClick = async (recipe: Recipe) => {
    // Load full details
    const result = await SpoonacularService.getRecipeInformation(recipe.id, true);
    
    if (result.success && result.data) {
      const fullRecipe = transformRecipes([result.data])[0];
      setSelectedRecipe(fullRecipe);
      setViewMode('detail');
    } else {
      setSelectedRecipe(recipe);
      setViewMode('detail');
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) {
      toastHelpers.error('Please sign in to save recipes');
      return;
    }

    try {
      const result = await savedItemsService.saveItem({
        itemId: String(recipe.id),
        itemType: 'recipe',
        metadata: {
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
        },
      });

      if (result.success) {
        toastHelpers.saved(recipe.title);
      } else {
        toastHelpers.error(result.error || 'Failed to save recipe');
      }
    } catch (error) {
      console.error('Save error:', error);
      toastHelpers.error('Failed to save recipe');
    }
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode(searchResults.length > 0 ? 'search' : 'home');
      setSelectedRecipe(null);
    } else if (viewMode === 'search' || viewMode === 'category') {
      setViewMode('home');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCategory(null);
    }
  };

  // Responsive switching: show desktop version on larger screens
  if (isDesktop) {
    return <BitesDesktop />;
  }

  // Show recipe detail view
  if (viewMode === 'detail' && selectedRecipe) {
    return <RecipeDetailView recipe={selectedRecipe} onBack={handleBack} onSave={() => handleSaveRecipe(selectedRecipe)} />;
  }

  // Show search results or category results
  if ((viewMode === 'search' || viewMode === 'category') && searchResults.length > 0) {
    return (
      <div 
        className="min-h-screen bg-[#FAFAFA] bg-cover bg-center bg-no-repeat flex flex-col"
        style={{
          backgroundImage: 'url(/bg.svg)',
          fontSize: '10pt',
        }}
      >
        <MinimalHeader showLogo={true} logoPosition="left" />
        <header className="sticky top-0 bg-white border-b border-[#EEE] z-50">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#FFD500]/20"
                />
              </div>
            </div>
          </div>
          <div className="px-4 pb-3">
            <p className="text-sm text-[#8A8A8A]">Found {searchResults.length} recipes</p>
          </div>
        </header>

        <main className="px-4 py-5 space-y-3">
          {searchResults.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleRecipeClick(recipe)}
              className="w-full bg-white rounded-2xl overflow-hidden border border-[#EEE] shadow-sm"
            >
              <div className="h-44 overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-[#0f172a] flex-1 text-left">{recipe.title}</h3>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 text-[#FFD500] fill-[#FFD500]" />
                    <span className="text-sm font-semibold text-[#0f172a]">{((recipe.healthScore || 50) / 20).toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-[#8A8A8A] mb-3 line-clamp-2">
                  {recipe.summary?.replaceAll(/<[^>]*>/g, '').slice(0, 100)}...
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#8A8A8A]" />
                    <span className="text-xs text-[#8A8A8A]">{recipe.readyInMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-xs text-[#8A8A8A]">~{Math.round((recipe.pricePerServing || 200) / 3)} kcal</span>
                  </div>
                </div>
                {recipe.diets.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {recipe.diets.slice(0, 2).map((diet) => (
                      <span key={diet} className="px-2.5 py-1 rounded-full bg-white text-xs font-medium text-[#0f172a]">
                        {diet}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-[#EEE]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveRecipe(recipe);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white text-[#0f172a] text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2.5 rounded-xl bg-[#FFD500] text-[#8A8A8A] text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </button>
          ))}
        </main>
      </div>
    );
  }

  // Home view
  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] bg-cover bg-center bg-no-repeat flex flex-col"
      style={{
        backgroundImage: 'url(/bg.svg)',
        fontSize: '10pt',
      }}
    >
      <MinimalHeader showLogo={true} logoPosition="left" />
      <header className="px-4 pt-6 pb-4 bg-white sticky top-0 z-50">
        <div className="relative">
          <Search className="absolute left-4 top-3 w-4 h-4 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-14 rounded-2xl bg-white text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#FFD500]/20"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-[#FFD500] flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#8A8A8A]" />
          </button>
        </div>
      </header>

      {showFilters && (
        <section className="px-4 py-4 bg-white border-b border-[#EEE]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Dietary Preferences</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {DIETARY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedDiet(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedDiet === filter.id
                    ? 'bg-[#FFD500] text-[#8A8A8A]'
                    : 'bg-white text-[#0f172a]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Meal Type</h3>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedMealType(type.id === selectedMealType ? null : type.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedMealType === type.id
                    ? 'bg-[#FFD500] text-[#8A8A8A]'
                    : 'bg-white text-[#0f172a]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <main className="px-4 py-5">
        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-4">Categories</h2>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#EEE] flex items-center justify-center shadow-sm">
                  <i className={category.icon} style={{ fontSize: '20pt' }}></i>
                </div>
                <span className="text-xs font-medium text-[#0f172a] text-center">{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD500]"></div>
          </div>
        )}

        {!loading && recommendedRecipes.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0f172a]">Recommended For You</h2>
              <button className="text-sm font-medium text-[#f59e0b]">See All</button>
            </div>
            <div className="space-y-3">
              {recommendedRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="w-full bg-white rounded-2xl overflow-hidden border border-[#EEE] shadow-sm"
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-bold text-[#0f172a] flex-1 text-left">{recipe.title}</h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-4 h-4 text-[#FFD500] fill-[#FFD500]" />
                        <span className="text-sm font-semibold text-[#0f172a]">{((recipe.healthScore || 50) / 20).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#8A8A8A]" />
                        <span className="text-xs text-[#8A8A8A]">{recipe.readyInMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-[#f59e0b]" />
                        <span className="text-xs text-[#8A8A8A]">~{Math.round((recipe.pricePerServing || 200) / 3)} kcal</span>
                      </div>
                    </div>
                    {recipe.diets.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        {recipe.diets.slice(0, 2).map((diet) => (
                          <span key={diet} className="px-2.5 py-1 rounded-full bg-white text-xs font-medium text-[#0f172a]">
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-[#EEE]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRecipe(recipe);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-white text-[#0f172a] text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Bookmark className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2.5 rounded-xl bg-[#FFD500] text-[#8A8A8A] text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && trendingRecipes.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0f172a]">Trending Now</h2>
              <button className="text-sm font-medium text-[#f59e0b]">See All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trendingRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="shrink-0 w-40 bg-white rounded-2xl overflow-hidden border border-[#EEE] shadow-sm"
                >
                  <div className="h-32 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-[#0f172a] mb-1 text-left line-clamp-2">{recipe.title}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-[#FFD500] fill-[#FFD500]" />
                      <span className="text-xs font-semibold text-[#0f172a]">{((recipe.healthScore || 50) / 20).toFixed(1)}</span>
                      <span className="text-xs text-[#8A8A8A] ml-auto">{recipe.readyInMinutes} min</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
