#!/bin/bash

# Build script for Render deployment
echo "Starting build process..."

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"
