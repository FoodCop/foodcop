# Google OAuth Test Users Configuration Script
# This script helps configure test users for Google OAuth

Write-Host "🔐 Google OAuth Test Users Configuration" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if gcloud is available
try {
    $gcloudVersion = gcloud version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Google Cloud CLI is available" -ForegroundColor Green
    } else {
        Write-Host "❌ Google Cloud CLI not found" -ForegroundColor Red
        Write-Host "Please install Google Cloud SDK first" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Google Cloud CLI not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Current Configuration:" -ForegroundColor Cyan
$projectId = gcloud config get-value project
$account = gcloud config get-value account
Write-Host "Project: $projectId" -ForegroundColor White
Write-Host "Account: $account" -ForegroundColor White

Write-Host "`n🔍 Checking OAuth 2.0 Client IDs:" -ForegroundColor Cyan
try {
    $clients = gcloud auth application-default print-access-token 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Authentication successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        Write-Host "Run: gcloud auth login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n🌐 Google Cloud Console Links:" -ForegroundColor Cyan
Write-Host "1. OAuth 2.0 Client IDs:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/credentials?project=$projectId" -ForegroundColor White

Write-Host "`n2. OAuth Consent Screen:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/apis/credentials/consent?project=$projectId" -ForegroundColor White

Write-Host "`n📝 Manual Steps Required:" -ForegroundColor Cyan
Write-Host "1. Go to OAuth 2.0 Client IDs (link above)" -ForegroundColor White
Write-Host "2. Find your Supabase OAuth client" -ForegroundColor White
Write-Host "3. Click on the client ID" -ForegroundColor White
Write-Host "4. Scroll down to 'Test users' section" -ForegroundColor White
Write-Host "5. Click 'Add users'" -ForegroundColor White
Write-Host "6. Add these test users:" -ForegroundColor White
Write-Host "   - juncando@gmail.com" -ForegroundColor Gray
Write-Host "   - fuzo.foodcop@gmail.com" -ForegroundColor Gray
Write-Host "   - Add any other test emails you want" -ForegroundColor Gray

Write-Host "`n🔧 Verify Redirect URIs:" -ForegroundColor Cyan
Write-Host "Make sure these are in 'Authorized redirect URIs':" -ForegroundColor White
Write-Host "- https://lgladnskxmbkhcnrsfxv.supabase.co/auth/v1/callback" -ForegroundColor Gray
Write-Host "- http://localhost:3000" -ForegroundColor Gray
Write-Host "- https://your-vercel-app.vercel.app" -ForegroundColor Gray

Write-Host "`n✅ After Configuration:" -ForegroundColor Cyan
Write-Host "1. Test with juncando@gmail.com" -ForegroundColor White
Write-Host "2. Check that onboarding completes successfully" -ForegroundColor White
Write-Host "3. Verify user doesn't get stuck in sign-in loop" -ForegroundColor White

Write-Host "`n🚀 Test Commands:" -ForegroundColor Cyan
Write-Host "npm run dev  # Start development server" -ForegroundColor White
Write-Host "npm run test:mcp  # Test Supabase connection" -ForegroundColor White

Write-Host "`n📚 Additional Resources:" -ForegroundColor Cyan
Write-Host "- Google OAuth Setup Guide: ./GOOGLE_OAUTH_SETUP.md" -ForegroundColor White
Write-Host "- Supabase Auth Docs: https://supabase.com/docs/guides/auth" -ForegroundColor White

