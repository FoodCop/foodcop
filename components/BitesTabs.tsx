"use client";

import { useState } from "react";
import { Search, ArrowLeft, Filter, Plus } from "lucide-react";

const DIET_TYPES = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescetarian", label: "Pescetarian" },
  { id: "ketogenic", label: "Ketogenic" },
  { id: "paleo", label: "Paleo" },
  { id: "primal", label: "Primal" },
  { id: "gluten free", label: "Gluten Free" }
];

interface BitesTabsProps {
  // Remove navigation props since we'll handle them internally
}

export function BitesTabs({}: BitesTabsProps = {}) {
  const [activeTab, setActiveTab] = useState<"recipes" | "videos">("recipes");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [lastSearchMethod, setLastSearchMethod] = useState<string>("");
  
  // Save-to-plate state
  const [savingRecipeIds, setSavingRecipeIds] = useState<Set<number>>(new Set());
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<number>>(new Set());
  const [saveMessages, setSaveMessages] = useState<{ [key: number]: string }>({});

  const handleDietToggle = (dietId: string) => {
    setSelectedDiets(prev => {
      if (prev.includes(dietId)) {
        return prev.filter(d => d !== dietId);
      } else {
        return [...prev, dietId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedDiets(selectedDiets.length === DIET_TYPES.length ? [] : DIET_TYPES.map(d => d.id));
  };

  // Save recipe to plate function
  const saveRecipeToPlate = async (recipe: any) => {
    const recipeId = recipe.id;
    
    try {
      setSavingRecipeIds(prev => new Set([...prev, recipeId]));
      setSaveMessages(prev => ({ ...prev, [recipeId]: '' }));
      
      const recipeMetadata = {
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        diets: recipe.diets || [],
        healthScore: recipe.healthScore,
        summary: recipe.summary ? recipe.summary.replace(/<[^>]*>/g, '').substring(0, 300) : null,
        sourceUrl: recipe.sourceUrl,
        spoonacularSourceUrl: recipe.spoonacularSourceUrl,
        savedFrom: 'BitesTabs',
        savedMethod: lastSearchMethod
      };

      const response = await fetch('/api/save-to-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: recipeId.toString(),
          itemType: 'recipe',
          metadata: recipeMetadata
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSavedRecipeIds(prev => new Set([...prev, recipeId]));
        setSaveMessages(prev => ({ 
          ...prev, 
          [recipeId]: `✅ Saved to plate successfully!` 
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveMessages(prev => ({ ...prev, [recipeId]: '' }));
        }, 3000);
      } else {
        setSaveMessages(prev => ({ 
          ...prev, 
          [recipeId]: `❌ Error: ${result.error}` 
        }));
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setSaveMessages(prev => ({ ...prev, [recipeId]: '' }));
        }, 5000);
      }
    } catch (error) {
      console.error('Error saving recipe to plate:', error);
      setSaveMessages(prev => ({ 
        ...prev, 
        [recipeId]: `❌ Error: Failed to save recipe` 
      }));
      
      setTimeout(() => {
        setSaveMessages(prev => ({ ...prev, [recipeId]: '' }));
      }, 5000);
    } finally {
      setSavingRecipeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipeId);
        return newSet;
      });
    }
  };

  const searchRecipes = async () => {
    if (!searchQuery.trim()) {
      setRecipeError("Please enter a search query");
      return;
    }

    setRecipeLoading(true);
    setRecipeError('');
    setRecipeResults([]);
    
    try {
      const queryParams = new URLSearchParams({
        query: searchQuery.trim(),
        number: '15',
        addRecipeInformation: 'true',
        fillIngredients: 'true',
        enhanced: 'true',
        sort: 'meta-score'
      });

      if (selectedDiets.length > 0) {
        queryParams.append('diet', selectedDiets.join(','));
      }

      queryParams.append('maxReadyTime', '45');
      queryParams.append('instructionsRequired', 'true');
      queryParams.append('ranking', '2');
      queryParams.append('addRecipeNutrition', 'true');

      const response = await fetch(`/api/debug/bites-recipe-search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.results) {
        setRecipeResults(data.data.results);
        const dietInfo = selectedDiets.length > 0 ? ` + diets: ${selectedDiets.join(', ')}` : '';
        setLastSearchMethod(`Search: "${searchQuery}"${dietInfo} (${data.data.results.length} of ${data.data.totalResults} results)`);
      } else {
        throw new Error(data.error || 'No results returned from API');
      }
    } catch (error) {
      console.error('Recipe search error:', error);
      setRecipeError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchRecipes();
    }
  };

  const clearResults = () => {
    setRecipeResults([]);
    setRecipeError('');
    setLastSearchMethod('');
    setSavingRecipeIds(new Set());
    setSavedRecipeIds(new Set());
    setSaveMessages({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Bites</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes, cuisines, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchQuery.trim() && (
            <div className="mt-2">
              <button
                onClick={searchRecipes}
                disabled={recipeLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 mr-2"
              >
                {recipeLoading ? "Searching..." : "Search"}
              </button>
              {recipeResults.length > 0 && (
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Results
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("recipes")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "recipes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Static Recipes
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "videos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Videos (Coming Soon)
            </button>
          </div>
        </div>

        {/* Diet Filters (collapsible) */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Diet Filters ({selectedDiets.length} selected)</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  {selectedDiets.length === DIET_TYPES.length ? "Clear All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {DIET_TYPES.map(diet => (
                  <label key={diet.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDiets.includes(diet.id)}
                      onChange={() => handleDietToggle(diet.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{diet.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === "videos" ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Video Feed Coming Soon
            </h3>
            <p className="text-gray-600">
              Cooking videos and tutorials will be available here soon!
            </p>
          </div>
        ) : (
          <>
            {/* Error Display */}
            {recipeError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {recipeError}
                </p>
              </div>
            )}

            {/* Search Results */}
            {recipeResults.length > 0 ? (
              <div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Results:</strong> {lastSearchMethod}
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recipeResults.map((recipe) => (
                    <div key={recipe.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Recipe Image */}
                      {recipe.image && (
                        <div 
                          className="h-48 bg-gray-200 bg-cover bg-center"
                          style={{ backgroundImage: `url(${recipe.image})` }}
                        />
                      )}
                      
                      {/* Recipe Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {recipe.title}
                        </h3>
                        
                        {/* Recipe Meta */}
                        <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            🕒 {recipe.readyInMinutes} min
                          </span>
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            👥 {recipe.servings} servings
                          </span>
                          {recipe.healthScore && (
                            <span className="bg-green-100 px-2 py-1 rounded text-green-700">
                              ❤️ {recipe.healthScore}
                            </span>
                          )}
                        </div>

                        {/* Diet Tags */}
                        {recipe.diets && recipe.diets.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {recipe.diets.slice(0, 3).map((diet: string, index: number) => (
                                <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {diet}
                                </span>
                              ))}
                              {recipe.diets.length > 3 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  +{recipe.diets.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recipe Summary */}
                        {recipe.summary && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {recipe.summary.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>
                        )}

                        {/* Save feedback message */}
                        {saveMessages[recipe.id] && (
                          <div className={`mb-3 p-2 text-xs rounded ${
                            saveMessages[recipe.id].includes('✅') 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {saveMessages[recipe.id]}
                          </div>
                        )}

                        {/* Save Button */}
                        <button
                          onClick={() => saveRecipeToPlate(recipe)}
                          disabled={savingRecipeIds.has(recipe.id) || savedRecipeIds.has(recipe.id)}
                          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            savedRecipeIds.has(recipe.id)
                              ? 'bg-green-500 text-white cursor-not-allowed'
                              : savingRecipeIds.has(recipe.id)
                              ? 'bg-blue-300 text-white cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {savingRecipeIds.has(recipe.id) ? (
                            <>⏳ Saving...</>
                          ) : savedRecipeIds.has(recipe.id) ? (
                            <>✅ Saved to Plate</>
                          ) : (
                            <>💾 Save to Plate</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Summary */}
                {savedRecipeIds.size > 0 && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      <strong>✅ {savedRecipeIds.size} recipe{savedRecipeIds.size === 1 ? '' : 's'} saved to your plate!</strong>
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Check the Plate page to see your saved recipes.
                    </p>
                  </div>
                )}
              </div>
            ) : !recipeLoading && !recipeError && searchQuery.trim() ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recipes found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or diet filters.
                </p>
              </div>
            ) : !searchQuery.trim() ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Search for Recipes
                </h3>
                <p className="text-gray-600">
                  Enter a search term above to find delicious recipes!
                </p>
              </div>
            ) : null}

            {/* Loading State */}
            {recipeLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching for recipes...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}