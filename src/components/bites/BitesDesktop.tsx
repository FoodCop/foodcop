import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Star, 
  Share2, 
  Bookmark,
  ChevronDown
} from 'lucide-react';
import { SpoonacularService } from '../../services/spoonacular';
import type { Recipe } from './components/RecipeCard';
import { RecipeModal } from './components/RecipeModal';
import { toast } from 'sonner';
import { savedItemsService } from '../../services/savedItemsService';
import { useAuth } from '../auth/AuthProvider';

type FilterType = 'All' | 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Keto' | 'Low Carb';

const BitesDesktop: React.FC = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load initial recipes
  useEffect(() => {
    loadRecommendedRecipes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecommendedRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await SpoonacularService.searchRecipes({
        query: 'popular',
        number: 12
      });
      if (results.success && results.data?.results) {
        setRecommendedRecipes(results.data.results.slice(0, 6));
        setRecipes(results.data.results);
      }
    } catch (err) {
      setError('Failed to load recipes');
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const dietMap: Record<FilterType, string | undefined> = {
        'All': undefined,
        'Vegetarian': 'vegetarian',
        'Vegan': 'vegan',
        'Gluten-Free': 'gluten free',
        'Keto': 'ketogenic',
        'Low Carb': 'primal'
      };

      const results = await SpoonacularService.searchRecipes({
        query: '',
        diet: dietMap[selectedFilter],
        number: 12
      });
      if (results.success && results.data?.results) {
        setRecipes(results.data.results);
      }
    } catch (err) {
      setError('Failed to load filtered recipes');
      console.error('Error loading filtered recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load recipes when filter changes
  useEffect(() => {
    if (searchQuery.trim()) {
      // If there's a search query, apply filter to search
      handleSearch(new Event('submit') as any);
    } else if (selectedFilter === 'All') {
      loadRecommendedRecipes();
    } else {
      loadFilteredRecipes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!searchQuery.trim()) {
      // If search is cleared, reload based on filter
      if (selectedFilter === 'All') {
        loadRecommendedRecipes();
      } else {
        loadFilteredRecipes();
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dietMap: Record<FilterType, string | undefined> = {
        'All': undefined,
        'Vegetarian': 'vegetarian',
        'Vegan': 'vegan',
        'Gluten-Free': 'gluten free',
        'Keto': 'ketogenic',
        'Low Carb': 'primal'
      };

      const results = await SpoonacularService.searchRecipes({
        query: searchQuery,
        diet: dietMap[selectedFilter],
        number: 12
      });
      if (results.success && results.data?.results) {
        setRecipes(results.data.results);
      }
    } catch (err) {
      setError('Failed to search recipes');
      console.error('Error searching recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalOpen(true);
  };

  const handleSaveRecipe = async (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save recipes');
      return;
    }

    try {
      await savedItemsService.saveItem({
        itemId: `spoonacular_${recipe.id}`,
        itemType: 'recipe',
        metadata: {
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
          healthScore: recipe.healthScore,
          cuisines: recipe.cuisines,
          diets: recipe.diets
        }
      });
      toast.success('Recipe saved to Plate!');
    } catch (err) {
      toast.error('Failed to save recipe');
      console.error('Error saving recipe:', err);
    }
  };

  const handleShareRecipe = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success('Share feature coming soon!');
  };

  const filterButtons: FilterType[] = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Low Carb'];

  return (
    <div 
      className="min-h-screen bg-background bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/bg.svg)',
      }}
    >
      {/* Filter Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {filterButtons.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-5 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                    selectedFilter === filter
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-white border-border text-foreground hover:border-primary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button className="px-5 py-2 rounded-full border-2 border-border text-sm font-medium text-foreground hover:border-primary transition-all flex items-center gap-2">
              More Filters
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Bar */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border bg-white text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={loadRecommendedRecipes}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* Recommended Section */}
        {!loading && !error && recommendedRecipes.length > 0 && selectedFilter === 'All' && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recommended For You</h2>
              <button className="text-primary font-medium hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe)}
                  onSave={(e) => handleSaveRecipe(recipe, e)}
                  onShare={(e) => handleShareRecipe(recipe, e)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Recipes Grid */}
        {!loading && !error && recipes.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {selectedFilter === 'All' ? 'All Recipes' : `${selectedFilter} Recipes`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe)}
                  onSave={(e) => handleSaveRecipe(recipe, e)}
                  onShare={(e) => handleShareRecipe(recipe, e)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No recipes found</p>
          </div>
        )}
      </main>

      {/* Recipe Modal */}
      {modalOpen && selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => {
            setModalOpen(false);
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
};

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onSave: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onSave, onShare }) => {
  const rating = recipe.healthScore ? recipe.healthScore / 20 : 0;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all cursor-pointer group text-left w-full">
      {/* Image */}
      <div 
        onClick={onClick}
        className="relative h-56 overflow-hidden cursor-pointer"
      >
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Diet Tags */}
        {recipe.diets && recipe.diets.length > 0 && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-primary/20 backdrop-blur-sm text-primary text-xs font-medium rounded-full border border-primary/30">
              {recipe.diets[0]}
            </span>
          </div>
        )}
        {/* Time Badge */}
        {Boolean(recipe.readyInMinutes) && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
              <Clock className="w-3 h-3 text-foreground" />
              <span className="text-xs font-medium text-foreground">{recipe.readyInMinutes} min</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div 
          onClick={onClick}
          className="cursor-pointer"
        >
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">{recipe.title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {recipe.summary?.replaceAll(/<[^>]*>/g, '') || 'Delicious recipe to try'}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={`star-${recipe.id}-${i}`}
                className={`w-4 h-4 ${
                  i < Math.round(rating)
                    ? 'fill-primary text-primary'
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              ({rating.toFixed(1)})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>
          <button
            onClick={onSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-sm font-medium">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitesDesktop;
