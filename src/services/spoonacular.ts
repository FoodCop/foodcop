import axios from 'axios';
import config from '../config/config';

interface SearchRecipesParams {
  query?: string;
  diet?: string;
  type?: string;
  cuisine?: string;
  maxReadyTime?: number;
  number?: number;
  offset?: number;
}

export const SpoonacularService = {
  async searchRecipes(params: SearchRecipesParams) {
    try {
      // Check if API key is available
      if (!config.spoonacular.apiKey) {
        console.warn('Spoonacular API key not found. Please set VITE_SPOONACULAR_API_KEY in your environment variables.');
        return { 
          success: false, 
          error: 'API key not configured. Please check your environment variables.' 
        };
      }

      const res = await axios.get(`${config.spoonacular.baseUrl}${config.spoonacular.endpoints.recipeSearch}`, {
        params: {
          ...params,
          number: params.number || 12,
          apiKey: config.spoonacular.apiKey,
          addRecipeInformation: true,
          fillIngredients: true,
          instructionsRequired: true,
          sort: 'popularity',
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular searchRecipes error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Invalid API key. Please check your Spoonacular API key.' };
        } else if (error.response?.status === 402) {
          return { success: false, error: 'API quota exceeded. Please check your Spoonacular plan.' };
        }
      }
      
      return { success: false, error: (error as Error).message };
    }
  },

  async getRecipeInformation(id: number, includeNutrition = true) {
    try {
      const path = config.spoonacular.endpoints.recipeInformation.replace('{id}', String(id));
      const res = await axios.get(`${config.spoonacular.baseUrl}${path}`, {
        params: {
          apiKey: config.spoonacular.apiKey,
          includeNutrition,
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getRecipeInformation error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async getRandomRecipes(number = 10, tags?: string) {
    try {
      if (!config.spoonacular.apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      const res = await axios.get(`${config.spoonacular.baseUrl}/recipes/random`, {
        params: {
          apiKey: config.spoonacular.apiKey,
          number,
          tags,
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getRandomRecipes error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async getSimilarRecipes(id: number, number = 4) {
    try {
      if (!config.spoonacular.apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      const res = await axios.get(`${config.spoonacular.baseUrl}/recipes/${id}/similar`, {
        params: {
          apiKey: config.spoonacular.apiKey,
          number,
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getSimilarRecipes error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default SpoonacularService;