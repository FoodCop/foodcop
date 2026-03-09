# Deploy YouTube Proxy Edge Function to Supabase
# This script deploys the youtube-proxy function and sets the required secret

Write-Host "Deploying YouTube Proxy Edge Function..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "Error: Supabase CLI is not installed." -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're logged in
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not logged in to Supabase." -ForegroundColor Red
    Write-Host "Please run: supabase login" -ForegroundColor Yellow
    exit 1
}

# Get the project reference
$projectRef = (Get-Content .env.local | Select-String "VITE_SUPABASE_URL").ToString() -replace '.*//([^.]+)\..*', '$1'

if (-not $projectRef) {
    Write-Host "Error: Could not determine project reference from .env.local" -ForegroundColor Red
    Write-Host "Make sure VITE_SUPABASE_URL is set in .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "Project Reference: $projectRef" -ForegroundColor Green

# Prompt for YouTube API Key if not already set
Write-Host "`nChecking YouTube API key secret..." -ForegroundColor Cyan
$secretCheck = supabase secrets list --project-ref $projectRef 2>&1 | Select-String "YOUTUBE_API_KEY"

if (-not $secretCheck) {
    Write-Host "YouTube API key not found in secrets." -ForegroundColor Yellow
    $apiKey = Read-Host "Enter your YouTube Data API v3 key"
    
    if ($apiKey) {
        Write-Host "Setting YOUTUBE_API_KEY secret..." -ForegroundColor Cyan
        supabase secrets set YOUTUBE_API_KEY="$apiKey" --project-ref $projectRef
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Secret set successfully!" -ForegroundColor Green
        } else {
            Write-Host "Error: Failed to set secret" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Error: API key is required" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "YouTube API key is already configured." -ForegroundColor Green
}

# Deploy the function
Write-Host "`nDeploying youtube-proxy function..." -ForegroundColor Cyan
supabase functions deploy youtube-proxy --project-ref $projectRef

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ YouTube Proxy Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host "`nFunction URL: https://$projectRef.supabase.co/functions/v1/youtube-proxy" -ForegroundColor Cyan
    Write-Host "`nThe function is now ready to use. Your API key is secure on the backend." -ForegroundColor Green
} else {
    Write-Host "`n✗ Deployment failed" -ForegroundColor Red
    exit 1
}
