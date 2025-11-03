// Export all services for easy importing
export { AuthService } from './authService';
export { PlateService } from './plateService';
export { ProfileService } from './profileService';
export { GeocodingService } from './geocodingService';
export { IdempotencyService } from './idempotencyService';
export { SupabaseService } from './supabase';
export { ErrorHandler } from '../utils/errorHandler';
export { savedItemsService } from './savedItemsService';
export { GoogleDirectionsService } from './googleDirections';

// Export types
export type { 
  AuthUser, 
  AuthStatus, 
  LoginForm, 
  SignupForm, 
  AuthResponse 
} from '../types/auth';

export type { 
  SaveItemParams, 
  SavedItem, 
  Restaurant, 
  PlateResponse, 
  ListSavedItemsParams,
  SavedItemsResponse 
} from '../types/plate';

export type { 
  UserProfile, 
  ProfileUpdateParams, 
  ProfileResponse,
  UserPreferences 
} from '../types/profile';

export type { 
  GeocodingParams, 
  GeocodingResult, 
  LocationCoordinates 
} from '../types/geocoding';

export type { 
  ServiceResponse, 
  IdempotencyKey, 
  RetryOptions, 
  ApiError 
} from '../types/common';