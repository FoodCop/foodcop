# Deploy Backend Script for FuzoFoodCop
# Deploys the make-server-5976446e Supabase Edge Function

Write-Host "🚀 Deploying FuzoFoodCop Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Deploy the function
Write-Host ""
Write-Host "📦 Deploying make-server-5976446e function..." -ForegroundColor Cyan
supabase functions deploy make-server-5976446e

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Available endpoints:" -ForegroundColor Cyan
    Write-Host "  - /health" -ForegroundColor White
    Write-Host "  - /directions" -ForegroundColor White
    Write-Host "  - /places/nearby" -ForegroundColor White
    Write-Host "  - /places/textsearch" -ForegroundColor White
    Write-Host "  - /places/details" -ForegroundColor White
    Write-Host ""
    Write-Host "Test health endpoint:" -ForegroundColor Cyan
    Write-Host "  curl https://lgladnskxmbkhcnrsfxv.supabase.co/functions/v1/make-server-5976446e/health" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    exit 1
}
