// Centralized Debug Service
// Checks all API keys and connections once and caches the results

export interface DebugStatus {
  envVars: {
    supabaseUrl: boolean;
    supabaseAnonKey: boolean;
    supabaseServiceKey: boolean;
    googleMapsKey: boolean;
    googleClientId: boolean;
    googleClientSecret: boolean;
    spoonacularKey: boolean;
    openaiKey: boolean;
    youtubeApiKey: boolean;
  };
  connections: {
    supabase: boolean;
    supabaseStorage: boolean;
    googleMaps: boolean;
    googlePlaces: boolean;
    spoonacular: boolean;
    openai: boolean;
    youtube: boolean;
    oauth: boolean;
  };
  errors: {
    [key: string]: string;
  };
  lastChecked: Date;
}

class DebugService {
  private static instance: DebugService;
  private debugStatus: DebugStatus | null = null;
  private isLoading: boolean = false;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService();
    }
    return DebugService.instance;
  }

  async getDebugStatus(): Promise<DebugStatus> {
    // Return cached result if still valid
    if (this.debugStatus && this.isCacheValid()) {
      return this.debugStatus;
    }

    // If already loading, wait for it
    if (this.isLoading) {
      return this.waitForLoad();
    }

    // Load fresh data
    this.isLoading = true;
    try {
      this.debugStatus = await this.loadDebugStatus();
      return this.debugStatus;
    } finally {
      this.isLoading = false;
    }
  }

  private isCacheValid(): boolean {
    if (!this.debugStatus) return false;
    const now = new Date().getTime();
    const lastChecked = this.debugStatus.lastChecked.getTime();
    return (now - lastChecked) < this.cacheExpiry;
  }

  private async waitForLoad(): Promise<DebugStatus> {
    while (this.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.debugStatus!;
  }

  private async loadDebugStatus(): Promise<DebugStatus> {
    const status: DebugStatus = {
      envVars: {
        supabaseUrl: false,
        supabaseAnonKey: false,
        supabaseServiceKey: false,
        googleMapsKey: false,
        googleClientId: false,
        googleClientSecret: false,
        spoonacularKey: false,
        openaiKey: false,
        youtubeApiKey: false,
      },
      connections: {
        supabase: false,
        supabaseStorage: false,
        googleMaps: false,
        googlePlaces: false,
        spoonacular: false,
        openai: false,
        youtube: false,
        oauth: false,
      },
      errors: {},
      lastChecked: new Date()
    };

    // Check environment variables
    try {
      const envResponse = await fetch("/api/debug/env-vars");
      const envData = await envResponse.json();
      
      status.envVars = {
        supabaseUrl: !!envData.envVars?.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!envData.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseServiceKey: !!envData.envVars?.SUPABASE_SERVICE_ROLE_KEY,
        googleMapsKey: !!envData.envVars?.GOOGLE_MAPS_API_KEY,
        googleClientId: !!envData.envVars?.GOOGLE_CLIENT_ID,
        googleClientSecret: !!envData.envVars?.GOOGLE_CLIENT_SECRET,
        spoonacularKey: !!envData.envVars?.SPOONACULAR_API_KEY,
        openaiKey: !!envData.envVars?.OPENAI_API_KEY,
        youtubeApiKey: !!envData.envVars?.YOUTUBE_API_KEY,
      };
    } catch (error) {
      status.errors.envVars = error instanceof Error ? error.message : "Failed to load environment variables";
      
      // Fallback to client-side check for public variables only
      status.envVars.supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      status.envVars.supabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }

    // Test all API connections in parallel
    const connectionTests = [
      this.testConnection("supabase", "/api/debug/supabase"),
      this.testConnection("supabaseStorage", "/api/debug/supabase-storage"),
      this.testConnection("googleMaps", "/api/debug/google-maps"),
      this.testConnection("googlePlaces", "/api/debug/google-places"),
      this.testConnection("spoonacular", "/api/debug/spoonacular"),
      this.testConnection("openai", "/api/debug/openai"),
      this.testConnection("youtube", "/api/debug/youtube"),
      this.testConnection("oauth", "/api/debug/oauth"),
    ];

    const results = await Promise.allSettled(connectionTests);
    
    results.forEach((result, index) => {
      const connectionName = ["supabase", "supabaseStorage", "googleMaps", "googlePlaces", "spoonacular", "openai", "youtube", "oauth"][index];
      
      if (result.status === "fulfilled") {
        status.connections[connectionName as keyof typeof status.connections] = result.value.success;
        if (result.value.error) {
          status.errors[connectionName] = result.value.error;
        }
      } else {
        status.connections[connectionName as keyof typeof status.connections] = false;
        status.errors[connectionName] = result.reason?.message || "Connection test failed";
      }
    });

    return status;
  }

  private async testConnection(name: string, endpoint: string): Promise<{success: boolean, error?: string}> {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      return {
        success: data.success,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // Force refresh the cache
  async refreshStatus(): Promise<DebugStatus> {
    this.debugStatus = null;
    return this.getDebugStatus();
  }

  // Get a summary of the overall system health
  getHealthSummary(status: DebugStatus): {
    envVarsConfigured: number;
    envVarsTotal: number;
    connectionsWorking: number;
    connectionsTotal: number;
    overallHealth: 'good' | 'warning' | 'error';
  } {
    const envVarsConfigured = Object.values(status.envVars).filter(Boolean).length;
    const envVarsTotal = Object.keys(status.envVars).length;
    const connectionsWorking = Object.values(status.connections).filter(Boolean).length;
    const connectionsTotal = Object.keys(status.connections).length;

    let overallHealth: 'good' | 'warning' | 'error' = 'good';
    
    if (envVarsConfigured < envVarsTotal * 0.5 || connectionsWorking < connectionsTotal * 0.5) {
      overallHealth = 'error';
    } else if (envVarsConfigured < envVarsTotal * 0.8 || connectionsWorking < connectionsTotal * 0.8) {
      overallHealth = 'warning';
    }

    return {
      envVarsConfigured,
      envVarsTotal,
      connectionsWorking,
      connectionsTotal,
      overallHealth
    };
  }
}

export const debugService = DebugService.getInstance();