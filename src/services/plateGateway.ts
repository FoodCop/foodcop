import { config } from '../config/config';

/**
 * PlateGateway - Helper utility for sending data to the Plate component
 * 
 * This utility provides an idempotent interface for external components
 * to save content to a user's Plate profile.
 */

const BASE_URL = `https://${config.supabase.url.split('//')[1]}/functions/v1/make-server-6eeb9061`;

export interface Post {
  id?: string;
  content: string;
  image?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface Photo {
  id?: string;
  url: string;
  caption?: string;
  [key: string]: any;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  image?: string;
  prepTime?: string;
  difficulty?: string;
  [key: string]: any;
}

export interface Offer {
  id?: string;
  title: string;
  description: string;
  discount?: number;
  validUntil?: string;
  restaurant?: string;
  [key: string]: any;
}

export interface Video {
  id?: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
  [key: string]: any;
}

export interface CrewMember {
  id?: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  [key: string]: any;
}

export interface Place {
  id?: string;
  name: string;
  address: string;
  cuisine?: string;
  rating?: number;
  priceRange?: string;
  [key: string]: any;
}

export interface BatchSaveData {
  posts?: Post[];
  photos?: Photo[];
  recipes?: Recipe[];
  offers?: Offer[];
  videos?: Video[];
  crew?: CrewMember[];
  places?: Place[];
}

class PlateGateway {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Save a single post
   */
  async savePost(post: Post): Promise<{ success: boolean; post?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/posts/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(post),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save post');
      }

      // Notify Plate component to refresh
      this.notifyPlate('post-saved', data.post);
      
      return data;
    } catch (error) {
      console.error('Error saving post:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save a single photo
   */
  async savePhoto(photo: Photo): Promise<{ success: boolean; photo?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/photos/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(photo),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save photo');
      }

      this.notifyPlate('photo-saved', data.photo);
      
      return data;
    } catch (error) {
      console.error('Error saving photo:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save a single recipe
   */
  async saveRecipe(recipe: Recipe): Promise<{ success: boolean; recipe?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/recipes/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(recipe),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe');
      }

      this.notifyPlate('recipe-saved', data.recipe);
      
      return data;
    } catch (error) {
      console.error('Error saving recipe:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save a single offer
   */
  async saveOffer(offer: Offer): Promise<{ success: boolean; offer?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/offers/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(offer),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save offer');
      }

      this.notifyPlate('offer-saved', data.offer);
      
      return data;
    } catch (error) {
      console.error('Error saving offer:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save a single video
   */
  async saveVideo(video: Video): Promise<{ success: boolean; video?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/videos/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(video),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save video');
      }

      this.notifyPlate('video-saved', data.video);
      
      return data;
    } catch (error) {
      console.error('Error saving video:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save a crew member
   */
  async saveCrew(member: CrewMember): Promise<{ success: boolean; crew?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/crew/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(member),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save crew member');
      }

      this.notifyPlate('crew-saved', data.crew);
      
      return data;
    } catch (error) {
      console.error('Error saving crew member:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save a place
   */
  async savePlace(place: Place): Promise<{ success: boolean; place?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/places/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(place),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save place');
      }

      this.notifyPlate('place-saved', data.place);
      
      return data;
    } catch (error) {
      console.error('Error saving place:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Batch save multiple items at once (more efficient)
   */
  async batchSave(data: BatchSaveData): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/batch-save/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to batch save');
      }

      this.notifyPlate('batch-saved', result.results);
      
      return result;
    } catch (error) {
      console.error('Error in batch save:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Notify the Plate component that new data was saved
   * Uses custom events for in-page communication
   */
  private notifyPlate(eventType: string, data: any) {
    const event = new CustomEvent('plate-data-update', {
      detail: {
        type: eventType,
        userId: this.userId,
        data,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Create a PlateGateway instance for a specific user
 */
export function createPlateGateway(userId: string): PlateGateway {
  return new PlateGateway(userId);
}

/**
 * Direct API for simple one-off saves without creating a gateway instance
 */
export const plateAPI = {
  async savePost(userId: string, post: Post) {
    return createPlateGateway(userId).savePost(post);
  },
  
  async savePhoto(userId: string, photo: Photo) {
    return createPlateGateway(userId).savePhoto(photo);
  },
  
  async saveRecipe(userId: string, recipe: Recipe) {
    return createPlateGateway(userId).saveRecipe(recipe);
  },
  
  async saveOffer(userId: string, offer: Offer) {
    return createPlateGateway(userId).saveOffer(offer);
  },
  
  async saveVideo(userId: string, video: Video) {
    return createPlateGateway(userId).saveVideo(video);
  },
  
  async saveCrew(userId: string, member: CrewMember) {
    return createPlateGateway(userId).saveCrew(member);
  },
  
  async savePlace(userId: string, place: Place) {
    return createPlateGateway(userId).savePlace(place);
  },
  
  async batchSave(userId: string, data: BatchSaveData) {
    return createPlateGateway(userId).batchSave(data);
  },
};
