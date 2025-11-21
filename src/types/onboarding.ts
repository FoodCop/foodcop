// Onboarding type definitions

export interface OnboardingState {
  currentStep: number; // 0-1 (Welcome, Dietary Preferences)
  location: LocationData | null;
  foodPreferences: FoodPreferencesData | null;
}

export interface LocationData {
  country: string;    // Country name (e.g., "India", "Canada", "United States")
}

export interface FoodPreferencesData {
  dietaryPreferences: string[];   // ["vegetarian", "vegan", "pescetarian", "ketogenic", "paleo", "gluten-free", "dairy-free", "no-restrictions"]
}

// Legacy types - kept for backward compatibility
export interface ProfileData {
  firstName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface QuestionResponse {
  questionId: string;
  question: string;
  answer: boolean;
  followUp?: string;
}

export interface ExtractedPreferences {
  dietary_preferences: string[];
  allergies: string[];
  cuisine_preferences: string[];
  health_conscious: boolean;
}

// Predefined options for UI rendering
export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Pescetarian',
  'Ketogenic',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
  'No restrictions'
] as const;
