/**
 * Stream Chat Token Service
 * 
 * This service handles secure token generation for Stream Chat.
 * In production, this should call your backend API endpoint.
 */

import { supabase } from './supabase';

interface TokenResponse {
  token: string;
  userId: string;
  expiresAt?: number;
}

/**
 * Generate a Stream Chat token for the authenticated user
 * 
 * @param userId - The user ID to generate a token for
 * @returns Promise<string> - The Stream Chat token
 */
export async function generateStreamToken(userId: string): Promise<string> {
  try {
    // Get current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    // TODO: Replace with your backend endpoint
    // For now, we'll need to use a Supabase Edge Function or external API
    
    // Example backend endpoint call:
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/stream-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error(`Token generation failed: ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();
    return data.token;
    
  } catch (error) {
    console.error('❌ StreamTokenService: Failed to generate token:', error);
    throw error;
  }
}

/**
 * Temporary fallback for development
 * This uses a workaround until proper backend is set up
 */
export async function generateStreamTokenFallback(userId: string): Promise<string> {
  console.warn('⚠️ Using fallback token generation - NOT FOR PRODUCTION');
  
  try {
    // Option 1: Call a Supabase Edge Function if you have one set up
    const { data, error } = await supabase.functions.invoke('generate-stream-token', {
      body: { userId }
    });
    
    if (error) throw error;
    return data.token;
    
  } catch (edgeFunctionError) {
    console.error('❌ Edge function failed:', edgeFunctionError);
    
    // Option 2: If you have no backend yet, return an error message
    throw new Error(
      'Backend token generation not configured. ' +
      'Please set up a backend endpoint or enable development tokens in Stream Chat dashboard.'
    );
  }
}
