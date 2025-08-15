#!/bin/bash
set -e
# Build script for Railway deployment

echo "Starting build process..."

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci --prefer-offline
fi

# Build with Vite
echo "Building application..."
npm run build

echo "Build complete!"
