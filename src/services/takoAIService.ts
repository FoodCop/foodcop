/**
 * TakoAI Service
 * Food expert AI assistant with function calling for restaurant search
 */

import { backendService, formatGooglePlaceResult } from './backendService';
import { GeocodingService } from './geocodingService';
import config from '../config/config';
import { supabase } from './supabase';

export interface RestaurantCardData {
  id: string;
  name: string;
  location: string;
  distance?: string;
  cuisine: string;
  imageUrl?: string;
  placeId: string;
  lat?: number;
  lng?: number;
}

export interface TakoAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface TakoAIResponse {
  message: string;
  functionCall?: {
    name: string;
    arguments: any;
  };
  restaurants?: RestaurantCardData[];
}

const SYSTEM_PROMPT = `You are TakoAI, a friendly and knowledgeable food expert assistant integrated into the FUZO Food Discovery app. Your role is to help users discover restaurants, plan meals, and get personalized food recommendations.

Key Guidelines:
1. Be conversational, friendly, and helpful
2. When users ask about restaurants (e.g., "find sushi restaurants", "where can I get pizza"), use the search_restaurants function
3. ALWAYS ask for confirmation before showing restaurant results: "I found X restaurants nearby. Would you like me to show them?"
4. For meal suggestions (e.g., "what should I have for dinner"), provide creative and helpful recommendations based on context
5. Keep responses concise but informative
6. If you don't have enough information (like location), ask the user politely

When searching for restaurants:
- Use the search_restaurants function with the cuisine type or restaurant name
- If location is not provided, ask the user for their location or use a default search
- Always confirm before displaying results`;

// Use Supabase Edge Function proxy for OpenAI API to keep API key secure
const OPENAI_PROXY_URL = `${config.supabase.url}/functions/v1/openai-proxy`;

// Convert to modern tools format (for OpenAI API v1)
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_restaurants',
      description: 'Search for restaurants by cuisine type, name, or location. Use this when the user asks about finding restaurants, places to eat, or specific cuisines.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Cuisine type (e.g., "sushi", "italian", "pizza") or restaurant name to search for',
          },
          location: {
            type: 'object',
            description: 'Optional user location coordinates',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
          },
          radius: {
            type: 'number',
            description: 'Search radius in kilometers (default: 5km)',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
  },
];

// Legacy format for backward compatibility (if needed)
const FUNCTION_SCHEMAS = [
  {
    name: 'search_restaurants',
    description: 'Search for restaurants by cuisine type, name, or location. Use this when the user asks about finding restaurants, places to eat, or specific cuisines.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Cuisine type (e.g., "sushi", "italian", "pizza") or restaurant name to search for',
        },
        location: {
          type: 'object',
          description: 'Optional user location coordinates',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
        radius: {
          type: 'number',
          description: 'Search radius in kilometers (default: 5km)',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
];

export class TakoAIService {
  /**
   * Get user's current location
   */
  private static async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      const location = await GeocodingService.getCurrentLocation();
      if (location) {
        return { lat: location.latitude, lng: location.longitude };
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
    return null;
  }

  /**
   * Search restaurants using backend service
   */
  private static async searchRestaurants(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5
  ): Promise<RestaurantCardData[]> {
    try {
      let result;
      const radiusMeters = radius * 1000;

      if (location) {
        // Use text search with location bias
        result = await backendService.searchPlacesByText(
          `${query} restaurant`,
          location
        );
      } else {
        // Try to get user location first
        const userLocation = await this.getUserLocation();
        if (userLocation) {
          result = await backendService.searchPlacesByText(
            `${query} restaurant`,
            userLocation
          );
        } else {
          // Fallback to nearby search with default location or text search
          const defaultLocation = { lat: 37.7849, lng: -122.4094 }; // San Francisco default
          result = await backendService.searchPlacesByText(
            `${query} restaurant`,
            defaultLocation
          );
        }
      }

      if (!result.success || !result.data?.results) {
        console.error('Restaurant search failed:', result.error);
        return [];
      }

      // Format results for display
      const searchLocation = location || (await this.getUserLocation()) || { lat: 37.7849, lng: -122.4094 };
      const restaurants = result.data.results
        .slice(0, 10) // Limit to 10 results
        .map((place: any) => {
          const formatted = formatGooglePlaceResult(place, searchLocation);
          return {
            id: formatted.id,
            name: formatted.name,
            location: formatted.address,
            distance: formatted.distance ? `${formatted.distance.toFixed(1)} km away` : undefined,
            cuisine: Array.isArray(formatted.cuisine) 
              ? formatted.cuisine[0] || 'Restaurant'
              : formatted.cuisine || 'Restaurant',
            imageUrl: formatted.image,
            placeId: formatted.placeId,
            lat: formatted.lat,
            lng: formatted.lng,
          } as RestaurantCardData;
        });

      return restaurants;
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }

  /**
   * Handle function call execution
   */
  private static async executeFunction(
    functionName: string,
    args: any
  ): Promise<{ content: string; restaurants?: RestaurantCardData[] }> {
    switch (functionName) {
      case 'search_restaurants': {
        const { query, location, radius = 5 } = args;
        const restaurants = await this.searchRestaurants(query, location, radius);
        
        if (restaurants.length === 0) {
          return {
            content: `I couldn't find any ${query} restaurants nearby. Would you like to try a different search?`,
          };
        }

        return {
          content: `I found ${restaurants.length} ${query} restaurant${restaurants.length > 1 ? 's' : ''} nearby. Would you like me to show them?`,
          restaurants,
        };
      }
      default:
        return {
          content: 'I encountered an error processing your request. Please try again.',
        };
    }
  }

  /**
   * Make OpenAI API call (via proxy or direct)
   */
  private static async makeOpenAICall(
    messages: any[],
    tools?: any[],
    tool_choice: string = 'auto'
  ): Promise<any> {
    const apiKey = config.openai.apiKey;
    const useProxy = !apiKey || config.supabase.url; // Use proxy if no local key or if Supabase is configured

    const requestBody: any = {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    if (tools) {
      requestBody.tools = tools;
      requestBody.tool_choice = tool_choice;
    }

    if (useProxy && config.supabase.url) {
      // Use Supabase Edge Function proxy
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(OPENAI_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.supabase.anonKey,
          'Authorization': `Bearer ${session?.access_token || config.supabase.anonKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorData.error || ''}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'OpenAI API error');
      }

      return data.data;
    } else {
      // Direct API call (for local development)
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY or configure Supabase proxy.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorData.error?.message || ''}`);
      }

      return await response.json();
    }
  }

  /**
   * Send message to TakoAI and get response
   */
  static async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string,
    userPreferences?: { dietary_preferences?: string[]; cuisine_preferences?: string[] }
  ): Promise<TakoAIResponse> {
    try {
      // Build conversation messages
      const conversationMessages: TakoAIMessage[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPT + (userPreferences 
            ? `\n\nUser Preferences:\n- Dietary: ${userPreferences.dietary_preferences?.join(', ') || 'None'}\n- Cuisine: ${userPreferences.cuisine_preferences?.join(', ') || 'None'}`
            : ''),
        },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      // First API call - check for tool calls
      const data = await this.makeOpenAICall(conversationMessages, TOOLS, 'auto');
      const assistantMessage = data.choices[0]?.message;

      if (!assistantMessage) {
        throw new Error('No response from OpenAI');
      }

      // Check if tool call was requested (new format)
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

        // Execute function
        const functionResult = await this.executeFunction(functionName, functionArgs);

        // Second API call - send function result back to get final response
        const finalData = await this.makeOpenAICall(
          [
            ...conversationMessages,
            assistantMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult.content),
            },
          ],
          undefined, // No tools in second call
          undefined
        );

        const finalMessage = finalData.choices[0]?.message?.content || functionResult.content;

        return {
          message: finalMessage,
          functionCall: {
            name: functionName,
            arguments: functionArgs,
          },
          restaurants: functionResult.restaurants,
        };
      }

      // Check for legacy function_call format (backward compatibility)
      if (assistantMessage.function_call) {
        const functionName = assistantMessage.function_call.name;
        const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');

        // Execute function
        const functionResult = await this.executeFunction(functionName, functionArgs);

        // Second API call - send function result back to get final response
        const finalData = await this.makeOpenAICall(
          [
            ...conversationMessages,
            assistantMessage,
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResult.content),
            },
          ],
          undefined,
          undefined
        );

        const finalMessage = finalData.choices[0]?.message?.content || functionResult.content;

        return {
          message: finalMessage,
          functionCall: {
            name: functionName,
            arguments: functionArgs,
          },
          restaurants: functionResult.restaurants,
        };
      }

      // No function/tool call - return text response
      return {
        message: assistantMessage.content || 'Sorry, I couldn\'t generate a response.',
      };
    } catch (error) {
      console.error('TakoAI chat error:', error);
      return {
        message: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please try again.`
          : 'Sorry, I encountered an error. Please try again.',
      };
    }
  }
}

export default TakoAIService;

