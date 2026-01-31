/**
 * Image utility functions for progressive loading
 */

/**
 * Generate blur data URL from color
 * Useful for solid color placeholders
 */
export function createBlurDataURL(color: string = 'var(--color-neutral-bg)'): string {
  return `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/></svg>`
  )}`;
}

/**
 * Generate low quality image URL
 * For services that support image transformations
 */
export function getLowQualityUrl(url: string): string {
  // Unsplash
  if (url.includes('unsplash.com')) {
    return url.includes('?') 
      ? `${url}&w=40&q=10&blur=10`
      : `${url}?w=40&q=10&blur=10`;
  }

  // Google Places API photos
  if (url.includes('maps.googleapis.com/maps/api/place/photo')) {
    return url.replace(/maxwidth=\d+/, 'maxwidth=40');
  }

  // Default: return original
  return url;
}
