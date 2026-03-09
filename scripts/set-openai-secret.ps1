# PowerShell script to set OpenAI API key in Supabase Edge Functions
# Run this script to configure the OPENAI_API_KEY secret

Write-Host "Setting OPENAI_API_KEY secret for Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please enter your OpenAI API key:" -ForegroundColor Yellow
$apiKey = Read-Host -AsSecureString

# Convert secure string to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
$plainApiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($plainApiKey)) {
    Write-Host "Error: API key cannot be empty" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting secret in Supabase..." -ForegroundColor Cyan

# Set the secret using Supabase CLI
try {
    supabase secrets set "OPENAI_API_KEY=$plainApiKey"
    Write-Host ""
    Write-Host "✅ Secret set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The Edge Function will now be able to access the OpenAI API." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Error setting secret: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative method:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/_/settings/functions" -ForegroundColor Yellow
    Write-Host "2. Add a new secret:" -ForegroundColor Yellow
    Write-Host "   Key: OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host "   Value: <your-api-key>" -ForegroundColor Yellow
    exit 1
}
