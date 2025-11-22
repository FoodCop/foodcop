# Deploy OpenAI Proxy Edge Function to Supabase (PowerShell)
# This script deploys the openai-proxy function with verify_jwt: false for anonymous access

Write-Host "Deploying openai-proxy Edge Function..." -ForegroundColor Cyan
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

# Deploy function with --no-verify-jwt flag to allow anonymous access
Write-Host "📦 Deploying function with anonymous access enabled..." -ForegroundColor Cyan
supabase functions deploy openai-proxy --project-ref lgladnskxmbkhcnrsfxv --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The function is now configured to allow anonymous access." -ForegroundColor Green
    Write-Host "Make sure OPENAI_API_KEY is set in Supabase secrets:" -ForegroundColor Yellow
    Write-Host "  supabase secrets set OPENAI_API_KEY=your-key-here --project-ref lgladnskxmbkhcnrsfxv" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

