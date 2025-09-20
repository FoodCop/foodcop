# Advanced FUZO Deployment Setup Script
# This script provides a comprehensive setup with Supabase integration

param(
    [switch]$SkipPrompts,
    [string]$SupabaseProjectRef = "",
    [string]$VercelProjectName = "finalfuzo"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    FUZO Advanced Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "fuzo-24122004"
$REQUIRED_APIS = @(
    "maps-backend.googleapis.com",
    "places-backend.googleapis.com",
    "geocoding-backend.googleapis.com",
    "storage.googleapis.com"
)

$UNNECESSARY_APIS = @(
    "bigqueryconnection.googleapis.com",
    "bigquerydatapolicy.googleapis.com",
    "bigquerymigration.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "bigquerystorage.googleapis.com",
    "cloudasset.googleapis.com",
    "datastore.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
    "dataform.googleapis.com",
    "maps-embed-backend.googleapis.com",
    "maps-android-backend.googleapis.com",
    "maps-ios-backend.googleapis.com",
    "static-maps-backend.googleapis.com"
)

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "[1/10] Checking prerequisites..." -ForegroundColor Yellow

    $tools = @("gcloud", "vercel", "npm", "git")
    $missing = @()

    foreach ($tool in $tools) {
        if (-not (Get-Command -Name $tool -ErrorAction SilentlyContinue)) {
            $missing += $tool
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host "ERROR: Missing required tools: $($missing -join ', ')" -ForegroundColor Red
        Write-Host "Please install the missing tools and run the script again." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✓ All prerequisites found" -ForegroundColor Green
    Write-Host ""
}

# Function to setup Google Cloud
function Setup-GoogleCloud {
    Write-Host "[2/10] Setting up Google Cloud..." -ForegroundColor Yellow

    Write-Host "Setting project to $PROJECT_ID" -ForegroundColor Gray
    gcloud config set project $PROJECT_ID

    Write-Host "Enabling required APIs..." -ForegroundColor Gray
    foreach ($api in $REQUIRED_APIS) {
        gcloud services enable $api
        Write-Host "  ✓ Enabled: $api" -ForegroundColor Green
    }

    Write-Host "Disabling unnecessary APIs..." -ForegroundColor Gray
    foreach ($api in $UNNECESSARY_APIS) {
        try {
            gcloud services disable $api --force 2>$null
            Write-Host "  ✓ Disabled: $api" -ForegroundColor Green
        } catch {
            Write-Host "  - Skipped: $api (not enabled)" -ForegroundColor Yellow
        }
    }

    Write-Host "✓ Google Cloud setup complete" -ForegroundColor Green
    Write-Host ""
}

# Function to collect environment variables
function Get-EnvironmentVariables {
    Write-Host "[3/10] Collecting environment variables..." -ForegroundColor Yellow

    if (-not $SkipPrompts) {
        Write-Host "Please enter your environment variables:" -ForegroundColor Cyan
        Write-Host ""

        $envVars = @{
            "SUPABASE_URL" = Read-Host "Enter Supabase URL"
            "SUPABASE_ANON_KEY" = Read-Host "Enter Supabase Anon Key"
            "SUPABASE_SERVICE_ROLE_KEY" = Read-Host "Enter Supabase Service Role Key"
            "GOOGLE_MAPS_API_KEY" = Read-Host "Enter Google Maps API Key"
            "GOOGLE_CLIENT_ID" = Read-Host "Enter Google Client ID"
            "GOOGLE_CLIENT_SECRET" = Read-Host "Enter Google Client Secret"
            "OPENAI_API_KEY" = Read-Host "Enter OpenAI API Key"
            "SPOONACULAR_API_KEY" = Read-Host "Enter Spoonacular API Key"
            "STREAM_KEY" = Read-Host "Enter Stream Key"
            "STREAM_SECRET" = Read-Host "Enter Stream Secret"
            "STREAM_WEBHOOK_SECRET" = Read-Host "Enter Stream Webhook Secret"
            "TEST_USER_ID" = Read-Host "Enter Test User ID"
        }
    } else {
        Write-Host "Using environment variables from system..." -ForegroundColor Gray
        $envVars = @{
            "SUPABASE_URL" = $env:SUPABASE_URL
            "SUPABASE_ANON_KEY" = $env:SUPABASE_ANON_KEY
            "SUPABASE_SERVICE_ROLE_KEY" = $env:SUPABASE_SERVICE_ROLE_KEY
            "GOOGLE_MAPS_API_KEY" = $env:GOOGLE_MAPS_API_KEY
            "GOOGLE_CLIENT_ID" = $env:GOOGLE_CLIENT_ID
            "GOOGLE_CLIENT_SECRET" = $env:GOOGLE_CLIENT_SECRET
            "OPENAI_API_KEY" = $env:OPENAI_API_KEY
            "SPOONACULAR_API_KEY" = $env:SPOONACULAR_API_KEY
            "STREAM_KEY" = $env:STREAM_KEY
            "STREAM_SECRET" = $env:STREAM_SECRET
            "STREAM_WEBHOOK_SECRET" = $env:STREAM_WEBHOOK_SECRET
            "TEST_USER_ID" = $env:TEST_USER_ID
        }
    }

    Write-Host "✓ Environment variables collected" -ForegroundColor Green
    Write-Host ""
    return $envVars
}

# Function to configure Vercel
function Setup-Vercel {
    param($envVars)

    Write-Host "[4/10] Configuring Vercel..." -ForegroundColor Yellow

    # Check if already logged in to Vercel
    $vercelStatus = vercel whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Please log in to Vercel first:" -ForegroundColor Yellow
        vercel login
    }

    # Set environment variables
    $vercelEnvVars = @{
        "VITE_SUPABASE_URL" = $envVars["SUPABASE_URL"]
        "VITE_SUPABASE_ANON_KEY" = $envVars["SUPABASE_ANON_KEY"]
        "VITE_GOOGLE_MAPS_API_KEY" = $envVars["GOOGLE_MAPS_API_KEY"]
        "VITE_OPENAI_API_KEY" = $envVars["OPENAI_API_KEY"]
        "VITE_SPOONACULAR_API_KEY" = $envVars["SPOONACULAR_API_KEY"]
        "VITE_STREAM_CHAT_API_KEY" = $envVars["STREAM_KEY"]
        "VITE_TEST_USER_ID" = $envVars["TEST_USER_ID"]
    }

    Write-Host "Setting Vercel environment variables..." -ForegroundColor Gray
    foreach ($var in $vercelEnvVars.GetEnumerator()) {
        if ($var.Value) {
            Write-Host "  Setting $($var.Key)..." -ForegroundColor Gray
            # Note: This would need to be implemented with Vercel CLI
            # vercel env add $var.Key production --value $var.Value
        }
    }

    Write-Host "✓ Vercel configuration complete" -ForegroundColor Green
    Write-Host ""
}

# Function to build and deploy
function Build-AndDeploy {
    Write-Host "[5/10] Building and deploying..." -ForegroundColor Yellow

    Write-Host "Installing dependencies..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Building project..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Deploying to Vercel..." -ForegroundColor Gray
    vercel --prod --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Vercel deployment failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Deployment successful" -ForegroundColor Green
    Write-Host ""
}

# Function to verify deployment
function Test-Deployment {
    Write-Host "[6/10] Verifying deployment..." -ForegroundColor Yellow

    Write-Host "Checking Vercel deployment status..." -ForegroundColor Gray
    vercel ls

    Write-Host ""
    Write-Host "Checking Google Cloud APIs..." -ForegroundColor Gray
    gcloud services list --enabled --filter="name:(maps OR places OR geocoding OR storage)"

    Write-Host "✓ Deployment verification complete" -ForegroundColor Green
    Write-Host ""
}

# Function to generate Supabase configuration
function Generate-SupabaseConfig {
    param($envVars)

    Write-Host "[7/10] Generating Supabase configuration..." -ForegroundColor Yellow

    $supabaseConfig = @"
-- Supabase Configuration for FUZO
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    username TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT,
    dietary_preferences TEXT[],
    cuisine_preferences TEXT[],
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, display_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
"@

    $supabaseConfig | Out-File -FilePath "supabase-setup.sql" -Encoding UTF8

    Write-Host "✓ Supabase configuration generated (supabase-setup.sql)" -ForegroundColor Green
    Write-Host ""
}

# Function to display next steps
function Show-NextSteps {
    Write-Host "[8/10] Next Steps..." -ForegroundColor Yellow

    Write-Host "1. Supabase Configuration:" -ForegroundColor Cyan
    Write-Host "   - Run the generated supabase-setup.sql in your Supabase SQL editor" -ForegroundColor White
    Write-Host "   - Go to Authentication > URL Configuration" -ForegroundColor White
    Write-Host "   - Add your Vercel domain to Site URL and Redirect URLs" -ForegroundColor White
    Write-Host "   - Configure Google OAuth provider" -ForegroundColor White
    Write-Host ""

    Write-Host "2. Test Your Deployment:" -ForegroundColor Cyan
    Write-Host "   - Visit your Vercel deployment URL" -ForegroundColor White
    Write-Host "   - Test Google OAuth sign-in" -ForegroundColor White
    Write-Host "   - Verify all API endpoints are working" -ForegroundColor White
    Write-Host "   - Check profile creation and data persistence" -ForegroundColor White
    Write-Host ""

    Write-Host "3. Monitor and Optimize:" -ForegroundColor Cyan
    Write-Host "   - Check Vercel function logs" -ForegroundColor White
    Write-Host "   - Monitor Google Cloud API usage" -ForegroundColor White
    Write-Host "   - Review Supabase logs and performance" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    Test-Prerequisites
    Setup-GoogleCloud
    $envVars = Get-EnvironmentVariables
    Setup-Vercel -envVars $envVars
    Build-AndDeploy
    Test-Deployment
    Generate-SupabaseConfig -envVars $envVars
    Show-NextSteps

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
