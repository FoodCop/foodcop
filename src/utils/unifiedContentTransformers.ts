import type { UnifiedContentData } from '../components/ui/universal-viewer/types';
import type { 
  RecipeViewerData, 
  RestaurantViewerData, 
  PhotoViewerData, 
  VideoViewerData 
} from '../components/ui/universal-viewer/types';
import type { SavedItem, PhotoMetadata, RecipeMetadata } from '../types/plate';
import SpoonacularService from '../services/spoonacular';
import YouTubeService from '../services/youtube';

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
  const durationSeconds = parseDurationToSeconds(video.duration);
  const viewCount = parseViewCountString(video.views);

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
      duration: durationSeconds,
      channelName: video.channelName,
      viewCount,
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
      const meta = item.metadata as RecipeMetadata | Record<string, unknown>;
      const title = asString(meta.title) || 'Untitled Recipe';
      const summary = asString(meta.summary) || '';
      const image = asString(meta.image) || asString((meta as Record<string, unknown>).image_url) || '';
      const sourceUrl = asString(meta.sourceUrl);
      const diets = Array.isArray(meta.diets)
        ? meta.diets.filter((diet): diet is string => typeof diet === 'string')
        : [];
      const readyInMinutes = asNumber(meta.readyInMinutes);
      const servings = asNumber(meta.servings);
      const healthScore = asNumber(meta.healthScore);
      return {
        type: 'recipe',
        id: item.id,
        title,
        description: summary,
        media: {
          image,
        },
        metadata: {
          ingredients: [], // Not stored in metadata
          instructions: [], // Not stored in metadata
          nutrition: undefined,
          readyInMinutes,
          servings,
          diets,
          healthScore,
          sourceUrl,
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
      const meta = item.metadata as PhotoMetadata | Record<string, unknown>;
      const title = asString(meta.title) || 'Photo';
      const description = asString(meta.description);
      const image = asString(meta.image_url) || asString(meta.image) || '';
      const visitDate = asString(meta.visit_date);
      const restaurantName = asString(meta.restaurant_name);
      const rating = asNumber(meta.rating);
      const tags = Array.isArray(meta.tags)
        ? meta.tags.filter((tag): tag is string => typeof tag === 'string')
        : [];
      return {
        type: 'photo',
        id: item.id,
        title,
        description,
        media: {
          image,
        },
        metadata: {
          visitDate,
          restaurantName,
          rating,
          tags,
        },
        savedItemId: item.id,
      };
    }

    case 'video': {
      const meta = (item.metadata || {}) as Record<string, unknown>;
      const youtubeId = extractSavedVideoId(meta, item.item_id);
      const duration = normalizeDurationValue(meta.duration);
      const snippetMeta = meta.snippet as Record<string, unknown> | undefined;
      const statsMeta = meta.statistics as Record<string, unknown> | undefined;

      const safeDescription = asString(meta.description) || asString(snippetMeta?.description) || '';
      const safeTitle = asString(meta.title) || asString(snippetMeta?.title) || 'Video';
      const thumbnail =
        asString(meta.thumbnail) ||
        asString(meta.image) ||
        (snippetMeta?.thumbnails as Record<string, any> | undefined)?.high?.url ||
        '';
      const tags = normalizeTags((meta.tags as unknown) ?? (meta.category as unknown));
      const viewCount = asNumber(meta.viewCount) ?? asNumber(statsMeta?.viewCount) ?? asNumber(meta.views);
      const channelName = asString(meta.channelName) || asString(snippetMeta?.channelTitle);
      const channelAvatar = asString(meta.channelAvatar);
      const subscriberCount = asNumber(meta.subscriberCount) ?? asNumber(statsMeta?.subscriberCount);
      const uploadDate = asString(meta.uploadDate) || asString(snippetMeta?.publishedAt);

      return {
        type: 'video',
        id: item.id,
        title: safeTitle,
        description: safeDescription,
        media: {
          video: typeof meta.url === 'string' ? meta.url : youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : undefined,
          youtubeId,
          image: thumbnail,
        },
        metadata: {
          duration,
          channelName,
          channelAvatar,
          viewCount,
          subscriberCount,
          uploadDate,
          tags,
          thumbnail,
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
 * Hydrate a saved video with YouTube data so it renders like Trims
 */
export async function hydrateSavedVideoToUnified(item: SavedItem): Promise<UnifiedContentData> {
  if (item.item_type !== 'video') {
    return transformSavedItemToUnified(item);
  }

  const meta = (item.metadata || {}) as Record<string, unknown>;
  const videoId = extractSavedVideoId(meta, item.item_id);
  let trimVideo: TrimVideo | null = null;

  if (videoId) {
    try {
      const result = await YouTubeService.getVideoDetails(videoId);
      const details = result.success ? result.data?.items?.[0] : undefined;

      if (details) {
        const snippet = details.snippet ?? {};
        const statistics = details.statistics ?? {};
        const contentDetails = details.contentDetails ?? {};
        const snippetTags = normalizeTags(snippet.tags);
        const fallbackTags = normalizeTags(meta.category ?? meta.tags);
        const resolvedTags = snippetTags.length
          ? snippetTags
          : fallbackTags.length
          ? fallbackTags
          : ['Quick Bites'];

        trimVideo = {
          id: videoId,
          title: snippet.title || (meta.title as string) || 'Video',
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            (meta.thumbnail as string) ||
            (meta.image as string) ||
            '',
          channelName: snippet.channelTitle || (meta.channelName as string) || 'Unknown Creator',
          views: formatViewCount(statistics.viewCount ?? meta.viewCount ?? meta.views),
          duration: normalizeDurationDisplay(contentDetails.duration ?? meta.duration),
          category: resolvedTags,
          videoId,
        };
      }
    } catch (error) {
      console.error('Failed to hydrate video details for saved item', error);
    }
  }

  if (!trimVideo) {
    const fallbackTags = normalizeTags(meta.category ?? meta.tags);

    trimVideo = {
      id: videoId || item.id,
      title:
        asString(meta.title) ||
        asString((meta.snippet as Record<string, unknown> | undefined)?.title) ||
        'Video',
      thumbnail:
        asString(meta.thumbnail) ||
        asString(meta.image) ||
        ((meta.snippet as Record<string, unknown> | undefined)?.thumbnails as Record<string, any> | undefined)?.high?.url ||
        '',
      channelName:
        asString(meta.channelName) ||
        asString((meta.snippet as Record<string, unknown> | undefined)?.channelTitle) ||
        'Unknown Creator',
      views: typeof meta.views === 'string' ? meta.views : formatViewCount(meta.viewCount),
      duration: normalizeDurationDisplay(meta.duration),
      category: fallbackTags.length ? fallbackTags : ['Quick Bites'],
      videoId: videoId || extractSavedVideoId(meta),
    };
  }

  return transformTrimVideoToUnified(trimVideo, item.id);
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

function extractSavedVideoId(meta: Record<string, unknown>, fallbackId?: string): string | undefined {
  if (typeof meta.videoId === 'string' && meta.videoId.trim()) {
    return meta.videoId;
  }

  const nestedId = (meta.id as Record<string, unknown> | undefined)?.videoId;
  if (typeof nestedId === 'string' && nestedId.trim()) {
    return nestedId;
  }

  const urlCandidate =
    (typeof meta.youtubeUrl === 'string' && meta.youtubeUrl) ||
    (typeof meta.url === 'string' && meta.url);
  if (urlCandidate) {
    const extracted = extractYouTubeId(urlCandidate);
    if (extracted) {
      return extracted;
    }
  }

  if (typeof fallbackId === 'string' && fallbackId.trim()) {
    if (fallbackId.startsWith('trim_')) {
      const trimmed = fallbackId.replace('trim_', '');
      if (trimmed) {
        return trimmed;
      }
    }
    const match = fallbackId.match(/([\w-]{8,})/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function normalizeDurationValue(duration: unknown): number | undefined {
  if (typeof duration === 'number') {
    return Number.isFinite(duration) ? duration : undefined;
  }

  if (typeof duration === 'string') {
    const seconds = parseDurationToSeconds(duration);
    return seconds > 0 ? seconds : undefined;
  }

  return undefined;
}

function normalizeDurationDisplay(duration: unknown): string {
  const seconds = parseDurationToSeconds(duration as string | number | undefined);
  if (seconds <= 0) {
    return '0:00';
  }
  return formatSecondsToTimestamp(seconds);
}

function parseDurationToSeconds(duration: string | number | undefined): number {
  if (typeof duration === 'number') {
    return Number.isFinite(duration) ? duration : 0;
  }

  if (!duration || typeof duration !== 'string') {
    return 0;
  }

  if (duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (duration.includes(':')) {
    const parts = duration.split(':').map((part) => parseInt(part, 10));
    if (parts.some((part) => Number.isNaN(part))) {
      return 0;
    }
    let total = 0;
    for (const part of parts) {
      total = total * 60 + part;
    }
    return total;
  }

  const numeric = parseFloat(duration);
  return Number.isNaN(numeric) ? 0 : numeric;
}

function formatSecondsToTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseViewCountString(value: string): number {
  if (!value || value === 'Unknown') return 0;
  const cleaned = value.replace(/views?/i, '').trim();
  const match = cleaned.match(/([\d.]+)([MK])?/i);
  if (!match) {
    const numeric = parseFloat(cleaned);
    return Number.isNaN(numeric) ? 0 : Math.round(numeric);
  }

  const quantity = parseFloat(match[1]);
  if (Number.isNaN(quantity)) return 0;
  const suffix = match[2]?.toUpperCase();
  if (suffix === 'M') return Math.round(quantity * 1_000_000);
  if (suffix === 'K') return Math.round(quantity * 1_000);
  return Math.round(quantity);
}

function formatViewCount(value?: unknown): string {
  if (value === null || value === undefined) {
    return 'Unknown';
  }

  if (typeof value === 'number') {
    return formatNumericCount(value);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/views?/i, '').replace(/,/g, '').trim();
    const numeric = parseFloat(cleaned);
    if (!Number.isNaN(numeric)) {
      return formatNumericCount(numeric);
    }
    return value;
  }

  return 'Unknown';
}

function formatNumericCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) {
    return 'Unknown';
  }

  if (count >= 1_000_000) {
    return `${trimTrailingZeros((count / 1_000_000).toFixed(1))}M views`;
  }

  if (count >= 1_000) {
    return `${trimTrailingZeros((count / 1_000).toFixed(1))}K views`;
  }

  return `${Math.round(count)} views`;
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0$/, '');
}

function normalizeTags(input: unknown): string[] {
  if (!input) {
    return [];
  }

  const tokens: string[] = [];

  const addFromValue = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(addFromValue);
      return;
    }
    if (typeof value === 'string') {
      tokens.push(...splitTagString(value));
      return;
    }
  };

  addFromValue(input);

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

function splitTagString(value: string): string[] {
  if (!value) return [];

  const sections = value.split(/[\n,\/]+/);
  const results: string[] = [];

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    if (trimmedSection.includes('#')) {
      const parts = trimmedSection.split(/\s+/);
      for (const part of parts) {
        const cleaned = part.replace(/^#+/, '').replace(/[^\w-]+$/g, '').trim();
        if (cleaned) {
          results.push(cleaned.replace(/[-_]/g, ' ').trim());
        }
      }
      continue;
    }

    results.push(trimmedSection);
  }

  return results;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

