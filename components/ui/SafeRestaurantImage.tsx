import { useEffect, useState } from "react";
import {
  getPlaceHeroUrl,
  staticMapFallback,
} from "../../src/lib/google/places";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  getFallbackImageUrl,
  resolvePhotoUrl,
} from "../services/backendService";

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
  placeId?: string; // Add placeId for Google Places API v1
  coordinates?: { lat: number; lng: number }; // Add coordinates for fallback
}

export function SafeRestaurantImage({
  src,
  photos,
  restaurantName,
  alt,
  className,
  maxWidth = 400,
  placeId,
  coordinates,
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

      // Try Google Places API v1 first if we have a placeId
      if (placeId) {
        setIsLoading(true);
        setHasError(false);

        try {
          console.log(
            "🔄 Fetching image for",
            restaurantName,
            "using Google Places API v1"
          );
          const result = await getPlaceHeroUrl(placeId, {
            maxWidth,
            maxHeight: Math.round(maxWidth * 0.75),
          });

          if (result.url) {
            console.log(
              "✅ Google Places API v1 image resolved for",
              restaurantName
            );
            setResolvedImageUrl(result.url);
            return;
          } else {
            console.warn(
              "⚠️ No image available from Google Places API v1 for",
              restaurantName
            );
          }
        } catch (error) {
          console.error(
            "❌ Error fetching image from Google Places API v1 for",
            restaurantName,
            error
          );
        } finally {
          setIsLoading(false);
        }
      }

      // Fallback to legacy photo resolution if we have photos with references
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

      // If we have coordinates but no placeId, try static map fallback
      if (coordinates && !placeId) {
        try {
          const staticMapUrl = staticMapFallback(
            coordinates.lat,
            coordinates.lng,
            maxWidth,
            Math.round(maxWidth * 0.75)
          );
          console.log("✅ Using static map fallback for", restaurantName);
          setResolvedImageUrl(staticMapUrl);
          return;
        } catch (error) {
          console.error(
            "❌ Error generating static map for",
            restaurantName,
            error
          );
        }
      }

      // If no valid image source, use fallback
      setHasError(true);
    }

    resolveImage();
  }, [src, photos, restaurantName, maxWidth, placeId, coordinates]);

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
