import { useState, useEffect } from "react";
import { Bell, Heart, Clock, Users, Shuffle, Search, SlidersHorizontal, Star } from "lucide-react";
import type { Recipe } from "./components/RecipeCard";
import { RecipeDetailDialog } from "./components/RecipeDetailDialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SpoonacularService } from "../../services/spoonacular";
import { useAuth } from "../auth/AuthProvider";

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
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes("popular recipes");
  }, []);

  const loadRecipes = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await SpoonacularService.searchRecipes(query, 12);
      
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
        
        setRecipes(transformedRecipes);
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

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  const handleRandomize = () => {
    const shuffled = [...recipes].sort(() => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return (array[0] / 0xFFFFFFFF) - 0.5;
    });
    setRecipes(shuffled);
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
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

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user?.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-[375px] md:max-w-full lg:max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 md:px-8 lg:px-12 py-4 md:py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] shadow-lg flex items-center justify-center">
            <svg className="w-4 h-4.5 text-white" viewBox="0 0 16 18" fill="currentColor">
              <path d="M14.625 0C14.0625 0 10.125 1.125 10.125 6.1875V10.125C10.125 11.366 11.134 12.375 12.375 12.375H13.5V16.875C13.5 17.4973 14.0027 18 14.625 18C15.2473 18 15.75 17.4973 15.75 16.875V12.375V8.4375V1.125C15.75 0.502734 15.2473 0 14.625 0ZM2.25 0.5625C2.25 0.274219 2.03555 0.0351562 1.74727 0.00351563C1.45898 -0.028125 1.20234 0.161719 1.13906 0.439453L0.0738281 5.23125C0.0246094 5.45273 0 5.67773 0 5.90273C0 7.51641 1.23398 8.8418 2.8125 8.98594V16.875C2.8125 17.4973 3.31523 18 3.9375 18C4.55977 18 5.0625 17.4973 5.0625 16.875V8.98594C6.64102 8.8418 7.875 7.51641 7.875 5.90273C7.875 5.67773 7.85039 5.45273 7.80117 5.23125L6.73594 0.439453C6.67266 0.158203 6.40898 -0.028125 6.12422 0.00351563C5.83945 0.0351562 5.625 0.274219 5.625 0.5625V5.28047C5.625 5.47031 5.47031 5.625 5.28047 5.625C5.10117 5.625 4.95352 5.48789 4.93594 5.30859L4.49648 0.513281C4.47188 0.221484 4.2293 0 3.9375 0C3.6457 0 3.40313 0.221484 3.37852 0.513281L2.94258 5.30859C2.925 5.48789 2.77734 5.625 2.59805 5.625C2.4082 5.625 2.25352 5.47031 2.25352 5.28047V0.5625H2.25Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[#1A1A1A] font-bold text-lg leading-[18px] font-[Poppins]">Bites</h1>
            <p className="text-[#6B7280] text-xs leading-4 font-[Inter]">Recipe Discovery</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1">
            <Bell className="w-4.5 h-5 text-[#374151]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-94"></span>
          </button>
          <Avatar className="w-9 h-9 rounded-full shadow-[0_0_0_0_#FF6B35,0_0_0_0_#FFF]">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white text-sm">
              {getUserDisplayName()[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-6">
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
            <button className="absolute right-2 top-2 md:top-3 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </button>
          </div>
        </section>

        {/* Diet Categories */}
        <section className="mb-6 md:mb-8">
          <div className="px-5 md:px-8 lg:px-12 mb-3 md:mb-4">
            <h2 className="text-[#1A1A1A] font-bold text-base md:text-lg leading-6 font-[Poppins]">Browse by Diet</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto md:overflow-x-visible md:flex-wrap pl-5 md:px-8 lg:px-12 pb-2 md:pb-0 hide-scrollbar md:show-scrollbar">
            {dietCategories.map((diet) => (
              <button
                key={diet.id}
                onClick={() => handleDietToggle(diet.id)}
                className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-2xl min-w-[80px] md:min-w-[110px] transition-all ${
                  selectedDiets.includes(diet.id)
                    ? 'bg-[#FF6B35] shadow-lg'
                    : 'bg-[#F3F4F6]'
                }`}
              >
                <span className="text-2xl md:text-3xl">{diet.emoji}</span>
                <span className={`text-xs md:text-sm font-semibold font-[Inter] ${
                  selectedDiets.includes(diet.id) ? 'text-white' : 'text-[#1A1A1A]'
                }`}>
                  {diet.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Randomize Button */}
        <section className="px-5 md:px-8 lg:px-12 pb-6 md:pb-8">
          <button
            onClick={handleRandomize}
            disabled={loading}
            className="w-full md:max-w-md md:mx-auto h-12 md:h-14 rounded-2xl bg-white border-2 border-[#FF6B35] text-[#FF6B35] font-bold text-sm md:text-base font-[Poppins] flex items-center justify-center gap-2 hover:bg-[#FF6B35] hover:text-white transition-all disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
            Shuffle Recipes
          </button>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="px-5 md:px-8 lg:px-12 flex flex-col items-center justify-center py-12 md:py-16">
            <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 md:border-b-3 border-[#FF6B35] mb-4"></div>
            <p className="text-[#6B7280] text-sm md:text-base font-[Inter]">Loading delicious recipes...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="px-5 md:px-8 lg:px-12 flex flex-col items-center justify-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <span className="text-3xl md:text-4xl">😕</span>
            </div>
            <p className="text-red-600 font-bold text-base md:text-lg mb-1 font-[Poppins]">Failed to load recipes</p>
            <p className="text-[#6B7280] text-sm md:text-base mb-4 font-[Inter]">{error}</p>
            <button
              onClick={() => loadRecipes("popular recipes")}
              className="px-6 md:px-8 py-2 md:py-3 rounded-xl bg-[#FF6B35] text-white font-semibold text-sm md:text-base font-[Inter]"
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
            <p className="text-[#6B7280] text-sm font-[Inter]">No recipes found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Recommended Recipes */}
        {!loading && !error && recommendedRecipes.length > 0 && (
          <section className="mb-6 md:mb-8">
            <div className="px-5 md:px-8 lg:px-12 flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-[#1A1A1A] font-bold text-base md:text-lg leading-6 font-[Poppins]">Recommended for You</h2>
              <button className="text-[#FF6B35] text-sm md:text-base font-semibold font-[Inter]">See All</button>
            </div>
            <div className="px-5 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {recommendedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className="absolute top-2 md:top-3 right-2 md:right-3 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                          favorites.includes(recipe.id)
                            ? 'text-[#FF6B35] fill-[#FF6B35]'
                            : 'text-[#374151]'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="text-[#1A1A1A] font-bold text-sm md:text-base leading-5 md:leading-6 mb-2 font-[Poppins] line-clamp-2">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center justify-between text-[#6B7280] text-xs md:text-sm font-[Inter]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{recipe.readyInMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{recipe.servings}</span>
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
            <div className="px-5 md:px-8 lg:px-12 flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-[#1A1A1A] font-bold text-base md:text-lg leading-6 font-[Poppins]">You Might Also Like</h2>
              <button className="text-[#FF6B35] text-sm md:text-base font-semibold font-[Inter]">See All</button>
            </div>
            <div className="px-5 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {mightLikeRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className="absolute top-2 md:top-3 right-2 md:right-3 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                          favorites.includes(recipe.id)
                            ? 'text-[#FF6B35] fill-[#FF6B35]'
                            : 'text-[#374151]'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="text-[#1A1A1A] font-bold text-sm md:text-base leading-5 mb-2 font-[Poppins] line-clamp-2">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center justify-between text-[#6B7280] text-xs md:text-sm font-[Inter]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{recipe.readyInMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{recipe.servings}</span>
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
