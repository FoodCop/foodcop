import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from './supabase/client';

interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  accuracy: number | null;
}

interface RestaurantData {
  name: string;
  cuisine: string;
  rating: number;
  description: string;
}

interface SavePhotoParams {
  imageData: string;
  metadata: PhotoMetadata;
  restaurant: RestaurantData;
}

// Mock mode flag - set to false when ready to use real Supabase
const MOCK_MODE = true;

/**
 * Saves a photo with restaurant data and geolocation to Supabase
 * Currently in MOCK mode - logs data to console
 */
export async function savePhoto(params: SavePhotoParams) {
  const { imageData, metadata, restaurant } = params;

  if (MOCK_MODE) {
    // Mock implementation
    console.log('📸 MOCK: Saving photo to Supabase...');
    console.log('Image size:', imageData.length, 'bytes');
    console.log('Metadata:', metadata);
    console.log('Restaurant:', restaurant);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      photoId: `mock-${Date.now()}`,
      message: 'Photo saved successfully (MOCK)'
    };
  }

  // Real Supabase implementation (ready for when you switch MOCK_MODE to false)
  try {
    const supabase = createClient();

    // 1. Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // 2. Upload to Supabase Storage
    const fileName = `snap-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('snap-photos') // Make sure this bucket exists
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('snap-photos')
      .getPublicUrl(fileName);

    // 4. Save metadata to database
    // Adjust table name and columns to match your schema
    const { data: dbData, error: dbError } = await supabase
      .from('photos') // Adjust table name
      .insert({
        image_url: publicUrl,
        restaurant_name: restaurant.name,
        cuisine_type: restaurant.cuisine,
        rating: restaurant.rating,
        description: restaurant.description,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        location_accuracy: metadata.accuracy,
        captured_at: metadata.timestamp.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return {
      success: true,
      photoId: dbData.id,
      message: 'Photo saved successfully'
    };

  } catch (error) {
    console.error('Error saving photo:', error);
    return {
      success: false,
      photoId: null,
      message: error instanceof Error ? error.message : 'Failed to save photo'
    };
  }
}

/**
 * Fetches user's photo stats for gamification
 * Currently in MOCK mode
 */
export async function getUserStats(userId?: string) {
  if (MOCK_MODE) {
    console.log('📊 MOCK: Fetching user stats...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalPhotos: 42,
      points: 420,
      level: 5,
      restaurantsVisited: 28
    };
  }

  // Real implementation
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-906257ef/user-stats`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}
