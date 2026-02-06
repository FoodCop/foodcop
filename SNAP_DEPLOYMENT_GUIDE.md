# 🚀 SNAP Feature - Deployment Guide

## Pre-Deployment Checklist

### Supabase Configuration
- [ ] Storage bucket `snap-photos` exists
- [ ] Bucket permissions set to public (for public image URLs)
- [ ] RLS policies configured (if needed)
- [ ] CORS enabled for image uploads

### Database Configuration
- [ ] `saved_items` table exists with columns:
  - `id` (uuid)
  - `user_id` (uuid, foreign key to auth.users)
  - `item_type` (text, should be 'photo')
  - `item_id` (text, unique identifier)
  - `metadata` (jsonb, stores all snap data)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### Code Configuration
- [ ] `MOCK_MODE = false` in `snap-api.tsx`
- [ ] Environment variables set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Auth properly configured (Google OAuth)

---

## Deployment Steps

### 1. **Verify Supabase Storage**
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'snap-photos';

-- If not, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('snap-photos', 'snap-photos', true);
```

### 2. **Set Storage Permissions**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'snap-photos');

-- Allow public access to view
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'snap-photos');
```

### 3. **Verify saved_items Table**
```sql
-- Ensure table has all required columns
ALTER TABLE saved_items ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE saved_items ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS saved_items_user_id_idx ON saved_items(user_id);
```

### 4. **Enable CORS (if needed)**
In Supabase dashboard:
- Storage → Settings → CORS Configuration
- Add allowed origins (your domain)

### 5. **Test In Development**
```bash
# Start dev server
npm run dev

# Test on mobile: http://localhost:5173/snap (< 768px)
# Test on desktop: http://localhost:5173/snap (> 768px)

# Test flows:
# 1. Mobile camera capture
# 2. Mobile gallery upload
# 3. Desktop drag-drop upload
# 4. Verify images appear in Plate
```

### 6. **Deploy to Production**
```bash
# Build
npm run build

# Deploy to Vercel/hosting
vercel deploy

# Or your hosting platform's deployment command
```

---

## Post-Deployment Testing

### Mobile Testing
1. **iOS Safari**
   - Camera permission prompt
   - Gallery upload
   - Location capture
   - Image saves to Plate

2. **Android Chrome**
   - Camera permission prompt
   - Gallery upload
   - Location capture
   - Image saves to Plate

### Desktop Testing
1. **Chrome/Firefox**
   - Drag-drop upload
   - Click to browse
   - Image preview
   - Metadata saves

### Network Testing
- [ ] Test with slow 3G connection
- [ ] Test offline mode (will save when online)
- [ ] Test interrupted uploads (retry)
- [ ] Test large files > 10MB (rejected)

---

## Monitoring & Logging

### Key Metrics to Monitor
```typescript
// Upload success rate
console.log('📸 Image uploaded:', uploadResult.imageUrl);

// Save success rate  
console.log('✅ Snap saved:', savedData.id);

// Error rate
console.error('❌ Upload failed:', error.message);
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Upload error" | Bucket doesn't exist | Create `snap-photos` bucket |
| "User not authenticated" | Auth not working | Check auth config |
| "File too large" | > 10MB | Validate file size |
| "Network error" | Connection issue | Implement retry logic |
| Images not appearing | RLS policies | Check storage permissions |
| 403 Forbidden | No upload permission | Update RLS policy |

---

## Performance Optimization

### For High Traffic
1. **Enable CDN Caching**
   - Supabase automatically caches images
   - Set cache-control header (3600s default)

2. **Image Compression**
   - Consider resizing before upload
   - Use JPEG quality 85% (default)

3. **Database Optimization**
   - Add indexes on frequently queried columns
   - Archive old snaps if needed

### File Size Expectations
| Image Type | Size |
|-----------|------|
| Camera capture (mobile) | 100-300 KB |
| Gallery upload (typical) | 200-500 KB |
| Large photo (original) | 1-5 MB |
| After compression | 100-200 KB |

---

## Rollback Plan

If issues occur:

1. **Disable SNAP temporarily**
```tsx
// In App.tsx - comment out route
// <Route path="/snap" element={<SnapApp />} />
```

2. **Revert snap-api.tsx**
```bash
git revert <commit-hash>
```

3. **Check Supabase logs**
```sql
-- View recent errors
SELECT * FROM storage.s3_multipart_uploads 
WHERE created_at > now() - interval '1 hour'
LIMIT 50;
```

4. **Clear cache** (if using CDN)
```bash
# Purge Supabase cache
# Or wait 1 hour for auto-expiration
```

---

## Monitoring Dashboard

### Important Metrics
```
Daily Active Users (SNAP)
├─ Mobile camera users
├─ Mobile upload users
├─ Desktop upload users
└─ Total snaps created

Upload Statistics
├─ Success rate (should be > 95%)
├─ Average upload time
├─ File size distribution
└─ Most common cuisines

Error Tracking
├─ Camera permission denied
├─ Upload failures
├─ Network errors
└─ Validation errors
```

---

## Security Checklist

- [ ] Only authenticated users can upload
- [ ] Uploaded files are images only (validated)
- [ ] File size limited to 10MB
- [ ] User can only access their own snaps
- [ ] Images served over HTTPS only
- [ ] RLS policies prevent unauthorized access
- [ ] No sensitive data in metadata
- [ ] CORS configured properly

---

## Maintenance Tasks

### Weekly
- [ ] Check upload error rate
- [ ] Monitor storage usage
- [ ] Review user feedback

### Monthly
- [ ] Archive old test images
- [ ] Review performance metrics
- [ ] Update documentation

### Quarterly
- [ ] Audit user snaps
- [ ] Review security settings
- [ ] Plan feature improvements

---

## Support Contacts

For issues during deployment:
1. Check [SNAP_IMPLEMENTATION_COMPLETE.md](./SNAP_IMPLEMENTATION_COMPLETE.md)
2. Review [SNAP_QUICK_REFERENCE.md](./SNAP_QUICK_REFERENCE.md)
3. Check error logs in Supabase dashboard
4. Test with MOCK_MODE enabled to isolate issues

---

## Version Info

- **Created**: February 6, 2026
- **Status**: Production Ready
- **Components**: 
  - Mobile: Snap.tsx
  - Desktop: SnapDesktop.tsx
  - Container: SnapContainer
  - API: snap-api.tsx

---

## Celebrate! 🎉

Once deployed successfully, SNAP will be live for users to:
- 📷 Capture food photos on mobile
- 📁 Upload from gallery on mobile
- 🖥️ Upload on desktop
- 🏪 Tag restaurants and cuisines
- ⭐ Rate their dining experience
- 💾 Save snaps to their Plate
- 🌍 Share snaps to Feed

Enjoy! 🚀
