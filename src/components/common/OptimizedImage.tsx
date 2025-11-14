import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '../../utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  blurDataURL?: string;
  lowQualitySrc?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component with Progressive Loading
 * Features:
 * - Blur-up loading effect
 * - Low-quality placeholder
 * - Lazy loading support
 * - Aspect ratio preservation
 * - Error fallback
 */
export default function OptimizedImage({
  src,
  alt,
  blurDataURL,
  lowQualitySrc,
  aspectRatio = '16/9',
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc || blurDataURL || '');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Skip loading for priority images
    if (priority) {
      setCurrentSrc(src);
      setIsLoading(false);
      return;
    }

    // Create image loader
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, priority, onLoad, onError]);

  // Error fallback
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-200 text-gray-400',
          className
        )}
        style={{ aspectRatio }}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {isLoading && blurDataURL && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-lg scale-110"
          style={{
            backgroundImage: `url(${blurDataURL})`,
          }}
        />
      )}

      {/* Main image */}
      <img
        src={currentSrc || src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        {...props}
      />

      {/* Loading spinner */}
      {isLoading && !blurDataURL && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      )}
    </div>
  );
}
