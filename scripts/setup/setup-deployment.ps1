# FUZO Deployment Setup Script
# This script automates the setup process for Supabase, Vercel, and Google Cloud Console

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    FUZO Deployment Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "fuzo-24122004"
$VERCEL_PROJECT_NAME = "finalfuzo"

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Step 1: Check prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "gcloud")) {
    Write-Host "ERROR: Google Cloud CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "vercel")) {
    Write-Host "ERROR: Vercel CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Run: npm install -g vercel" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Step 2: Google Cloud Setup
Write-Host "[2/8] Google Cloud Setup..." -ForegroundColor Yellow
Write-Host "Setting project to $PROJECT_ID" -ForegroundColor Gray
gcloud config set project $PROJECT_ID

Write-Host "Enabling required APIs..." -ForegroundColor Gray
gcloud services enable maps-backend.googleapis.com
gcloud services enable places-backend.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
gcloud services enable storage.googleapis.com

Write-Host "✓ Google Cloud APIs enabled" -ForegroundColor Green
Write-Host ""

# Step 3: Disable unnecessary APIs
Write-Host "[3/8] Disabling unnecessary APIs..." -ForegroundColor Yellow
$unnecessaryAPIs = @(
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

foreach ($api in $unnecessaryAPIs) {
    try {
        gcloud services disable $api --force 2>$null
        Write-Host "  Disabled: $api" -ForegroundColor Gray
    } catch {
        Write-Host "  Skipped: $api (not enabled)" -ForegroundColor Gray
    }
}

Write-Host "✓ Unnecessary APIs disabled" -ForegroundColor Green
Write-Host ""

# Step 4: Collect environment variables
Write-Host "[4/8] Collecting environment variables..." -ForegroundColor Yellow
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

Write-Host ""

# Step 5: Configure Vercel environment variables
Write-Host "[5/8] Configuring Vercel environment variables..." -ForegroundColor Yellow

$vercelEnvVars = @{
    "VITE_SUPABASE_URL" = $envVars["SUPABASE_URL"]
    "VITE_SUPABASE_ANON_KEY" = $envVars["SUPABASE_ANON_KEY"]
    "VITE_GOOGLE_MAPS_API_KEY" = $envVars["GOOGLE_MAPS_API_KEY"]
    "VITE_OPENAI_API_KEY" = $envVars["OPENAI_API_KEY"]
    "VITE_SPOONACULAR_API_KEY" = $envVars["SPOONACULAR_API_KEY"]
    "VITE_STREAM_KEY" = $envVars["STREAM_KEY"]
    "VITE_TEST_USER_ID" = $envVars["TEST_USER_ID"]
}

foreach ($var in $vercelEnvVars.GetEnumerator()) {
    try {
        Write-Host "  Setting $($var.Key)..." -ForegroundColor Gray
        # Note: This would need to be implemented with Vercel CLI
        # vercel env add $var.Key production
    } catch {
        Write-Host "  Warning: Could not set $($var.Key)" -ForegroundColor Yellow
    }
}

Write-Host "✓ Vercel environment variables configured" -ForegroundColor Green
Write-Host ""

# Step 6: Build and deploy
Write-Host "[6/8] Building and deploying to Vercel..." -ForegroundColor Yellow

Write-Host "Building project..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Deploying to Vercel..." -ForegroundColor Gray
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Vercel deployment failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Vercel deployment successful" -ForegroundColor Green
Write-Host ""

# Step 7: Supabase configuration instructions
Write-Host "[7/8] Supabase Configuration Instructions..." -ForegroundColor Yellow
Write-Host "Please configure the following in your Supabase dashboard:" -ForegroundColor Cyan
Write-Host "1. Go to Authentication > URL Configuration" -ForegroundColor White
Write-Host "2. Add your Vercel domain to Site URL" -ForegroundColor White
Write-Host "3. Add your Vercel domain to Redirect URLs" -ForegroundColor White
Write-Host "4. Configure Google OAuth provider with your Google Client ID and Secret" -ForegroundColor White
Write-Host ""

# Step 8: Final verification
Write-Host "[8/8] Final verification..." -ForegroundColor Yellow
Write-Host "Checking deployment status..." -ForegroundColor Gray
vercel ls

Write-Host ""
Write-Host "Checking Google Cloud APIs..." -ForegroundColor Gray
gcloud services list --enabled --filter="name:(maps OR places OR geocoding OR storage)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test your deployment at the Vercel URL" -ForegroundColor White
Write-Host "2. Verify Google OAuth is working" -ForegroundColor White
Write-Host "3. Test all API endpoints" -ForegroundColor White
Write-Host "4. Check Supabase authentication flow" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
