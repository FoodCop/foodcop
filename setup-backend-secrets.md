# 🔐 Setup Backend Secrets for Scout Page

## Problem
The Scout page is returning 0 restaurants because the backend Edge Function doesn't have access to your Google Maps API key.

**Error:** `⚠️ Google Maps API not configured in backend`

## ✅ Solution: Set Supabase Secrets

You need to configure the `GOOGLE_MAPS_API_KEY` as a **Supabase secret** (not in your `.env.local` file).

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lgladnskxmbkhcnrsfxv
2. Navigate to: **Settings** → **Edge Functions** → **Manage secrets**
3. Add the following secret:
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** Your Google Maps API Key (same one from your `.env.local`)

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Set the Google Maps API key
supabase secrets set GOOGLE_MAPS_API_KEY=your_actual_google_api_key_here
```

### Option 3: Using PowerShell Script

Create a file called `set-secrets.ps1`:

```powershell
# Get your Google API key from .env.local
$apiKey = Read-Host "Enter your Google Maps API Key"

# Set the secret using Supabase CLI
supabase secrets set GOOGLE_MAPS_API_KEY=$apiKey

Write-Host "✅ Secret configured successfully!" -ForegroundColor Green
Write-Host "Now redeploy the function or wait for auto-restart" -ForegroundColor Cyan
```

## 🔍 Where to Get Your Google Maps API Key

1. **Check your `.env.local` file** (if you have one):
   - Look for `VITE_GOOGLE_MAPS_API_KEY`
   - Copy that value

2. **Or get it from Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your API key or create a new one
   - Make sure these APIs are enabled:
     - Google Places API
     - Google Maps JavaScript API
     - Google Routes API

## ⚠️ Important Notes

- **DO NOT** use the `VITE_` prefix for backend secrets
- The backend needs the raw API key directly
- After setting the secret, the Edge Function will automatically restart
- You may need to refresh your browser after 30-60 seconds

## 🧪 Verify Setup

After setting the secret, test the health endpoint:

```bash
curl https://lgladnskxmbkhcnrsfxv.supabase.co/functions/v1/make-server-5976446e/health
```

You should see:
```json
{
  "status": "ok",
  "google_maps_configured": true,  // ← Should be true now!
  "timestamp": "..."
}
```

## 📋 Quick Checklist

- [ ] Get your Google Maps API key
- [ ] Set it as a Supabase secret (not in `.env.local`)
- [ ] Wait 30-60 seconds for Edge Function to restart
- [ ] Refresh Scout page
- [ ] See real restaurants! 🎉

## 🆘 Need Help Finding Your API Key?

If you don't have a Google Maps API key yet:

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable these APIs:
   - Places API
   - Maps JavaScript API
   - Routes API
4. Go to Credentials → Create Credentials → API Key
5. Copy the key and set it as a Supabase secret

## 🔗 Related Files

- Backend function: `supabase/functions/make-server-5976446e/index.ts`
- Frontend service: `src/services/backendService.ts`
- Scout component: `src/components/scout/App.tsx`
