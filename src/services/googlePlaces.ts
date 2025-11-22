import axios from 'axios';
import config from '../config/config';
import type { GooglePlace, SearchResult } from '../types';
import { withGoogleApiCache } from './googleApiCache';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

export const GooglePlacesService = {
  async textSearch(query: string, location?: { lat: number; lng: number } | null, radius = 5000) {
    try {
      const params: Record<string, string | number> = {
        query,
        key: config.google.placesApiKey,
      };

      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = radius;
      }

      // Use caching and rate limiting
      const cacheParams = {
        method: 'textSearch',
        query,
        ...(location ? { lat: Math.round(location.lat * 100) / 100, lng: Math.round(location.lng * 100) / 100, radius } : {})
      };

      const result = await withGoogleApiCache<{ success: boolean; data?: any; error?: string }>(
        'places',
        cacheParams,
        async () => {
          const url = `${PLACES_BASE}/textsearch/json`;
          const res = await axios.get(url, { params });
          return { success: true, data: res.data };
        },
        {
          useCache: true,
          cacheDuration: 20 * 60 * 1000 // 20 minutes
        }
      );

      return result;
    } catch (error) {
      console.error('Google Places textSearch error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async placeDetails(placeId: string) {
    try {
      // Use caching and rate limiting
      const cacheParams = { method: 'placeDetails', placeId };

      const result = await withGoogleApiCache<{ success: boolean; data?: any; error?: string }>(
        'places',
        cacheParams,
        async () => {
          const url = `${PLACES_BASE}/details/json`;
          const res = await axios.get(url, {
            params: {
              place_id: placeId,
              key: config.google.placesApiKey,
            },
          });
          return { success: true, data: res.data };
        },
        {
          useCache: true,
          cacheDuration: 30 * 60 * 1000 // 30 minutes - place details don't change often
        }
      );

      return result;
    } catch (error) {
      console.error('Google Places placeDetails error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async nearbySearch(location: { lat: number; lng: number }, radius = 5000, type?: string) {
    try {
      // Use caching and rate limiting
      const cacheParams = {
        method: 'nearbySearch',
        lat: Math.round(location.lat * 100) / 100, // Round to reduce cache fragmentation
        lng: Math.round(location.lng * 100) / 100,
        radius,
        ...(type ? { type } : {})
      };

      const result = await withGoogleApiCache<{ success: boolean; data?: any; error?: string }>(
        'places',
        cacheParams,
        async () => {
          const params: Record<string, string | number> = {
            location: `${location.lat},${location.lng}`,
            radius,
            key: config.google.placesApiKey,
          };

          if (type) params.type = type;

          const url = `${PLACES_BASE}/nearbysearch/json`;
          const res = await axios.get(url, { params });
          return { success: true, data: res.data };
        },
        {
          useCache: true,
          cacheDuration: 20 * 60 * 1000 // 20 minutes
        }
      );

      return result;
    } catch (error) {
      console.error('Google Places nearbySearch error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default GooglePlacesService;