import axios from 'axios';
import config from '../config/config';
import { supabase } from './supabase';

// Use Supabase Edge Function proxy for Spoonacular API to keep API key secure
const SPOONACULAR_PROXY_URL = `${config.supabase.url}/functions/v1/make-server-5976446e`;

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
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await axios.post(
        `${SPOONACULAR_PROXY_URL}/spoonacular/recipes/search`,
        {
          ...params,
          number: params.number || 12,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || config.supabase.anonKey}`,
          },
          timeout: config.api.timeout,
        }
      );

      // Check for Spoonacular API errors
      if (res.data.message) {
        return { success: false, error: res.data.message };
      }

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular searchRecipes error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Invalid API key. Please check your Spoonacular API key.' };
        } else if (error.response?.status === 402) {
          return { success: false, error: 'API quota exceeded. Please check your Spoonacular plan.' };
        } else if (error.response?.data?.error) {
          return { success: false, error: error.response.data.error };
        }
      }
      
      return { success: false, error: (error as Error).message };
    }
  },

  async getRecipeInformation(id: number, includeNutrition = true) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await axios.post(
        `${SPOONACULAR_PROXY_URL}/spoonacular/recipes/${id}`,
        { includeNutrition },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || config.supabase.anonKey}`,
          },
          timeout: config.api.timeout,
        }
      );

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getRecipeInformation error:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: (error as Error).message };
    }
  },

  async getRandomRecipes(number = 10, tags?: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await axios.post(
        `${SPOONACULAR_PROXY_URL}/spoonacular/recipes/random`,
        { number, tags },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || config.supabase.anonKey}`,
          },
          timeout: config.api.timeout,
        }
      );

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getRandomRecipes error:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: (error as Error).message };
    }
  },

  async getSimilarRecipes(id: number, number = 4) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await axios.post(
        `${SPOONACULAR_PROXY_URL}/spoonacular/recipes/${id}/similar`,
        { number },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || config.supabase.anonKey}`,
          },
          timeout: config.api.timeout,
        }
      );

      return { success: true, data: res.data };
    } catch (error) {
      console.error('Spoonacular getSimilarRecipes error:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: (error as Error).message };
    }
  },
};

export default SpoonacularService;