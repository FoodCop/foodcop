import { useEffect, useState } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  isLoading: boolean;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    latitude: 0,
    longitude: 0,
    address: "LaunchPad @ one-north, 75 Ay...",
    city: "Singapore",
    country: "Singapore",
    isLoading: false,
    error: null,
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser.",
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation((prev) => ({
          ...prev,
          latitude,
          longitude,
          isLoading: false,
          error: null,
        }));
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    );
  };

  useEffect(() => {
    // Auto-detect location on mount
    getCurrentLocation();
  }, []);

  return {
    location,
    getCurrentLocation,
  };
}
