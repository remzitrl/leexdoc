#!/bin/bash

# LeexDoc CapRover Deployment Script
# Bu script CapRover'a deploy etmek için gerekli adımları otomatikleştirir

set -e

echo "🚀 LeexDoc CapRover Deployment Script"
echo "====================================="

# Check if captain-definition exists
if [ ! -f "captain-definition" ]; then
    echo "❌ captain-definition file not found!"
    exit 1
fi

echo "✅ captain-definition file found"

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found!"
    exit 1
fi

echo "✅ Dockerfile found"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create it from env.production.example"
    echo "   cp env.production.example .env"
    echo "   Then edit .env with your production values"
    exit 1
fi

echo "✅ .env file found"

# Build the application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed"

# Create deployment package
echo "📦 Creating deployment package..."

# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
cp -r . "$TEMP_DIR/leexdoc"
cd "$TEMP_DIR/leexdoc"

# Remove unnecessary files for deployment
rm -rf node_modules
rm -rf .next/cache
rm -rf storage/*
rm -rf tmp/*
rm -rf tests
rm -rf test-files
rm -rf .git
rm -rf .github

# Create tar.gz for CapRover
tar -czf ../leexdoc-deploy.tar.gz .

echo "✅ Deployment package created: leexdoc-deploy.tar.gz"

# Instructions for CapRover
echo ""
echo "📋 CapRover Deployment Instructions:"
echo "===================================="
echo ""
echo "1. Go to your CapRover dashboard"
echo "2. Create a new app named 'leexdoc'"
echo "3. Go to 'Deployment' tab"
echo "4. Upload the file: $TEMP_DIR/leexdoc-deploy.tar.gz"
echo "5. Set environment variables in 'App Configs' → 'Environment Variables':"
echo ""
echo "   NODE_ENV=production"
echo "   DATABASE_URL=postgresql://leexdoc:YOUR_POSTGRES_PASSWORD@postgres:5432/leexdoc"
echo "   REDIS_URL=redis://redis:6379"
echo "   NEXTAUTH_URL=https://leexdoc.tural.digital"
echo "   NEXTAUTH_SECRET=YOUR_VERY_STRONG_SECRET_KEY_HERE"
echo "   STORAGE_PROVIDER=s3"
echo "   S3_ENDPOINT=http://minio:9000"
echo "   S3_BUCKET=leexdoc"
echo "   S3_ACCESS_KEY=YOUR_MINIO_ACCESS_KEY"
echo "   S3_SECRET_KEY=YOUR_MINIO_SECRET_KEY"
echo "   S3_REGION=us-east-1"
echo "   MINIO_ROOT_USER=YOUR_MINIO_ACCESS_KEY"
echo "   MINIO_ROOT_PASSWORD=YOUR_MINIO_SECRET_KEY"
echo ""
echo "6. Set up domain: leexdoc.tural.digital"
echo "7. Enable HTTPS"
echo "8. Deploy!"
echo ""
echo "📁 Deployment package location: $TEMP_DIR/leexdoc-deploy.tar.gz"
echo ""
echo "🎉 Ready for CapRover deployment!"
