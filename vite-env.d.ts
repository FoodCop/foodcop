/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_YOUTUBE_API_KEY?: string;
  readonly YOUTUBE_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AUTH_REDIRECT_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_DEBUG_AUTH_FLOW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
