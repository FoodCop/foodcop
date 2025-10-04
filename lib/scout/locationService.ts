// Location service utility for Scout map functionality
// Uses existing Google reverse geocoding API for address resolution

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
  geocodingSuccess?: boolean;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Geolocation error message helper (from ScoutDebug)
export function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Permission denied - Please allow location access";
    case 2:
      return "Position unavailable - Unable to determine location";
    case 3:
      return "Request timeout - Location request timed out";
    default:
      return "Unknown geolocation error";
  }
}

// Get user's current location with high accuracy
export async function getCurrentUserLocation(): Promise<LocationInfo> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationInfo = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toLocaleString()
        };

        // Attempt reverse geocoding using existing Google API
        try {
          const response = await fetch(`/api/debug/google-maps?lat=${locationData.latitude}&lng=${locationData.longitude}`);
          const data = await response.json();
          
          locationData.address = data.locationName || data.formatted_address || 'Address not available';
          locationData.geocodingSuccess = data.success;
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
          locationData.address = 'Reverse geocoding failed';
          locationData.geocodingSuccess = false;
        }

        resolve(locationData);
      },
      (error) => {
        const geolocationError: GeolocationError = {
          code: error.code,
          message: getGeolocationErrorMessage(error.code)
        };
        reject(geolocationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  });
}

// Format location for display
export function formatLocationInfo(location: LocationInfo): string {
  const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  const accuracy = `±${Math.round(location.accuracy)}m`;
  
  if (location.address && location.geocodingSuccess) {
    return `${location.address} (${coords}, ${accuracy})`;
  } else {
    return `${coords} (${accuracy})`;
  }
}

// Check if location is valid
export function isValidLocation(location: any): location is LocationInfo {
  return (
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    !isNaN(location.latitude) &&
    !isNaN(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
}