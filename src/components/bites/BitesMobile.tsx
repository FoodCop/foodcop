import { useState, useEffect } from 'react';
import { Search, Tune, Star, Schedule, LocalFireDepartment, BookmarkBorder, Bookmark, Send, WbSunny, Restaurant, DarkMode, Cake, Nature, Park, Whatshot } from '@mui/icons-material';
import { SpoonacularService } from '../../services/spoonacular';
import { savedItemsService } from '../../services/savedItemsService';
import { useAuth } from '../auth/AuthProvider';
import { toastHelpers } from '../../utils/toastHelpers';
import type { Recipe } from './components/RecipeCard';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import BitesDesktop from './BitesDesktop';
import { MinimalHeader } from '../common/MinimalHeader';
import { SectionHeading } from '../ui/section-heading';
import { useUniversalViewer } from '../../contexts/UniversalViewerContext';
import { transformBitesRecipeToUnified } from '../../utils/unifiedContentTransformers';
import { PreferencesFilterDrawer } from '../common/PreferencesFilterDrawer';
import { ProfileService } from '../../services/profileService';
import type { UserProfile } from '../../types/profile';

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
  { id: 'breakfast', label: 'Breakfast', icon: WbSunny, type: 'breakfast' },
  { id: 'lunch', label: 'Lunch', icon: Restaurant, type: 'main course' },
  { id: 'dinner', label: 'Dinner', icon: DarkMode, type: 'main course' },
  { id: 'dessert', label: 'Dessert', icon: Cake, type: 'dessert' },
  { id: 'vegan', label: 'Vegan', icon: Nature, diet: 'vegan' },
  { id: 'keto', label: 'Keto', icon: Park, diet: 'ketogenic' },
  { id: 'glutenFree', label: 'Gluten Free', icon: Park, diet: 'gluten free' },
  { id: 'quick', label: 'Quick', icon: LocalFireDepartment, maxReadyTime: 30 },
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

export default function BitesMobile() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { openViewer } = useUniversalViewer();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState('all');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'search' | 'category'>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadInitialRecipes();
    // Load user profile for preferences
    const loadProfile = async () => {
      if (user) {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
        }
      }
    };
    loadProfile();
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
      // Fetch user preferences
      let userPreferences: string[] = [];
      if (user) {
        const { ProfileService } = await import('../../services/profileService');
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data?.dietary_preferences) {
          userPreferences = profileResult.data.dietary_preferences;
        }
      }

      // Map preferences to Spoonacular diet parameter
      const { getSpoonacularDietParam } = await import('../../utils/preferenceMapper');
      const dietParam = getSpoonacularDietParam(userPreferences);

      // Build search params
      const searchParams: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query: 'popular',
        number: 6,
      };

      // Add diet filter if user has preferences
      if (dietParam) {
        searchParams.diet = dietParam;
      }

      // Load recommended recipes
      const recommendedResult = await SpoonacularService.searchRecipes(searchParams);

      // Load trending recipes (also apply preferences)
      const trendingParams: Parameters<typeof SpoonacularService.getRandomRecipes>[1] = dietParam || undefined;
      const trendingResult = await SpoonacularService.getRandomRecipes(6, trendingParams);

      // Check shuffle state once and import utilities
      const { shuffleArray, hasRecipesBeenShuffled, markRecipesAsShuffled } = await import('../../utils/preferenceMapper');
      const shouldShuffle = !hasRecipesBeenShuffled();

      if (recommendedResult.success && recommendedResult.data?.results) {
        let recipes = transformRecipes(recommendedResult.data.results);
        
        // Shuffle on first load only
        if (shouldShuffle) {
          recipes = shuffleArray(recipes);
          markRecipesAsShuffled();
        }
        
        setRecommendedRecipes(recipes);
      }

      if (trendingResult.success && trendingResult.data?.recipes) {
        let recipes = transformRecipes(trendingResult.data.recipes);
        
        // Shuffle trending recipes too on first load (if not already shuffled)
        if (shouldShuffle) {
          recipes = shuffleArray(recipes);
        }
        
        setTrendingRecipes(recipes);
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
      // Fetch user preferences
      let userPreferences: string[] = [];
      if (user) {
        const { ProfileService } = await import('../../services/profileService');
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data?.dietary_preferences) {
          userPreferences = profileResult.data.dietary_preferences;
        }
      }

      // Map preferences to Spoonacular diet parameter
      const { getSpoonacularDietParam } = await import('../../utils/preferenceMapper');
      const userDietParam = getSpoonacularDietParam(userPreferences);

      const params: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query: searchQuery,
        number: 12,
      };

      // Use user preferences if no manual diet filter is selected, otherwise use manual filter
      if (selectedDiet !== 'all') {
        params.diet = selectedDiet;
      } else if (userDietParam) {
        params.diet = userDietParam;
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
    // Load full details if needed
    let fullRecipe = recipe;
    
    if (!recipe.instructions || !recipe.extendedIngredients || recipe.extendedIngredients.length === 0) {
      const result = await SpoonacularService.getRecipeInformation(recipe.id, true);
      if (result.success && result.data) {
        fullRecipe = transformRecipes([result.data])[0];
      }
    }
    
    // Transform and open in Universal Viewer
    const unified = transformBitesRecipeToUnified(fullRecipe);
    openViewer(unified);
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
    if (viewMode === 'search' || viewMode === 'category') {
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


  // Show search results or category results
  if ((viewMode === 'search' || viewMode === 'category') && searchResults.length > 0) {
    return (
      <div
        className="min-h-screen bg-surface-primary bg-cover bg-center bg-no-repeat flex flex-col text-sm"
        style={{ backgroundImage: 'url(/bg.svg)' }}
      >
        <MinimalHeader showLogo={true} logoPosition="left" />
        <header className="sticky top-0 bg-surface-secondary border-b border-neutral-200 z-50">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="relative">
                <Search sx={{ position: 'absolute', left: 12, top: 12, fontSize: 16, color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-[#6B7280] placeholder:text-[#9CA3AF] text-sm border-none focus:outline-none focus:ring-2 focus:ring-accent-yellow-500/20"
                />
              </div>
            </div>
          </div>
          <div className="px-4 pb-3">
            <p className="text-sm text-neutral-400">Found {searchResults.length} recipes</p>
          </div>
        </header>

        <main className="px-4 py-5 space-y-3">
          {searchResults.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleRecipeClick(recipe)}
              className="w-full bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm"
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
                  <h3 className="text-base font-bold text-foreground flex-1 text-left">{recipe.title}</h3>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 text-accent-yellow-500 fill-accent-yellow-500" />
                      <span className="text-xs font-semibold text-foreground">{((recipe.healthScore || 50) / 20).toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
                  {recipe.summary?.replaceAll(/<[^>]*>/g, '').slice(0, 100)}...
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Schedule className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-400">{recipe.readyInMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Whatshot className="w-4 h-4 text-warning" />
                    <span className="text-xs text-neutral-400">~{Math.round((recipe.pricePerServing || 200) / 3)} kcal</span>
                  </div>
                </div>
                {recipe.diets.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {recipe.diets.slice(0, 2).map((diet) => (
                      <span key={diet} className="px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium text-foreground">
                        {diet}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-neutral-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveRecipe(recipe);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-surface-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <BookmarkBorder sx={{ fontSize: 16 }} />
                    Save
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Send sx={{ fontSize: 16 }} />
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
    <div className="min-h-screen bg-background flex flex-col text-sm">
      <MinimalHeader showLogo={true} logoPosition="left" />
      <header className="px-4 pt-6 pb-4 bg-surface-secondary sticky top-0 z-50">
        <div className="relative">
          <Search sx={{ position: 'absolute', left: 16, top: 12, fontSize: 16, color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-14 rounded-2xl bg-white text-[#6B7280] placeholder:text-[#9CA3AF] text-sm border-none focus:outline-none focus:ring-2 focus:ring-accent-yellow-500/20"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-primary flex items-center justify-center"
          >
            <Tune sx={{ fontSize: 16, color: '#374151' }} />
          </button>
        </div>
      </header>

      {/* Active Preferences Display */}
      {userProfile?.dietary_preferences && userProfile.dietary_preferences.length > 0 && (
        <div className="px-4 py-2 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-orange-700">Active Filters:</span>
            {userProfile.dietary_preferences.map((pref) => (
              <span
                key={pref}
                className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
              >
                {pref.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferences Filter Drawer */}
      <PreferencesFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        userProfile={userProfile}
        onPreferencesUpdated={async () => {
          // Reload profile and recipes
          if (user) {
            const profileResult = await ProfileService.getProfile();
            if (profileResult.success && profileResult.data) {
              setUserProfile(profileResult.data);
            }
            loadInitialRecipes();
          }
        }}
      />

      <main className="px-4 py-5">
        <section className="mb-6">
          <SectionHeading className="mb-4">Categories</SectionHeading>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                  <category.icon sx={{ fontSize: 24, color: '#374151' }} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-yellow-500"></div>
          </div>
        )}

        {!loading && recommendedRecipes.length > 0 && (
          <section className="mb-6">
            <div className="mb-4">
              <SectionHeading>Recommended For You</SectionHeading>
            </div>
            <div className="space-y-3">
              {recommendedRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="w-full bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm"
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
                      <h3 className="text-base font-bold text-foreground flex-1 text-left">{recipe.title}</h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-4 h-4 text-accent-yellow-500 fill-accent-yellow-500" />
                        <span className="text-sm font-semibold text-foreground">{((recipe.healthScore || 50) / 20).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Schedule className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs text-neutral-400">{recipe.readyInMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Whatshot className="w-4 h-4 text-warning" />
                        <span className="text-xs text-neutral-400">~{Math.round((recipe.pricePerServing || 200) / 3)} kcal</span>
                      </div>
                    </div>
                    {recipe.diets.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        {recipe.diets.slice(0, 2).map((diet) => (
                          <span key={diet} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-foreground">
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRecipe(recipe);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-surface-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <BookmarkBorder className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
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
            <div className="mb-4">
              <SectionHeading>Trending Now</SectionHeading>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trendingRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="shrink-0 w-40 bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm"
                >
                  <div className="h-32 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground mb-1 text-left line-clamp-2">{recipe.title}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-accent-yellow-500 fill-accent-yellow-500" />
                        <span className="text-xs font-semibold text-foreground">{((recipe.healthScore || 50) / 20).toFixed(1)}</span>
                      <span className="text-xs text-neutral-400 ml-auto">{recipe.readyInMinutes} min</span>
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
