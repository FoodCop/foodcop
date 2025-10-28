import { supabase } from './supabase';
import { config } from '../config/config';
import type { AuthUser, AuthStatus, LoginForm, SignupForm, AuthResponse } from '../types/auth';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Authentication service for Vite application
 * Provides authentication checks, user management, and session handling
 */
export class AuthService {
  /**
   * Check current authentication status
   */
  static async checkAuthStatus(): Promise<AuthStatus> {
    try {
      console.log('🔍 AuthService: Checking authentication status...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('🔍 AuthService: getUser result:', { user: user ? `User(${user.email})` : 'null', error });
      
      if (error || !user) {
        console.log('❌ AuthService: No authenticated user found');
        return { 
          success: false, 
          error: 'Authentication required',
          message: 'No user is currently authenticated'
        };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
        metadata: user.user_metadata
      };

      console.log('✅ AuthService: User authenticated successfully:', {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name
      });

      return {
        success: true,
        user: authUser,
        message: 'User is authenticated'
      };
    } catch (error) {
      console.error('❌ AuthService: Authentication check failed:', error);
      return {
        success: false,
        error: 'Authentication check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ensure user is authenticated, throw error if not
   */
  static async ensureAuthenticated(): Promise<AuthUser> {
    const authStatus = await this.checkAuthStatus();
    
    if (!authStatus.success || !authStatus.user) {
      throw new Error('User must be authenticated');
    }

    return authStatus.user;
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const authStatus = await this.checkAuthStatus();
      return authStatus.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign up new user with email and password
   */
  static async signUp({ email, password, name }: SignupForm): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      ErrorHandler.validateRequired(
        { email, password, name },
        ['email', 'password', 'name'],
        'user signup'
      );

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      });

      if (error) throw error;

      return { 
        success: true, 
        data,
        message: 'Account created successfully. Please check your email for verification.'
      };
    }, 'sign up user');
  }

  /**
   * Sign in user with email and password
   */
  static async signIn({ email, password }: LoginForm): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      ErrorHandler.validateRequired(
        { email, password },
        ['email', 'password'],
        'user signin'
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { 
        success: true, 
        data,
        message: 'Signed in successfully'
      };
    }, 'sign in user');
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      console.log('🔑 AuthService: Starting Google OAuth with redirect to:', config.app.url);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: config.app.url,
        },
      });

      if (error) throw error;

      return { 
        success: true, 
        data,
        message: 'Redirecting to Google authentication...'
      };
    }, 'Google signin');
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      return { 
        success: true,
        message: 'Signed out successfully'
      };
    }, 'sign out user');
  }

  /**
   * Reset user password
   */
  static async resetPassword(email: string): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      ErrorHandler.validateRequired(
        { email },
        ['email'],
        'password reset'
      );

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.app.url}/auth/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };
    }, 'reset password');
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      ErrorHandler.validateRequired(
        { newPassword },
        ['newPassword'],
        'password update'
      );

      // Ensure user is authenticated
      await this.ensureAuthenticated();

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully'
      };
    }, 'update password');
  }

  /**
   * Update user email
   */
  static async updateEmail(newEmail: string): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      ErrorHandler.validateRequired(
        { newEmail },
        ['newEmail'],
        'email update'
      );

      // Ensure user is authenticated
      await this.ensureAuthenticated();

      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Email update initiated. Please check both old and new email addresses for confirmation.'
      };
    }, 'update email');
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          metadata: session.user.user_metadata
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get the current session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Refresh the current session
   */
  static async refreshSession(): Promise<AuthResponse> {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Session refreshed successfully'
      };
    }, 'refresh session');
  }

  /**
   * Get the Supabase client instance (for advanced usage)
   */
  static getSupabaseClient() {
    return supabase;
  }
}