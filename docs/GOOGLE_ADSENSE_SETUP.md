# Google AdSense Integration Guide

This document explains how to complete the Google AdSense integration for your FUZO application.

## ✅ Implementation Complete

The technical integration is ready. You now need to configure your Google AdSense account.

## ⏸️ Temporary Site-Wide Disable (Current State)

As of February 13, 2026, AdSense is intentionally hidden site-wide.

Current temporary disable changes:
- `index.html` AdSense script include is removed (script no longer loads)
- `src/components/common/AdBanner.tsx` is gated by `VITE_ENABLE_ADSENSE === 'true'`
- `src/components/common/AdBanner.tsx` reads `VITE_ADSENSE_CLIENT_ID` (no hardcoded client ID)
- `src/index.css` includes a safety hide rule for `.adsbygoogle`

To re-enable later:
1. Re-add the AdSense script to `index.html`
2. Set `VITE_ENABLE_ADSENSE=true` in your environment
3. Set `VITE_ADSENSE_CLIENT_ID` and `VITE_ADSENSE_SLOT_BOTTOM_BANNER` to real values
4. Remove the temporary `.adsbygoogle` hide rule from `src/index.css`
5. Verify ads render in production

## 📋 Setup Steps

### 1. Create Google AdSense Account
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign up or sign in with your Google account
3. Complete the registration process
4. Wait for approval (typically 1-3 business days)

### 2. Get Your Publisher ID
1. Once approved, log into your AdSense dashboard
2. Find your Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. Located in **Account** → **Account Information**

### 3. Create Ad Unit
1. Go to **Ads** → **Overview** → **By ad unit**
2. Click **Create new ad unit**
3. Select **Display ads**
4. Choose **Horizontal** format for bottom banner
5. Name it "Bottom Banner" or similar
6. Set responsive sizing
7. Save and get your **Ad Slot ID** (10-digit number)

### 4. Configure Environment Variables
Update your `.env.local` file (create if doesn't exist):

```env
# Google AdSense Configuration
VITE_ENABLE_ADSENSE="true"                     # Enable banner rendering
VITE_ADSENSE_CLIENT_ID="ca-pub-XXXXXXXXXXXXXXXX"  # Your Publisher ID
VITE_ADSENSE_SLOT_BOTTOM_BANNER="1234567890"      # Your Ad Slot ID
```

### 5. Update HTML File
Replace the placeholder in [index.html](../index.html#L45-L46):
```html
<!-- BEFORE -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"

<!-- AFTER -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
```

### 6. Update Component Files
Replace the placeholder in [AdBanner.tsx](../src/components/common/AdBanner.tsx#L47):
```typescript
// BEFORE
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"

// AFTER
data-ad-client="ca-pub-1234567890123456"  // Your actual Publisher ID
```

## 📁 Files Modified

### Created Files:
- [src/components/common/AdBanner.tsx](../src/components/common/AdBanner.tsx) - Base ad component
- [src/components/common/BottomAdBanner.tsx](../src/components/common/BottomAdBanner.tsx) - Fixed bottom banner
- This guide

### Modified Files:
- [index.html](../index.html) - AdSense script currently removed while disabled
- [src/App.tsx](../src/App.tsx) - Integrated bottom banner
- [.env.example](../.env.example) - Added AdSense config

## 🎨 Customization Options

### Adjust Banner Height
In [BottomAdBanner.tsx](../src/components/common/BottomAdBanner.tsx#L22-L24):
```typescript
style={{
  minHeight: '50px',   // Adjust minimum height
  maxHeight: '100px'   // Adjust maximum height
}}
```

### Change Position
The banner is currently fixed to bottom. To make it static (in page flow):
```typescript
// Change from:
<div className="fixed bottom-0 left-0 right-0 z-40 ...">

// To:
<div className="relative w-full ...">
```

### Remove Close Button
In [BottomAdBanner.tsx](../src/components/common/BottomAdBanner.tsx#L27-L38), delete the button element to prevent users from closing ads.

### Add More Ad Placements
Create additional ad units in AdSense dashboard and use the `AdBanner` component:
```tsx
import AdBanner from './components/common/AdBanner';

<AdBanner 
  dataAdSlot="YOUR_NEW_SLOT_ID"
  dataAdFormat="rectangle"  // or "vertical", "horizontal"
  style={{ minHeight: '250px' }}
/>
```

## 🚀 Testing

### Development Testing:
```bash
npm run dev
```

AdSense may show blank ads or test ads in development. This is normal.

### Production Testing:
1. Deploy to production
2. Wait 10-30 minutes for ads to appear
3. Check browser console for any AdSense errors

### Important Notes:
- ⚠️ **Never click your own ads** - This violates AdSense policy
- ⚠️ Ads may not show immediately after deployment
- ⚠️ AdSense requires real traffic to optimize ad delivery
- ⚠️ Your site must comply with [AdSense Program Policies](https://support.google.com/adsense/answer/48182)

## 🐛 Troubleshooting

### Ads Not Showing?
1. Check browser console for errors
2. Verify Publisher ID is correct
3. Ensure AdSense account is approved
4. Wait 24-48 hours after setup
5. Check you're not using ad blockers

### "AdSense Error" in Console?
- Verify the ad slot ID matches your AdSense dashboard
- Ensure the script tag has correct `data-ad-client`

### Layout Issues?
The bottom banner has `z-40` to appear above content. Adjust if needed:
```typescript
className="fixed bottom-0 ... z-40"  // Change z-index
```

## 📊 Performance Considerations

### Page Load Impact:
- AdSense script loads asynchronously (`async` attribute)
- Minimal impact on initial page load
- Ads load after page content

### Mobile Optimization:
- Banner uses `data-full-width-responsive="true"`
- Automatically adjusts to mobile screens
- Close button helps mobile UX

### Content Spacing:
Add bottom padding to your main content to prevent overlap:
```css
/* In your main layout CSS */
.main-content {
  padding-bottom: 120px; /* Ad height + spacing */
}
```

## 💰 Revenue Optimization Tips

1. **Place ads strategically** - Bottom banner has good visibility
2. **Add more placements** - Consider sidebar or in-content ads
3. **Monitor performance** - Use AdSense dashboard analytics
4. **Optimize content** - High-quality content = better ads = more revenue
5. **Follow policies** - Violations can ban your account

## 📞 Support

- [AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Policy Center](https://support.google.com/adsense/answer/48182)
- [AdSense Community](https://support.google.com/adsense/community)

## 🔐 Security Notes

- AdSense Publisher IDs (starting with `ca-pub-`) are safe to expose in client-side code
- Ad Slot IDs are also safe to expose
- Never share your AdSense account password
- Be cautious of phishing emails claiming to be from AdSense

## ✅ Checklist

- [ ] Sign up for Google AdSense account
- [ ] Get approved by AdSense
- [ ] Create ad unit and get Publisher ID
- [ ] Get Ad Slot ID for bottom banner
- [ ] Update `.env.local` with your IDs
- [ ] Set `VITE_ENABLE_ADSENSE=true` when ready to go live
- [ ] Update `index.html` with Publisher ID
- [ ] Confirm `VITE_ADSENSE_CLIENT_ID` is set (component reads env value)
- [ ] Test in development
- [ ] Deploy to production
- [ ] Verify ads appear after deployment
- [ ] Monitor AdSense dashboard for performance

---

**Ready to Deploy!** Once you complete the configuration steps above, your ads will start appearing to users.
