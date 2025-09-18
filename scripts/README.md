# FUZO Deployment Scripts

This directory contains automated setup scripts for deploying FUZO to production.

## Scripts Overview

### 1. `quick-setup.bat` - Development Setup

**Purpose**: Quick local development setup
**Usage**: Double-click or run from command line
**What it does**:

- Installs dependencies
- Builds the project
- Starts development server
- Opens browser

### 2. `setup-deployment.bat` - Basic Production Setup

**Purpose**: Basic production deployment setup
**Usage**: `scripts\setup-deployment.bat`
**What it does**:

- Checks prerequisites (gcloud, vercel CLI)
- Sets up Google Cloud project
- Enables/disables APIs
- Collects environment variables
- Deploys to Vercel

### 3. `setup-deployment.ps1` - PowerShell Version

**Purpose**: Same as .bat but with better error handling
**Usage**: `powershell -ExecutionPolicy Bypass -File scripts\setup-deployment.ps1`
**What it does**:

- Same as .bat version
- Better error handling and colored output
- More robust API management

### 4. `advanced-setup.ps1` - Comprehensive Setup

**Purpose**: Complete production setup with Supabase integration
**Usage**: `powershell -ExecutionPolicy Bypass -File scripts\advanced-setup.ps1`
**What it does**:

- Everything from basic setup
- Generates Supabase SQL configuration
- Creates database schema
- Sets up authentication triggers
- Provides detailed next steps

## Prerequisites

Before running any script, ensure you have:

1. **Google Cloud CLI** installed and authenticated

   ```bash
   gcloud auth login
   gcloud config set project fuzo-24122004
   ```

2. **Vercel CLI** installed and authenticated

   ```bash
   npm install -g vercel
   vercel login
   ```

3. **Node.js and npm** installed

4. **Git** installed

## Environment Variables Required

The scripts will prompt for these variables:

### Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Google Cloud

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### AI Services

- `OPENAI_API_KEY`
- `SPOONACULAR_API_KEY`

### Stream Chat

- `STREAM_KEY`
- `STREAM_SECRET`
- `STREAM_WEBHOOK_SECRET`
- `TEST_USER_ID`

## Quick Start

### For Development:

```bash
scripts\quick-setup.bat
```

### For Production:

```bash
# Basic setup
scripts\setup-deployment.bat

# Or advanced setup with Supabase
powershell -ExecutionPolicy Bypass -File scripts\advanced-setup.ps1
```

## What Gets Configured

### Google Cloud Console

- ✅ Enables: Maps, Places, Geocoding, Storage APIs
- ❌ Disables: BigQuery, Datastore, Logging, Monitoring APIs
- 🔧 Sets project configuration

### Vercel

- ✅ Sets environment variables
- ✅ Deploys to production
- ✅ Configures build settings

### Supabase (Advanced Script)

- ✅ Generates database schema
- ✅ Creates user management functions
- ✅ Sets up Row Level Security policies
- ✅ Configures authentication triggers

## Troubleshooting

### Common Issues:

1. **"gcloud not found"**

   - Install Google Cloud CLI
   - Add to PATH or restart terminal

2. **"vercel not found"**

   - Run: `npm install -g vercel`
   - Run: `vercel login`

3. **Build fails**

   - Check Node.js version (>=18.0.0)
   - Clear node_modules and reinstall
   - Check for TypeScript errors

4. **API errors**
   - Verify API keys are correct
   - Check API quotas and billing
   - Ensure APIs are enabled

### Getting Help:

1. Check the console output for specific errors
2. Verify all prerequisites are installed
3. Ensure you're authenticated to all services
4. Check that your API keys have proper permissions

## Manual Steps After Scripts

Even with automation, you'll need to manually:

1. **Supabase Dashboard**:

   - Run the generated SQL script
   - Configure OAuth providers
   - Set up redirect URLs

2. **Google Cloud Console**:

   - Verify API quotas
   - Check billing settings
   - Review security settings

3. **Testing**:
   - Test all authentication flows
   - Verify API endpoints work
   - Check error handling

## Script Customization

You can modify the scripts to:

- Add additional environment variables
- Include more API configurations
- Add custom deployment steps
- Integrate with other services

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Regularly rotate API keys
- Monitor API usage and costs
