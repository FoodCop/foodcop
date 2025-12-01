/**
 * Google Maps Script Loader
 * Ensures Google Maps API is loaded only once across the entire application
 * Uses the official @googlemaps/js-api-loader for reliable loading
 */

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { config } from '../config/config';

let loadingPromise: Promise<void> | null = null;

/**
 * Load Google Maps API script
 * @returns Promise that resolves when the script is loaded
 */
export async function loadGoogleMapsScript(): Promise<void> {
  // If already loaded, return immediately
  if (globalThis.google?.maps?.Map) {
    return;
  }

  // If currently loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  const apiKey = config.google.mapsApiKey;
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  // Configure global options
  setOptions({
    key: apiKey,
    v: 'weekly',
    libraries: ['places', 'geometry'],
  });

  // Start loading
  loadingPromise = importLibrary('maps').then(() => {
    // We also need the marker library for AdvancedMarkerElement if we decide to use it,
    // but for now just ensuring 'maps' is loaded is the core requirement.
    // The Loader automatically handles the script injection and ready state.
    return;
  }).catch((err) => {
    console.error('Failed to load Google Maps:', err);
    loadingPromise = null; // Reset promise on error so we can retry
    throw err;
  });

  return loadingPromise;
}

/**
 * Check if Google Maps is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return Boolean(globalThis.google?.maps?.Map);
}

/**
 * Reset the loader state (useful for testing)
 */
export function resetLoader(): void {
  loadingPromise = null;
}
