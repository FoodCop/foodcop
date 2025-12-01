// Authentication types for Vite app
export interface AuthUser {
  id: string;
  email: string | undefined;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
  // Extended user profile fields from Supabase users table
  username?: string;
  bio?: string;
  location_city?: string;
  location_country?: string;
  location_state?: string;
  total_points?: number;
  followers_count?: number;
  following_count?: number;
  dietary_preferences?: string[];
  cuisine_preferences?: string[];
  preferences_hint_shown?: boolean;
  is_masterbot?: boolean;
  updated_at?: string;
}

export interface AuthStatus {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface SessionData {
  user: AuthUser;
  session: Record<string, unknown>;
  expires_at?: string;
}