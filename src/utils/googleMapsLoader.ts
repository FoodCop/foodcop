/**
 * Google Maps Script Loader
 * Ensures Google Maps API is loaded only once across the entire application
 */

import { config } from '../config/config';

// Global state to track loading
let isLoading = false;
let isLoaded = false;
let loadError: Error | null = null;
const loadPromises: Array<(value: void) => void> = [];
const errorCallbacks: Array<(error: Error) => void> = [];

/**
 * Load Google Maps API script
 * @returns Promise that resolves when the script is loaded
 */
export async function loadGoogleMapsScript(): Promise<void> {
  // If already loaded, return immediately
  if (isLoaded && globalThis.google?.maps) {
    return Promise.resolve();
  }

  // If there was a previous error, reject with that error
  if (loadError) {
    return Promise.reject(loadError);
  }

  // If currently loading, wait for the existing load to complete
  if (isLoading) {
    return new Promise<void>((resolve, reject) => {
      loadPromises.push(resolve);
      errorCallbacks.push(reject);
    });
  }

  // Start loading
  isLoading = true;

  return new Promise<void>((resolve, reject) => {
    try {
      const apiKey = config.google.mapsApiKey;
      if (!apiKey) {
        const error = new Error('Google Maps API key is not configured');
        loadError = error;
        isLoading = false;
        reject(error);
        errorCallbacks.forEach(cb => cb(error));
        return;
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );

      if (existingScript) {
        // Script exists, wait for it to load
        if (globalThis.google?.maps) {
          isLoaded = true;
          isLoading = false;
          resolve();
          loadPromises.forEach(cb => cb());
          return;
        }

        // Wait for existing script to load
        existingScript.addEventListener('load', () => {
          isLoaded = true;
          isLoading = false;
          resolve();
          loadPromises.forEach(cb => cb());
        });

        existingScript.addEventListener('error', () => {
          const error = new Error('Failed to load Google Maps script');
          loadError = error;
          isLoading = false;
          reject(error);
          errorCallbacks.forEach(cb => cb(error));
        });

        return;
      }

      // Create new script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isLoaded = true;
        isLoading = false;
        resolve();
        loadPromises.forEach(cb => cb());
        loadPromises.length = 0;
        errorCallbacks.length = 0;
      };

      script.onerror = () => {
        const error = new Error('Failed to load Google Maps script');
        loadError = error;
        isLoading = false;
        reject(error);
        errorCallbacks.forEach(cb => cb(error));
        loadPromises.length = 0;
        errorCallbacks.length = 0;
      };

      document.head.appendChild(script);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading Google Maps');
      loadError = error;
      isLoading = false;
      reject(error);
      errorCallbacks.forEach(cb => cb(error));
      loadPromises.length = 0;
      errorCallbacks.length = 0;
    }
  });
}

/**
 * Check if Google Maps is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded && Boolean(globalThis.google?.maps);
}

/**
 * Reset the loader state (useful for testing)
 */
export function resetLoader(): void {
  isLoading = false;
  isLoaded = false;
  loadError = null;
  loadPromises.length = 0;
  errorCallbacks.length = 0;
}
