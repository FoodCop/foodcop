# OAuth Configuration Checker for FUZO
# This script helps diagnose OAuth issues

Write-Host "🔍 OAuth Configuration Checker for FUZO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if gcloud is available
try {
    $gcloudVersion = gcloud version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Google Cloud CLI is available" -ForegroundColor Green
    } else {
        Write-Host "❌ Google Cloud CLI not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Google Cloud CLI not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Current Project Configuration:" -ForegroundColor Cyan
Write-Host "Project ID: $(gcloud config get-value project)" -ForegroundColor White
Write-Host "Account: $(gcloud config get-value account)" -ForegroundColor White
Write-Host "Region: $(gcloud config get-value compute/region)" -ForegroundColor White

Write-Host "`n🔍 Checking API Keys:" -ForegroundColor Cyan
try {
    # Try to list API keys (this might require additional permissions)
    $apiKeys = gcloud services api-keys list 2>$null
    if ($apiKeys) {
        Write-Host "✅ API Keys found:" -ForegroundColor Green
        Write-Host $apiKeys -ForegroundColor White
    } else {
        Write-Host "⚠️ Could not retrieve API keys via CLI" -ForegroundColor Yellow
        Write-Host "This is normal - check Google Cloud Console instead" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️ API Keys check requires console access" -ForegroundColor Yellow
}

Write-Host "`n🔍 Checking OAuth Consent Screen:" -ForegroundColor Cyan
try {
    # Check if we can access OAuth consent screen info
    $consentInfo = gcloud iap oauth-brands list 2>$null
    if ($consentInfo) {
        Write-Host "✅ OAuth brands found:" -ForegroundColor Green
        Write-Host $consentInfo -ForegroundColor White
    } else {
        Write-Host "⚠️ OAuth consent screen info not accessible via CLI" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ OAuth consent screen check requires console access" -ForegroundColor Yellow
}

Write-Host "`n🌐 Google Cloud Console Links:" -ForegroundColor Cyan
$projectId = gcloud config get-value project
Write-Host "1. OAuth 2.0 Client IDs:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/credentials?project=$projectId" -ForegroundColor White

Write-Host "`n2. OAuth Consent Screen:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/credentials/consent?project=$projectId" -ForegroundColor White

Write-Host "`n3. API Keys:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/credentials?project=$projectId" -ForegroundColor White

Write-Host "`n4. Enabled APIs:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/library?project=$projectId" -ForegroundColor White

Write-Host "`n5. IAM & Admin:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/iam-admin/iam?project=$projectId" -ForegroundColor White

Write-Host "`n🔍 What to Check in Google Cloud Console:" -ForegroundColor Cyan
Write-Host "1. OAuth 2.0 Client IDs:" -ForegroundColor White
Write-Host "   - Look for your Supabase OAuth client" -ForegroundColor Gray
Write-Host "   - Check if Client ID matches: 323216534546-f9ivsgrgkambgeuaikgsvqbfu16c6elc.apps.googleusercontent.com" -ForegroundColor Gray
Write-Host "   - Verify authorized redirect URIs include your Supabase URL" -ForegroundColor Gray

Write-Host "`n2. OAuth Consent Screen:" -ForegroundColor White
Write-Host "   - Check if it's configured for external users" -ForegroundColor Gray
Write-Host "   - Verify app name and support email" -ForegroundColor Gray
Write-Host "   - Check if verification status is 'Published' or 'Testing'" -ForegroundColor Gray

Write-Host "`n3. API Keys:" -ForegroundColor White
Write-Host "   - Find your Maps API key: AIzaSyDKT9fftvHwreKtLZDb7KsTOE-d_kwuRrM" -ForegroundColor Gray
Write-Host "   - Check API restrictions (should include Maps JavaScript API, Places API)" -ForegroundColor Gray
Write-Host "   - Check HTTP referrer restrictions" -ForegroundColor Gray

Write-Host "`n4. Common Issues:" -ForegroundColor White
Write-Host "   - OAuth client not configured for Supabase domain" -ForegroundColor Red
Write-Host "   - OAuth consent screen not published" -ForegroundColor Red
Write-Host "   - API key restrictions too strict" -ForegroundColor Red
Write-Host "   - Missing authorized redirect URIs" -ForegroundColor Red

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open the Google Cloud Console links above" -ForegroundColor White
Write-Host "2. Check each configuration item" -ForegroundColor White
Write-Host "3. Fix any issues found" -ForegroundColor White
Write-Host "4. Test authentication in production" -ForegroundColor White
