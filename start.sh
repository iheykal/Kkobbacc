#!/bin/bash

echo "🚀 Starting Kobac Real Estate App..."

# Check if required environment variables are set
echo "📋 Checking environment variables..."

if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI is not set"
    exit 1
else
    echo "✅ MONGODB_URI is set"
fi

if [ -z "$R2_ENDPOINT" ]; then
    echo "❌ R2_ENDPOINT is not set"
    exit 1
else
    echo "✅ R2_ENDPOINT is set"
fi

if [ -z "$R2_ACCESS_KEY_ID" ]; then
    echo "❌ R2_ACCESS_KEY_ID is not set"
    exit 1
else
    echo "✅ R2_ACCESS_KEY_ID is set"
fi

if [ -z "$R2_SECRET_ACCESS_KEY" ]; then
    echo "❌ R2_SECRET_ACCESS_KEY is not set"
    exit 1
else
    echo "✅ R2_SECRET_ACCESS_KEY is set"
fi

if [ -z "$R2_BUCKET" ]; then
    echo "❌ R2_BUCKET is not set"
    exit 1
else
    echo "✅ R2_BUCKET is set"
fi

echo "🎯 All required environment variables are set!"
echo "🚀 Starting Next.js application..."

# Start the application
npm start
