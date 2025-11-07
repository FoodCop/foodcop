import type { SavedItem, PhotoMetadata, RecipeMetadata } from '../types/plate';
import type { 
  ViewerData, 
  RecipeViewerData, 
  RestaurantViewerData, 
  PhotoViewerData, 
  VideoViewerData 
} from '../components/ui/universal-viewer/types';

/**
 * Transform SavedItem data to Universal Viewer format
 */
export function transformSavedItemToViewerData(item: SavedItem): ViewerData {
  switch (item.item_type) {
    case 'recipe': {
      const meta = item.metadata as RecipeMetadata;
      return {
        savedItemId: item.id, // Add saved item ID for delete functionality
        recipe: {
          id: item.id,
          title: meta.title || 'Untitled Recipe',
          summary: meta.summary || '',
          description: meta.summary || '',
          image: meta.image,
          readyInMinutes: meta.readyInMinutes,
          servings: meta.servings,
          healthScore: meta.healthScore,
          pricePerServing: (meta as any).pricePerServing,
          // Basic ingredients array - will be empty since not stored in metadata
          ingredients: [],
          // Basic instructions array - will be empty since not stored in metadata  
          instructions: [],
          cuisines: (meta as any).cuisines || [],
          diets: meta.diets || [],
          intolerances: [],
          nutrition: undefined, // Not available in current metadata
          sourceUrl: meta.sourceUrl,
          spoonacularId: parseInt(item.item_id) || 0
        } as RecipeViewerData
      };
    }

    case 'restaurant': {
      const meta = item.metadata as any; // Restaurant metadata varies
      return {
        savedItemId: item.id, // Add saved item ID for delete functionality
        restaurant: {
          id: item.id,
          name: meta.name || meta.title || 'Restaurant',
          description: meta.editorial_summary?.overview || meta.description || '',
          address: meta.formatted_address || meta.vicinity || '',
          rating: meta.rating || 0,
          priceLevel: meta.price_level || 0,
          photos: meta.photos?.map((photo: any) => photo.photo_reference || photo.url) || [],
          cuisine: meta.types?.filter((type: string) => 
            !['establishment', 'point_of_interest'].includes(type)
          ) || [],
          location: {
            lat: meta.geometry?.location?.lat || meta.lat || 0,
            lng: meta.geometry?.location?.lng || meta.lng || 0
          },
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.name || 'restaurant')}&query_place_id=${meta.place_id || ''}`,
          types: meta.types || [],
          openingHours: meta.opening_hours,
          phoneNumber: meta.formatted_phone_number,
          website: meta.website,
          googlePlaceId: meta.place_id
        } as RestaurantViewerData
      };
    }

    case 'photo': {
      const meta = item.metadata as PhotoMetadata;
      return {
        savedItemId: item.id, // Add saved item ID for delete functionality
        photo: {
          id: item.id,
          url: meta.image_url || meta.image || '',
          title: meta.title,
          description: meta.description,
          restaurantName: meta.restaurant_name,
          visitDate: meta.visit_date,
          rating: meta.rating,
          tags: meta.tags || []
        } as PhotoViewerData
      };
    }

    case 'video': {
      const meta = item.metadata as any; // Video metadata varies
      return {
        savedItemId: item.id, // Add saved item ID for delete functionality
        video: {
          id: item.id,
          title: meta.title || meta.snippet?.title || 'Video',
          description: meta.description || meta.snippet?.description || '',
          url: meta.url || `https://www.youtube.com/watch?v=${meta.id?.videoId || meta.videoId}`,
          thumbnail: meta.thumbnail || meta.snippet?.thumbnails?.high?.url,
          youtubeUrl: meta.url || `https://www.youtube.com/watch?v=${meta.id?.videoId || meta.videoId}`,
          channelName: meta.channelName || meta.snippet?.channelTitle,
          channelAvatar: meta.channelAvatar,
          duration: typeof meta.duration === 'string' ? parseDurationToSeconds(meta.duration) : meta.duration,
          viewCount: meta.viewCount || meta.statistics?.viewCount,
          subscriberCount: meta.subscriberCount,
          uploadDate: meta.uploadDate || meta.snippet?.publishedAt,
          tags: meta.tags || [],
          recipeTitle: meta.recipeTitle,
          recipeDescription: meta.recipeDescription
        } as VideoViewerData
      };
    }

    default:
      throw new Error(`Unsupported content type: ${item.item_type}`);
  }
}

/**
 * Parse YouTube duration format (PT4M13S) to seconds
 */
function parseDurationToSeconds(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Transform multiple SavedItems to ViewerData array for navigation
 */
export function transformSavedItemsToViewerData(items: SavedItem[]): ViewerData[] {
  return items.map(transformSavedItemToViewerData);
}

/**
 * Get the index of an item in the viewer data array
 */
export function getItemIndexInViewerData(items: ViewerData[], itemId: string): number {
  return items.findIndex(item => {
    // Extract ID from whichever data type is present
    if (item.recipe) return item.recipe.id === itemId;
    if (item.restaurant) return item.restaurant.id === itemId;
    if (item.photo) return item.photo.id === itemId;
    if (item.video) return item.video.id === itemId;
    return false;
  });
}