import axios from 'axios';
import config from '../config/config';

export const SpoonacularService = {
  async searchRecipes(query: string, number = 10) {
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
          query,
          number,
          apiKey: config.spoonacular.apiKey,
          addRecipeInformation: true, // Include detailed recipe information
          fillIngredients: true, // Include ingredients information
          addRecipeNutrition: false, // Don't include nutrition to save API credits
          instructionsRequired: true, // Only return recipes with instructions
          sort: 'popularity', // Sort by popularity for better results
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

  async getRecipeInformation(id: number) {
    try {
      const path = config.spoonacular.endpoints.recipeInformation.replace('{id}', String(id));
      const res = await axios.get(`${config.spoonacular.baseUrl}${path}`, {
        params: {
          apiKey: config.spoonacular.apiKey,
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getRecipeInformation error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default SpoonacularService;