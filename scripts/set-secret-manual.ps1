# Manual method to set Supabase secret using API
# This uses your SUPABASE_ACCESS_TOKEN from .env

$projectRef = "lgladnskxmbkhcnrsfxv"
$accessToken = "sbp_3a1c026ca2804704551dd81f43630cdf38dbef86"
$apiKey = "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"

Write-Host "Setting OPENAI_API_KEY secret via Supabase Management API..." -ForegroundColor Cyan

$body = @(
    @{
        name = "OPENAI_API_KEY"
        value = $apiKey
    }
) | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.supabase.com/v1/projects/$projectRef/secrets" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "✅ Secret set successfully!" -ForegroundColor Green
    Write-Host "The Edge Function will now have access to OPENAI_API_KEY" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use the Dashboard method instead:" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard/project/$projectRef/settings/functions" -ForegroundColor Cyan
}
