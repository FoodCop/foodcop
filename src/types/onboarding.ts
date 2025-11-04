// Onboarding type definitions

export interface OnboardingState {
  currentStep: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    country: string;
  } | null;
  profile: {
    firstName: string;
    avatarUrl?: string;
  } | null;
  responses: QuestionResponse[];
  preferences: ExtractedPreferences | null;
}

export interface QuestionResponse {
  questionId: string;
  question: string;
  answer: boolean; // true = Yes, false = No
  followUp?: string; // For "which diet?" question
}

export interface ExtractedPreferences {
  dietary_preferences: string[]; // ["vegetarian", "vegan", "pescetarian", "ketogenic", "paleo", "glutenFree"]
  allergies: string[]; // ["dairy", "nuts", "shellfish", "gluten", "soy"]
  cuisine_preferences: string[]; // ["italian", "mexican", "asian", "american", "indian"]
  cuisine_dislikes: string[];
  spice_tolerance: number; // 1-5
  health_conscious: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface ProfileData {
  firstName: string;
  avatarUrl?: string;
}

export const ONBOARDING_QUESTIONS = [
  {
    id: 'q1',
    question: 'Do you eat meat?',
    helpText: 'This includes beef, pork, chicken, and other poultry'
  },
  {
    id: 'q2',
    question: 'Do you eat seafood?',
    helpText: 'Fish, shellfish, and other seafood'
  },
  {
    id: 'q3',
    question: 'Do you avoid dairy products?',
    helpText: 'Milk, cheese, yogurt, butter, etc.'
  },
  {
    id: 'q4',
    question: 'Are you allergic to nuts?',
    helpText: 'Tree nuts, peanuts, or nut-based products'
  },
  {
    id: 'q5',
    question: 'Do you enjoy spicy food?',
    helpText: 'Hot peppers, spicy sauces, etc.'
  },
  {
    id: 'q6',
    question: 'Do you prefer healthy, low-calorie options?',
    helpText: 'Focus on nutritious, lighter meals'
  },
  {
    id: 'q7',
    question: 'Are you following a specific diet?',
    helpText: 'Keto, Paleo, Whole30, etc.',
    requiresFollowUp: true,
    followUpOptions: ['Ketogenic', 'Paleo', 'Whole30', 'Low FODMAP', 'Primal', 'None']
  }
];
