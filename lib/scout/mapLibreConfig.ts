// MapLibre GL JS configuration for Scout page
// This file contains map styles, default settings, and control configurations

export interface MapStyle {
  name: string;
  label: string;
  url: string;
  description: string;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Available map styles
export const mapStyles: Record<string, MapStyle> = {
  street: {
    name: 'street',
    label: 'Street',
    url: 'https://demotiles.maplibre.org/style.json',
    description: 'Basic OpenStreetMap style (reliable fallback)'
  },
  osm_bright: {
    name: 'osm_bright',
    label: 'OSM Bright',
    url: 'https://api.maptiler.com/maps/bright/style.json?key=demo',
    description: 'Bright OpenStreetMap style with good detail'
  },
  satellite: {
    name: 'satellite', 
    label: 'Satellite',
    url: 'https://api.maptiler.com/maps/hybrid/style.json?key=demo',
    description: 'Satellite imagery view with labels'
  },
  terrain: {
    name: 'terrain',
    label: 'Terrain',
    url: 'https://api.maptiler.com/maps/outdoor/style.json?key=demo', 
    description: 'Terrain and elevation view'
  }
};

// Default map configuration
export const mapConfig = {
  // Default map style (will be street view)
  defaultStyle: mapStyles.street.url,
  
  // Default view state (San Francisco as fallback)
  defaultViewState: {
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12,
    pitch: 0,
    bearing: 0
  } as MapViewState,
  
  // Map controls configuration
  controls: {
    navigation: true,      // Zoom and rotation controls
    scale: true,          // Scale indicator
    fullscreen: true,     // Fullscreen button
    geolocate: false     // Disabled - using custom location detection
  },
  
  // Map interaction settings
  interactions: {
    scrollZoom: true,
    dragPan: true,
    dragRotate: true,
    doubleClickZoom: false,  // Disable double-click zoom to prevent accidental zoom changes
    touchZoom: true,
    touchRotate: true,
    keyboard: true
  },
  
  // Performance settings
  performance: {
    maxZoom: 20,
    minZoom: 1,
    antialias: true,
    preserveDrawingBuffer: false
  }
};

// Map container CSS classes
export const mapClasses = {
  container: "scout-map-container",
  map: "scout-map",
  loading: "scout-map-loading",
  error: "scout-map-error",
  controls: "scout-map-controls"
};

// Utility function to get user's location or fallback to default
export const getInitialViewState = (userLocation?: { latitude: number; longitude: number }): MapViewState => {
  if (userLocation) {
    return {
      longitude: userLocation.longitude,
      latitude: userLocation.latitude,
      zoom: 18, // High zoom level for detailed street visibility
      pitch: 0,
      bearing: 0
    };
  }
  
  return mapConfig.defaultViewState;
};

// Brand colors for map styling
export const brandColors = {
  primary: "#329937",      // FUZO green
  secondary: "#047DD4",    // FUZO blue  
  accent: "#FF7E27",       // FUZO orange
  error: "#dc2626",        // Error red
  success: "#28a745",      // Success green
  warning: "#ffc107"       // Warning yellow
};