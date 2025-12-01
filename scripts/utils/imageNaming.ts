/**
 * Image Naming Utilities
 * 
 * Provides consistent, human-readable naming for restaurant images
 * Format: {city}_{index}_{sanitized-title}_v2.png
 * Example: bangkok_01_cheaper-better-street-food_v2.png
 */

/**
 * Sanitize a string for use in filenames
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces with hyphens
 * - Limits length to 50 characters
 */
export function sanitizeFilename(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .substring(0, 50) // Limit length
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract city name from MasterSet filename
 * Example: MasterSet_bangkok.json -> bangkok
 */
export function extractCityFromFilename(filename: string): string {
    const match = filename.match(/MasterSet_([^.]+)\.json/);
    return match ? match[1] : 'unknown';
}

/**
 * Generate a human-readable image filename
 * Format: {city}_{index}_{sanitized-title}_v2.png
 * 
 * @param city - City name (e.g., "bangkok")
 * @param index - Index in the JSON file (0-based, will be formatted as 01, 02, etc.)
 * @param title - Restaurant title
 * @returns Filename like "bangkok_01_cheaper-better-street-food_v2.png"
 */
export function generateImageFilename(
    city: string,
    index: number,
    title: string
): string {
    const sanitizedCity = sanitizeFilename(city);
    const sanitizedTitle = sanitizeFilename(title);
    const formattedIndex = String(index + 1).padStart(2, '0'); // 01, 02, 03, etc.
    
    return `${sanitizedCity}_${formattedIndex}_${sanitizedTitle}_v2.png`;
}

/**
 * Generate image path (relative to public folder)
 */
export function generateImagePath(
    city: string,
    index: number,
    title: string
): string {
    const filename = generateImageFilename(city, index, title);
    return `/generated-images/${filename}`;
}

