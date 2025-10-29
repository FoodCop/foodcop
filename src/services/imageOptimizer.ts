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
   */
  private optimizeGooglePlacesImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    const { width = 400, height = 300 } = config;
    
    let optimizedUrl = originalUrl;
    
    // Handle different Google image URL types
    if (originalUrl.includes('streetviewpixels-pa.googleapis.com')) {
      // Street View images - update dimensions in existing parameters
      optimizedUrl = originalUrl.replace(/w=\d+/, `w=${width}`);
      optimizedUrl = optimizedUrl.replace(/h=\d+/, `h=${height}`);
    } else if (originalUrl.includes('googleusercontent.com')) {
      // Google Photos/User Content - modify size parameters
      if (originalUrl.includes('=w') && originalUrl.includes('-h')) {
        // Format: =w408-h544-k-no
        optimizedUrl = originalUrl.replace(/=w\d+-h\d+/, `=w${width}-h${height}`);
      } else if (!originalUrl.includes('maxwidth') && !originalUrl.includes('maxheight')) {
        // Add size parameters if not present
        const separator = originalUrl.includes('?') ? '&' : '?';
        optimizedUrl = `${originalUrl}${separator}maxwidth=${width}&maxheight=${height}`;
      }
    } else if (originalUrl.includes('maps.googleapis.com')) {
      // Google Maps/Places API images
      if (!originalUrl.includes('maxwidth') && !originalUrl.includes('maxheight')) {
        const separator = originalUrl.includes('?') ? '&' : '?';
        optimizedUrl = `${originalUrl}${separator}maxwidth=${width}&maxheight=${height}`;
      }
    }

    console.log('🗺️ Google image optimization:', {
      original: originalUrl,
      optimized: optimizedUrl,
      width,
      height
    });

    return {
      src: optimizedUrl,
      fallbackSrc: originalUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Restaurant image',
      placeholder: config.placeholder ? this.generatePlaceholder(width, height) : undefined
    };
  }

  /**
   * Optimize YouTube thumbnail images
   */
  private optimizeYouTubeImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    const { width = 480, quality = 85 } = config;
    
    // YouTube thumbnail quality hierarchy (from best to worst quality available)
    // maxresdefault.jpg (1280×720) - Not always available
    // sddefault.jpg (640×480) - Not always available  
    // hqdefault.jpg (480×360) - Usually available
    // mqdefault.jpg (320×180) - Always available
    // default.jpg (120×90) - Always available but low quality
    
    let optimizedUrl = originalUrl;
    let fallbackUrl = originalUrl;
    
    // Extract video ID for reliable fallback construction
    const videoIdMatch = originalUrl.match(/\/vi\/([^\/]+)\//);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (videoId) {
      // Always use mqdefault as the safest reliable quality (320x180)
      // This ensures no 404 errors while still providing decent quality
      optimizedUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      
      // Set multiple fallback options in decreasing quality
      fallbackUrl = `https://i.ytimg.com/vi/${videoId}/default.jpg`;
      
      // For larger displays, try hqdefault but with proper error handling
      if (width >= 480) {
        const hqUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        // Return hqdefault with mqdefault as fallback
        return {
          src: hqUrl,
          webpSrc: undefined, // YouTube doesn't support WebP thumbnails
          fallbackSrc: optimizedUrl, // mqdefault as primary fallback
          loading: config.lazy ? 'lazy' : 'eager',
          alt: 'Video thumbnail',
          placeholder: config.placeholder ? this.generatePlaceholder(480, 360) : undefined
        };
      }
    } else {
      // If we can't extract video ID, be conservative with existing URL
      if (originalUrl.includes('maxresdefault.jpg') || originalUrl.includes('sddefault.jpg')) {
        // These high-res versions often don't exist, downgrade to safer hqdefault
        optimizedUrl = originalUrl.replace(/(maxres|sd)default\.jpg/, 'hqdefault.jpg');
        fallbackUrl = originalUrl.replace(/(maxres|sd|hq)default\.jpg/, 'mqdefault.jpg');
      } else if (originalUrl.includes('default.jpg') && !originalUrl.includes('mqdefault.jpg')) {
        // Upgrade default.jpg to mqdefault.jpg (safe upgrade)
        optimizedUrl = originalUrl.replace('default.jpg', 'mqdefault.jpg');
        fallbackUrl = originalUrl; // Keep original as fallback
      }
    }

    return {
      src: optimizedUrl,
      webpSrc: undefined, // YouTube doesn't serve WebP thumbnails
      fallbackSrc: fallbackUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Video thumbnail',
      placeholder: config.placeholder ? this.generatePlaceholder(320, 180) : undefined
    };
  }

  /**
   * Optimize Spoonacular recipe images
   */
  private optimizeSpoonacularImage(
    originalUrl: string,
    config: ImageOptimizationConfig
  ): OptimizedImageResult {
    const { width = 400, height = 300 } = config;
    
    // Spoonacular supports size parameters
    let optimizedUrl = originalUrl;
    
    // Add size parameters for Spoonacular images
    if (originalUrl.includes('spoonacular.com')) {
      // Remove existing size parameters
      optimizedUrl = originalUrl.replace(/\d+x\d+\./g, '');
      // Add new size parameters
      optimizedUrl = optimizedUrl.replace(
        /(.*\/)(.*\.(jpg|jpeg|png))/i,
        `$1${width}x${height}.$2`
      );
    }

    return {
      src: optimizedUrl,
      fallbackSrc: originalUrl,
      loading: config.lazy ? 'lazy' : 'eager',
      alt: 'Recipe image',
      placeholder: config.placeholder ? this.generatePlaceholder(width, height) : undefined
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
              font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
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