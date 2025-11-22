# MCP Setup Guide for Cursor

## Quick Setup Checklist

### ✅ Step 1: Supabase (Priority 1)
- [ ] Get Supabase access token from https://supabase.com/dashboard/account/tokens
- [ ] Set environment variable: `SUPABASE_ACCESS_TOKEN`
- [ ] Restart Cursor
- [ ] Test connection

### ✅ Step 2: Vercel CLI (Priority 2)
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login: `vercel login`
- [ ] Get token from https://vercel.com/account/tokens
- [ ] Set environment variable: `VERCEL_TOKEN`
- [ ] (Optional) Set `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`
- [ ] Restart Cursor
- [ ] Test connection

### ✅ Step 3: Google Cloud (Priority 3)
- [ ] Verify GCloud SDK is installed: `gcloud --version`
- [ ] Set `GCLOUD_PROJECT` environment variable
- [ ] (If using service account) Set `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] Or use: `gcloud auth application-default login`
- [ ] Restart Cursor
- [ ] Test connection

## Getting Your Vercel Credentials

1. **Vercel Token**:
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Name it (e.g., "Cursor MCP")
   - Copy the token

2. **Vercel Org ID** (optional):
   - Go to your Vercel dashboard
   - Click on your organization/team
   - The Org ID is in the URL or team settings

3. **Vercel Project ID** (optional):
   - Go to your project in Vercel
   - Go to Settings → General
   - Project ID is listed there

## Testing Connections

After setting up each service, restart Cursor and test:

1. **Supabase**: Try querying your database
2. **Vercel**: Try listing your projects
3. **GCloud**: Try listing your GCP resources

## Environment Variables Reference

```bash
# Supabase
SUPABASE_ACCESS_TOKEN=your_supabase_token

# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id (optional)
VERCEL_PROJECT_ID=your_project_id (optional)

# Google Cloud
GCLOUD_PROJECT=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json (if using service account)
```

