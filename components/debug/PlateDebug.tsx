"use client";

import { useEffect, useState } from "react";

export function PlateDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Saved recipes state
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [savedRecipesLoading, setSavedRecipesLoading] = useState(false);
  const [savedRecipesError, setSavedRecipesError] = useState<string | null>(null);
  
  // Saved restaurants state
  const [savedRestaurants, setSavedRestaurants] = useState<any[]>([]);
  const [savedRestaurantsLoading, setSavedRestaurantsLoading] = useState(false);
  const [savedRestaurantsError, setSavedRestaurantsError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnections = async () => {
      const info: any = {};

      // Check environment variables through server-side API
      try {
        const envResponse = await fetch("/api/debug/env-vars");
        const envData = await envResponse.json();
        // Map API response to component expected format
        info.envVars = {
          supabaseUrl: !!envData.envVars?.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: !!envData.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseServiceKey: !!envData.envVars?.SUPABASE_SERVICE_ROLE_KEY,
          googleMapsKey: !!envData.envVars?.GOOGLE_MAPS_API_KEY,
          spoonacularKey: !!envData.envVars?.SPOONACULAR_API_KEY,
        };
      } catch (error) {
        // Fallback to client-side check for public variables only
        info.envVars = {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseServiceKey: false,
          googleMapsKey: false,
          spoonacularKey: false,
        };
      }

      // Test Supabase connection
      try {
        const response = await fetch("/api/debug/supabase");
        const data = await response.json();
        info.supabaseConnection = data.success;
        info.supabaseError = data.error;
      } catch (error) {
        info.supabaseConnection = false;
        info.supabaseError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test database tables
      try {
        const response = await fetch("/api/debug/database-tables");
        const data = await response.json();
        info.databaseTables = data.success;
        info.databaseTablesError = data.error;
        info.tableCount = data.tableCount;
      } catch (error) {
        info.databaseTables = false;
        info.databaseTablesError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test collections functionality
      try {
        const response = await fetch("/api/debug/collections");
        const data = await response.json();
        info.collectionsTest = data.success;
        info.collectionsError = data.error;
      } catch (error) {
        info.collectionsTest = false;
        info.collectionsError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test OAuth configuration
      try {
        const response = await fetch("/api/debug/oauth");
        const data = await response.json();
        info.oauthConfig = data.success;
        info.oauthError = data.error;
      } catch (error) {
        info.oauthConfig = false;
        info.oauthError = error instanceof Error ? error.message : "Unknown error";
      }

      setDebugInfo(info);
      setLoading(false);
    };

    checkConnections();
  }, []);

  // Function to load saved recipes
  const loadSavedRecipes = async () => {
    setSavedRecipesLoading(true);
    setSavedRecipesError(null);
    
    try {
      const response = await fetch('/api/debug/saved-recipes');
      const data = await response.json();
      
      if (data.success) {
        setSavedRecipes(data.recipes || []);
      } else {
        setSavedRecipesError(data.error || 'Failed to load saved recipes');
        setSavedRecipes([]);
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      setSavedRecipesError(error instanceof Error ? error.message : 'Unknown error occurred');
      setSavedRecipes([]);
    } finally {
      setSavedRecipesLoading(false);
    }
  };

  // Function to load saved restaurants
  const loadSavedRestaurants = async () => {
    setSavedRestaurantsLoading(true);
    setSavedRestaurantsError(null);
    
    try {
      const response = await fetch('/api/debug/saved-restaurants');
      const data = await response.json();
      
      if (data.success) {
        setSavedRestaurants(data.restaurants || []);
      } else {
        setSavedRestaurantsError(data.error || 'Failed to load saved restaurants');
        setSavedRestaurants([]);
      }
    } catch (error) {
      console.error('Error loading saved restaurants:', error);
      setSavedRestaurantsError(error instanceof Error ? error.message : 'Unknown error occurred');
      setSavedRestaurants([]);
    } finally {
      setSavedRestaurantsLoading(false);
    }
  };

  // Function to remove a saved recipe (placeholder for future implementation)
  const removeSavedRecipe = async (itemId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from your plate?`)) {
      return;
    }

    try {
      // Note: This would require implementing an unsave endpoint
      // For now, just refresh the list
      console.log('Remove recipe functionality to be implemented:', itemId);
      await loadSavedRecipes();
    } catch (error) {
      console.error('Error removing saved recipe:', error);
    }
  };

  if (loading) {
    return <div>Loading debug information...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <h3>Plate Page Debug Information</h3>
      
      <h4>Environment Variables:</h4>
      <ul>
        <li>Supabase URL: {debugInfo.envVars?.supabaseUrl ? "LOADED" : "MISSING"}</li>
        <li>Supabase Anon Key: {debugInfo.envVars?.supabaseAnonKey ? "LOADED" : "MISSING"}</li>
        <li>Supabase Service Key: {debugInfo.envVars?.supabaseServiceKey ? "LOADED" : "MISSING"}</li>
        <li>Google Maps Key: {debugInfo.envVars?.googleMapsKey ? "LOADED" : "MISSING"}</li>
        <li>Spoonacular Key: {debugInfo.envVars?.spoonacularKey ? "LOADED" : "MISSING"}</li>
      </ul>

      <h4>Database Connections:</h4>
      <ul>
        <li>Supabase Connection: {debugInfo.supabaseConnection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.supabaseError && <li>Supabase Error: {debugInfo.supabaseError}</li>}
        
        <li>Database Tables: {debugInfo.databaseTables ? "ACCESSIBLE" : "FAILED"}</li>
        {debugInfo.tableCount && <li>Table Count: {debugInfo.tableCount}</li>}
        {debugInfo.databaseTablesError && <li>Tables Error: {debugInfo.databaseTablesError}</li>}
        
        <li>Collections Test: {debugInfo.collectionsTest ? "PASSED" : "FAILED"}</li>
        {debugInfo.collectionsError && <li>Collections Error: {debugInfo.collectionsError}</li>}
        
        <li>OAuth Config: {debugInfo.oauthConfig ? "CONFIGURED" : "FAILED"}</li>
        {debugInfo.oauthError && <li>OAuth Error: {debugInfo.oauthError}</li>}
      </ul>

      {/* Saved Recipes Section */}
      <div style={{ marginTop: "30px", borderTop: `2px solid var(--border)`, paddingTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ margin: 0, color: "var(--primary)" }}>💾 Saved Recipes Debug</h4>
          <button
            onClick={loadSavedRecipes}
            disabled={savedRecipesLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              opacity: savedRecipesLoading ? 0.6 : 1
            }}
          >
            {savedRecipesLoading ? "Loading..." : "Load Saved Recipes"}
          </button>
        </div>

        {savedRecipesError && (
          <div style={{ 
            padding: "10px", 
            backgroundColor: "var(--destructive)", 
            border: `1px solid var(--destructive)`, 
            borderRadius: "4px", 
            marginBottom: "15px",
            color: "var(--destructive-foreground)",
            fontSize: "13px"
          }}>
            <strong>Error:</strong> {savedRecipesError}
          </div>
        )}

        {savedRecipes.length > 0 ? (
          <div>
            <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "var(--muted-foreground)" }}>
              <strong>{savedRecipes.length} recipe{savedRecipes.length === 1 ? '' : 's'} saved to your plate</strong>
            </p>
            
            <div style={{ 
              maxHeight: "400px", 
              overflowY: "auto", 
              border: `1px solid var(--border)`, 
              borderRadius: "4px",
              backgroundColor: "var(--muted)"
            }}>
              {savedRecipes.map((recipe, index) => (
                <div key={index} style={{ 
                  padding: "15px", 
                  borderBottom: index < savedRecipes.length - 1 ? `1px solid var(--border)` : "none",
                  backgroundColor: "var(--card)",
                  margin: "5px",
                  borderRadius: "4px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: "15px" }}>
                      <h6 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "var(--card-foreground)" }}>
                        {recipe.title || `Recipe ${recipe.spoonacularId}`}
                      </h6>
                      
                      <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
                        <div><strong>Spoonacular ID:</strong> {recipe.spoonacularId}</div>
                        <div><strong>Saved:</strong> {new Date(recipe.savedAt).toLocaleDateString()} at {new Date(recipe.savedAt).toLocaleTimeString()}</div>
                        {recipe.readyInMinutes && <div><strong>Cook Time:</strong> {recipe.readyInMinutes} minutes</div>}
                        {recipe.servings && <div><strong>Servings:</strong> {recipe.servings}</div>}
                        {recipe.healthScore && <div><strong>Health Score:</strong> {recipe.healthScore}/100</div>}
                      </div>

                      {recipe.diets && recipe.diets.length > 0 && (
                        <div style={{ marginBottom: "8px" }}>
                          {recipe.diets.map((diet: string, dietIndex: number) => (
                            <span key={dietIndex} style={{
                              fontSize: "10px",
                              backgroundColor: "var(--accent)",
                              color: "var(--accent-foreground)",
                              padding: "2px 6px",
                              borderRadius: "8px",
                              marginRight: "4px",
                              display: "inline-block"
                            }}>
                              {diet}
                            </span>
                          ))}
                        </div>
                      )}

                      {recipe.summary && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "var(--muted-foreground)", lineHeight: "1.4" }}>
                          {recipe.summary}
                        </p>
                      )}
                      
                      <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "8px" }}>
                        <strong>Debug Info:</strong> ID: {recipe.id} | Item ID: {recipe.itemId}
                      </div>
                    </div>
                    
                    {/* Recipe image */}
                    {recipe.image && (
                      <div style={{ 
                        width: "60px", 
                        height: "60px", 
                        borderRadius: "4px", 
                        backgroundColor: "var(--muted)",
                        backgroundImage: `url(${recipe.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: `1px solid var(--border)`,
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", gap: "8px" }}>
                    <button
                      onClick={() => window.open(`https://spoonacular.com/recipes/${recipe.title?.toLowerCase().replace(/\s+/g, '-')}-${recipe.spoonacularId}`, '_blank')}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "var(--secondary)",
                        color: "var(--secondary-foreground)",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      View Original
                    </button>
                    <button
                      onClick={() => removeSavedRecipe(recipe.itemId, recipe.title)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "var(--destructive)",
                        color: "var(--destructive-foreground)",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : savedRecipes.length === 0 && !savedRecipesLoading && !savedRecipesError ? (
          <div style={{ 
            padding: "20px", 
            textAlign: "center", 
            color: "var(--muted-foreground)",
            backgroundColor: "var(--muted)",
            border: `1px solid var(--border)`,
            borderRadius: "4px",
            fontSize: "13px"
          }}>
            <p style={{ margin: "0 0 10px 0" }}>📭 No recipes saved to your plate yet.</p>
            <p style={{ margin: 0, fontSize: "12px" }}>Go to the Bites page and save some recipes to see them here!</p>
          </div>
        ) : null}
      </div>

      {/* Saved Restaurants Section */}
      <div style={{ marginTop: "30px", borderTop: `2px solid var(--border)`, paddingTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ margin: 0, color: "var(--primary)" }}>🏪 Saved Restaurants Debug</h4>
          <button
            onClick={loadSavedRestaurants}
            disabled={savedRestaurantsLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#047DD4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              opacity: savedRestaurantsLoading ? 0.6 : 1
            }}
          >
            {savedRestaurantsLoading ? "Loading..." : "Load Saved Restaurants"}
          </button>
        </div>

        {savedRestaurantsError && (
          <div style={{ 
            padding: "10px", 
            backgroundColor: "#f8d7da", 
            border: "1px solid #f5c6cb", 
            borderRadius: "4px", 
            marginBottom: "15px",
            color: "#721c24",
            fontSize: "13px"
          }}>
            <strong>Error:</strong> {savedRestaurantsError}
          </div>
        )}

        {savedRestaurants.length > 0 ? (
          <div>
            <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#666" }}>
              <strong>{savedRestaurants.length} restaurant{savedRestaurants.length === 1 ? '' : 's'} saved to your plate</strong>
            </p>
            
            <div style={{ 
              maxHeight: "400px", 
              overflowY: "auto", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              backgroundColor: "#f9f9f9"
            }}>
              {savedRestaurants.map((restaurant, index) => (
                <div key={index} style={{ 
                  padding: "15px", 
                  borderBottom: index < savedRestaurants.length - 1 ? "1px solid #eee" : "none",
                  backgroundColor: "#fff",
                  margin: "5px",
                  borderRadius: "4px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: "15px" }}>
                      <h6 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>
                        {restaurant.name || `Restaurant ${restaurant.restaurant_id}`}
                      </h6>
                      
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                        <div><strong>Address:</strong> {restaurant.address}</div>
                        <div><strong>Saved:</strong> {new Date(restaurant.created_at).toLocaleDateString()} at {new Date(restaurant.created_at).toLocaleTimeString()}</div>
                        {restaurant.rating && <div><strong>Rating:</strong> {restaurant.display_rating}</div>}
                        {restaurant.price_level && <div><strong>Price:</strong> {restaurant.display_price}</div>}
                        <div><strong>Distance:</strong> {restaurant.latitude && restaurant.longitude ? 'Coordinates available' : 'Location unknown'}</div>
                      </div>

                      {restaurant.types && restaurant.types.length > 0 && (
                        <div style={{ marginBottom: "8px" }}>
                          {restaurant.types.slice(0, 4).map((type: string, typeIndex: number) => (
                            <span key={typeIndex} style={{
                              fontSize: "10px",
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              padding: "2px 6px",
                              borderRadius: "8px",
                              marginRight: "4px",
                              display: "inline-block"
                            }}>
                              {type.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {restaurant.search_method && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#555", lineHeight: "1.4" }}>
                          <strong>Found via:</strong> {restaurant.search_method.replace(/_/g, ' ')} 
                          {restaurant.restaurant_type && restaurant.restaurant_type !== 'all' && ` (${restaurant.restaurant_type})`}
                        </p>
                      )}
                      
                      <div style={{ fontSize: "10px", color: "#999", marginTop: "8px" }}>
                        <strong>Debug Info:</strong> ID: {restaurant.id} | Restaurant ID: {restaurant.restaurant_id} | Place ID: {restaurant.item_id}
                      </div>
                    </div>
                    
                    {/* Restaurant photo */}
                    {restaurant.photo_url && (
                      <div style={{ 
                        width: "60px", 
                        height: "60px", 
                        borderRadius: "4px", 
                        backgroundColor: "#f0f0f0",
                        backgroundImage: `url(${restaurant.photo_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: "1px solid #ddd",
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", gap: "8px" }}>
                    {restaurant.google_maps_url && (
                      <button
                        onClick={() => window.open(restaurant.google_maps_url, '_blank')}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        View on Maps
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove "${restaurant.name}" from your plate?`)) {
                          console.log('Remove restaurant functionality to be implemented:', restaurant.restaurant_id);
                          loadSavedRestaurants(); // Refresh for now
                        }
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : savedRestaurants.length === 0 && !savedRestaurantsLoading && !savedRestaurantsError ? (
          <div style={{ 
            padding: "20px", 
            textAlign: "center", 
            color: "#666",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            fontSize: "13px"
          }}>
            <p style={{ margin: "0 0 10px 0" }}>🏪 No restaurants saved to your plate yet.</p>
            <p style={{ margin: 0, fontSize: "12px" }}>Go to the Scout page and save some restaurants to see them here!</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
