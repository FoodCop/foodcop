export interface ScoutMenuSection {
  section: string;
  items: string[];
}

export interface ScoutUserReview {
  user: string;
  rating: number;
  text: string;
}

export type ScoutTimings = Record<string, string>;

export interface ScoutPlace {
  id: string;
  placeId?: string;
  name: string;
  cat: string;
  rating: number;
  reviews: number;
  address: string;
  phone: string;
  website: string;
  vibe: string[];
  img: string;
  lat: number;
  lng: number;
  timings: ScoutTimings;
  menu: ScoutMenuSection[];
  userReviews: ScoutUserReview[];
  photos: string[];
}

export type MarkerLike = {
  setMap: (map: null) => void;
  addListener: (eventName: string, handler: () => void) => void;
};

export type LatLngBoundsLike = {
  extend: (location: { lat: number; lng: number }) => void;
  isEmpty: () => boolean;
};

export type MapLike = {
  fitBounds: (bounds: LatLngBoundsLike, padding?: number) => void;
  setCenter: (center: { lat: number; lng: number }) => void;
};

export type GoogleMapsLike = {
  Map: new (
    container: HTMLDivElement,
    options: {
      center: { lat: number; lng: number };
      zoom: number;
      streetViewControl: boolean;
      mapTypeControl: boolean;
      fullscreenControl: boolean;
    }
  ) => MapLike;
  Marker: new (options: {
    map: MapLike;
    position: { lat: number; lng: number };
    title: string;
    icon?: {
      path: unknown;
      scale: number;
      fillColor: string;
      fillOpacity: number;
      strokeColor: string;
      strokeWeight: number;
    };
  }) => MarkerLike;
  LatLngBounds: new () => LatLngBoundsLike;
  SymbolPath: { CIRCLE: unknown };
};

export type GooglePlacePhoto = { photo_reference?: string };

export type GooglePlaceReview = {
  author_name?: string;
  rating?: number;
  text?: string;
};

export type GooglePlaceResult = {
  place_id?: string;
  name?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  opening_hours?: { weekday_text?: string[] };
  reviews?: GooglePlaceReview[];
  photos?: GooglePlacePhoto[];
};

export const getGoogleMaps = (): GoogleMapsLike | null => {
  const runtime = globalThis as { google?: { maps?: GoogleMapsLike } };
  return runtime.google?.maps ?? null;
};
