import axios from 'axios';
import config from '../config/config';
import type { GooglePlace, SearchResult } from '../types';

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

      const url = `${PLACES_BASE}/textsearch/json`;
      const res = await axios.get(url, { params });
      return { success: true, data: res.data };
    } catch (error) {
      console.error('Google Places textSearch error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async placeDetails(placeId: string) {
    try {
      const url = `${PLACES_BASE}/details/json`;
      const res = await axios.get(url, {
        params: {
          place_id: placeId,
          key: config.google.placesApiKey,
        },
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error('Google Places placeDetails error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async nearbySearch(location: { lat: number; lng: number }, radius = 5000, type?: string) {
    try {
      const params: Record<string, string | number> = {
        location: `${location.lat},${location.lng}`,
        radius,
        key: config.google.placesApiKey,
      };

      if (type) params.type = type;

      const url = `${PLACES_BASE}/nearbysearch/json`;
      const res = await axios.get(url, { params });
      return { success: true, data: res.data };
    } catch (error) {
      console.error('Google Places nearbySearch error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default GooglePlacesService;