#!/bin/bash

# Deploy Directions Endpoint to Supabase
# Run this script to deploy the make-server-5976446e function

echo "🚀 Deploying make-server-5976446e Edge Function..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null
then
    echo "❌ Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Deploy function
echo "📦 Deploying function..."
supabase functions deploy make-server-5976446e --project-ref lgladnskxmbkhcnrsfxv

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🧪 Testing health endpoint..."
    curl https://lgladnskxmbkhcnrsfxv.supabase.co/functions/v1/make-server-5976446e/health
    echo ""
    echo ""
    echo "🎉 All done! Your /directions endpoint is now live!"
    echo "Try clicking 'Show Route' in your app to see real turn-by-turn directions!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error message above and try again."
    exit 1
fi
