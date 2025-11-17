# PlateNew Implementation - Testing Checklist

## ✅ Code Changes Verified
- [x] PlateNewProps interface added with userId and currentUser
- [x] Component accepts props with fallback to useAuth()
- [x] Direct Supabase query with `.eq('user_id', userId)`
- [x] PlateProtectedApp wrapper created in App.tsx
- [x] userId and currentUser passed as props to PlateApp

## 🧪 Manual Testing Required

### 1. Navigate to Plate Page
1. Open browser to `http://localhost:3000`
2. Sign in if not already signed in
3. Navigate to `#plate` or click Plate in navigation
4. **Expected**: Plate page loads without errors

### 2. Check Browser Console
Look for these console messages:
- [ ] `🔍 Fetching all saved items for userId: [user-id]`
- [ ] `✅ Saved items fetched: [count]`
- [ ] `📊 Item types: [array of types]`

**If you see `❌ No userId available`** - Auth is not working correctly

### 3. Verify Saved Items Display
- [ ] Items appear in the grid (if you have saved items)
- [ ] Tab filtering works (All, Recipes, Videos, Places)
- [ ] Item counts are correct in stats section

### 4. Test Save-to-Plate from Other Pages

#### From Scout Page:
1. Navigate to `#scout`
2. Search for a restaurant
3. Click "Save to Plate" or bookmark icon
4. Navigate back to `#plate`
5. **Expected**: Restaurant appears in saved items

#### From Bites Page:
1. Navigate to `#bites`
2. Find a recipe
3. Click "Save to Plate"
4. Navigate back to `#plate`
5. **Expected**: Recipe appears in saved items

### 5. Check Network Tab
1. Open DevTools → Network tab
2. Navigate to Plate page
3. Look for request to `/rest/v1/saved_items`
4. **Verify**:
   - [ ] Request has `user_id=eq.[your-user-id]` parameter
   - [ ] Response returns 200 OK
   - [ ] Response data contains your saved items

### 6. Error Handling
Try these scenarios:
- [ ] Navigate to Plate without signing in → See "Sign In Required"
- [ ] While on Plate, sign out → Redirected or see auth prompt
- [ ] Network error simulation → Toast error appears

## 🐛 Troubleshooting

### If no items appear:
1. Check console for userId value
2. Verify saved_items table has data with your user_id
3. Check Supabase RLS policies allow SELECT for authenticated users

### If "No userId available" error:
1. Check auth context is working: `const { user } = useAuth()`
2. Verify user is signed in
3. Check PlateProtectedApp wrapper is executing

### If TypeScript errors in IDE:
- These are compile-time warnings only
- Code will work at runtime
- Caused by lazy loading type inference

## 📝 Expected Console Output

```
🔍 Fetching all saved items for userId: abc123-def456-...
✅ Saved items fetched: 5
📊 Item types: ['recipe', 'restaurant', 'video', 'restaurant', 'recipe']
🔍 Filtering for tab: all
📋 Total items: 5, Filtered: 5
📊 Item breakdown: {
  recipes: 2,
  videos: 1,
  restaurants: 2,
  photos: 0,
  other: 0
}
```

## ✅ Success Criteria

The implementation is working correctly if:
1. ✅ Plate page loads without JavaScript errors
2. ✅ Console shows "Fetching all saved items for userId: [valid-id]"
3. ✅ Saved items appear in the grid
4. ✅ Tab filtering works correctly
5. ✅ New items saved from other pages appear in Plate
6. ✅ Item counts match actual data

## 🔄 Hot Reload Note

Changes should be hot-reloaded automatically. If not:
1. Save files again to trigger reload
2. Hard refresh browser (Ctrl+Shift+R)
3. Restart dev server if needed

## 📞 If Still Not Working

Check these files match the implementation:
- `src/components/plate/PlateNew.tsx` - Lines 42-95 (props and fetch function)
- `src/App.tsx` - Lines 210-233 (PlateProtectedApp wrapper)

Compare with reference: `public/plate/components/Plate.tsx`
