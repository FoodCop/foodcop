import { useState, useEffect } from "react";
import Masonry from 'react-masonry-css';
import { Search, SlidersHorizontal } from "lucide-react";
import type { Recipe } from "./components/RecipeCard";
import { RecipeCard } from "./components/RecipeCard";
import { AdCard } from "./components/AdCard";
import { RecipeDetailDialog } from "./components/RecipeDetailDialog";
import { SpoonacularService } from "../../services/spoonacular";
import { useAuth } from "../auth/AuthProvider";
import { SectionHeading } from "../ui/section-heading";
import { ProfileService } from "../../services/profileService";
import { PreferencesFilterDrawer } from "../common/PreferencesFilterDrawer";
import type { UserProfile } from "../../types/profile";
import { toast } from "sonner";
import { DIETARY_OPTIONS } from "../../types/onboarding";
import { SidebarPanel, SidebarSection } from "../common/SidebarPanel";
import { mixRecipesWithAds, isAd, type BitesContent } from '../../utils/contentMixer';

// Spoonacular API response types
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
}

const dietCategories = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'glutenFree', label: 'Gluten Free', emoji: '🌾' },
  { id: 'ketogenic', label: 'Keto', emoji: '🥑' },
];

export default function Bites() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fallbackRecipes, setFallbackRecipes] = useState<Recipe[]>([]); // For when main results are sparse
  const [mixedRecommended, setMixedRecommended] = useState<BitesContent[]>([]);
  const [mixedMightLike, setMixedMightLike] = useState<BitesContent[]>([]);
  const [mixedSimilar, setMixedSimilar] = useState<BitesContent[]>([]); // For fallback content
  const [loading, setLoading] = useState(false);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [desktopDietaryFilters, setDesktopDietaryFilters] = useState<string[]>([]);
  const [savingDesktopPrefs, setSavingDesktopPrefs] = useState(false);

  useEffect(() => {
    loadRecipes("popular recipes");
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
  }, [user]);

  useEffect(() => {
    if (userProfile?.dietary_preferences) {
      setDesktopDietaryFilters(userProfile.dietary_preferences);
    } else {
      setDesktopDietaryFilters([]);
    }
  }, [userProfile]);

  const loadRecipes = async (query: string) => {
    setLoading(true);
    setError(null);
    setFallbackRecipes([]); // Clear fallback recipes when new search starts
    
    try {
      // Fetch user preferences
      let userPreferences: string[] = [];
      if (user) {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data?.dietary_preferences) {
          userPreferences = profileResult.data.dietary_preferences;
        }
      }

      // Map preferences to Spoonacular diet parameter
      const { getSpoonacularDietParam } = await import('../../utils/preferenceMapper');
      const dietParam = getSpoonacularDietParam(userPreferences);

      // Build search params - increase number based on preferences
      const hasPreferences = userPreferences.length > 0;
      const searchParams: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query,
        number: hasPreferences ? 24 : 12 // Request more when filtering
      };

      // Add diet filter if user has preferences
      if (dietParam) {
        searchParams.diet = dietParam;
      }

      const result = await SpoonacularService.searchRecipes(searchParams);
      
      if (result.success && result.data?.results) {
        const transformedRecipes: Recipe[] = result.data.results.map((recipe: SpoonacularRecipe) => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 4,
          diets: recipe.diets || [],
          cuisines: recipe.cuisines || [],
          summary: recipe.summary || "No description available.",
          instructions: recipe.instructions || "",
          extendedIngredients: recipe.extendedIngredients || [],
          sourceUrl: recipe.sourceUrl,
          aggregateLikes: recipe.aggregateLikes,
          healthScore: recipe.healthScore,
          pricePerServing: recipe.pricePerServing,
          analyzedInstructions: recipe.analyzedInstructions,
          preparationMinutes: recipe.preparationMinutes,
          cookingMinutes: recipe.cookingMinutes,
        }));
        
        // Shuffle on first load only
        const { shuffleArray, hasRecipesBeenShuffled, markRecipesAsShuffled } = await import('../../utils/preferenceMapper');
        let finalRecipes = transformedRecipes;
        
        if (!hasRecipesBeenShuffled()) {
          finalRecipes = shuffleArray(transformedRecipes);
          markRecipesAsShuffled();
        }
        
        setRecipes(finalRecipes);
        
        // If we got fewer than 6 results, fetch fallback recipes with relaxed filters
        if (finalRecipes.length < 6 && dietParam) {
          loadFallbackRecipes(query, userPreferences);
        }
      } else {
        setError(result.error || "Failed to load recipes");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Recipe loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load fallback recipes with relaxed dietary restrictions
  const loadFallbackRecipes = async (query: string, userPreferences: string[]) => {
    setLoadingFallback(true);
    
    try {
      console.log('📦 Loading fallback recipes to supplement sparse results...');
      
      // Strategy: Remove strictest filters first, keep major ones
      // Priority: Keep vegan/vegetarian, relax gluten-free, dairy-free, etc.
      const relaxedPrefs = userPreferences.filter(pref => 
        pref === 'vegan' || pref === 'vegetarian'
      );
      
      const { getSpoonacularDietParam } = await import('../../utils/preferenceMapper');
      const relaxedDietParam = getSpoonacularDietParam(relaxedPrefs);
      
      const fallbackParams: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query: query || 'popular healthy recipes',
        number: 12
      };
      
      if (relaxedDietParam) {
        fallbackParams.diet = relaxedDietParam;
      }
      
      const result = await SpoonacularService.searchRecipes(fallbackParams);
      
      if (result.success && result.data?.results) {
        const transformedRecipes: Recipe[] = result.data.results.map((recipe: SpoonacularRecipe) => ({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 4,
          diets: recipe.diets || [],
          cuisines: recipe.cuisines || [],
          summary: recipe.summary || "No description available.",
          instructions: recipe.instructions || "",
          extendedIngredients: recipe.extendedIngredients || [],
          sourceUrl: recipe.sourceUrl,
          aggregateLikes: recipe.aggregateLikes,
          healthScore: recipe.healthScore,
          pricePerServing: recipe.pricePerServing,
          analyzedInstructions: recipe.analyzedInstructions,
          preparationMinutes: recipe.preparationMinutes,
          cookingMinutes: recipe.cookingMinutes,
        }));
        
        // Filter out any duplicates with main recipes
        const mainRecipeIds = new Set(recipes.map(r => r.id));
        const uniqueFallbacks = transformedRecipes.filter(r => !mainRecipeIds.has(r.id));
        
        console.log(`✅ Loaded ${uniqueFallbacks.length} fallback recipes`);
        setFallbackRecipes(uniqueFallbacks);
      }
    } catch (err) {
      console.error('Fallback recipe loading error:', err);
      // Don't show error for fallback loading
    } finally {
      setLoadingFallback(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadRecipes(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadRecipes("popular recipes");
    }
  }, [searchQuery]);


  const toggleDesktopDietary = (option: string) => {
    const normalized = option.toLowerCase();
    setDesktopDietaryFilters((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((item) => item !== normalized);
      }
      if (normalized === "no restrictions") {
        return [normalized];
      }
      return [...prev.filter((item) => item !== "no restrictions"), normalized];
    });
  };

  const clearDesktopDietary = () => setDesktopDietaryFilters([]);

  const handleDesktopPreferencesSave = async () => {
    if (!user) {
      toast.warning("Sign in to save your preferences");
      return;
    }

    setSavingDesktopPrefs(true);

    try {
      const dietaryPrefs = desktopDietaryFilters.includes("no restrictions")
        ? []
        : desktopDietaryFilters;

      const result = await ProfileService.updateProfile({
        dietary_preferences: dietaryPrefs,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save preferences");
      }

      toast.success("Preferences updated");

      const profileResult = await ProfileService.getProfile();
      if (profileResult.success && profileResult.data) {
        setUserProfile(profileResult.data);
      } else {
        setUserProfile((prev) =>
          prev ? { ...prev, dietary_preferences: dietaryPrefs } : prev
        );
      }

      await loadRecipes(searchQuery.trim() ? searchQuery : "popular recipes");
    } catch (error) {
      console.error("Error saving desktop preferences:", error);
      toast.error("Unable to save preferences");
    } finally {
      setSavingDesktopPrefs(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDiets =
      desktopDietaryFilters.length === 0 ||
      desktopDietaryFilters.some((diet) => recipe.diets.includes(diet));
    return matchesSearch && matchesDiets;
  });

  // Use fallback recipes to supplement main results when sparse
  const filteredFallbackRecipes = fallbackRecipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDiets =
      desktopDietaryFilters.length === 0 ||
      desktopDietaryFilters.some((diet) => recipe.diets.includes(diet));
    return matchesSearch && matchesDiets;
  });

  const recommendedRecipes = filteredRecipes.slice(0, 3);
  const mightLikeRecipes = filteredRecipes.slice(3);
  const similarRecipes = filteredFallbackRecipes; // All fallback recipes go here
  
  // Mix recipes with ads - using useEffect to update when filtered recipes change
  useEffect(() => {
    setMixedRecommended(mixRecipesWithAds(recommendedRecipes, false));
    setMixedMightLike(mixRecipesWithAds(mightLikeRecipes, false));
    setMixedSimilar(mixRecipesWithAds(similarRecipes, false));
  }, [recipes, fallbackRecipes, searchQuery, desktopDietaryFilters]);

  return (
    <div className="flex h-screen overflow-hidden bg-page-profile">
      {/* Full-height Sidebar for desktop - Vibrant Pink Theme */}
      <SidebarPanel
        className="hidden md:flex"
        fullHeight
        themeColor="vibrant-pink"
        action={
          desktopDietaryFilters.length > 0 ? (
            <button
              onClick={clearDesktopDietary}
              className="text-sm font-semibold text-white hover:text-gray-200"
            >
              Clear
            </button>
          ) : undefined
        }
        footer={
          <button
            onClick={handleDesktopPreferencesSave}
            disabled={savingDesktopPrefs}
            className="w-full py-2.5 rounded-lg bg-white text-[#ac0039] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {savingDesktopPrefs ? "Saving..." : "Save Preferences"}
          </button>
        }
      >
        <div className="space-y-2">
          {DIETARY_OPTIONS.map((option) => {
            const normalized = option.toLowerCase();
            const isSelected = desktopDietaryFilters.includes(normalized);
            
            // Color coding for each dietary preference
            const dietaryColors: Record<string, { bg: string; icon: string }> = {
              'vegetarian': { bg: '#10b981', icon: '🥗' },
              'vegan': { bg: '#22c55e', icon: '🌱' },
              'pescetarian': { bg: '#06b6d4', icon: '🐟' },
              'ketogenic': { bg: '#f59e0b', icon: '🥑' },
              'paleo': { bg: '#f97316', icon: '🍖' },
              'gluten-free': { bg: '#eab308', icon: '🌾' },
              'dairy-free': { bg: '#8b5cf6', icon: '🥛' },
              'no restrictions': { bg: '#6b7280', icon: '🍽️' }
            };
            
            const colors = dietaryColors[normalized] || { bg: '#6b7280', icon: '🍽️' };

            return (
              <button
                key={option}
                onClick={() => toggleDesktopDietary(option)}
                className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: isSelected ? colors.bg : `${colors.bg}80`,
                  color: 'white',
                  border: 'none'
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{colors.icon}</span>
                  <span>{option}</span>
                </span>
                {isSelected && <span className="text-xs font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </SidebarPanel>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-6 max-w-[375px] md:max-w-full mx-auto p-4 md:p-6">
          {/* Search Bar */}
          <section className="px-5 md:px-8 lg:px-12 pt-5 md:pt-6 pb-6 md:pb-8">
            <div className="relative md:max-w-2xl lg:max-w-3xl md:mx-auto">
              <Search className="absolute left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search recipes, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 md:h-14 pl-12 md:pl-14 pr-14 md:pr-16 rounded-2xl bg-white text-sm md:text-base text-[#6B7280] placeholder:text-[#9CA3AF] border-0 focus:outline-none focus:ring-2 focus:ring-[#FFC909]/20"
              />
              <button
                onClick={() => setShowFilterDrawer(true)}
                className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-[#FFC909] flex items-center justify-center hover:bg-[#EA580C] transition-colors md:hidden"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </section>

          {/* Active Preferences Display - Mobile */}
          {userProfile?.dietary_preferences && userProfile.dietary_preferences.length > 0 && (
            <section className="px-5 md:px-8 lg:px-12 mb-4 md:hidden">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-orange-700">Active Filters:</span>
                  {userProfile.dietary_preferences.map((pref) => (
                    <span
                      key={pref}
                      className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
                    >
                      {pref.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Loading State */}
          {loading && (
            <div className="px-5 md:px-8 lg:px-12 flex flex-col items-center justify-center py-12 md:py-16">
              <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 md:border-b-3 border-[#FFC909] mb-4"></div>
              <p className="text-[#6B7280] text-sm md:text-base">Loading delicious recipes...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="px-5 md:px-8 lg:px-12 flex flex-col items-center justify-center py-12 md:py-16">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <span className="text-3xl md:text-4xl">😕</span>
              </div>
              <p className="text-red-600 font-bold text-base md:text-lg mb-1">Failed to load recipes</p>
              <p className="text-[#6B7280] text-sm md:text-base mb-4">{error}</p>
              <button
                onClick={() => loadRecipes("popular recipes")}
                className="px-6 md:px-8 py-2 md:py-3 rounded-xl bg-[#FFC909] text-white font-semibold text-sm md:text-base"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredRecipes.length === 0 && !loading && !error && !loadingFallback && (
            <div className="px-5 text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <p className="text-[#6B7280] text-sm mb-2">No recipes found matching your criteria.</p>
              <p className="text-[#9CA3AF] text-xs">Try adjusting your filters or search terms.</p>
            </div>
          )}

          {/* Recommended Recipes */}
          {!loading && !error && recommendedRecipes.length > 0 && (
            <section className="mb-6 md:mb-8">
              <div className="px-5 md:px-8 lg:px-12 mb-3 md:mb-4">
                <SectionHeading>Recommended for You</SectionHeading>
              </div>
              <div className="px-5 md:px-8 lg:px-12">
                <Masonry
                  breakpointCols={{ default: 4, 1400: 4, 1024: 3, 768: 2, 640: 2 }}
                  className="masonry-grid"
                  columnClassName="masonry-grid-column"
                >
                  {mixedRecommended.map((item) => (
                    isAd(item) ? (
                      <AdCard key={item.id} ad={item} />
                    ) : (
                      <RecipeCard
                        key={item.id}
                        recipe={item}
                        onClick={() => handleRecipeClick(item)}
                      />
                    )
                  ))}
                </Masonry>
              </div>
            </section>
          )}

          {/* You Might Like */}
          {!loading && !error && mightLikeRecipes.length > 0 && (
            <section className="mb-6 md:mb-8">
              <div className="px-5 md:px-8 lg:px-12 mb-3 md:mb-4">
                <SectionHeading>You Might Also Like</SectionHeading>
              </div>
              <div className="px-5 md:px-8 lg:px-12">
                <Masonry
                  breakpointCols={{ default: 4, 1400: 4, 1024: 3, 768: 2, 640: 2 }}
                  className="masonry-grid"
                  columnClassName="masonry-grid-column"
                >
                  {mixedMightLike.map((item) => (
                    isAd(item) ? (
                      <AdCard key={item.id} ad={item} />
                    ) : (
                      <RecipeCard
                        key={item.id}
                        recipe={item}
                        onClick={() => handleRecipeClick(item)}
                      />
                    )
                  ))}
                </Masonry>
              </div>
            </section>
          )}

          {/* Similar Recipes (Fallback content with relaxed filters) */}
          {!loading && !error && mixedSimilar.length > 0 && (
            <section className="mb-6 md:mb-8">
              <div className="px-5 md:px-8 lg:px-12 mb-3 md:mb-4">
                <SectionHeading>
                  More Options for You
                  {loadingFallback && (
                    <span className="ml-2 text-xs text-gray-500">Loading...</span>
                  )}
                </SectionHeading>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  These recipes match most of your preferences
                </p>
              </div>
              <div className="px-5 md:px-8 lg:px-12">
                <Masonry
                  breakpointCols={{ default: 4, 1400: 4, 1024: 3, 768: 2, 640: 2 }}
                  className="masonry-grid"
                  columnClassName="masonry-grid-column"
                >
                  {mixedSimilar.map((item) => (
                    isAd(item) ? (
                      <AdCard key={item.id} ad={item} />
                    ) : (
                      <RecipeCard
                        key={item.id}
                        recipe={item}
                        onClick={() => handleRecipeClick(item)}
                      />
                    )
                  ))}
                </Masonry>
              </div>
            </section>
          )}

          {/* Page Endpoint Banners (Desktop only) */}
          <div className="hidden md:block mt-10 px-8">
            <div className="max-w-3xl mx-auto space-y-4">
              <img src="/banners/fb_03.png" alt="Bites banner 1" className="max-w-full h-auto rounded-md shadow-sm" />
              <img src="/banners/fb_04.png" alt="Bites banner 2" className="max-w-full h-auto rounded-md shadow-sm" />
              <img src="/banners/fb_05.png" alt="Bites banner 3" className="max-w-full h-auto rounded-md shadow-sm" />
            </div>
          </div>
        </main>

      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Preferences Filter Drawer */}
      <PreferencesFilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        userProfile={userProfile}
        onPreferencesUpdated={async () => {
          // Reload profile and recipes
          if (user) {
            const profileResult = await ProfileService.getProfile();
            if (profileResult.success && profileResult.data) {
              setUserProfile(profileResult.data);
            }
            loadRecipes(searchQuery || "popular recipes");
          }
        }}
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
