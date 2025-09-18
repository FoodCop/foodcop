# PowerShell script to disable unnecessary Google Cloud APIs for FUZO food app
# This will help reduce costs and eliminate API errors

Write-Host "🚀 Disabling unnecessary Google Cloud APIs for FUZO..." -ForegroundColor Green

# Set your project ID (replace with your actual project ID)
$PROJECT_ID = "your-project-id-here"

# List of APIs to disable (APIs not needed for FUZO food app)
$APIS_TO_DISABLE = @(
    "bigqueryconnection.googleapis.com",
    "bigquerydatapolicy.googleapis.com",
    "bigquerymigration.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "bigquerystorage.googleapis.com",
    "cloudasset.googleapis.com",
    "clouddataplex.googleapis.com",
    "datastore.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
    "dataform.googleapis.com"
)

Write-Host "📋 APIs to disable:" -ForegroundColor Yellow
foreach ($api in $APIS_TO_DISABLE) {
    Write-Host "  - $api" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⚠️  WARNING: This will disable the above APIs for project: $PROJECT_ID" -ForegroundColor Red
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

# Disable each API
foreach ($api in $APIS_TO_DISABLE) {
    Write-Host "🔄 Disabling $api..." -ForegroundColor Blue

    try {
        gcloud services disable $api --project=$PROJECT_ID --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully disabled $api" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to disable $api" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error disabling $api : $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "🎉 API disabling process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 To check remaining enabled APIs, run:" -ForegroundColor Yellow
Write-Host "gcloud services list --enabled --project=$PROJECT_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "💰 To check API usage and costs, visit:" -ForegroundColor Yellow
Write-Host "https://console.cloud.google.com/billing" -ForegroundColor Gray
