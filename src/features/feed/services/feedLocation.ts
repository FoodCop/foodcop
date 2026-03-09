export const getUserFeedLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
  if (!navigator.geolocation) return undefined;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 120000 }
    );
  });
};
