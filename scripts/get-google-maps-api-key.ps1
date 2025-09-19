# Get Google Maps API Key Script
# This script helps you retrieve your Google Maps API key from Google Cloud Console

Write-Host "🔑 Google Maps API Key Retrieval Helper" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Get the current project
$projectId = gcloud config get-value project
Write-Host "Current Google Cloud Project: $projectId" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Steps to get your Google Maps API Key:" -ForegroundColor Yellow
Write-Host "1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=$projectId" -ForegroundColor White
Write-Host "2. Click 'Create Credentials' > 'API Key'" -ForegroundColor White
Write-Host "3. Copy the generated API key" -ForegroundColor White
Write-Host "4. Click 'Restrict Key' and add these restrictions:" -ForegroundColor White
Write-Host "   - Application restrictions: HTTP referrers" -ForegroundColor White
Write-Host "   - Add referrer: http://localhost:*" -ForegroundColor White
Write-Host "   - Add referrer: https://your-domain.com/*" -ForegroundColor White
Write-Host "   - API restrictions: Select 'Restrict key'" -ForegroundColor White
Write-Host "   - Select these APIs:" -ForegroundColor White
Write-Host "     * Places API (New)" -ForegroundColor White
Write-Host "     * Maps JavaScript API" -ForegroundColor White
Write-Host "     * Geocoding API" -ForegroundColor White
Write-Host "     * Static Maps API" -ForegroundColor White
Write-Host "5. Save the restrictions" -ForegroundColor White
Write-Host ""

Write-Host "🔧 After getting your API key:" -ForegroundColor Yellow
Write-Host "1. Create a .env file in your project root" -ForegroundColor White
Write-Host "2. Add this line: VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" -ForegroundColor White
Write-Host "3. Restart your development server" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Test your API key:" -ForegroundColor Yellow
Write-Host "Run: node scripts/test-google-places-images.js" -ForegroundColor White
Write-Host ""

Write-Host "💡 Quick .env file template:" -ForegroundColor Cyan
Write-Host "VITE_GOOGLE_MAPS_API_KEY=AIzaSy..." -ForegroundColor White
Write-Host "VITE_SUPABASE_URL=https://lgladnskxmbkhcnrsfxv.supabase.co" -ForegroundColor White
Write-Host "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor White
Write-Host ""

Write-Host "🚀 Ready to proceed? Press any key to open Google Cloud Console..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open Google Cloud Console
$url = "https://console.cloud.google.com/apis/credentials?project=$projectId"
Start-Process $url
