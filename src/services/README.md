# Backend Services Implementation for Vite Application

This implementation provides a complete set of backend services adapted from the main-services Next.js application for use in a Vite React application. All services are designed to work client-side with Supabase as the backend.

## 🏗️ Architecture Overview

The services are organized into dedicated modules with clear separation of concerns:

- **Authentication**: User authentication and session management
- **Plate Management**: Save-to-plate functionality with idempotent operations
- **Profile Management**: User profile data and preferences
- **Geocoding**: Location services and reverse geocoding
- **Idempotency**: Operation deduplication and caching
- **Error Handling**: Comprehensive error management and retry logic

## 🚀 Quick Start

### Import Services

```typescript
import { 
  AuthService, 
  PlateService, 
  ProfileService, 
  GeocodingService,
  IdempotencyService 
} from './services';

// Or import individually
import { AuthService } from './services/authService';
import { PlateService } from './services/plateService';
```

### Basic Usage Examples

```typescript
// Authentication
const user = await AuthService.getCurrentUser();
const authResult = await AuthService.signIn({ email, password });

// Save restaurant to plate
const restaurant = { id: 'rest123', name: 'Great Restaurant', ... };
const saveResult = await PlateService.saveRestaurant(restaurant);

// Get user's saved items
const savedItems = await PlateService.listSavedItems({ itemType: 'restaurant' });

// Reverse geocode coordinates
const location = await GeocodingService.reverseGeocode({ lat: 40.7128, lng: -74.0060 });

// Update user profile
const profileResult = await ProfileService.updateProfile({ 
  display_name: 'New Name',
  bio: 'Updated bio'
});
```

## 📚 Service Documentation

### AuthService

Handles user authentication and session management.

#### Methods

- `checkAuthStatus()` - Check current authentication status
- `ensureAuthenticated()` - Ensure user is authenticated, throw if not
- `getCurrentUser()` - Get current authenticated user
- `signUp(credentials)` - Register new user
- `signIn(credentials)` - Sign in user
- `signInWithGoogle()` - Google OAuth sign in
- `signOut()` - Sign out current user
- `resetPassword(email)` - Send password reset email
- `updatePassword(newPassword)` - Update user password
- `updateEmail(newEmail)` - Update user email
- `onAuthStateChange(callback)` - Listen to auth state changes

#### Example Usage

```typescript
// Check if user is authenticated
const authStatus = await AuthService.checkAuthStatus();
if (authStatus.success && authStatus.user) {
  console.log('User is logged in:', authStatus.user);
}

// Sign up new user
const signupResult = await AuthService.signUp({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
});

// Listen to auth changes
const unsubscribe = AuthService.onAuthStateChange((user) => {
  if (user) {
    console.log('User signed in:', user);
  } else {
    console.log('User signed out');
  }
});
```

### PlateService

Manages user's saved items with idempotent operations.

#### Methods

- `saveToPlate(params)` - Save any item to user's plate
- `saveRestaurant(restaurant)` - Save restaurant with validation
- `isItemSaved(itemType, itemId)` - Check if item is already saved
- `listSavedItems(params)` - List saved items with filtering
- `getSavedRestaurants(limit, offset)` - Get saved restaurants specifically
- `removeFromPlate(itemType, itemId)` - Remove item from plate
- `getItemCount(itemType)` - Get count of saved items

#### Example Usage

```typescript
// Save a restaurant
const restaurant = {
  id: 'restaurant123',
  name: 'Amazing Restaurant',
  address: '123 Main St',
  latitude: 40.7128,
  longitude: -74.0060,
  rating: 4.5,
  types: ['restaurant', 'food']
};

const saveResult = await PlateService.saveRestaurant(restaurant);

// Check if item is saved
const isAlreadySaved = await PlateService.isItemSaved('restaurant', 'restaurant123');

// Get all saved restaurants
const savedRestaurants = await PlateService.getSavedRestaurants(10, 0);

// Remove from plate
const removeResult = await PlateService.removeFromPlate('restaurant', 'restaurant123');
```

### ProfileService

Manages user profile data and preferences.

#### Methods

- `getProfile()` - Get current user's profile
- `updateProfile(updates)` - Update user profile
- `updatePreferences(preferences)` - Update user preferences
- `updateDietaryRestrictions(restrictions)` - Update dietary restrictions
- `updateCuisinePreferences(preferences, dislikes)` - Update cuisine preferences
- `updateAvatar(file)` - Upload and update user avatar
- `deleteAvatar()` - Delete user avatar
- `isUsernameAvailable(username)` - Check username availability

#### Example Usage

```typescript
// Get user profile
const profile = await ProfileService.getProfile();

// Update profile
const updateResult = await ProfileService.updateProfile({
  display_name: 'John Smith',
  bio: 'Food enthusiast from NYC',
  location_city: 'New York'
});

// Update dietary restrictions
const dietaryResult = await ProfileService.updateDietaryRestrictions([
  'vegetarian', 'gluten-free'
]);

// Update cuisine preferences
const cuisineResult = await ProfileService.updateCuisinePreferences(
  ['italian', 'japanese', 'mexican'],
  ['spicy-food']
);

// Upload avatar
const file = document.querySelector('input[type="file"]').files[0];
const avatarResult = await ProfileService.updateAvatar(file);
```

### GeocodingService

Provides location services and geocoding functionality.

#### Methods

- `reverseGeocode(params)` - Convert coordinates to address
- `forwardGeocode(address)` - Convert address to coordinates
- `getCurrentLocation()` - Get user's current location
- `getCurrentLocationAddress()` - Get current location and address
- `calculateDistance(coord1, coord2)` - Calculate distance between coordinates
- `validateCoordinates(lat, lng)` - Validate coordinate values

#### Example Usage

```typescript
// Reverse geocode coordinates to address
const location = await GeocodingService.reverseGeocode({
  lat: 40.7128,
  lng: -74.0060
});

// Forward geocode address to coordinates
const coordinates = await GeocodingService.forwardGeocode('Empire State Building, NYC');

// Get current location
const currentLocation = await GeocodingService.getCurrentLocation();
if (currentLocation) {
  console.log('Current coordinates:', currentLocation);
}

// Calculate distance between two points
const distance = GeocodingService.calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 34.0522, longitude: -118.2437 }
);
console.log('Distance:', distance, 'km');
```

### IdempotencyService

Handles operation deduplication and result caching.

#### Methods

- `executeWithIdempotency(key, operation, ttlHours)` - Execute with idempotency
- `generateKey(operation, params)` - Generate idempotency key
- `generateUserKey(operation, params)` - Generate user-specific key
- `invalidateKey(key)` - Invalidate specific key
- `cleanupExpiredKeys()` - Clean up expired keys
- `getUsageStats()` - Get idempotency usage statistics

#### Example Usage

```typescript
// Execute operation with idempotency
const result = await IdempotencyService.executeWithIdempotency(
  'save_restaurant_123',
  async () => {
    return await PlateService.saveRestaurant(restaurant);
  },
  24 // TTL in hours
);

// Generate consistent keys
const key = IdempotencyService.generateKey('save_restaurant', { 
  restaurantId: '123',
  userId: 'user456'
});

// User-specific operation
const userResult = await IdempotencyService.executeUserOperation(
  'update_profile',
  { field: 'bio', value: 'New bio' },
  async () => {
    return await ProfileService.updateProfile({ bio: 'New bio' });
  }
);
```

## 🔧 Configuration

### Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (for geocoding)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# App Configuration
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME="Your App Name"
```

### Database Setup

Ensure your Supabase database has the following tables:

1. **users** - User profiles and preferences
2. **saved_items** - User's saved content with metadata
3. **idempotency_keys** - Operation deduplication cache

See the `main-services/database/schema.sql` for complete schema.

## 🛡️ Error Handling

All services use consistent error handling patterns:

```typescript
// Services return structured responses
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Example usage with error handling
try {
  const result = await PlateService.saveRestaurant(restaurant);
  
  if (result.success) {
    console.log('Saved successfully:', result.data);
  } else {
    console.error('Save failed:', result.error);
    // Handle error appropriately
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## 🔄 Migration from Legacy Service

If you're migrating from the existing `SupabaseService`, the new services provide better organization:

```typescript
// Old way
import { SupabaseService } from './services/supabase';
const user = await SupabaseService.getCurrentUser();

// New way
import { AuthService } from './services/authService';
const user = await AuthService.getCurrentUser();
```

The legacy `SupabaseService` is updated to delegate to the new services for backward compatibility.

## 🧪 Testing

Each service includes comprehensive error handling and logging. Test with:

```typescript
// Enable detailed logging
console.log('Service response:', await AuthService.checkAuthStatus());
console.log('Plate items:', await PlateService.listSavedItems());
```

## 📈 Performance Considerations

- **Idempotency**: Use `IdempotencyService` for expensive operations
- **Caching**: Services cache authentication state and profile data
- **Retry Logic**: Built-in retry for network operations
- **Pagination**: Use limit/offset for large data sets

## 🔐 Security Notes

- All operations validate user authentication
- Row Level Security (RLS) enforced at database level
- Tenant isolation prevents cross-user data access
- API keys stored securely in environment variables

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**: Check Supabase configuration and user session
2. **Database Errors**: Verify table structure and RLS policies
3. **API Limits**: Handle geocoding quota limits gracefully
4. **Network Issues**: Services include automatic retry logic

### Debug Mode

Enable detailed logging by setting `localStorage.debug = '*'` in browser console.

## 📄 License

This implementation follows the same license as the main FuzoFoodCop application.