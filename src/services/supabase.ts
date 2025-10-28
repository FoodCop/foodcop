import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import type { User, LoginForm, SignupForm } from '../types';
// Import new services for compatibility
import { AuthService } from './authService';

// Debug Supabase configuration
console.log('🔧 Supabase Config Check:', {
  url: config.supabase.url ? `${config.supabase.url.substring(0, 20)}...` : 'MISSING',
  anonKey: config.supabase.anonKey ? `${config.supabase.anonKey.substring(0, 20)}...` : 'MISSING',
  hasUrl: !!config.supabase.url,
  hasAnonKey: !!config.supabase.anonKey
});

// Initialize Supabase client - SHARED INSTANCE with explicit session persistence
const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'fuzo-auth-session',
    storage: window.localStorage
  }
});

console.log('✅ Supabase client created with session persistence enabled');

/**
 * Legacy SupabaseService - Updated to work with new architecture
 * @deprecated Consider using the new dedicated services instead:
 * - AuthService for authentication
 * - PlateService for save-to-plate functionality
 * - ProfileService for user profiles
 * - GeocodingService for location services
 * - IdempotencyService for operation deduplication
 */
export class SupabaseService {
  // Authentication Methods - Delegated to AuthService
  static async signUp({ email, password, name }: SignupForm) {
    const result = await AuthService.signUp({ email, password, name });
    return result.success ? { success: true, data: result.data } : result;
  }

  static async signIn({ email, password }: LoginForm) {
    const result = await AuthService.signIn({ email, password });
    return result.success ? { success: true, data: result.data } : result;
  }

  static async signInWithGoogle() {
    const result = await AuthService.signInWithGoogle();
    return result.success ? { success: true, data: result.data } : result;
  }

  static async signOut() {
    const result = await AuthService.signOut();
    return result.success ? { success: true } : result;
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const authUser = await AuthService.getCurrentUser();
      
      if (!authUser) return null;

      // Try to get additional profile data
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }

      // Return user data combining auth and profile information
      return {
        id: authUser.id,
        email: authUser.email!,
        name: profile?.display_name || authUser.name || '',
        avatar_url: profile?.avatar_url || authUser.avatar_url,
        points: profile?.points || 0,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // User Profile Methods - For backward compatibility
  static async updateProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  }

  // Points System Methods
  static async getUserPoints(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.points || 0;
    } catch (error) {
      console.error('Get user points error:', error);
      return 0;
    }
  }

  static async addPoints(points: number, description: string, referenceId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Add points transaction
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points,
          type: 'earned',
          description,
          reference_id: referenceId,
        });

      if (transactionError) throw transactionError;

      // Update user's total points
      const { error: updateError } = await supabase
        .rpc('increment_user_points', {
          user_id: user.id,
          points_to_add: points,
        });

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Add points error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add points' 
      };
    }
  }

  // Database Methods
  static async insert(table: string, data: Record<string, unknown>) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error(`Insert error for ${table}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Insert failed' 
      };
    }
  }

  static async update(table: string, id: string, updates: Record<string, unknown>) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error(`Update error for ${table}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  }

  static async delete(table: string, id: string) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Delete error for ${table}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  static async fetch(table: string, id?: string) {
    try {
      if (id) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await supabase
          .from(table)
          .select('*');
        
        if (error) throw error;
        return { success: true, data };
      }
    } catch (error) {
      console.error(`Fetch error for ${table}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Fetch failed' 
      };
    }
  }

  // Real-time subscriptions
  static subscribeToAuth(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // File Upload Methods
  static async uploadFile(bucket: string, path: string, file: File) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('File upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'File upload failed' 
      };
    }
  }

  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}

export { supabase };
export default SupabaseService;