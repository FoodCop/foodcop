import { useState, useEffect } from "react";
import { Clock, Shuffle, Search, SlidersHorizontal, Star } from "lucide-react";
import type { Recipe } from "./components/RecipeCard";
import { RecipeDetailDialog } from "./components/RecipeDetailDialog";
import { SpoonacularService } from "../../services/spoonacular";
import { useAuth } from "../auth/AuthProvider";
import { SectionHeading } from "../ui/section-heading";
import { CardHeading } from "../ui/card-heading";
import { ProfileService } from "../../services/profileService";
import { PreferencesFilterDrawer } from "../common/PreferencesFilterDrawer";
import type { UserProfile } from "../../types/profile";
import { toast } from "sonner";
import { DIETARY_OPTIONS } from "../../types/onboarding";
import { SidebarPanel, SidebarSection } from "../common/SidebarPanel";

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

export default function BitesNew() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
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

      // Build search params
      const searchParams: Parameters<typeof SpoonacularService.searchRecipes>[0] = {
        query,
        number: 12
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

  const handleDietToggle = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

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

  const handleRandomize = async () => {
    const { shuffleArray } = await import('../../utils/preferenceMapper');
    const shuffled = shuffleArray([...recipes]);
    setRecipes(shuffled);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDiets =
      selectedDiets.length === 0 ||
      selectedDiets.some((diet) => recipe.diets.includes(diet));
    return matchesSearch && matchesDiets;
  });

  const recommendedRecipes = filteredRecipes.slice(0, 3);
  const mightLikeRecipes = filteredRecipes.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Full-height Sidebar for desktop */}
      <SidebarPanel
        className="hidden md:flex"
        fullHeight
        eyebrow="Customize"
        title="Filters"
        action={
          desktopDietaryFilters.length > 0 ? (
            <button
              onClick={clearDesktopDietary}
              className="text-sm font-semibold text-[#f59e0b] hover:text-[#d97706]"
            >
              Clear All
            </button>
          ) : undefined
        }
        footer={
          <button
            onClick={handleDesktopPreferencesSave}
            disabled={savingDesktopPrefs}
            className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {savingDesktopPrefs ? "Saving..." : "Save Preferences"}
          </button>
        }
      >
        <SidebarSection
          title="Dietary Preferences"
          description="Select your dietary preferences to filter recipes."
        >
          <div className="space-y-2">
            {DIETARY_OPTIONS.map((option) => {
              const normalized = option.toLowerCase();
              const isSelected = desktopDietaryFilters.includes(normalized);

              return (
                <button
                  key={option}
                  onClick={() => toggleDesktopDietary(option)}
                  className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between text-sm transition-colors ${
                    isSelected
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-orange-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-seedling text-orange-500" />
                    {option}
                  </span>
                  {isSelected && <span className="text-xs font-medium">✓</span>}
                </button>
              );
            })}
          </div>
        </SidebarSection>

        {desktopDietaryFilters.length > 0 && (
          <SidebarSection title="Active Filters">
            <div className="flex flex-wrap gap-2">
              {desktopDietaryFilters.map((pref) => (
                <span
                  key={pref}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium"
                >
                  {pref.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </span>
              ))}
            </div>
          </SidebarSection>
        )}
      </SidebarPanel>

      {/* Main Content */}
      <main className="flex-1 pb-6 max-w-[375px] md:max-w-full mx-auto p-4 md:p-6">
          {/* Search Bar */}
          <section className="px-5 md:px-8 lg:px-12 pt-5 md:pt-6 pb-6 md:pb-8">
            <div className="relative md:max-w-2xl lg:max-w-3xl md:mx-auto">
              <Search className="absolute left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search recipes, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 md:h-14 pl-12 md:pl-14 pr-14 md:pr-16 rounded-2xl bg-[#F3F4F6] text-sm md:text-base text-[#1A1A1A] placeholder:text-[#ADAEBC] border-0 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <button
                onClick={() => setShowFilterDrawer(true)}
                className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center hover:bg-[#EA580C] transition-colors md:hidden"
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

          {/* Diet Categories */}
          {/* Randomize Button */}
          <section className="px-5 md:px-8 lg:px-12 pb-6 md:pb-8">
            <button
              onClick={handleRandomize}
              disabled={loading}
              className="w-full md:max-w-md md:mx-auto h-12 md:h-14 rounded-2xl bg-white border-2 border-[#FF6B35] text-[#FF6B35] font-bold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-[#FF6B35] hover:text-white transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
              Shuffle Recipes
            </button>
          </section>

          {/* Loading State */}
          {loading && (
            <div className="px-5 md:px-8 lg:px-12 flex flex-col items-center justify-center py-12 md:py-16">
              <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 md:border-b-3 border-[#FF6B35] mb-4"></div>
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
                className="px-6 md:px-8 py-2 md:py-3 rounded-xl bg-[#FF6B35] text-white font-semibold text-sm md:text-base"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredRecipes.length === 0 && !loading && !error && (
            <div className="px-5 text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <p className="text-[#6B7280] text-sm">No recipes found. Try adjusting your filters.</p>
            </div>
          )}

          {/* Recommended Recipes */}
          {!loading && !error && recommendedRecipes.length > 0 && (
            <section className="mb-6 md:mb-8">
              <div className="px-5 md:px-8 lg:px-12 mb-3 md:mb-4">
                <SectionHeading>Recommended for You</SectionHeading>
              </div>
              <div className="px-5 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {recommendedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe)}
                    className="bg-white rounded-2xl shadow-[_-2px_4px_12px_4px_rgba(51,51,51,0.05)] overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="relative h-32 md:h-40 lg:h-48">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                      {recipe.healthScore && recipe.healthScore > 70 && (
                        <div className="absolute top-2 md:top-3 left-2 md:left-3 flex items-center gap-1 px-2 md:px-3 py-1 rounded-full bg-green-500 text-white">
                          <Star className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="text-xs md:text-sm font-bold">Healthy</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <CardHeading variant="accent" size="sm" lineClamp={2} className="mb-2">
                        {recipe.title}
                      </CardHeading>
                      <div className="flex items-center text-[#6B7280] text-xs md:text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{recipe.readyInMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* You Might Like */}
          {!loading && !error && mightLikeRecipes.length > 0 && (
            <section className="mb-6 md:mb-8">
              <div className="px-5 md:px-8 lg:px-12 mb-3 md:mb-4">
                <SectionHeading>You Might Also Like</SectionHeading>
              </div>
              <div className="px-5 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {mightLikeRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe)}
                    className="bg-white rounded-2xl shadow-[_-2px_4px_12px_4px_rgba(51,51,51,0.05)] overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="relative h-32 md:h-40 lg:h-48">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                      {recipe.healthScore && recipe.healthScore > 70 && (
                        <div className="absolute top-2 md:top-3 left-2 md:left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white">
                          <Star className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="text-xs md:text-sm font-bold">Healthy</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <CardHeading variant="accent" size="sm" lineClamp={2} className="mb-2">
                        {recipe.title}
                      </CardHeading>
                      <div className="flex items-center text-[#6B7280] text-xs md:text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{recipe.readyInMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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
