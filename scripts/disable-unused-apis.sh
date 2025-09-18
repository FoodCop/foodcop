#!/bin/bash

# Script to disable unnecessary Google Cloud APIs for FUZO food app
# This will help reduce costs and eliminate API errors

echo "🚀 Disabling unnecessary Google Cloud APIs for FUZO..."

# Set your project ID (replace with your actual project ID)
PROJECT_ID="your-project-id-here"

# List of APIs to disable (APIs not needed for FUZO food app)
APIS_TO_DISABLE=(
    "bigqueryconnection.googleapis.com"
    "bigquerydatapolicy.googleapis.com"
    "bigquerymigration.googleapis.com"
    "bigqueryreservation.googleapis.com"
    "bigquerystorage.googleapis.com"
    "cloudasset.googleapis.com"
    "clouddataplex.googleapis.com"
    "datastore.googleapis.com"
    "logging.googleapis.com"
    "monitoring.googleapis.com"
    "cloudtrace.googleapis.com"
    "dataform.googleapis.com"
)

echo "📋 APIs to disable:"
for api in "${APIS_TO_DISABLE[@]}"; do
    echo "  - $api"
done

echo ""
echo "⚠️  WARNING: This will disable the above APIs for project: $PROJECT_ID"
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Disable each API
for api in "${APIS_TO_DISABLE[@]}"; do
    echo "🔄 Disabling $api..."
    gcloud services disable "$api" --project="$PROJECT_ID" --force

    if [ $? -eq 0 ]; then
        echo "✅ Successfully disabled $api"
    else
        echo "❌ Failed to disable $api"
    fi
    echo ""
done

echo "🎉 API disabling process completed!"
echo ""
echo "📊 To check remaining enabled APIs, run:"
echo "gcloud services list --enabled --project=$PROJECT_ID"
echo ""
echo "💰 To check API usage and costs, visit:"
echo "https://console.cloud.google.com/billing"
