#!/bin/bash

# Update Google Maps API Key - Run these commands after updating .env files

echo "🔑 Updating Google Maps API Key..."
echo ""
echo "Step 1: Make sure you've updated the API key in:"
echo "  - .env.production"
echo "  - .env.local"
echo ""
echo "Step 2: Rebuilding app with new API key..."

cd /Users/akrammahmoud/geo-bubble-whispers/geo-bubble-whispers

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build with new API key
echo "🔨 Building..."
npm run build

# Sync to iOS
echo "📱 Syncing to iOS..."
npx cap sync ios

echo ""
echo "✅ Done! Now run the app in Xcode (Cmd+R)"
echo ""
