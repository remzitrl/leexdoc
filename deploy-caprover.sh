#!/bin/bash

# LeexDoc CapRover Deployment Script
# This script helps deploy LeexDoc to CapRover

set -e

echo "🚀 Starting LeexDoc CapRover deployment..."

# Check if caprover CLI is installed
if ! command -v caprover &> /dev/null; then
    echo "❌ CapRover CLI is not installed. Please install it first:"
    echo "npm install -g caprover"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    echo "❌ Please run this script from the LeexDoc root directory"
    exit 1
fi

echo "📦 Building and deploying to CapRover..."

# Deploy to CapRover
caprover deploy

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: https://leexdoc.tural.digital"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables in CapRover dashboard"
echo "2. Deploy the required services (PostgreSQL, Redis, MinIO)"
echo "3. Run database migrations"
echo "4. Create an admin user"
echo ""
echo "🔧 Required services to deploy:"
echo "- PostgreSQL (srv-captain--postgres)"
echo "- Redis (srv-captain--redis)" 
echo "- MinIO (srv-captain--minio)"
