# Google Cloud CLI Setup Script for FUZO
# Run this after Google Cloud SDK is installed

Write-Host "🚀 Setting up Google Cloud CLI for FUZO project..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Google Cloud CLI is installed" -ForegroundColor Green
        Write-Host $gcloudVersion
    } else {
        Write-Host "❌ Google Cloud CLI not found. Please install it first." -ForegroundColor Red
        Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Google Cloud CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "`n🔐 Step 1: Authenticating with Google Cloud..." -ForegroundColor Cyan
Write-Host "This will open a browser window for authentication..." -ForegroundColor Yellow
gcloud auth login fuzo.foodcop@gmail.com

Write-Host "`n🔑 Step 2: Setting up application default credentials..." -ForegroundColor Cyan
gcloud auth application-default login

Write-Host "`n📋 Step 3: Setting FUZO project as default..." -ForegroundColor Cyan
gcloud config set project fuzo-24122004

Write-Host "`n🔍 Step 4: Checking enabled APIs..." -ForegroundColor Cyan
Write-Host "Current enabled services:" -ForegroundColor Yellow
gcloud services list --enabled

Write-Host "`n🔧 Step 5: Enabling required APIs..." -ForegroundColor Cyan
Write-Host "Enabling Maps Backend API..." -ForegroundColor Yellow
gcloud services enable maps-backend.googleapis.com

Write-Host "Enabling Maps Platform Datasets API..." -ForegroundColor Yellow
gcloud services enable mapsplatformdatasets.googleapis.com

Write-Host "Enabling OAuth2 API..." -ForegroundColor Yellow
gcloud services enable oauth2.googleapis.com

Write-Host "`n✅ Step 6: Verifying configuration..." -ForegroundColor Cyan
Write-Host "Current project:" -ForegroundColor Yellow
gcloud config get-value project

Write-Host "`nCurrent account:" -ForegroundColor Yellow
gcloud config get-value account

Write-Host "`n🎉 Google Cloud CLI setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Check your Google Cloud Console for API quotas and billing" -ForegroundColor White
Write-Host "2. Verify your OAuth 2.0 Client credentials in GCP Console" -ForegroundColor White
Write-Host "3. Check that your Maps API key has proper restrictions" -ForegroundColor White
Write-Host "4. Test your authentication flow in production" -ForegroundColor White

Write-Host "`n🔍 To check Maps API status:" -ForegroundColor Cyan
Write-Host "gcloud maps services describe --help" -ForegroundColor Yellow
