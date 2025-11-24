import type { UnifiedContentData } from '../components/ui/universal-viewer/types';
import type { 
  RecipeViewerData, 
  RestaurantViewerData, 
  PhotoViewerData, 
  VideoViewerData 
} from '../components/ui/universal-viewer/types';
import type { SavedItem, PhotoMetadata, RecipeMetadata } from '../types/plate';
import SpoonacularService from '../services/spoonacular';

// TrimVideo type from Trims component
interface TrimVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  views: string;
  duration: string;
  category: string[];
  videoId: string;
}

// Recipe type from Bites component
interface BitesRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  diets: string[];
  cuisines: string[];
  summary: string;
  instructions: string | string[];
  extendedIngredients: {
    id: number;
    original: string;
    name?: string;
    amount?: number;
    unit?: string;
  }[];
  sourceUrl?: string;
  healthScore?: number;
  nutrition?: {
    nutrients?: { name: string; amount: number; unit: string }[];
  };
  analyzedInstructions?: {
    name: string;
    steps: {
      number: number;
      step: string;
    }[];
  }[];
}

/**
 * Transform Bites Recipe to RecipeViewerData
 */
export function transformBitesRecipeToViewerData(recipe: BitesRecipe): RecipeViewerData {
  // Convert instructions to array if it's a string
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : recipe.instructions
    ? recipe.instructions.split(/\n+/).filter(s => s.trim())
    : recipe.analyzedInstructions?.[0]?.steps.map(s => s.step) || [];

  // Convert extendedIngredients to ingredients format
  const ingredients = recipe.extendedIngredients.map(ing => ({
    name: ing.name || ing.original,
    amount: ing.amount?.toString() || '',
    unit: ing.unit || '',
  }));

  // Extract nutrition info
  const nutrition = recipe.nutrition?.nutrients
    ? {
        calories: recipe.nutrition.nutrients.find(n => n.name.toLowerCase().includes('calorie'))?.amount,
        protein: recipe.nutrition.nutrients.find(n => n.name.toLowerCase() === 'protein')?.amount.toString() + 'g',
        carbs: recipe.nutrition.nutrients.find(n => n.name.toLowerCase().includes('carb'))?.amount.toString() + 'g',
        fat: recipe.nutrition.nutrients.find(n => n.name.toLowerCase() === 'fat')?.amount.toString() + 'g',
      }
    : undefined;

  return {
    id: recipe.id.toString(),
    title: recipe.title,
    summary: recipe.summary,
    image: recipe.image,
    instructions,
    ingredients,
    nutrition,
    readyInMinutes: recipe.readyInMinutes,
    servings: recipe.servings,
    diets: recipe.diets,
    healthScore: recipe.healthScore,
    sourceUrl: recipe.sourceUrl,
    spoonacularId: recipe.id,
  };
}

/**
 * Transform RecipeViewerData to UnifiedContentData
 */
export function transformRecipeToUnified(data: RecipeViewerData, savedItemId?: string): UnifiedContentData {
  return {
    type: 'recipe',
    id: data.id,
    title: data.title,
    description: data.summary,
    media: {
      image: data.image,
    },
    metadata: {
      ingredients: data.ingredients,
      instructions: data.instructions,
      nutrition: data.nutrition,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      diets: data.diets,
      healthScore: data.healthScore,
      sourceUrl: data.sourceUrl,
      spoonacularId: data.spoonacularId,
    },
    savedItemId,
  };
}

/**
 * Transform RestaurantViewerData to UnifiedContentData
 */
export function transformRestaurantToUnified(data: RestaurantViewerData, savedItemId?: string): UnifiedContentData {
  return {
    type: 'restaurant',
    id: data.id,
    title: data.name,
    description: data.address,
    media: {
      image: data.photos?.[0]?.url,
      photos: data.photos,
    },
    metadata: {
      location: data.location,
      address: data.address,
      rating: data.rating,
      priceLevel: data.priceLevel,
      openingHours: data.openingHours,
      phoneNumber: data.phoneNumber,
      website: data.website,
      googleMapsUrl: data.googleMapsUrl,
      types: data.types,
      googlePlaceId: data.id,
    },
    savedItemId,
  };
}

/**
 * Transform PhotoViewerData to UnifiedContentData
 */
export function transformPhotoToUnified(data: PhotoViewerData, savedItemId?: string): UnifiedContentData {
  return {
    type: 'photo',
    id: data.id,
    title: data.title || 'Photo',
    description: data.description,
    media: {
      image: data.url,
    },
    metadata: {
      visitDate: data.visitDate,
      restaurantName: data.restaurantName,
      rating: data.rating,
      tags: data.tags,
    },
    savedItemId,
  };
}

/**
 * Transform VideoViewerData to UnifiedContentData
 */
export function transformVideoToUnified(data: VideoViewerData, savedItemId?: string): UnifiedContentData {
  // Extract YouTube ID from URL if present
  const youtubeId = data.youtubeUrl 
    ? extractYouTubeId(data.youtubeUrl)
    : data.url?.includes('youtube.com') || data.url?.includes('youtu.be')
    ? extractYouTubeId(data.url)
    : undefined;

  return {
    type: 'video',
    id: data.id,
    title: data.title,
    description: data.description,
    media: {
      video: data.url,
      youtubeId,
      image: data.thumbnail,
    },
    metadata: {
      duration: data.duration,
      channelName: data.channelName,
      channelAvatar: data.channelAvatar,
      viewCount: data.viewCount,
      subscriberCount: data.subscriberCount,
      uploadDate: data.uploadDate,
      tags: data.tags,
      thumbnail: data.thumbnail,
    },
    savedItemId,
  };
}

/**
 * Transform TrimVideo to UnifiedContentData
 */
export function transformTrimVideoToUnified(video: TrimVideo, savedItemId?: string): UnifiedContentData {
  // Parse duration (format: "M:SS" or "MM:SS")
  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  // Parse views (format: "1.2M views" or "123K views" or "123 views")
  const parseViews = (viewsStr: string): number => {
    if (viewsStr === 'Unknown') return 0;
    const match = viewsStr.match(/([\d.]+)([MK])?/);
    if (match) {
      const num = parseFloat(match[1]);
      const suffix = match[2];
      if (suffix === 'M') return Math.round(num * 1000000);
      if (suffix === 'K') return Math.round(num * 1000);
      return Math.round(num);
    }
    return 0;
  };

  return {
    type: 'video',
    id: video.id,
    title: video.title,
    description: '',
    media: {
      youtubeId: video.videoId,
      image: video.thumbnail,
    },
    metadata: {
      duration: parseDuration(video.duration),
      channelName: video.channelName,
      viewCount: parseViews(video.views),
      tags: video.category,
      thumbnail: video.thumbnail,
    },
    savedItemId,
  };
}

/**
 * Transform SavedItem to UnifiedContentData
 * This is the main transformer for Plate page saved items
 */
export function transformSavedItemToUnified(item: SavedItem): UnifiedContentData {
  switch (item.item_type) {
    case 'recipe': {
      const meta = item.metadata as RecipeMetadata;
      return {
        type: 'recipe',
        id: item.id,
        title: meta.title || 'Untitled Recipe',
        description: meta.summary || '',
        media: {
          image: meta.image,
        },
        metadata: {
          ingredients: [], // Not stored in metadata
          instructions: [], // Not stored in metadata
          nutrition: undefined,
          readyInMinutes: meta.readyInMinutes,
          servings: meta.servings,
          diets: meta.diets || [],
          healthScore: meta.healthScore,
          sourceUrl: meta.sourceUrl,
          spoonacularId: parseInt(item.item_id) || 0,
        },
        savedItemId: item.id,
      };
    }

    case 'restaurant': {
      const meta = item.metadata as any; // Restaurant metadata varies
      
      // Transform photos array
      const photos = meta.photos?.map((photo: any) => {
        if (typeof photo === 'string') {
          return { url: photo };
        }
        if (photo.photo_reference) {
          // Google Places photo reference - construct URL
          const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
          return {
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${apiKey}`,
            reference: photo.photo_reference,
          };
        }
        return { url: photo.url || photo };
      }) || [];

      return {
        type: 'restaurant',
        id: item.id,
        title: meta.name || meta.title || 'Restaurant',
        description: meta.editorial_summary?.overview || meta.description || meta.address || '',
        media: {
          image: photos[0]?.url,
          photos: photos,
        },
        metadata: {
          location: {
            lat: meta.geometry?.location?.lat || meta.lat || 0,
            lng: meta.geometry?.location?.lng || meta.lng || 0,
          },
          address: meta.formatted_address || meta.vicinity || meta.address || '',
          rating: meta.rating || 0,
          priceLevel: meta.price_level || meta.priceLevel || 0,
          openingHours: meta.opening_hours || meta.openingHours,
          phoneNumber: meta.formatted_phone_number || meta.phoneNumber || meta.phone,
          website: meta.website,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.name || 'restaurant')}&query_place_id=${meta.place_id || ''}`,
          types: meta.types || [],
          googlePlaceId: meta.place_id || item.item_id,
        },
        savedItemId: item.id,
      };
    }

    case 'photo': {
      const meta = item.metadata as PhotoMetadata;
      return {
        type: 'photo',
        id: item.id,
        title: meta.title || 'Photo',
        description: meta.description,
        media: {
          image: meta.image_url || meta.image || '',
        },
        metadata: {
          visitDate: meta.visit_date,
          restaurantName: meta.restaurant_name,
          rating: meta.rating,
          tags: meta.tags || [],
        },
        savedItemId: item.id,
      };
    }

      case 'video': {
      const meta = item.metadata as any;
      
      // Extract YouTube ID
      const extractYouTubeId = (url: string): string | undefined => {
        if (!url) return undefined;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        return match ? match[1] : undefined;
      };
      
      const youtubeId = meta.videoId || 
        (meta.id?.videoId) ||
        (meta.youtubeUrl ? extractYouTubeId(meta.youtubeUrl) : undefined) ||
        (meta.url ? extractYouTubeId(meta.url) : undefined);

      // Parse duration
      let duration: number | undefined;
      if (typeof meta.duration === 'string') {
        duration = parseDurationToSeconds(meta.duration);
      } else if (typeof meta.duration === 'number') {
        duration = meta.duration;
      }

      return {
        type: 'video',
        id: item.id,
        title: meta.title || meta.snippet?.title || 'Video',
        description: meta.description || meta.snippet?.description || '',
        media: {
          video: meta.url || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : undefined),
          youtubeId,
          image: meta.thumbnail || meta.snippet?.thumbnails?.high?.url,
        },
        metadata: {
          duration,
          channelName: meta.channelName || meta.snippet?.channelTitle,
          channelAvatar: meta.channelAvatar,
          viewCount: meta.viewCount || meta.statistics?.viewCount || (typeof meta.views === 'number' ? meta.views : undefined),
          subscriberCount: meta.subscriberCount,
          uploadDate: meta.uploadDate || meta.snippet?.publishedAt,
          tags: meta.tags || meta.category || [],
          thumbnail: meta.thumbnail || meta.snippet?.thumbnails?.high?.url,
        },
        savedItemId: item.id,
      };
    }

    default:
      throw new Error(`Unsupported content type: ${item.item_type}`);
  }
}

function parseSpoonacularId(value?: string | number | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === 'string') {
    if (!value.trim()) return undefined;
    const normalized = value.startsWith('spoonacular_') ? value.replace('spoonacular_', '') : value;
    const numeric = parseInt(normalized, 10);
    if (!Number.isNaN(numeric)) return numeric;
    const digits = value.match(/\d+/);
    if (digits?.[0]) {
      const parsed = parseInt(digits[0], 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
  }

  return undefined;
}

/**
 * Transform multiple SavedItems to UnifiedContentData array for navigation
 */
export function transformSavedItemsToUnified(items: SavedItem[]): UnifiedContentData[] {
  return items.map(transformSavedItemToUnified);
}

/**
 * Get the index of an item in a UnifiedContentData array by ID
 */
export function getUnifiedItemIndex(items: UnifiedContentData[], itemId: string): number {
  return items.findIndex(item => item.id === itemId);
}

/**
 * Transform Bites Recipe directly to UnifiedContentData
 */
export function transformBitesRecipeToUnified(recipe: BitesRecipe, savedItemId?: string): UnifiedContentData {
  const viewerData = transformBitesRecipeToViewerData(recipe);
  return transformRecipeToUnified(viewerData, savedItemId);
}

/**
 * Hydrate a saved recipe with Spoonacular data so it renders like Bites
 */
export async function hydrateSavedRecipeToUnified(item: SavedItem): Promise<UnifiedContentData> {
  if (item.item_type !== 'recipe') {
    return transformSavedItemToUnified(item);
  }

  const meta = (item.metadata || {}) as RecipeMetadata & Record<string, unknown>;
  const spoonacularId =
    parseSpoonacularId(item.item_id) ??
    parseSpoonacularId((meta.spoonacularId as string | number | undefined) ?? (meta.recipeId as string | number | undefined));

  let fullRecipe: BitesRecipe | null = null;

  if (spoonacularId) {
    try {
      const result = await SpoonacularService.getRecipeInformation(spoonacularId, true);
      if (result.success && result.data) {
        fullRecipe = result.data as BitesRecipe;
      }
    } catch (error) {
      console.error('Failed to load recipe details for saved item', error);
    }
  }

  if (!fullRecipe) {
    const fallbackIngredients = Array.isArray(meta.extendedIngredients)
      ? (meta.extendedIngredients as Array<Record<string, unknown>>).map((ing, index) => ({
          id: typeof ing.id === 'number' ? ing.id : index,
          original: (ing.original as string) || (ing.name as string) || '',
          name: ing.name as string | undefined,
          amount: typeof ing.amount === 'number' ? ing.amount : undefined,
          unit: ing.unit as string | undefined,
        }))
      : [];

    const rawInstructions = meta.instructions ?? meta.steps ?? '';

    fullRecipe = {
      id: (spoonacularId ?? parseInt(item.id, 10)) ?? Date.now(),
      title: meta.title as string || 'Untitled Recipe',
      image: (meta.image as string) || (meta.image_url as string) || '',
      readyInMinutes: (meta.readyInMinutes as number) || 0,
      servings: (meta.servings as number) || 0,
      diets: Array.isArray(meta.diets) ? (meta.diets as string[]) : [],
      cuisines: Array.isArray(meta.cuisines) ? (meta.cuisines as string[]) : [],
      summary: (meta.summary as string) || '',
      instructions: rawInstructions as string,
      extendedIngredients: fallbackIngredients,
      nutrition: meta.nutrition as BitesRecipe['nutrition'],
      analyzedInstructions: Array.isArray(meta.analyzedInstructions)
        ? (meta.analyzedInstructions as BitesRecipe['analyzedInstructions'])
        : undefined,
      sourceUrl: meta.sourceUrl as string | undefined,
      healthScore: meta.healthScore as number | undefined,
    };
  }

  return transformBitesRecipeToUnified(fullRecipe, item.id);
}

/**
 * Transform any raw data to UnifiedContentData
 * Auto-detects type and transforms accordingly
 */
export function transformToUnified(
  data: RecipeViewerData | RestaurantViewerData | PhotoViewerData | VideoViewerData | UnifiedContentData | BitesRecipe | TrimVideo | SavedItem,
  savedItemId?: string
): UnifiedContentData {
  // If already unified, return as is
  if ('type' in data && 'media' in data && 'metadata' in data) {
    return data as UnifiedContentData;
  }

  // Check if it's a SavedItem (from Plate)
  if ('item_type' in data && 'item_id' in data && 'metadata' in data) {
    return transformSavedItemToUnified(data as SavedItem);
  }

  // Check if it's a TrimVideo
  if ('videoId' in data && 'channelName' in data && 'category' in data) {
    return transformTrimVideoToUnified(data as TrimVideo, savedItemId);
  }

  // Check if it's a Bites Recipe
  if ('extendedIngredients' in data && typeof (data as any).id === 'number') {
    return transformBitesRecipeToUnified(data as BitesRecipe, savedItemId);
  }

  // Detect type and transform
  if ('ingredients' in data || 'readyInMinutes' in data) {
    return transformRecipeToUnified(data as RecipeViewerData, savedItemId);
  }
  
  if ('location' in data || 'address' in data) {
    return transformRestaurantToUnified(data as RestaurantViewerData, savedItemId);
  }
  
  if ('url' in data && !('youtubeUrl' in data) && !('channelName' in data)) {
    return transformPhotoToUnified(data as PhotoViewerData, savedItemId);
  }
  
  if ('youtubeUrl' in data || 'channelName' in data) {
    return transformVideoToUnified(data as VideoViewerData, savedItemId);
  }

  throw new Error('Unable to transform data to UnifiedContentData');
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | undefined {
  if (!url) return undefined;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

