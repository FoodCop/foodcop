/**
 * Google Places API Image Fetching Service
 * Based on Places API v1 implementation guide
 * Fetches real restaurant photos using place_id and Google Places API (v1)
 */

import { supabase } from './supabase';

const PLACES_API_V1 = 'https://places.googleapis.com/v1';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface PlacePhoto {
  name: string;
  authorAttributions?: PhotoAttribution[];
}

interface PlaceDetailsResponse {
  photos?: PlacePhoto[];
}

interface PhotoMediaResponse {
  name: string;
  photoUri: string;
}

interface PlaceImageResult {
  url: string | null;
  attributions: PhotoAttribution[];
}

/**
 * Attribution type for photos
 */
interface PhotoAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

/**
 * Review data from Google Places API
 */
interface PlaceReview {
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  rating?: number;
  text?: {
    text?: string;
    languageCode?: string;
  };
  originalText?: {
    text?: string;
    languageCode?: string;
  };
  relativePublishTimeDescription?: string;
  publishTime?: string;
}

/**
 * Operating hours from Google Places API
 */
interface PlaceOpeningHours {
  openNow?: boolean;
  periods?: Array<{
    open?: {
      day?: number;
      hour?: number;
      minute?: number;
    };
    close?: {
      day?: number;
      hour?: number;
      minute?: number;
    };
  }>;
  weekdayDescriptions?: string[];
}

/**
 * Complete place details interface
 */
interface PlaceDetailsResponse {
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  currentOpeningHours?: PlaceOpeningHours;
  regularOpeningHours?: PlaceOpeningHours;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  formattedAddress?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
  displayName?: {
    text?: string;
    languageCode?: string;
  };
}

/**
 * Processed restaurant details for UI
 */
interface RestaurantDetails {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  photos: Array<{
    url: string;
    reference: string;
    width: number;
    height: number;
    attributions?: PhotoAttribution[];
  }>;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    relativeTimeDescription: string;
    publishTime?: string;
  }>;
  hours?: {
    openNow?: boolean;
    weekdayText: string[];
  };
}

/**
 * Fetches a hero image for a restaurant using Google Places API v1
 * Implements proper caching with 3-day TTL to reduce API calls
 */
export async function getPlaceHeroImage(
  placeId: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    forceRefresh?: boolean;
  }
): Promise<PlaceImageResult> {
  if (!placeId) {
    throw new Error('placeId is required');
  }

  if (!API_KEY) {
    console.warn('Google Maps API key not found - cannot fetch real images');
    return { url: null, attributions: [] };
  }

  const maxWidth = options?.maxWidth ?? 1200;
  const maxHeight = options?.maxHeight ?? 800;

  try {
    // 1. Check cache first (unless force refresh)
    if (!options?.forceRefresh) {
      const cachedResult = await getCachedImage(placeId);
      if (cachedResult) {
        console.log(`📸 Using cached image for place ${placeId}`);
        return cachedResult;
      }
    }

    console.log(`📸 Fetching fresh image for place ${placeId}`);

    // 2. Fetch place details to get photo references
    const photos = await getPlacePhotos(placeId);
    if (!photos || photos.length === 0) {
      console.log(`📸 No photos found for place ${placeId}`);
      return { url: null, attributions: [] };
    }

    // 3. Get the first photo's media URL
    const photo = photos[0];
    const photoUrl = await getPhotoMediaUrl(photo.name, maxWidth, maxHeight);
    
    if (!photoUrl) {
      console.log(`📸 Failed to get photo URL for place ${placeId}`);
      return { url: null, attributions: [] };
    }

    const result: PlaceImageResult = {
      url: photoUrl,
      attributions: photo.authorAttributions || []
    };

    // 4. Cache the result
    await cacheImageResult(placeId, photo.name, photoUrl, result.attributions);

    console.log(`📸 Successfully fetched and cached image for place ${placeId}`);
    return result;

  } catch (error) {
    console.error(`📸 Error fetching image for place ${placeId}:`, error);
    return { url: null, attributions: [] };
  }
}

/**
 * Fetches place photos using Google Places API v1
 */
async function getPlacePhotos(placeId: string): Promise<PlacePhoto[]> {
  const url = `${PLACES_API_V1}/places/${encodeURIComponent(placeId)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'photos' // Only request photos to minimize response
    }
  });

  if (!response.ok) {
    throw new Error(`Place Details API failed with status: ${response.status}`);
  }

  const data: PlaceDetailsResponse = await response.json();
  return data.photos || [];
}

/**
 * Fetches the actual photo URL using Google Places API v1 Photo Media endpoint
 */
async function getPhotoMediaUrl(
  photoName: string,
  maxWidth: number,
  maxHeight: number
): Promise<string | null> {
  // Don't encode the photo name - it's already properly formatted
  const url = `${PLACES_API_V1}/${photoName}/media`;
  const params = new URLSearchParams({
    maxWidthPx: maxWidth.toString(),
    maxHeightPx: maxHeight.toString(),
    skipHttpRedirect: 'true', // Get JSON response with photoUri instead of redirect
    key: API_KEY
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Photo Media API failed with status: ${response.status}`);
  }

  const data: PhotoMediaResponse = await response.json();
  return data.photoUri || null;
}

/**
 * Checks cache for existing image data
 */
async function getCachedImage(placeId: string): Promise<PlaceImageResult | null> {
  try {
    const { data, error } = await supabase
      .from('place_media_cache')
      .select('photo_uri, attributions, updated_at')
      .eq('place_id', placeId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid (3 days)
    const cacheAge = Date.now() - new Date(data.updated_at).getTime();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

    if (cacheAge < threeDaysInMs && data.photo_uri) {
      return {
        url: data.photo_uri,
        attributions: data.attributions || []
      };
    }

    return null;
  } catch (error) {
    console.warn('Error checking image cache:', error);
    return null;
  }
}

/**
 * Caches the image result in Supabase
 */
async function cacheImageResult(
  placeId: string,
  photoName: string,
  photoUri: string,
  attributions: PhotoAttribution[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('place_media_cache')
      .upsert({
        place_id: placeId,
        photo_name: photoName,
        photo_uri: photoUri,
        attributions,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Error caching image result:', error);
    }
  } catch (error) {
    console.warn('Error caching image result:', error);
  }
}

/**
 * Generates a Static Map fallback URL when no photos are available
 */
export function generateStaticMapFallback(
  lat: number,
  lng: number,
  width = 1200,
  height = 800,
  zoom = 15
): string {
  if (!API_KEY) {
    // Return a placeholder image if no API key
    return `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=Restaurant`;
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    markers: `${lat},${lng}`,
    key: API_KEY
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params}`;
}

/**
 * Gets multiple images for a place (up to 10)
 */
export async function getPlaceImages(
  placeId: string,
  maxImages = 3,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<PlaceImageResult[]> {
  if (!placeId || !API_KEY) {
    return [];
  }

  try {
    const photos = await getPlacePhotos(placeId);
    const limitedPhotos = photos.slice(0, maxImages);
    
    const imagePromises = limitedPhotos.map(async (photo) => {
      try {
        const photoUrl = await getPhotoMediaUrl(
          photo.name,
          options?.maxWidth ?? 800,
          options?.maxHeight ?? 600
        );
        
        return {
          url: photoUrl,
          attributions: photo.authorAttributions || []
        };
      } catch (error) {
        console.warn('Error fetching individual photo:', error);
        return { url: null, attributions: [] };
      }
    });

    const results = await Promise.all(imagePromises);
    return results.filter(result => result.url !== null);
    
  } catch (error) {
    console.error('Error fetching multiple place images:', error);
    return [];
  }
}

/**
 * Fetches comprehensive restaurant details using Google Places API v1
 * Returns photos, reviews, hours, contact info, and ratings
 */
export async function getPlaceDetails(
  placeId: string,
  options?: {
    includePhotos?: boolean;
    includeReviews?: boolean;
    maxPhotos?: number;
    maxReviews?: number;
  }
): Promise<RestaurantDetails | null> {
  if (!placeId || !API_KEY) {
    console.warn('Place ID or API key missing - cannot fetch details');
    return null;
  }

  const includePhotos = options?.includePhotos ?? true;
  const includeReviews = options?.includeReviews ?? true;
  const maxPhotos = options?.maxPhotos ?? 3;

  try {
    console.log(`🔍 Fetching comprehensive details for place ${placeId}`);

    // Build field mask for the data we want
    const fields = [
      'id',
      'displayName',
      'formattedAddress',
      'internationalPhoneNumber',
      'nationalPhoneNumber',
      'websiteUri',
      'googleMapsUri',
      'rating',
      'userRatingCount',
      'priceLevel'
    ];

    if (includePhotos) fields.push('photos');
    if (includeReviews) fields.push('reviews');
    fields.push('currentOpeningHours', 'regularOpeningHours');

    const fieldMask = fields.join(',');

    // Fetch place details from Google Places API v1
    const url = `${PLACES_API_V1}/places/${encodeURIComponent(placeId)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': fieldMask
      }
    });

    if (!response.ok) {
      throw new Error(`Place Details API failed with status: ${response.status}`);
    }

    const data: PlaceDetailsResponse = await response.json();
    console.log(`✅ Raw place details from Google:`, data);

    // Process photos
    let photos: RestaurantDetails['photos'] = [];
    if (includePhotos && data.photos && data.photos.length > 0) {
      const photoPromises = data.photos.slice(0, maxPhotos).map(async (photo, index) => {
        try {
          const photoUrl = await getPhotoMediaUrl(photo.name, 800, 600);
          return {
            url: photoUrl || '',
            reference: photo.name,
            width: 800,
            height: 600,
            attributions: photo.authorAttributions || []
          };
        } catch (error) {
          console.warn(`Failed to fetch photo ${index}:`, error);
          return null;
        }
      });

      const photoResults = await Promise.all(photoPromises);
      photos = photoResults.filter((photo): photo is NonNullable<typeof photo> => photo !== null);
    }

    // Process reviews
    const reviews: RestaurantDetails['reviews'] = [];
    if (includeReviews && data.reviews && data.reviews.length > 0) {
      data.reviews.forEach(review => {
        if (review.text?.text) {
          reviews.push({
            author: review.authorAttribution?.displayName || 'Anonymous',
            rating: review.rating || 0,
            text: review.text.text,
            relativeTimeDescription: review.relativePublishTimeDescription || 'Recently',
            publishTime: review.publishTime
          });
        }
      });
    }

    // Process opening hours
    let hours: RestaurantDetails['hours'] | undefined;
    const openingHours = data.currentOpeningHours || data.regularOpeningHours;
    if (openingHours) {
      hours = {
        openNow: openingHours.openNow,
        weekdayText: openingHours.weekdayDescriptions || []
      };
    }

    // Convert price level to number
    let priceLevel: number | undefined;
    if (data.priceLevel) {
      const priceLevelMap = {
        'PRICE_LEVEL_FREE': 0,
        'PRICE_LEVEL_INEXPENSIVE': 1,
        'PRICE_LEVEL_MODERATE': 2,
        'PRICE_LEVEL_EXPENSIVE': 3,
        'PRICE_LEVEL_VERY_EXPENSIVE': 4
      };
      priceLevel = priceLevelMap[data.priceLevel];
    }

    const result: RestaurantDetails = {
      id: placeId,
      name: data.displayName?.text || 'Unknown Restaurant',
      address: data.formattedAddress || '',
      phone: data.internationalPhoneNumber || data.nationalPhoneNumber,
      website: data.websiteUri,
      googleMapsUrl: data.googleMapsUri,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      priceLevel,
      photos,
      reviews,
      hours
    };

    console.log(`✅ Processed restaurant details:`, result);
    return result;

  } catch (error) {
    console.error(`❌ Error fetching place details for ${placeId}:`, error);
    return null;
  }
}