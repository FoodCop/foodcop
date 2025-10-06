"use client";

import { useState, useEffect } from "react";
import { Search, ArrowLeft, Filter, Plus, User, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const DIET_TYPES = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescetarian", label: "Pescetarian" }, // Fixed spelling
  { id: "ketogenic", label: "Ketogenic" },
  { id: "paleo", label: "Paleo" },
  { id: "primal", label: "Primal" },
  { id: "gluten free", label: "Gluten Free" },
  { id: "whole30", label: "Whole30" },
  { id: "low fodmap", label: "Low FODMAP" }
];

// Map user dietary preferences to search API format (based on official Spoonacular docs)
const mapUserPreferencesToDiets = (userPreferences: string[]) => {
  const mapping: { [key: string]: string } = {
    "Pescatarian": "pescetarian", // Fixed spelling
    "Pescetarian": "pescetarian", // Fixed spelling  
    "Gluten-Free": "gluten free",
    "Paleo": "paleo",
    "Low-Carb": "ketogenic", // Low-carb maps to ketogenic
    "Vegetarian": "vegetarian",
    "Vegan": "vegan",
    "Primal": "primal",
    "Whole30": "whole30"
  };
  
  return userPreferences
    .map(pref => mapping[pref])
    .filter(Boolean); // Remove any undefined mappings
};

// Generate smart search queries based on user preferences with ingredient focus
const generatePersonalizedSearchQueries = (userPreferences: string[]) => {
  const searchStrategies = [];
  
  // Pescetarian-focused searches (fish/seafood heavy)
  if (userPreferences.includes("Pescatarian")) {
    searchStrategies.push(
      "salmon",
      "tuna", 
      "shrimp",
      "cod",
      "fish tacos",
      "seafood pasta",
      "grilled fish",
      "fish curry",
      "crab cakes",
      "fish and vegetables"
    );
  }
  
  // Gluten-free focused searches
  if (userPreferences.includes("Gluten-Free")) {
    searchStrategies.push(
      "rice bowls",
      "quinoa salad",
      "corn tortilla",
      "potato dishes",
      "rice noodles"
    );
  }
  
  // Paleo focused searches
  if (userPreferences.includes("Paleo")) {
    searchStrategies.push(
      "grilled meat",
      "roasted vegetables",
      "avocado salad",
      "coconut",
      "sweet potato"
    );
  }
  
  // Low-carb/Keto focused searches
  if (userPreferences.includes("Low-Carb")) {
    searchStrategies.push(
      "cauliflower",
      "zucchini noodles",
      "egg dishes",
      "cheese recipes",
      "lettuce wraps"
    );
  }
  
  // Vegetarian searches
  if (userPreferences.includes("Vegetarian")) {
    searchStrategies.push(
      "vegetable curry",
      "bean dishes",
      "tofu recipes",
      "pasta primavera",
      "veggie burgers"
    );
  }
  
  // Vegan searches
  if (userPreferences.includes("Vegan")) {
    searchStrategies.push(
      "plant based",
      "chickpea recipes",
      "lentil curry",
      "vegan protein",
      "cashew cream"
    );
  }
  
  // Add general healthy combinations
  searchStrategies.push(
    "healthy protein",
    "fresh vegetables",
    "nutritious meals",
    "balanced diet",
    "whole foods"
  );
  
  return searchStrategies;
};

// Generate ingredient inclusions and exclusions based on preferences
const generateIngredientFilters = (userPreferences: string[]) => {
  const includeIngredients = [];
  const excludeIngredients = [];
  
  if (userPreferences.includes("Pescatarian")) {
    includeIngredients.push("fish", "salmon", "tuna", "shrimp", "cod", "crab", "lobster", "mussels");
    excludeIngredients.push("beef", "pork", "chicken", "turkey", "lamb", "bacon", "ham");
  }
  
  if (userPreferences.includes("Gluten-Free")) {
    includeIngredients.push("rice", "quinoa", "corn", "potatoes", "gluten-free flour");
    excludeIngredients.push("wheat", "barley", "rye", "bread", "pasta", "flour", "soy sauce");
  }
  
  if (userPreferences.includes("Paleo")) {
    includeIngredients.push("vegetables", "meat", "fish", "eggs", "nuts", "seeds", "coconut oil");
    excludeIngredients.push("grains", "legumes", "dairy", "sugar", "processed foods");
  }
  
  if (userPreferences.includes("Low-Carb")) {
    includeIngredients.push("protein", "vegetables", "cheese", "eggs", "avocado", "olive oil");
    excludeIngredients.push("bread", "pasta", "rice", "potatoes", "sugar", "fruits");
  }
  
  if (userPreferences.includes("Vegetarian")) {
    includeIngredients.push("vegetables", "beans", "lentils", "tofu", "cheese", "eggs");
    excludeIngredients.push("meat", "fish", "seafood", "chicken", "beef", "pork");
  }
  
  if (userPreferences.includes("Vegan")) {
    includeIngredients.push("vegetables", "legumes", "nuts", "seeds", "plant milk", "tofu");
    excludeIngredients.push("meat", "fish", "dairy", "eggs", "honey", "cheese", "milk");
  }
  
  return {
    include: [...new Set(includeIngredients)], // Remove duplicates
    exclude: [...new Set(excludeIngredients)]
  };
};

// Generate multiple search configurations with different diet combinations and ingredient filtering
const generateFlexibleSearchConfigs = (userPreferences: string[]) => {
  const mappedDiets = mapUserPreferencesToDiets(userPreferences);
  const searchQueries = generatePersonalizedSearchQueries(userPreferences);
  const ingredientFilters = generateIngredientFilters(userPreferences);
  const configs = [];
  
  // Config 1: Strict diet filters + ingredient inclusions (most restrictive)
  if (mappedDiets.length > 0) {
    configs.push({
      diets: mappedDiets,
      searchTerms: searchQueries.slice(0, 5), // Use first 5 specific terms
      includeIngredients: ingredientFilters.include.slice(0, 3), // Top 3 include ingredients
      excludeIngredients: ingredientFilters.exclude.slice(0, 3), // Top 3 exclude ingredients
      label: "Perfect Match",
      priority: 1
    });
  }
  
  // Config 2: Primary dietary restrictions only (medium restrictive)
  const primaryDiets = mappedDiets.filter(diet => 
    ['gluten free', 'vegan', 'vegetarian', 'pescetarian'].includes(diet)
  );
  if (primaryDiets.length > 0) {
    configs.push({
      diets: primaryDiets,
      searchTerms: searchQueries.slice(2, 8), // Different search terms
      includeIngredients: ingredientFilters.include.slice(0, 2),
      excludeIngredients: ingredientFilters.exclude.slice(0, 2),
      label: "Dietary Compatible",
      priority: 2
    });
  }
  
  // Config 3: Ingredient-focused search without strict diet filters (flexible)
  configs.push({
    diets: [],
    searchTerms: searchQueries.slice(5, 10),
    includeIngredients: ingredientFilters.include.slice(0, 4),
    excludeIngredients: [], // No exclusions for flexibility
    label: "Ingredient Match",
    priority: 3
  });
  
  // Config 4: General search terms only (most flexible)
  configs.push({
    diets: [],
    searchTerms: ["healthy recipes", "nutritious meals", "fresh ingredients"],
    includeIngredients: [],
    excludeIngredients: [],
    label: "Health Focused",
    priority: 4
  });
  
  return configs;
};

interface BitesTabsProps {
  // Remove navigation props since we'll handle them internally
}

export function BitesTabs({}: BitesTabsProps = {}) {
  const { user } = useAuth();
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

  // User preferences state
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [useMyPreferences, setUseMyPreferences] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Auto-loaded recipes state
  const [autoRecipes, setAutoRecipes] = useState<any[]>([]);
  const [autoRecipesLoading, setAutoRecipesLoading] = useState(false);
  const [autoRecipesError, setAutoRecipesError] = useState<string | null>(null);
  const [lastAutoSearchQuery, setLastAutoSearchQuery] = useState<string>("");

  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;
      
      setPreferencesLoading(true);
      try {
        const response = await fetch('/api/profile');
        const result = await response.json();
        
        if (result.success && result.data?.dietary_preferences) {
          const preferences = result.data.dietary_preferences;
          setUserPreferences(preferences);
          
          // Auto-populate selected diets if user wants personalized experience
          if (useMyPreferences) {
            const mappedDiets = mapUserPreferencesToDiets(preferences);
            setSelectedDiets(mappedDiets);
            
            // Auto-fetch personalized recipes
            autoFetchPersonalizedRecipes(preferences);
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    loadUserPreferences();
  }, [user, useMyPreferences]);

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

  const togglePreferenceMode = () => {
    const newMode = !useMyPreferences;
    setUseMyPreferences(newMode);
    
    if (newMode && userPreferences.length > 0) {
      // Switch to user preferences
      const mappedDiets = mapUserPreferencesToDiets(userPreferences);
      setSelectedDiets(mappedDiets);
    } else {
      // Switch to manual selection
      setSelectedDiets([]);
    }
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
        const prefInfo = useMyPreferences && userPreferences.length > 0 ? ` (personalized for your preferences)` : '';
        setLastSearchMethod(`Search: "${searchQuery}"${dietInfo}${prefInfo} (${data.data.results.length} of ${data.data.totalResults} results)`);
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

  // Auto-fetch personalized recipes based on user preferences with flexible AND/OR logic
  const autoFetchPersonalizedRecipes = async (preferences: string[]) => {
    if (preferences.length === 0) return;
    
    setAutoRecipesLoading(true);
    setAutoRecipesError('');
    
    try {
      const searchConfigs = generateFlexibleSearchConfigs(preferences);
      const allRecipes = [];
      
      // Execute multiple searches with different levels of restriction
      for (const config of searchConfigs.slice(0, 3)) { // Limit to 3 configs to avoid too many API calls
        try {
          const searchQuery = config.searchTerms[Math.floor(Math.random() * config.searchTerms.length)];
          
          const queryParams = new URLSearchParams({
            query: searchQuery,
            number: '4', // Fewer per query since we're doing multiple
            addRecipeInformation: 'true',
            fillIngredients: 'true',
            enhanced: 'true',
            sort: 'healthiness'
          });

          // Add diet restrictions
          if (config.diets && config.diets.length > 0) {
            queryParams.append('diet', config.diets.join(','));
          }

          // Add ingredient inclusions (prioritize these ingredients)
          if (config.includeIngredients && config.includeIngredients.length > 0) {
            queryParams.append('includeIngredients', config.includeIngredients.join(','));
          }

          // Add ingredient exclusions (avoid these ingredients)
          if (config.excludeIngredients && config.excludeIngredients.length > 0) {
            queryParams.append('excludeIngredients', config.excludeIngredients.join(','));
          }

          queryParams.append('maxReadyTime', '60');
          queryParams.append('instructionsRequired', 'true');
          queryParams.append('ranking', '2');
          queryParams.append('addRecipeNutrition', 'true');

          console.log(`🔍 Auto-fetching with ${config.label}:`, {
            query: searchQuery,
            diets: config.diets,
            includeIngredients: config.includeIngredients,
            excludeIngredients: config.excludeIngredients
          });

          const response = await fetch(`/api/debug/bites-recipe-search?${queryParams.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.results) {
              // Add metadata to recipes about their match level
              const recipesWithMeta = data.data.results.map((recipe: any) => ({
                ...recipe,
                matchLevel: config.label,
                matchPriority: config.priority,
                searchQuery: searchQuery,
                appliedDiets: config.diets,
                includedIngredients: config.includeIngredients || [],
                excludedIngredients: config.excludeIngredients || []
              }));
              allRecipes.push(...recipesWithMeta);
              console.log(`✅ Found ${recipesWithMeta.length} recipes with ${config.label}`);
            }
          }
        } catch (configError) {
          console.warn(`Search config failed: ${config.label}`, configError);
        }
      }
      
      if (allRecipes.length > 0) {
        // Remove duplicates based on recipe ID
        const uniqueRecipes = allRecipes.filter((recipe, index, self) =>
          index === self.findIndex(r => r.id === recipe.id)
        );
        
        // Sort by match priority (lower number = better match) and health score
        const sortedRecipes = uniqueRecipes.sort((a, b) => {
          if (a.matchPriority !== b.matchPriority) {
            return a.matchPriority - b.matchPriority;
          }
          return (b.healthScore || 0) - (a.healthScore || 0);
        });
        
        setAutoRecipes(sortedRecipes.slice(0, 12)); // Show top 12
        setLastAutoSearchQuery(`Smart-curated using flexible matching: ${preferences.join(', ')} (${sortedRecipes.length} recipes)`);
      } else {
        throw new Error('No recipes found with any preference combination');
      }
    } catch (error) {
      console.error('Auto recipe fetch error:', error);
      setAutoRecipesError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setAutoRecipesLoading(false);
    }
  };

  const refreshPersonalizedRecipes = () => {
    if (userPreferences.length > 0) {
      autoFetchPersonalizedRecipes(userPreferences);
    }
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

        {/* Personalized Preferences Banner */}
        {user && userPreferences.length > 0 && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 text-blue-600 mr-2" />
                  <h3 className="text-sm font-medium text-blue-900">Your Food Preferences</h3>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {userPreferences.map((pref, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {pref}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useMyPreferences"
                      checked={useMyPreferences}
                      onChange={togglePreferenceMode}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor="useMyPreferences" className="text-xs text-blue-700">
                      {useMyPreferences ? "✅ Auto-loading personalized recipes" : "Enable personalized auto-loading"}
                    </label>
                  </div>
                  {useMyPreferences && (
                    <button
                      onClick={refreshPersonalizedRecipes}
                      disabled={autoRecipesLoading}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      {autoRecipesLoading ? "🔄" : "🔄 Refresh"}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="Adjust filters"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
                <h3 className="text-sm font-medium text-gray-900">
                  Diet Filters ({selectedDiets.length} selected)
                  {useMyPreferences && userPreferences.length > 0 && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Using your preferences
                    </span>
                  )}
                </h3>
                <div className="flex gap-2">
                  {user && userPreferences.length > 0 && (
                    <button
                      onClick={togglePreferenceMode}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        useMyPreferences 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {useMyPreferences ? "Manual" : "My Prefs"}
                    </button>
                  )}
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    {selectedDiets.length === DIET_TYPES.length ? "Clear All" : "Select All"}
                  </button>
                </div>
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
            {/* Manual Search Results (Priority Display) */}
            {recipeResults.length > 0 ? (
              <div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Search Results:</strong> {lastSearchMethod}
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recipeResults.map((recipe) => (
                    <div key={`search-${recipe.id}`} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Recipe Card Content */}
                      {recipe.image && (
                        <div 
                          className="h-48 bg-gray-200 bg-cover bg-center"
                          style={{ backgroundImage: `url(${recipe.image})` }}
                        />
                      )}
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {recipe.title}
                        </h3>
                        
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

                        {recipe.summary && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {recipe.summary.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>
                        )}

                        {saveMessages[recipe.id] && (
                          <div className={`mb-3 p-2 text-xs rounded ${
                            saveMessages[recipe.id].includes('✅') 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {saveMessages[recipe.id]}
                          </div>
                        )}

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
              </div>
            ) : (
              <>
                {/* Error Display for Manual Search */}
                {recipeError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      <strong>Search Error:</strong> {recipeError}
                    </p>
                  </div>
                )}

                {/* Manual Search: No Results */}
                {!recipeLoading && !recipeError && searchQuery.trim() ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or diet filters.</p>
                  </div>
                ) : (
                  <>
                    {/* Auto-loaded Personalized Recipes */}
                    {user && userPreferences.length > 0 && useMyPreferences && autoRecipes.length > 0 ? (
                      <div>
                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 text-sm mb-2">
                            <strong>✨ Smart Curation:</strong> {lastAutoSearchQuery}
                          </p>
                          <div className="text-xs text-green-700">
                            <span className="inline-flex items-center gap-1 mr-3">
                              🎯 <strong>Perfect Match</strong> - All preferences
                            </span>
                            <span className="inline-flex items-center gap-1 mr-3">
                              ✅ <strong>Compatible</strong> - Key restrictions
                            </span>
                            <span className="inline-flex items-center gap-1 mr-3">
                              🔸 <strong>Partial</strong> - Some preferences
                            </span>
                            <span className="inline-flex items-center gap-1">
                              💡 <strong>Inspired</strong> - Preference-based search
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {autoRecipes.map((recipe) => (
                            <div key={`auto-${recipe.id}`} className="bg-white rounded-lg border border-green-200 overflow-hidden hover:shadow-md transition-shadow">
                              {recipe.image && (
                                <div 
                                  className="h-48 bg-gray-200 bg-cover bg-center"
                                  style={{ backgroundImage: `url(${recipe.image})` }}
                                />
                              )}
                              
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                                    {recipe.title}
                                  </h3>
                                  <div className="ml-2 flex flex-col gap-1 flex-shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      recipe.matchPriority === 1 ? 'bg-green-100 text-green-700' :
                                      recipe.matchPriority === 2 ? 'bg-blue-100 text-blue-700' :
                                      recipe.matchPriority === 3 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-purple-100 text-purple-700'
                                    }`}>
                                      {recipe.matchPriority === 1 ? '🎯' : 
                                       recipe.matchPriority === 2 ? '✅' : 
                                       recipe.matchPriority === 3 ? '🔸' : '💡'} {recipe.matchLevel}
                                    </span>
                                  </div>
                                </div>
                                
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

                                {/* Show applied dietary filters for this recipe */}
                                {recipe.appliedDiets && recipe.appliedDiets.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {recipe.appliedDiets.map((diet: string, index: number) => (
                                        <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                          {diet}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Regular diet tags from API */}
                                {recipe.diets && recipe.diets.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {recipe.diets.slice(0, 3).map((diet: string, index: number) => (
                                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
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

                                {recipe.summary && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {recipe.summary.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                  </p>
                                )}

                                {/* Show why this recipe was recommended */}
                                {recipe.searchQuery && (
                                  <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                    🔍 Found via: &ldquo;{recipe.searchQuery}&rdquo;
                                  </div>
                                )}

                                {saveMessages[recipe.id] && (
                                  <div className={`mb-3 p-2 text-xs rounded ${
                                    saveMessages[recipe.id].includes('✅') 
                                      ? 'bg-green-50 text-green-700 border border-green-200' 
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {saveMessages[recipe.id]}
                                  </div>
                                )}

                                <button
                                  onClick={() => saveRecipeToPlate(recipe)}
                                  disabled={savingRecipeIds.has(recipe.id) || savedRecipeIds.has(recipe.id)}
                                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                    savedRecipeIds.has(recipe.id)
                                      ? 'bg-green-500 text-white cursor-not-allowed'
                                      : savingRecipeIds.has(recipe.id)
                                      ? 'bg-green-300 text-white cursor-not-allowed'
                                      : 'bg-green-500 text-white hover:bg-green-600'
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
                      </div>
                    ) : (
                      <>
                        {/* Auto-loading Error */}
                        {autoRecipesError && (
                          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">
                              <strong>Auto-loading Error:</strong> {autoRecipesError}
                            </p>
                          </div>
                        )}

                        {/* Default State with Recommendations */}
                        <div>
                          {user && userPreferences.length > 0 && useMyPreferences ? (
                            <div className="mb-8">
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                  <User className="w-5 h-5 text-green-600 mr-2" />
                                  <h3 className="text-lg font-medium text-green-900">Recommended for You</h3>
                                </div>
                                <p className="text-green-700 mb-4">
                                  Based on your preferences: {userPreferences.join(", ")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      setSearchQuery("healthy protein");
                                      setTimeout(() => searchRecipes(), 100);
                                    }}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    🥗 Find Healthy Recipes
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSearchQuery("fish seafood");
                                      setTimeout(() => searchRecipes(), 100);
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    🐟 Pescatarian Options
                                  </button>
                                  <button
                                    onClick={refreshPersonalizedRecipes}
                                    disabled={autoRecipesLoading}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                                  >
                                    {autoRecipesLoading ? "🔄 Loading..." : "✨ Get Curated Recipes"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          
                          {/* Default empty state */}
                          <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {user && userPreferences.length > 0 ? "Your Personalized Recipe Feed" : "Search for Recipes"}
                            </h3>
                            <p className="text-gray-600">
                              {user && userPreferences.length > 0 
                                ? "Recipes will be automatically curated based on your preferences!"
                                : "Enter a search term above to find delicious recipes!"
                              }
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Loading State */}
            {(recipeLoading || autoRecipesLoading) && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {recipeLoading ? "Searching for recipes..." : "Loading personalized recipes..."}
                  </p>
                </div>
              </div>
            )}

            {/* Save Summary for both auto and manual recipes */}
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
          </>
        )}
      </div>
    </div>
  );
}