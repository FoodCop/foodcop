export interface SettingsProfile {
  name: string;
  username: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  diet: string;
  cuisine: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  pinterest: string;
}

export interface UserSettingsRow {
  id: string;
  display_name: string | null;
  username: string | null;
  dietary_preferences: string[] | null;
  cuisine_preferences: string[] | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  pinterest_url: string | null;
}

export interface AuthContextUser {
  id?: string;
  email?: string;
  user_metadata?: Record<string, any>;
}
