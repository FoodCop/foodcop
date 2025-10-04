"use client";

import { useState } from "react";
import { BaseDebug } from "./BaseDebug";

const DIET_TYPES = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescetarian", label: "Pescetarian" },
  { id: "ketogenic", label: "Ketogenic" },
  { id: "paleo", label: "Paleo" },
  { id: "primal", label: "Primal" },
  { id: "gluten free", label: "Gluten Free" }
];

export function BitesDebug() {
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [useEnhancedFiltering, setUseEnhancedFiltering] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
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
        savedFrom: 'BitesDebug',
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

  const testRecipes = async () => {
    if (selectedDiets.length === 0) {
      setRecipeError("Please select at least one diet to test");
      return;
    }

    setRecipeLoading(true);
    setRecipeError('');
    setRecipeResults([]);
    
    try {
      const dietsToTest = selectedDiets.join(',');
      const queryParams = new URLSearchParams({
        diet: dietsToTest,
        number: '12',
        addRecipeInformation: 'true',
        fillIngredients: 'true',
        enhanced: useEnhancedFiltering.toString(),
        sort: 'popularity'
      });

      if (useEnhancedFiltering) {
        queryParams.append('maxReadyTime', '60');
        queryParams.append('instructionsRequired', 'true');
        queryParams.append('ranking', '2');
      }

      const response = await fetch(`/api/debug/bites-recipe-search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.results) {
        setRecipeResults(data.data.results);
        setLastSearchMethod(`Diet filtering: ${dietsToTest.replace(/,/g, ', ')} (${data.data.results.length} of ${data.data.totalResults} results)${useEnhancedFiltering ? ' - Enhanced' : ''}`);
      } else {
        throw new Error(data.error || 'No results returned from API');
      }
    } catch (error) {
      console.error('Recipe test error:', error);
      setRecipeError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setRecipeLoading(false);
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
        enhanced: useEnhancedFiltering.toString(),
        sort: 'meta-score'
      });

      if (selectedDiets.length > 0) {
        queryParams.append('diet', selectedDiets.join(','));
      }

      if (useEnhancedFiltering) {
        queryParams.append('maxReadyTime', '45');
        queryParams.append('instructionsRequired', 'true');
        queryParams.append('ranking', '2');
        queryParams.append('addRecipeNutrition', 'true');
      }

      const response = await fetch(`/api/debug/bites-recipe-search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.results) {
        setRecipeResults(data.data.results);
        const dietInfo = selectedDiets.length > 0 ? ` + diets: ${selectedDiets.join(', ')}` : '';
        const enhancedInfo = useEnhancedFiltering ? ' (Enhanced)' : '';
        setLastSearchMethod(`Search: "${searchQuery}"${dietInfo} (${data.data.results.length} of ${data.data.totalResults} results)${enhancedInfo}`);
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

  const testSingleDiet = async (dietId: string) => {
    const diet = DIET_TYPES.find(d => d.id === dietId);
    if (!diet) return;

    setRecipeLoading(true);
    setRecipeError('');
    setRecipeResults([]);
    
    try {
      const queryParams = new URLSearchParams({
        diet: dietId,
        number: '10',
        addRecipeInformation: 'true',
        fillIngredients: 'true',
        enhanced: useEnhancedFiltering.toString(),
        sort: 'popularity'
      });

      if (useEnhancedFiltering) {
        queryParams.append('maxReadyTime', '60');
        queryParams.append('instructionsRequired', 'true');
        queryParams.append('ranking', '2');
      }

      const response = await fetch(`/api/debug/bites-recipe-search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.results) {
        setRecipeResults(data.data.results);
        setLastSearchMethod(`Single diet test: ${diet.label} (${data.data.results.length} of ${data.data.totalResults} results)${useEnhancedFiltering ? ' - Enhanced' : ''}`);
      } else {
        throw new Error(data.error || 'No results returned from API');
      }
    } catch (error) {
      console.error('Single diet test error:', error);
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
    // Clear save-to-plate state
    setSavingRecipeIds(new Set());
    setSavedRecipeIds(new Set());
    setSaveMessages({});
  };

  const recipeTestingFeatures = (
    <>
      <h4>Recipe Testing Interface</h4>
      
      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="Search recipes (e.g. 'chicken pasta', 'chocolate cake')..."
            style={{
              width: "300px",
              padding: "12px",
              fontSize: "14px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginRight: "10px"
            }}
          />
          <button
            onClick={searchRecipes}
            disabled={recipeLoading || !searchQuery.trim()}
            style={{
              padding: "12px 24px",
              backgroundColor: "#329937",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              opacity: recipeLoading || !searchQuery.trim() ? 0.6 : 1
            }}
          >
            {recipeLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Enhanced Filtering Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={useEnhancedFiltering}
            onChange={(e) => setUseEnhancedFiltering(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Enhanced Filtering (uses comprehensive diet + ingredients + time filters)
        </label>
      </div>

      {/* Diet Selection */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <strong>Diet Filters ({selectedDiets.length} selected):</strong>
          <button
            onClick={handleSelectAll}
            style={{
              padding: "6px 12px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {selectedDiets.length === DIET_TYPES.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
          {DIET_TYPES.map(diet => (
            <div key={diet.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: "13px", cursor: "pointer", flex: "1" }}>
                <input
                  type="checkbox"
                  checked={selectedDiets.includes(diet.id)}
                  onChange={() => handleDietToggle(diet.id)}
                  style={{ marginRight: "8px" }}
                />
                {diet.label}
              </label>
              <button
                onClick={() => testSingleDiet(diet.id)}
                disabled={recipeLoading}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#FF7E27",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "11px",
                  marginLeft: "8px",
                  opacity: recipeLoading ? 0.6 : 1
                }}
              >
                Test
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={testRecipes}
          disabled={recipeLoading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#047DD4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            marginRight: "10px",
            opacity: recipeLoading ? 0.6 : 1
          }}
        >
          {recipeLoading ? "Testing..." : "Test Selected Diets"}
        </button>

        {recipeResults.length > 0 && (
          <button
            onClick={clearResults}
            style={{
              padding: "12px 24px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Error Display */}
      {recipeError && (
        <div style={{ padding: "10px", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", borderRadius: "4px", marginBottom: "20px", color: "#721c24" }}>
          <strong>Error:</strong> {recipeError}
        </div>
      )}

      {/* Results Display */}
      {recipeResults.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h5>Recipe Results ({recipeResults.length} found)</h5>
          <p><strong>Search Method:</strong> {lastSearchMethod}</p>
          
          <div style={{ 
            maxHeight: "500px", 
            overflowY: "auto", 
            border: "1px solid #ddd", 
            padding: "15px",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9"
          }}>
            {recipeResults.map((recipe, index) => (
              <div key={index} style={{ 
                marginBottom: "20px", 
                paddingBottom: "20px", 
                borderBottom: index < recipeResults.length - 1 ? "1px solid #eee" : "none",
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #e9ecef"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ flex: 1, paddingRight: "15px" }}>
                    <h6 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "16px", fontWeight: "600" }}>
                      {recipe.title}
                    </h6>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#666", backgroundColor: "#e9ecef", padding: "2px 8px", borderRadius: "12px" }}>
                        🕒 {recipe.readyInMinutes} min
                      </span>
                      <span style={{ fontSize: "12px", color: "#666", backgroundColor: "#e9ecef", padding: "2px 8px", borderRadius: "12px" }}>
                        👥 {recipe.servings} servings
                      </span>
                      {recipe.healthScore && (
                        <span style={{ fontSize: "12px", color: "#666", backgroundColor: "#e9ecef", padding: "2px 8px", borderRadius: "12px" }}>
                          ❤️ {recipe.healthScore} health score
                        </span>
                      )}
                    </div>

                    {recipe.diets && recipe.diets.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        {recipe.diets.map((diet: string, dietIndex: number) => (
                          <span key={dietIndex} style={{
                            fontSize: "11px",
                            backgroundColor: "#d4edda",
                            color: "#155724",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            marginRight: "4px",
                            display: "inline-block"
                          }}>
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}

                    {recipe.summary && (
                      <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#555", lineHeight: "1.4" }}>
                        {recipe.summary.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    )}
                    
                    {/* Save feedback message */}
                    {saveMessages[recipe.id] && (
                      <div style={{ 
                        marginTop: "8px", 
                        padding: "6px 10px", 
                        borderRadius: "4px",
                        fontSize: "12px",
                        backgroundColor: saveMessages[recipe.id].includes('✅') ? '#d4edda' : '#f8d7da',
                        color: saveMessages[recipe.id].includes('✅') ? '#155724' : '#721c24',
                        border: `1px solid ${saveMessages[recipe.id].includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {saveMessages[recipe.id]}
                      </div>
                    )}
                  </div>
                  
                  {/* Recipe image */}
                  {recipe.image && (
                    <div style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "6px", 
                      backgroundColor: "#f0f0f0",
                      backgroundImage: `url(${recipe.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid #ddd"
                    }} />
                  )}
                </div>
                
                {/* Save to Plate Button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    onClick={() => saveRecipeToPlate(recipe)}
                    disabled={savingRecipeIds.has(recipe.id) || savedRecipeIds.has(recipe.id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: savedRecipeIds.has(recipe.id) ? "#28a745" : "#329937",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: savingRecipeIds.has(recipe.id) || savedRecipeIds.has(recipe.id) ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                      opacity: savingRecipeIds.has(recipe.id) ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
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
          
          {/* Save-to-Plate Summary */}
          {savedRecipeIds.size > 0 && (
            <div style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "4px",
              color: "#155724",
              fontSize: "14px"
            }}>
              <strong>✅ {savedRecipeIds.size} recipe{savedRecipeIds.size === 1 ? '' : 's'} saved to your plate!</strong>
              <br />
              <small>Check the Plate page to see your saved recipes.</small>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <BaseDebug 
      title="Bites Page Debug Information" 
      pageSpecificFeatures={recipeTestingFeatures} 
    />
  );
}
