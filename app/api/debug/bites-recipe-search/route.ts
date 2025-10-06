import { NextRequest, NextResponse } from "next/server";

// Enhanced diet configurations with comprehensive parameters
const SPOONACULAR_DIETS: Record<string, any> = {
  'vegetarian': {
    name: 'Vegetarian',
    spoonacularValue: 'vegetarian',
    description: 'No meat or meat by-products',
    enhancedFilters: {
      includeIngredients: 'vegetables,cheese,eggs,beans,lentils,tofu,quinoa',
      excludeIngredients: 'meat,chicken,beef,pork,fish,bacon,ham',
      type: 'main course',
      sort: 'popularity'
    }
  },
  'vegan': {
    name: 'Vegan',
    spoonacularValue: 'vegan',
    description: 'No animal products whatsoever',
    enhancedFilters: {
      includeIngredients: 'tofu,tempeh,beans,lentils,nuts,seeds,quinoa',
      excludeIngredients: 'meat,chicken,beef,pork,fish,dairy,eggs,honey',
      type: 'main course',
      sort: 'popularity'
    }
  },
  'pescetarian': {
    name: 'Pescetarian',
    spoonacularValue: 'pescetarian',
    description: 'Fish allowed, no other meat',
    enhancedFilters: {
      includeIngredients: 'fish,salmon,tuna,shrimp,vegetables,beans',
      excludeIngredients: 'meat,chicken,beef,pork,bacon,ham',
      type: 'main course',
      sort: 'popularity'
    }
  },
  'ketogenic': {
    name: 'Ketogenic',
    spoonacularValue: 'ketogenic',
    description: 'High fat, very low carb',
    enhancedFilters: {
      includeIngredients: 'meat,eggs,cheese,butter,avocado,olive oil',
      excludeIngredients: 'bread,pasta,rice,sugar,fruit,potato',
      type: 'main course',
      sort: 'popularity',
      maxCarbs: '25'
    }
  },
  'paleo': {
    name: 'Paleo',
    spoonacularValue: 'paleo',
    description: 'Stone age diet - no processed foods',
    enhancedFilters: {
      includeIngredients: 'chicken,beef,pork,salmon,eggs,avocado',
      excludeIngredients: 'grains,bread,pasta,rice,beans,lentils,dairy,wheat',
      type: 'main course',
      sort: 'popularity'
    }
  },
  'primal': {
    name: 'Primal',
    spoonacularValue: 'primal',
    description: 'Like Paleo but allows some dairy',
    enhancedFilters: {
      includeIngredients: 'chicken,beef,fish,eggs,butter,cheese',
      excludeIngredients: 'grains,bread,pasta,rice,beans,lentils,wheat',
      type: 'main course',
      sort: 'popularity'
    }
  },
  'gluten free': {
    name: 'Gluten Free',
    spoonacularValue: 'gluten free',
    description: 'No gluten-containing grains',
    enhancedFilters: {
      includeIngredients: 'rice,quinoa,potatoes,corn,vegetables',
      excludeIngredients: 'wheat,barley,rye,bread,pasta,flour',
      type: 'main course',
      sort: 'popularity'
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Spoonacular API key not configured"
      });
    }

    // Parse parameters
    const query = searchParams.get('query') || '';
    const diet = searchParams.get('diet') || '';
    const enhanced = searchParams.get('enhanced') === 'true';
    const number = searchParams.get('number') || '12';
    const addRecipeInformation = searchParams.get('addRecipeInformation') === 'true';
    const fillIngredients = searchParams.get('fillIngredients') === 'true';
    const maxReadyTime = searchParams.get('maxReadyTime') || '60';
    const instructionsRequired = searchParams.get('instructionsRequired') === 'true';
    const ranking = searchParams.get('ranking') || '2';
    const sort = searchParams.get('sort') || 'popularity';
    const addRecipeNutrition = searchParams.get('addRecipeNutrition') === 'true';
    
    // Parse ingredient filtering parameters
    const includeIngredients = searchParams.get('includeIngredients') || '';
    const excludeIngredients = searchParams.get('excludeIngredients') || '';

    // Build API URL
    const baseUrl = 'https://api.spoonacular.com/recipes/complexSearch';
    const urlParams = new URLSearchParams({
      apiKey,
      number,
      addRecipeInformation: addRecipeInformation.toString(),
      fillIngredients: fillIngredients.toString(),
      sort,
    });

    // Add query if provided
    if (query.trim()) {
      urlParams.append('query', query.trim());
    }

    // Add direct ingredient filtering (takes precedence over enhanced filters)
    if (includeIngredients.trim()) {
      urlParams.append('includeIngredients', includeIngredients.trim());
    }
    if (excludeIngredients.trim()) {
      urlParams.append('excludeIngredients', excludeIngredients.trim());
    }

    // Add diet filters
    if (diet) {
      const diets = diet.split(',').map(d => d.trim());
      urlParams.append('diet', diets.join(','));
      
      // If enhanced filtering is enabled, add comprehensive filters
      if (enhanced) {
        // Add time constraints
        urlParams.append('maxReadyTime', maxReadyTime);
        
        // Add quality filters
        if (instructionsRequired) {
          urlParams.append('instructionsRequired', 'true');
        }
        if (ranking) {
          urlParams.append('ranking', ranking);
        }
        if (addRecipeNutrition) {
          urlParams.append('addRecipeNutrition', 'true');
        }
        
        // Add diet-specific enhanced filters for the first diet (only if no direct ingredient filters)
        const primaryDiet = diets[0].toLowerCase();
        if (SPOONACULAR_DIETS[primaryDiet]?.enhancedFilters && !includeIngredients && !excludeIngredients) {
          const filters = SPOONACULAR_DIETS[primaryDiet].enhancedFilters;
          
          if (filters.includeIngredients) {
            urlParams.append('includeIngredients', filters.includeIngredients);
          }
          if (filters.excludeIngredients) {
            urlParams.append('excludeIngredients', filters.excludeIngredients);
          }
          if (filters.type) {
            urlParams.append('type', filters.type);
          }
          if (filters.maxCarbs) {
            urlParams.append('maxCarbs', filters.maxCarbs);
          }
        }
      }
    }

    const apiUrl = `${baseUrl}?${urlParams.toString()}`;
    
    console.log('Making Spoonacular API request:', apiUrl);

    // Make API request
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process and enhance results
    const enhancedResults = data.results?.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      summary: recipe.summary,
      diets: recipe.diets || [],
      dishTypes: recipe.dishTypes || [],
      nutrition: recipe.nutrition,
      healthScore: recipe.healthScore,
      spoonacularScore: recipe.spoonacularScore,
      extendedIngredients: recipe.extendedIngredients || [],
      sourceUrl: recipe.sourceUrl,
      spoonacularSourceUrl: recipe.spoonacularSourceUrl,
      // Additional metadata
      vegetarian: recipe.vegetarian,
      vegan: recipe.vegan,
      glutenFree: recipe.glutenFree,
      dairyFree: recipe.dairyFree,
      veryHealthy: recipe.veryHealthy,
      cheap: recipe.cheap,
      veryPopular: recipe.veryPopular,
      sustainable: recipe.sustainable,
      lowFodmap: recipe.lowFodmap,
      weightWatcherSmartPoints: recipe.weightWatcherSmartPoints,
      gaps: recipe.gaps,
      preparationMinutes: recipe.preparationMinutes,
      cookingMinutes: recipe.cookingMinutes,
      aggregateLikes: recipe.aggregateLikes,
      creditsText: recipe.creditsText,
      license: recipe.license,
      sourceName: recipe.sourceName,
      pricePerServing: recipe.pricePerServing
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        results: enhancedResults,
        offset: data.offset,
        number: data.number,
        totalResults: data.totalResults
      },
      searchParams: {
        query,
        diet,
        enhanced,
        number: parseInt(number),
        sort,
        maxReadyTime: enhanced ? maxReadyTime : null,
        instructionsRequired: enhanced ? instructionsRequired : null,
        ranking: enhanced ? ranking : null
      }
    });

  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}