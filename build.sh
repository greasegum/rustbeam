#!/bin/bash
# Build script for Railway deployment

echo "Starting build process..."

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build with Vite
echo "Building application..."
npx vite build

echo "Build complete!"