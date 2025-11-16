# Deploy Directions Endpoint to Supabase (PowerShell)
# Run this script to deploy the make-server-5976446e function

Write-Host "Deploying make-server-5976446e Edge Function..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    supabase projects list 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Logged in to Supabase" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Not logged in to Supabase" -ForegroundColor Red
    Write-Host "Run: supabase login" -ForegroundColor Yellow
    exit 1
}

# Deploy function
Write-Host "📦 Deploying function..." -ForegroundColor Cyan
supabase functions deploy make-server-5976446e --project-ref lgladnskxmbkhcnrsfxv

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing health endpoint..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "https://lgladnskxmbkhcnrsfxv.supabase.co/functions/v1/make-server-5976446e/health"
        $response | ConvertTo-Json
        Write-Host ""
        Write-Host ""
        Write-Host "🎉 All done! Your /directions endpoint is now live!" -ForegroundColor Green
        Write-Host "Try clicking 'Show Route' in your app to see real turn-by-turn directions!" -ForegroundColor Yellow
    } catch {
        Write-Host "⚠️ Deployment succeeded but health check failed" -ForegroundColor Yellow
        Write-Host "The function may need a moment to start up" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error message above and try again." -ForegroundColor Yellow
    exit 1
}
