import { useEffect, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  getFallbackImageUrl,
  resolvePhotoUrl,
} from "./services/backendService";

interface SafeRestaurantImageProps {
  src?: string;
  photos?: Array<{
    photoReference?: string;
    needsResolving?: boolean;
    width?: number;
    height?: number;
  }>;
  restaurantName: string;
  alt: string;
  className?: string;
  maxWidth?: number;
}

export function SafeRestaurantImage({
  src,
  photos,
  restaurantName,
  alt,
  className,
  maxWidth = 400,
}: SafeRestaurantImageProps) {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function resolveImage() {
      // If we already have a direct image URL, use it
      if (src && !src.startsWith("photo_reference:")) {
        setResolvedImageUrl(src);
        return;
      }

      // If we have photos with references that need resolving
      if (photos && photos.length > 0) {
        const firstPhoto = photos[0];
        if (firstPhoto.photoReference && firstPhoto.needsResolving) {
          setIsLoading(true);
          setHasError(false);

          try {
            const photoUrl = await resolvePhotoUrl(
              firstPhoto.photoReference,
              maxWidth
            );
            if (photoUrl) {
              console.log("✅ Photo resolved for", restaurantName);
              setResolvedImageUrl(photoUrl);
            } else {
              console.warn("⚠️ Photo resolution failed for", restaurantName);
              setHasError(true);
            }
          } catch (error) {
            console.error(
              "❌ Error resolving photo for",
              restaurantName,
              error
            );
            setHasError(true);
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }

      // Check if src is an old-style photo reference
      if (src && src.startsWith("photo_reference:")) {
        const photoReference = src.replace("photo_reference:", "");
        setIsLoading(true);
        setHasError(false);

        try {
          const photoUrl = await resolvePhotoUrl(photoReference, maxWidth);
          if (photoUrl) {
            console.log("✅ Legacy photo resolved for", restaurantName);
            setResolvedImageUrl(photoUrl);
          } else {
            console.warn(
              "⚠️ Legacy photo resolution failed for",
              restaurantName
            );
            setHasError(true);
          }
        } catch (error) {
          console.error(
            "❌ Error resolving legacy photo for",
            restaurantName,
            error
          );
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // If no valid image source, use fallback
      setHasError(true);
    }

    resolveImage();
  }, [src, photos, restaurantName, maxWidth]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
      >
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  // Use resolved image URL or fallback
  const imageUrl =
    resolvedImageUrl || (hasError ? getFallbackImageUrl(restaurantName) : src);

  return (
    <ImageWithFallback
      src={imageUrl || getFallbackImageUrl(restaurantName)}
      alt={alt}
      className={className}
    />
  );
}
