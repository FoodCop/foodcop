import type { 
  SystemHealth, 
  APIStatus, 
  DebugTestResult, 
  SearchResult, 
  RecipeSearchResult, 
  GeocodingResult 
} from './types';

class DebugServiceClass {
  private cache = new Map<string, { data: any; timestamp: Date; ttl: number }>();
  
  private async fetchWithCache(url: string, ttl: number = 30000): Promise<any> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
      return cached.data;
    }
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: new Date(),
        ttl
      });
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    // Fetch all health data in parallel
    const [
      envVars,
      supabaseStatus,
      googleMapsStatus,
      googlePlacesStatus,
      openaiStatus,
      spoonacularStatus,
      youtubeStatus,
      supabaseStorageStatus,
      oauthStatus,
      databaseTablesStatus
    ] = await Promise.allSettled([
      this.fetchWithCache('/api/debug/env-vars'),
      this.fetchWithCache('/api/debug/supabase'),
      this.fetchWithCache('/api/debug/google-maps'),
      this.fetchWithCache('/api/debug/google-places'),
      this.fetchWithCache('/api/debug/openai'),
      this.fetchWithCache('/api/debug/spoonacular'),
      this.fetchWithCache('/api/debug/youtube'),
      this.fetchWithCache('/api/debug/supabase-storage'),
      this.fetchWithCache('/api/debug/oauth'),
      this.fetchWithCache('/api/debug/database-tables')
    ]);

    const getAPIStatus = (result: PromiseSettledResult<any>): APIStatus => {
      if (result.status === 'fulfilled') {
        return {
          connected: result.value.success || false,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          data: result.value,
          error: result.value.error
        };
      } else {
        return {
          connected: false,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: result.reason?.message || 'Failed to connect'
        };
      }
    };

    // Extract environment status
    const environment = envVars.status === 'fulfilled' ? envVars.value.envVars : {};
    
    // Extract database info
    const databaseInfo = databaseTablesStatus.status === 'fulfilled' ? databaseTablesStatus.value : {};
    
    // Extract auth info
    const authInfo = oauthStatus.status === 'fulfilled' ? oauthStatus.value : {};
    
    return {
      environment: {
        supabase: !!environment.supabaseUrl && !!environment.supabaseAnonKey,
        supabaseUrl: !!environment.supabaseUrl,
        supabaseAnonKey: !!environment.supabaseAnonKey,
        supabaseServiceKey: !!environment.supabaseServiceKey,
        googleMaps: !!environment.googleMapsKey,
        googleClientId: !!environment.googleClientId,
        googleClientSecret: !!environment.googleClientSecret,
        openai: !!environment.openaiKey,
        spoonacular: !!environment.spoonacularKey,
        youtube: !!environment.youtubeApiKey,
        stream: !!environment.streamApiKey
      },
      apis: {
        supabase: getAPIStatus(supabaseStatus),
        googleMaps: getAPIStatus(googleMapsStatus),
        googlePlaces: getAPIStatus(googlePlacesStatus),
        openai: getAPIStatus(openaiStatus),
        spoonacular: getAPIStatus(spoonacularStatus),
        youtube: getAPIStatus(youtubeStatus),
        supabaseStorage: getAPIStatus(supabaseStorageStatus)
      },
      auth: {
        supabaseAuth: supabaseStatus.status === 'fulfilled' ? supabaseStatus.value.success : false,
        googleOAuth: authInfo.success || false,
        currentUser: supabaseStatus.status === 'fulfilled' ? supabaseStatus.value.auth?.user : null,
        sessionValid: supabaseStatus.status === 'fulfilled' ? !!supabaseStatus.value.auth?.user : false,
        error: authInfo.error
      },
      database: {
        connection: databaseInfo.success || false,
        tablesCount: databaseInfo.tableCount || 0,
        userCount: 0, // TODO: Add user count endpoint
        error: databaseInfo.error
      },
      performance: {
        cacheHitRate: this.getCacheHitRate(),
        averageResponseTime: Date.now() - startTime,
        apiCallsLast5Min: this.getRecentAPICallCount(),
        error: undefined
      },
      timestamp: new Date()
    };
  }

  async testEnvironmentVariables(): Promise<DebugTestResult> {
    try {
      const data = await this.fetchWithCache('/api/debug/env-vars');
      return {
        success: true,
        message: 'Environment variables checked successfully',
        data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check environment variables',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async testAuthentication(): Promise<DebugTestResult> {
    try {
      const [supabaseTest, oauthTest] = await Promise.all([
        this.fetchWithCache('/api/debug/supabase'),
        this.fetchWithCache('/api/debug/oauth')
      ]);

      return {
        success: supabaseTest.success && oauthTest.success,
        message: 'Authentication systems tested',
        data: { supabase: supabaseTest, oauth: oauthTest },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async searchRestaurants(query: string, location?: string): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({ query });
      if (location) params.append('location', location);
      
      const response = await fetch(`/api/debug/scout-restaurant-search?${params}`);
      const data = await response.json();
      
      return data.results || [];
    } catch (error) {
      console.error('Restaurant search failed:', error);
      return [];
    }
  }

  async searchRecipes(query: string): Promise<RecipeSearchResult[]> {
    try {
      const params = new URLSearchParams({ query });
      const response = await fetch(`/api/debug/spoonacular?${params}`);
      const data = await response.json();
      
      return data.results || [];
    } catch (error) {
      console.error('Recipe search failed:', error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const params = new URLSearchParams({ 
        lat: lat.toString(), 
        lng: lng.toString() 
      });
      const response = await fetch(`/api/debug/google-maps?${params}`);
      const data = await response.json();
      
      if (data.success && data.results?.[0]) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          location: { lat, lng },
          components: {
            street: result.address_components?.find((c: any) => c.types.includes('route'))?.long_name,
            city: result.address_components?.find((c: any) => c.types.includes('locality'))?.long_name,
            state: result.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name,
            country: result.address_components?.find((c: any) => c.types.includes('country'))?.long_name,
            postal_code: result.address_components?.find((c: any) => c.types.includes('postal_code'))?.long_name
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation failed:', error);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  private getCacheHitRate(): number {
    // Simple cache hit rate calculation
    const totalRequests = this.cache.size;
    if (totalRequests === 0) return 0;
    
    const validCacheEntries = Array.from(this.cache.values())
      .filter(entry => Date.now() - entry.timestamp.getTime() < entry.ttl).length;
    
    return Math.round((validCacheEntries / totalRequests) * 100);
  }

  private getRecentAPICallCount(): number {
    // In a real implementation, you'd track this properly
    // For now, return cache size as a proxy
    return this.cache.size;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const DebugService = new DebugServiceClass();