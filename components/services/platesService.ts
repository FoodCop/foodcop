import { projectId, publicAnonKey } from "../../utils/supabase/info";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5976446e`;

export interface PlateRestaurant {
  id: string;
  place_id: string;
  name: string;
  image: string | null;
  rating: number;
  cuisine: string;
  price: string;
  location: string;
  savedAt: string;
  geometry?: any;
}

export interface PlatePhoto {
  id: string;
  image: string;
  caption: string;
  tags: string[];
  points: number;
  likes: number;
  uploadedAt: string;
  location?: string | null;
}

class PlatesService {
  private async getAuthToken(): Promise<string> {
    try {
      // Dynamically import to avoid circular dependencies
      const { default: supabaseClient } = await import(
        "../../utils/supabase/client"
      );

      if (!supabaseClient) {
        throw new Error("Supabase client is not available");
      }

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session?.access_token) {
        return session.access_token;
      }
    } catch (error) {
      console.warn("Could not get auth token, using anon key:", error);
    }

    return publicAnonKey;
  }

  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ) {
    const authToken = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Restaurant methods
  async saveRestaurant(restaurant: any): Promise<{
    success: boolean;
    message: string;
    savedRestaurant?: PlateRestaurant;
  }> {
    console.log("💾 Saving restaurant to plates:", restaurant.name);

    try {
      const result = await this.makeAuthenticatedRequest(
        "/profile/save-restaurant",
        {
          method: "POST",
          body: JSON.stringify({ restaurant }),
        }
      );

      console.log("✅ Restaurant saved to plates:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to save restaurant to plates:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to save restaurant",
      };
    }
  }

  async unsaveRestaurant(
    placeId: string
  ): Promise<{ success: boolean; message: string }> {
    console.log("🗑️ Removing restaurant from plates:", placeId);

    try {
      const result = await this.makeAuthenticatedRequest(
        `/profile/unsave-restaurant/${placeId}`,
        {
          method: "DELETE",
        }
      );

      console.log("✅ Restaurant removed from plates:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to remove restaurant from plates:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove restaurant",
      };
    }
  }

  async getSavedRestaurants(): Promise<PlateRestaurant[]> {
    console.log("📋 Getting restaurants from plates");

    try {
      const result = await this.makeAuthenticatedRequest(
        "/profile/saved-restaurants"
      );
      console.log("✅ Retrieved restaurants from plates:", result.totalCount);
      return result.restaurants || [];
    } catch (error) {
      console.error("❌ Failed to get restaurants from plates:", error);
      return [];
    }
  }

  async isRestaurantSaved(placeId: string): Promise<boolean> {
    try {
      const result = await this.makeAuthenticatedRequest(
        `/profile/is-restaurant-saved/${placeId}`
      );
      return result.isSaved || false;
    } catch (error) {
      console.error("❌ Failed to check restaurant saved status:", error);
      return false;
    }
  }

  // Photo methods
  async savePhoto(photo: {
    image: string;
    caption: string;
    tags?: string[];
    points?: number;
    location?: string | null;
  }): Promise<{ success: boolean; message: string; savedPhoto?: PlatePhoto }> {
    console.log("📷 Saving photo to plates:", photo.caption);

    try {
      const result = await this.makeAuthenticatedRequest(
        "/profile/save-photo",
        {
          method: "POST",
          body: JSON.stringify({ photo }),
        }
      );

      console.log("✅ Photo saved to plates:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to save photo to plates:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to save photo",
      };
    }
  }

  async getSavedPhotos(): Promise<PlatePhoto[]> {
    console.log("🖼️ Getting photos from plates");

    try {
      const result = await this.makeAuthenticatedRequest(
        "/profile/saved-photos"
      );
      console.log("✅ Retrieved photos from plates:", result.totalCount);
      return result.photos || [];
    } catch (error) {
      console.error("❌ Failed to get photos from plates:", error);
      return [];
    }
  }

  // Convenience methods
  async getPlatesCount(): Promise<{ restaurants: number; photos: number }> {
    try {
      const [restaurants, photos] = await Promise.all([
        this.getSavedRestaurants(),
        this.getSavedPhotos(),
      ]);

      return {
        restaurants: restaurants.length,
        photos: photos.length,
      };
    } catch (error) {
      console.error("❌ Failed to get plates count:", error);
      return { restaurants: 0, photos: 0 };
    }
  }
}

// Export singleton instance
export const platesService = new PlatesService();

// Legacy export for backward compatibility
export const savedItemsService = platesService;
export type SavedRestaurant = PlateRestaurant;
export type SavedPhoto = PlatePhoto;
