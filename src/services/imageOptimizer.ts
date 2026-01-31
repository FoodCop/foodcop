/**
 * Phase 3: Image Optimization Service
 * 
 * Provides URL transformation, lazy loading, and performance optimization
 * for images in the feed system with WebP support and progressive loading.
 */

export interface ImageOptimizationConfig {
  /** Target width for optimization */
  width?: number;
  /** Target height for optimization */
  height?: number;
  /** Image quality (1-100) */
  quality?: number;
  /** Format preference */
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  /** Enable lazy loading */
  lazy?: boolean;
  /** Blur placeholder while loading */
  placeholder?: boolean;
}

export interface OptimizedImageResult {
  /** Optimized image URL */
  src: string;
  /** Placeholder/blurred image URL */
  placeholder?: string;
  /** WebP alternative URL */
  webpSrc?: string;
  /** Fallback URL for unsupported formats */
  fallbackSrc: string;
  /** Suggested loading strategy */
  loading: 'eager' | 'lazy';
  /** Alt text for accessibility */
  alt: string;
}

/**
 * Image size configurations for different card types and use cases
 */
const IMAGE_CONFIGS = {
  // Feed card images - primary display
  feedCard: {
    width: 400,
    height: 300,
    quality: 85,
    format: 'webp' as const,
    lazy: true,
    placeholder: true
  },
  // Restaurant images
  restaurant: {
    width: 400,
    height: 300,
    quality: 90, // Higher quality for food images
    format: 'webp' as const,
    lazy: true,
    placeholder: true
  },
  // Recipe images
  recipe: {
    width: 400,
    height: 300,
    quality: 88,
    format: 'webp' as const,
    lazy: true,
    placeholder: true
  },
  // Video thumbnails
  video: {
    width: 480,
    height: 360, // 4:3 aspect ratio for YouTube
    quality: 85,
    format: 'webp' as const,
    lazy: true,
    placeholder: true
  },
  // User avatars
  avatar: {
    width: 64,
    height: 64,
    quality: 90,
    format: 'webp' as const,
    lazy: true,
    placeholder: false
  },
  // Thumbnail previews
  thumbnail: {
    width: 200,
    height: 150,
    quality: 80,
    format: 'webp' as const,
    lazy: true,
    placeholder: true
  }
} as const;

export type ImageConfigType = keyof typeof IMAGE_CONFIGS;

/**
 * Image Optimization Service
 */
class ImageOptimizationService {
  private supportsWebP: boolean | null = null;
  private loadingImages = new Set<string>();

  constructor() {
    this.detectWebPSupport();
  }

  /**
   * Detect WebP support in the browser
   */
  private async detectWebPSupport(): Promise<void> {
    if (typeof window === 'undefined') {
      this.supportsWebP = false;
      return;
    }

    try {
      const webpTest = await new Promise<boolean>((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
          resolve(webP.height === 2);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });
      
      this.supportsWebP = webpTest;
      console.log('🖼️ WebP support detected:', this.supportsWebP);
    } catch {
      this.supportsWebP = false;
    }
  }

  /**
   * Optimize image URL based on configuration
   */
  optimizeImageUrl(
    originalUrl: string,
    config: ImageOptimizationConfig = {}
  ): OptimizedImageResult {
    const {
      width = 400,
      height = 300,
      quality = 85,
      format = 'auto',
      lazy = true,
      placeholder = true
    } = config;

    // Handle different image sources
    if (this.isGooglePlacesImage(originalUrl)) {
      return this.optimizeGooglePlacesImage(originalUrl, config);
    }
    
    if (this.isYouTubeImage(originalUrl)) {
      return this.optimizeYouTubeImage(originalUrl, config);
    }
    
    if (this.isSpoonacularImage(originalUrl)) {
      return this.optimizeSpoonacularImage(originalUrl, config);
    }

    // Generic image optimization
    return this.optimizeGenericImage(originalUrl, config);
  }

  /**
   * Optimize image using predefined configuration
   */
  optimizeImageByType(
    originalUrl: string,
    type: ImageConfigType,
    overrides: Partial<ImageOptimizationConfig> = {}
  ): OptimizedImageResult {
    const baseConfig = IMAGE_CONFIGS[type];
    const config = { ...baseConfig, ...overrides };
    return this.optimizeImageUrl(originalUrl, config);
  }

  /**
   * Optimize Google Places images
   * ✅ DISABLED: Google Places images are already optimized by Google's CDN
   * Re-optimization degrades quality and adds latency
   */
  private optimizeGooglePlacesImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    // Return original URL without modification - Google's CDN already optimizes these
    return {
      src: originalUrl,
      fallbackSrc: originalUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Restaurant image'
    };
  }

  /**
   * Optimize YouTube thumbnail images
   * ✅ DISABLED: YouTube thumbnails are already optimized by YouTube's CDN
   * Re-optimization degrades quality and adds latency
   */
  private optimizeYouTubeImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    // Return original URL without modification - YouTube's CDN already optimizes these
    return {
      src: originalUrl,
      fallbackSrc: originalUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Video thumbnail'
    };
  }

  /**
   * Optimize Spoonacular recipe images
   * ✅ DISABLED: Spoonacular images are already optimized by their CDN
   * Re-optimization degrades quality and adds latency
   */
  private optimizeSpoonacularImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    // Return original URL without modification - Spoonacular's CDN already optimizes these
    return {
      src: originalUrl,
      fallbackSrc: originalUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Recipe image'
    };
  }

  /**
   * Generic image optimization
   */
  private optimizeGenericImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    const { width = 400, height = 300, format = 'auto' } = config;

    // For generic images, we can't modify the URL much
    // But we can provide WebP alternatives if supported
    let webpSrc: string | undefined;
    
    if (this.supportsWebP && format === 'webp') {
      // For services that support WebP, try to convert extension
      webpSrc = originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    return {
      src: originalUrl,
      webpSrc: webpSrc,
      fallbackSrc: originalUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Image',
      placeholder: config.placeholder ? this.generatePlaceholder(width, height) : undefined
    };
  }

  /**
   * Generate placeholder image (blurred/gradient)
   */
  private generatePlaceholder(width: number, height: number): string {
    // Create a simple SVG placeholder with gradient
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="placeholder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#placeholder)" />
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
              font-family="Arial, sans-serif" font-size="14" fill="#d1d5db">
          Loading...
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Check if URL is from Google Places
   */
  private isGooglePlacesImage(url: string): boolean {
    return url.includes('maps.googleapis.com') || 
           url.includes('googleusercontent.com') ||
           url.includes('streetviewpixels-pa.googleapis.com');
  }

  /**
   * Check if URL is from YouTube
   */
  private isYouTubeImage(url: string): boolean {
    return url.includes('ytimg.com') || url.includes('youtube.com');
  }

  /**
   * Check if URL is from Spoonacular
   */
  private isSpoonacularImage(url: string): boolean {
    return url.includes('spoonacular.com');
  }

  /**
   * Preload critical images
   */
  preloadImage(url: string): Promise<void> {
    if (this.loadingImages.has(url)) {
      return Promise.resolve();
    }

    this.loadingImages.add(url);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadingImages.delete(url);
        resolve();
      };
      
      img.onerror = () => {
        this.loadingImages.delete(url);
        reject(new Error(`Failed to preload image: ${url}`));
      };
      
      img.src = url;
    });
  }

  /**
   * Batch preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    const preloadPromises = urls.map(url => 
      this.preloadImage(url).catch(error => {
        console.warn('Failed to preload image:', url, error);
        return Promise.resolve(); // Don't fail the batch for one image
      })
    );

    await Promise.all(preloadPromises);
    console.log(`✅ Preloaded ${urls.length} images`);
  }

  /**
   * Get WebP support status
   */
  getWebPSupport(): boolean | null {
    return this.supportsWebP;
  }

  /**
   * Clear loading cache
   */
  clearLoadingCache(): void {
    this.loadingImages.clear();
  }
}

// Global image optimization service
export const imageOptimizer = new ImageOptimizationService();

/**
 * Phase 3: Utility hooks and functions for React components
 */

/**
 * Get optimized image props for React Image components
 */
export function useOptimizedImage(
  originalUrl: string | undefined,
  type: ImageConfigType = 'feedCard',
  overrides: Partial<ImageOptimizationConfig> = {}
): OptimizedImageResult | null {
  if (!originalUrl) return null;

  return imageOptimizer.optimizeImageByType(originalUrl, type, overrides);
}

/**
 * Transform feed card image URLs
 */
export function optimizeFeedCardImages<T extends { imageUrl?: string }>(cards: T[]): T[] {
  return cards.map(card => {
    if (card.imageUrl) {
      const optimized = imageOptimizer.optimizeImageByType(card.imageUrl, 'feedCard');
      return {
        ...card,
        imageUrl: optimized.src,
        placeholderUrl: optimized.placeholder,
        webpUrl: optimized.webpSrc
      };
    }
    return card;
  });
}

export default imageOptimizer;