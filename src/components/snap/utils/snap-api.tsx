import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from './supabase/client';
import { supabase } from '../../../services/supabase';

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

interface UploadImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Mock mode flag - set to false when ready to use real Supabase
const MOCK_MODE = false;

/**
 * Uploads image to Supabase Storage
 * Handles both base64 (from camera) and File objects (from upload)
 */
export async function uploadImage(imageData: string | File, fileName?: string): Promise<UploadImageResult> {
  try {
    // Generate unique file name if not provided
    const uniqueFileName = fileName || `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    let blob: Blob;
    let contentType = 'image/jpeg';

    // Handle base64 string (from camera)
    if (typeof imageData === 'string') {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: contentType });
    } else {
      // Handle File object (from file input)
      blob = imageData;
      contentType = imageData.type || 'image/jpeg';
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('snap-photos')
      .upload(uniqueFileName, blob, {
        contentType,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from('snap-photos')
      .getPublicUrl(uniqueFileName);

    return {
      success: true,
      imageUrl: data.publicUrl
    };
  } catch (error) {
    console.error('❌ Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
}

/**
 * Saves a photo with restaurant data and geolocation to Supabase
 * Properly uploads image to Storage and saves metadata to database
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

  try {
    // Step 1: Upload image to Supabase Storage
    console.log('📸 Uploading image to Supabase Storage...');
    const uploadResult = await uploadImage(imageData);
    
    if (!uploadResult.success || !uploadResult.imageUrl) {
      throw new Error(uploadResult.error || 'Failed to upload image');
    }

    console.log('✅ Image uploaded successfully:', uploadResult.imageUrl);

    // Step 2: Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Step 3: Save metadata to saved_items table
    console.log('💾 Saving snap metadata to database...');
    const snapMetadata = {
      image_url: uploadResult.imageUrl,
      restaurant_name: restaurant.name,
      cuisine_type: restaurant.cuisine,
      rating: restaurant.rating,
      description: restaurant.description,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      location_accuracy: metadata.accuracy,
      timestamp: metadata.timestamp.toISOString()
    };

    const { data: dbData, error: dbError } = await supabase
      .from('saved_items')
      .insert({
        user_id: user.id,
        item_id: `snap-${Date.now()}`,
        item_type: 'photo',
        metadata: snapMetadata
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('✅ Snap saved successfully:', dbData);

    return {
      success: true,
      photoId: dbData.id,
      message: 'Photo saved successfully'
    };

  } catch (error) {
    console.error('❌ Error saving photo:', error);
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
    console.log('MOCK: Fetching user stats...');
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
