# Profile Edit Modal - Design Specification

## 🎯 Overview

The Profile Edit Modal allows users to update their profile information in an intuitive, organized interface. The modal is designed to be responsive, accessible, and provide a smooth user experience for managing profile settings.

## 📋 Profile Fields Included

Based on the Supabase schema analysis, the following fields will be editable:

### ✅ **Basic Profile Information**
- `email` - User's email address (read-only, for reference)
- `username` - Unique username (with availability check)
- `display_name` - Display name
- `avatar_url` - Profile picture upload/URL
- `cover_photo_url` - Cover/banner photo upload/URL

### ✅ **Personal Details**
- `first_name` - First name
- `last_name` - Last name
- `date_of_birth` - Date of birth (optional)
- `location_city` - City location
- `location_state` - State/province location
- `location_country` - Country location

### ✅ **Food Preferences**
- `dietary_preferences` - JSON array (vegetarian, vegan, gluten-free, etc.)

### ✅ **Privacy & Account Settings**
- `is_private` - Private profile setting
- `is_verified` - Verified account status (read-only)

### ❌ **Excluded Fields** (per user request)
- ~~`bio`~~ - User biography/description
- ~~`price_range_preference`~~ - Integer 1-4 scale
- ~~`cuisine_preferences`~~ - JSON array
- ~~`spice_tolerance`~~ - Integer 1-5 scale

### 🔒 **System Fields** (Read-only/Auto-managed)
- Gamification fields (points, level, streaks)
- Social stats (followers, following, posts count)
- Metadata (created_at, updated_at, last_seen_at)

---

## 🎨 UI Design Specification

### Modal Structure
```
┌─────────────────────────────────────────────────────────┐
│ Profile Settings                                    [×] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────────────────────────────┐ │
│ │             │  │                                     │ │
│ │   Tab Nav   │  │           Form Content              │ │
│ │             │  │                                     │ │
│ │ • Basic     │  │  [Form fields based on active tab] │ │
│ │ • Personal  │  │                                     │ │
│ │ • Food      │  │                                     │ │
│ │ • Privacy   │  │                                     │ │
│ │             │  │                                     │ │
│ └─────────────┘  └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                              [Cancel] [Save Changes]   │
└─────────────────────────────────────────────────────────┘
```

### Tab Navigation (Left Sidebar)
- **Basic Info** - Core profile information
- **Personal** - Personal details and location
- **Food Preferences** - Dietary restrictions
- **Privacy & Settings** - Account privacy controls

---

## 📱 Responsive Design

### Desktop (768px+)
- Modal width: 800px
- Two-column layout: Tab navigation (200px) + Content area (600px)
- Tab navigation on the left side

### Mobile (<768px)
- Full-screen modal overlay
- Tab navigation as horizontal scrollable pills at top
- Single-column content layout
- Sticky save/cancel buttons at bottom

---

## 📋 Form Sections Detail

### 1. **Basic Info Tab**

```tsx
┌─ Basic Information ──────────────────────────────────┐
│                                                      │
│ Profile Picture                                      │
│ ┌────────────┐  [Upload Photo] [Remove]             │
│ │    Avatar  │                                       │
│ │   Preview  │  Supported: JPG, PNG (max 5MB)       │
│ └────────────┘                                       │
│                                                      │
│ Cover Photo                                          │
│ ┌──────────────────────────────────────────────────┐ │
│ │           Cover Photo Preview                    │ │
│ └──────────────────────────────────────────────────┘ │
│ [Upload Cover] [Remove Cover]                        │
│                                                      │
│ Display Name *                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ John Doe                                         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Username * (Available ✓)                           │
│ ┌──────────────────────────────────────────────────┐ │
│ │ @johndoe                                         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Email (Cannot be changed)                            │
│ ┌──────────────────────────────────────────────────┐ │
│ │ john@example.com                                 │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Fields:**
- Avatar upload with preview
- Cover photo upload with preview  
- Display name (required)
- Username (required, with real-time availability check)
- Email (read-only, for reference)

**Validation:**
- Display name: 1-100 characters, required
- Username: 3-50 characters, alphanumeric + underscore, unique
- Images: JPG/PNG, max 5MB each

### 2. **Personal Tab**

```tsx
┌─ Personal Information ───────────────────────────────┐
│                                                      │
│ First Name                                           │
│ ┌──────────────────────────────────────────────────┐ │
│ │ John                                             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Last Name                                            │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Doe                                              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Date of Birth (Optional)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ MM/DD/YYYY                                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Location                                             │
│ City                                                 │
│ ┌──────────────────────────────────────────────────┐ │
│ │ San Francisco                                    │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ State/Province                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ California                                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Country                                              │
│ ┌──────────────────────────────────────────────────┐ │
│ │ United States                                    │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Fields:**
- First name (optional)
- Last name (optional)  
- Date of birth (optional, date picker)
- Location: City, State/Province, Country

**Validation:**
- Names: 1-50 characters if provided
- Date of birth: Valid date, must be 13+ years old
- Location fields: 1-100 characters if provided

### 3. **Food Preferences Tab**

```tsx
┌─ Food Preferences ───────────────────────────────────┐
│                                                      │
│ Dietary Restrictions                                 │
│ Select all that apply:                               │
│                                                      │
│ ☐ Vegetarian      ☐ Gluten-Free                     │
│ ☐ Vegan           ☐ Dairy-Free                      │
│ ☐ Pescatarian     ☐ Nut-Free                        │
│ ☐ Keto            ☐ Halal                           │
│ ☐ Paleo           ☐ Kosher                          │
│ ☐ Low-Carb        ☐ Sugar-Free                      │
│                                                      │
│ Custom Dietary Restriction                           │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Enter custom restriction...                      │ │
│ └──────────────────────────────────────────────────┘ │
│ [+ Add Custom]                                       │
│                                                      │
│ Current Restrictions:                                │
│ • Vegetarian [×]                                     │
│ • Gluten-Free [×]                                    │
│ • Low-Sodium [×] (custom)                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Fields:**
- Dietary preferences (checkbox selection)
- Custom dietary restrictions (add/remove)

**Validation:**
- Multiple selection allowed
- Custom restrictions: 1-50 characters

### 4. **Privacy & Settings Tab**

```tsx
┌─ Privacy & Account Settings ─────────────────────────┐
│                                                      │
│ Profile Visibility                                   │
│ ○ Public Profile                                     │
│   Anyone can view your profile and saved items      │
│                                                      │
│ ○ Private Profile                                    │
│   Only friends can view your profile                │
│                                                      │
│ Account Status                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ✓ Verified Account                               │ │
│ │   Your account has been verified                 │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Account Actions                                      │
│ [Change Password]                                    │
│                                                      │
│ Danger Zone                                          │
│ [Deactivate Account]                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Fields:**
- Profile privacy setting (public/private)
- Account verification status (read-only)
- Action buttons for password change and account deactivation

---

## 🔧 Technical Implementation

### Component Structure
```
components/
└── profile/
    ├── ProfileEditModal.tsx          # Main modal component
    ├── tabs/
    │   ├── BasicInfoTab.tsx         # Basic profile info
    │   ├── PersonalTab.tsx          # Personal details  
    │   ├── FoodPreferencesTab.tsx   # Dietary preferences
    │   └── PrivacySettingsTab.tsx   # Privacy & settings
    ├── ImageUpload.tsx              # Reusable image upload
    └── UsernameChecker.tsx          # Username availability
```

### State Management
```typescript
interface ProfileEditState {
  // Form data
  formData: {
    display_name: string;
    username: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    location_city: string;
    location_state: string;
    location_country: string;
    dietary_preferences: string[];
    avatar_url: string;
    cover_photo_url: string;
    is_private: boolean;
  };
  
  // UI state
  activeTab: 'basic' | 'personal' | 'food' | 'privacy';
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  
  // Username checking
  isCheckingUsername: boolean;
  usernameAvailable: boolean | null;
}
```

### API Endpoints
```typescript
// PUT /api/profile
interface UpdateProfileRequest {
  display_name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  dietary_preferences?: string[];
  avatar_url?: string;
  cover_photo_url?: string;
  is_private?: boolean;
}

// GET /api/check-username/:username
interface CheckUsernameResponse {
  available: boolean;
  suggestions?: string[];
}
```

---

## 📱 User Experience Flow

### Opening the Modal
1. User clicks "Edit Profile" button in PlateHeader
2. Modal opens with current profile data pre-populated
3. Basic Info tab is active by default

### Editing Process
1. User navigates between tabs using left sidebar (desktop) or top pills (mobile)
2. Changes are tracked in form state (isDirty flag)
3. Real-time validation provides immediate feedback
4. Username availability checked on blur/change

### Saving Changes
1. User clicks "Save Changes" button
2. Form validation runs across all tabs
3. API call made with only changed fields
4. Success toast shown, modal closes
5. Profile data refreshed in app state

### Error Handling
1. Field-level validation errors shown inline
2. API errors shown in toast notifications
3. Network errors allow retry
4. Unsaved changes warning on close

---

## 🎨 Design System Integration

### Colors
- Primary: `#F14C35` (FUZO Red)
- Secondary: `#0B1F3A` (Dark Navy)
- Background: `#FFFFFF` (White)
- Gray scale: Tailwind gray palette

### Typography
- Headers: `font-bold`
- Labels: `font-medium`
- Input text: `font-normal`
- Help text: `text-sm text-gray-600`

### Components Used
- `Dialog` - Modal container
- `Tabs` - Tab navigation
- `Form` - Form handling
- `Input` - Text inputs
- `Button` - Action buttons
- `Checkbox` - Multiple selections
- `RadioGroup` - Single selections
- `DatePicker` - Date selection
- `Avatar` - Profile picture display
- `Badge` - Dietary preferences display

---

## ♿ Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow
- All interactive elements keyboard accessible
- Escape key closes modal
- Enter key submits form

### Screen Reader Support
- Proper ARIA labels on all inputs
- Form validation errors announced
- Tab navigation state announced
- Loading states announced

### Visual Accessibility
- High contrast color combinations
- Focus indicators on all interactive elements
- Error states clearly indicated
- Text alternatives for images

---

## 🧪 Testing Strategy

### Unit Tests
- Form validation logic
- State management
- Username availability checking
- Image upload handling

### Integration Tests
- Tab navigation
- Form submission flow
- Error handling
- Modal open/close behavior

### E2E Tests
- Complete profile edit workflow
- Responsive behavior
- Accessibility compliance
- Error scenarios

---

## 🚀 Implementation Priority

### Phase 1 (MVP)
- [x] Modal structure and basic UI
- [x] Basic Info tab with core fields
- [x] Form validation
- [x] Save/cancel functionality

### Phase 2 (Enhanced)
- [ ] Personal details tab
- [ ] Food preferences tab
- [ ] Image upload functionality
- [ ] Real-time username checking

### Phase 3 (Complete)
- [ ] Privacy settings tab
- [ ] Advanced validation
- [ ] Responsive optimizations
- [ ] Accessibility enhancements

---

## 📄 File Structure

```
docs/
└── ProfileEditModal-Design.md        # This document

components/
└── profile/
    ├── ProfileEditModal.tsx
    ├── tabs/
    │   ├── BasicInfoTab.tsx
    │   ├── PersonalTab.tsx
    │   ├── FoodPreferencesTab.tsx
    │   └── PrivacySettingsTab.tsx
    ├── ImageUpload.tsx
    └── UsernameChecker.tsx

app/
└── api/
    ├── profile/
    │   └── route.ts
    └── check-username/
        └── [username]/
            └── route.ts

lib/
└── services/
    └── profileService.ts
```

This design provides a comprehensive, user-friendly profile editing experience while maintaining the clean, modern aesthetic of the FUZO app.

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. **500 Internal Server Error on Profile API**

**Problem:** When testing the Profile Edit Modal, you may encounter 500 errors with messages like:
- `column users.first_name does not exist`
- `Could not find the 'cover_photo_url' column of 'users' in the schema cache`

**Root Cause:** The Profile Edit Modal expects certain fields in the `users` table that may not exist in your database schema, or PostgREST (Supabase's API layer) hasn't refreshed its schema cache.

**Solution:**

1. **Add Missing Database Fields:**
   ```sql
   ALTER TABLE public.users 
   ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
   ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
   ADD COLUMN IF NOT EXISTS date_of_birth DATE,
   ADD COLUMN IF NOT EXISTS location_state VARCHAR(100),
   ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '[]'::jsonb,
   ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
   ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
   ```

2. **Refresh PostgREST Schema Cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Restart Development Server:**
   ```bash
   npm run dev
   ```

#### 2. **Dialog Description Warning**

**Problem:** Console warning: `Missing Description or aria-describedby={undefined} for {DialogContent}`

**Solution:** Add `DialogDescription` component to the ProfileEditModal:
```tsx
import { DialogDescription } from "@/components/ui/dialog"

// Inside DialogContent
<DialogDescription>
  Edit your profile information and preferences
</DialogDescription>
```

#### 3. **Image "fill" Missing "sizes" Prop**

**Problem:** Next.js warning about Image components missing `sizes` prop when using `fill={true}`

**Solution:** Add appropriate `sizes` prop to Image components:
```tsx
<Image
  src="/images/landing/Images/hero_image.png"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  alt="Hero image"
/>
```

#### 4. **TypeScript Build Errors**

**Problem:** TypeScript compilation errors after making changes

**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Run type checking: `npm run type-check`

#### 5. **Authentication Issues**

**Problem:** Profile data not loading or authentication errors

**Solution:**
1. Check if user is properly authenticated in AuthProvider
2. Verify Supabase client configuration
3. Check RLS policies on users table:
   ```sql
   -- Allow users to read their own profile
   CREATE POLICY "Users can view own profile" ON public.users
   FOR SELECT USING (auth.uid() = id);
   
   -- Allow users to update their own profile  
   CREATE POLICY "Users can update own profile" ON public.users
   FOR UPDATE USING (auth.uid() = id);
   ```

### Debugging Tips

1. **Check Browser Console:** Look for detailed error messages in the browser developer tools
2. **Check Terminal Output:** Server-side errors will appear in your terminal running `npm run dev`
3. **Use Supabase Dashboard:** Monitor API requests and database queries in the Supabase dashboard
4. **Test API Endpoints Directly:** Use tools like Postman or curl to test `/api/profile` endpoints independently

#### 6. **Placeholder Content in Profile Display**

**Problem:** Profile shows hardcoded placeholder text like "Food explorer and recipe collector" or "San Francisco, CA"

**Solution:** Remove placeholder content from PlateHeader component:
1. Remove any hardcoded bio text (bio field is excluded per requirements)
2. Remove hardcoded location placeholders
3. Ensure only real user data from database is displayed

### Database Schema Requirements

The Profile Edit Modal requires these fields in the `public.users` table:

**Required Fields:**
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `username` (VARCHAR, Unique) 
- `display_name` (VARCHAR)

**Optional Fields for Full Functionality:**
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `date_of_birth` (DATE)
- `location_city` (VARCHAR)
- `location_state` (VARCHAR)
- `location_country` (VARCHAR)
- `dietary_preferences` (JSONB)
- `avatar_url` (TEXT)
- `cover_photo_url` (TEXT)
- `is_private` (BOOLEAN)
- `is_verified` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)