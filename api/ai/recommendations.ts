import { NextRequest, NextResponse } from "next/server";
import { spoonacularService } from "../../../lib/spoonacular";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPreferences, filters = {}, query = "", limit = 12 } = body;

    if (!userPreferences) {
      return NextResponse.json(
        { error: "User preferences are required" },
        { status: 400 }
      );
    }

    // Convert user preferences to Spoonacular search parameters
    const searchParams =
      spoonacularService.convertUserPreferencesToSearchParams(userPreferences);

    // Apply additional filters
    if (filters.maxReadyTime) {
      searchParams.maxReadyTime = filters.maxReadyTime;
    }
    if (filters.maxPrice) {
      searchParams.maxPricePerServing = filters.maxPrice;
    }
    if (filters.minHealthScore) {
      searchParams.minHealthScore = filters.minHealthScore;
    }
    if (filters.mealType) {
      searchParams.type = filters.mealType;
    }
    if (query) {
      searchParams.query = query;
    }

    searchParams.number = limit;
    searchParams.sort = "meta-score";

    // Fetch recommendations from Spoonacular
    const response = await spoonacularService.searchRecipes(searchParams);

    // Calculate AI reasoning for each recommendation
    const recommendations = response.results.map((recipe) => {
      let matchScore = 0;
      let aiReasoning = "Recommended based on your preferences: ";

      // Check cuisine match
      if (userPreferences.cuisine_preferences && recipe.cuisines) {
        const cuisineMatch = recipe.cuisines.some((cuisine) =>
          userPreferences.cuisine_preferences.some((pref: string) =>
            cuisine.toLowerCase().includes(pref.toLowerCase())
          )
        );
        if (cuisineMatch) {
          matchScore += 30;
          aiReasoning += "matches your cuisine preferences, ";
        }
      }

      // Check dietary match
      if (userPreferences.dietary_preferences && recipe.diets) {
        const dietMatch = recipe.diets.some((diet) =>
          userPreferences.dietary_preferences.some((pref: string) =>
            diet.toLowerCase().includes(pref.toLowerCase())
          )
        );
        if (dietMatch) {
          matchScore += 25;
          aiReasoning += "fits your dietary needs, ";
        }
      }

      // Health score bonus
      if (recipe.healthScore > 70) {
        matchScore += 15;
        aiReasoning += "healthy option, ";
      }

      // Popularity bonus
      if (recipe.veryPopular) {
        matchScore += 10;
        aiReasoning += "popular choice, ";
      }

      // Price consideration
      if (recipe.pricePerServing < 5) {
        matchScore += 10;
        aiReasoning += "budget-friendly, ";
      }

      // Preparation time bonus
      if (recipe.readyInMinutes < 30) {
        matchScore += 10;
        aiReasoning += "quick to prepare, ";
      }

      return {
        ...recipe,
        aiReasoning: aiReasoning.slice(0, -2) + ".",
        matchScore: Math.min(matchScore, 100),
      };
    });

    // Sort by match score
    recommendations.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return NextResponse.json({
      success: true,
      recommendations,
      totalResults: response.totalResults,
      hasMore: response.offset + response.number < response.totalResults,
    });
  } catch (error) {
    console.error("AI Recommendations API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "12");
    const cuisine = searchParams.get("cuisine") || "";
    const diet = searchParams.get("diet") || "";

    // Build search parameters
    const params: any = {
      number: limit,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
    };

    if (query) params.query = query;
    if (cuisine) params.cuisine = cuisine;
    if (diet) params.diet = diet;

    const response = await spoonacularService.searchRecipes(params);

    return NextResponse.json({
      success: true,
      recommendations: response.results,
      totalResults: response.totalResults,
    });
  } catch (error) {
    console.error("AI Recommendations GET API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


