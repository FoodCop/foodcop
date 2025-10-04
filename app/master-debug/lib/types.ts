export interface APIStatus {
  connected: boolean;
  responseTime?: number;
  error?: string;
  lastChecked: Date;
  data?: any;
}

export interface EnvironmentStatus {
  supabase: boolean;
  supabaseUrl: boolean;
  supabaseAnonKey: boolean;
  supabaseServiceKey: boolean;
  googleMaps: boolean;
  googleClientId: boolean;
  googleClientSecret: boolean;
  openai: boolean;
  spoonacular: boolean;
  youtube: boolean;
  stream: boolean;
}

export interface AuthStatus {
  supabaseAuth: boolean;
  googleOAuth: boolean;
  currentUser: any;
  sessionValid: boolean;
  error?: string;
}

export interface DatabaseStatus {
  connection: boolean;
  tablesCount: number;
  userCount: number;
  error?: string;
}

export interface PerformanceStatus {
  cacheHitRate: number;
  averageResponseTime: number;
  apiCallsLast5Min: number;
  error?: string;
}

export interface SystemHealth {
  environment: EnvironmentStatus;
  apis: {
    supabase: APIStatus;
    googleMaps: APIStatus;
    googlePlaces: APIStatus;
    openai: APIStatus;
    spoonacular: APIStatus;
    youtube: APIStatus;
    supabaseStorage: APIStatus;
  };
  auth: AuthStatus;
  database: DatabaseStatus;
  performance: PerformanceStatus;
  timestamp: Date;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  location: {
    lat: number;
    lng: number;
  };
  types?: string[];
}

export interface RecipeSearchResult {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
}

export interface GeocodingResult {
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  components: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
}

export interface DebugTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: Date;
}