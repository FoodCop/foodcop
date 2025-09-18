# Google Cloud Diagnostics Script for FUZO
# This script helps diagnose common Google Cloud issues

Write-Host "🔍 Google Cloud Diagnostics for FUZO" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

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
Write-Host "Project: $(gcloud config get-value project)" -ForegroundColor White
Write-Host "Account: $(gcloud config get-value account)" -ForegroundColor White
Write-Host "Region: $(gcloud config get-value compute/region)" -ForegroundColor White

Write-Host "`n🔍 Checking Authentication Status:" -ForegroundColor Cyan
$authList = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if ($authList) {
    Write-Host "✅ Active accounts:" -ForegroundColor Green
    $authList | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
} else {
    Write-Host "❌ No active authentication found" -ForegroundColor Red
    Write-Host "Run: gcloud auth login" -ForegroundColor Yellow
}

Write-Host "`n🔍 Checking Application Default Credentials:" -ForegroundColor Cyan
$adcPath = "$env:APPDATA\gcloud\application_default_credentials.json"
if (Test-Path $adcPath) {
    Write-Host "✅ Application Default Credentials found" -ForegroundColor Green
} else {
    Write-Host "❌ Application Default Credentials not found" -ForegroundColor Red
    Write-Host "Run: gcloud auth application-default login" -ForegroundColor Yellow
}

Write-Host "`n🔍 Checking Enabled APIs:" -ForegroundColor Cyan
$enabledApis = gcloud services list --enabled --format="value(config.name)" 2>$null
if ($enabledApis) {
    Write-Host "✅ Enabled APIs:" -ForegroundColor Green
    $enabledApis | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

    # Check for specific APIs we need
    $requiredApis = @(
        "maps-backend.googleapis.com",
        "mapsplatformdatasets.googleapis.com",
        "oauth2.googleapis.com"
    )

    Write-Host "`n🔍 Checking Required APIs:" -ForegroundColor Cyan
    foreach ($api in $requiredApis) {
        if ($enabledApis -contains $api) {
            Write-Host "✅ $api" -ForegroundColor Green
        } else {
            Write-Host "❌ $api (not enabled)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ No enabled APIs found" -ForegroundColor Red
}

Write-Host "`n🔍 Checking API Quotas:" -ForegroundColor Cyan
try {
    $quotaInfo = gcloud compute project-info describe --format="value(quotas[].metric)" 2>$null
    if ($quotaInfo) {
        Write-Host "✅ Quota information available" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Could not retrieve quota information" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not check quotas" -ForegroundColor Yellow
}

Write-Host "`n🔍 Checking Billing Status:" -ForegroundColor Cyan
try {
    $billingInfo = gcloud billing projects describe $(gcloud config get-value project) 2>$null
    if ($billingInfo) {
        Write-Host "✅ Billing account linked" -ForegroundColor Green
    } else {
        Write-Host "❌ No billing account linked" -ForegroundColor Red
        Write-Host "This could cause API failures!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not check billing status" -ForegroundColor Yellow
}

Write-Host "`n🔍 Checking Maps API Key (if available):" -ForegroundColor Cyan
$mapsKey = $env:VITE_GOOGLE_MAPS_API_KEY
if ($mapsKey) {
    Write-Host "✅ Maps API Key found in environment" -ForegroundColor Green
    Write-Host "Key: $($mapsKey.Substring(0,10))..." -ForegroundColor White
} else {
    Write-Host "⚠️ Maps API Key not found in environment" -ForegroundColor Yellow
    Write-Host "Check your .env.local file" -ForegroundColor White
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "If you see any ❌ or ⚠️ above, those are potential issues that could cause authentication problems." -ForegroundColor White
Write-Host "`nCommon fixes:" -ForegroundColor Yellow
Write-Host "1. Enable billing: https://console.cloud.google.com/billing" -ForegroundColor White
Write-Host "2. Enable APIs: https://console.cloud.google.com/apis/library" -ForegroundColor White
Write-Host "3. Check API keys: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "4. Check OAuth consent: https://console.cloud.google.com/apis/credentials/consent" -ForegroundColor White
