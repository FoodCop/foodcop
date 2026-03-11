export type OnboardingLocation = {
  country: string;
  state: string;
  city: string;
  detected: boolean;
  lat?: number;
  lng?: number;
};

export type OnboardingV2Payload = {
  answers: Record<string, string>;
  phone: string;
  location: OnboardingLocation;
  locationLabel: string;
};
