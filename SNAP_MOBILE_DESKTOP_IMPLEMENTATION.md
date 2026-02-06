# SNAP Feature - Mobile & Desktop Implementation

## 📋 Summary of Changes

### Problem Identified ❌
**Camera was not saving pictures properly** because:
- Images were being stored as base64 strings in the `metadata` JSON field
- Base64 strings are 3-4x larger than binary data
- JSON field has size limitations
- This approach doesn't scale and causes storage issues

### Solution Implemented ✅

#### 1. **Fixed Image Upload Pipeline**
- Created `uploadImage()` function in `snap-api.tsx`
- Properly converts base64 (camera) or File objects (uploads) to blobs
- Uploads to Supabase Storage bucket `snap-photos`
- Returns public URL for metadata storage
- Images now saved in dedicated storage, not in JSON

#### 2. **Enhanced Mobile SNAP**
- Added file upload button alongside camera capture
- Users can now:
  - 📷 Capture photo with camera
  - 📁 Upload from device gallery
- Both methods now properly upload to Supabase Storage
- Location is captured automatically for both

#### 3. **Created Desktop SNAP**
- New `SnapDesktop.tsx` component
- Upload-only interface (no camera)
- Features:
  - Drag-and-drop file upload
  - Click to browse files
  - Max 10MB file size validation
  - Image preview before tagging
  - Full metadata tagging (restaurant, cuisine, rating, description)
  - Location capture support
  - Responsive desktop design

#### 4. **Unified Component Architecture**
- Created `index.tsx` with `SnapContainer`
- Auto-selects mobile vs desktop based on screen width (768px breakpoint)
- Clean separation of concerns:
  - Mobile: Camera + Upload
  - Desktop: Upload only

---

## 🗂️ File Structure

```
src/components/snap/
├── Snap.tsx                 ✅ Mobile SNAP (camera + upload)
├── SnapDesktop.tsx         ✅ NEW - Desktop SNAP (upload only)
├── index.tsx               ✅ NEW - SnapContainer (auto-selection)
└── utils/
    └── snap-api.tsx        ✅ FIXED - Proper Supabase upload
```

---

## 🔄 Data Flow

### Before (Broken)
```
Camera → Base64 String → JSON Metadata → Saved Items Table
❌ Large strings in JSON field, no Supabase Storage usage
```

### After (Fixed)
```
Camera/Upload → Blob → Supabase Storage → Public URL → JSON Metadata → Saved Items Table
✅ Efficient storage, scalable architecture
```

---

## 🚀 Usage

### Automatic Selection
- **Mobile** (width < 768px): Opens Snap with camera + upload
- **Desktop** (width ≥ 768px): Opens SnapDesktop with upload only

### Mobile Flow
1. User clicks Start SNAP → Disclaimer screen
2. Camera auto-starts (or shows upload option)
3. User captures/uploads photo
4. Location captured automatically
5. Tag restaurant details
6. Save to Plate

### Desktop Flow
1. User opens SNAP page
2. Drag-drop or click to upload image
3. Location captured automatically
4. Tag restaurant details
5. Save to Plate

---

## 📦 Updated Imports

`App.tsx`:
```tsx
// OLD
const SnapApp = lazyWithRetry(() => import('./components/snap/Snap').then(module => ({ default: module.Snap })))

// NEW
const SnapApp = lazyWithRetry(() => import('./components/snap').then(module => ({ default: module.SnapContainer })))
```

---

## 🛠️ Key Functions

### `uploadImage(imageData, fileName)`
- Accepts base64 string (camera) or File object (upload)
- Validates file type and size
- Uploads to Supabase Storage
- Returns public URL
- Error handling for upload failures

### `savePhoto(params)` (Updated)
- Calls `uploadImage()` first
- Saves metadata with image URL (not base64)
- Stores in `saved_items` table
- Returns success/error response

---

## 🎯 Benefits

✅ **Performance**: No large base64 strings in JSON
✅ **Scalability**: Proper use of Supabase Storage
✅ **User Experience**: Both camera and upload on mobile
✅ **Desktop Support**: Native upload interface
✅ **Consistency**: Unified data structure across platforms
✅ **Maintainability**: Clean separation of mobile/desktop

---

## 🧪 Testing Checklist

- [ ] Mobile camera capture and save
- [ ] Mobile gallery upload and save
- [ ] Desktop drag-drop upload
- [ ] Desktop click-to-upload
- [ ] Location capture on both
- [ ] Restaurant tagging on both
- [ ] Image appears in Plate after save
- [ ] Large files are rejected (>10MB)
- [ ] Invalid file types are rejected
- [ ] Network errors are handled gracefully

---

## 📝 Notes

- `MOCK_MODE` is set to `false` in snap-api.tsx for real Supabase uploads
- Supabase storage bucket `snap-photos` must exist
- File naming includes timestamp + random string for uniqueness
- Images cached for 3600 seconds in Supabase Storage
