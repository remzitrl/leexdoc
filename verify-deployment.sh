#!/bin/bash

# Comprehensive deployment verification script
echo "🔍 LeexDoc Deployment Verification"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check essential files exist
echo ""
print_info "Checking essential files..."

files=(
    "Dockerfile"
    "captain-definition"
    "package.json"
    "next.config.ts"
    "prisma/schema.prisma"
    ".env"
)

all_files_ok=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
        all_files_ok=false
    fi
done

# 2. Check Dockerfile content
echo ""
print_info "Checking Dockerfile content..."

if grep -q "FROM node:18-alpine" Dockerfile; then
    print_status 0 "Dockerfile has correct base image"
else
    print_status 1 "Dockerfile base image issue"
    all_files_ok=false
fi

if grep -q "output: 'standalone'" next.config.ts; then
    print_status 0 "Next.js configured for standalone output"
else
    print_status 1 "Next.js not configured for standalone output"
    all_files_ok=false
fi

# 3. Check captain-definition
echo ""
print_info "Checking captain-definition..."

if grep -q "dockerfilePath" captain-definition; then
    print_status 0 "captain-definition has dockerfilePath"
else
    print_status 1 "captain-definition missing dockerfilePath"
    all_files_ok=false
fi

# 4. Check .dockerignore
echo ""
print_info "Checking .dockerignore..."

if ! grep -q "^Dockerfile$" .dockerignore; then
    print_status 0 "Dockerfile not excluded in .dockerignore"
else
    print_status 1 "Dockerfile is excluded in .dockerignore"
    all_files_ok=false
fi

if ! grep -q "^captain-definition$" .dockerignore; then
    print_status 0 "captain-definition not excluded in .dockerignore"
else
    print_status 1 "captain-definition is excluded in .dockerignore"
    all_files_ok=false
fi

# 5. Test deployment package creation
echo ""
print_info "Testing deployment package creation..."

TEMP_DIR=$(mktemp -d)
cp -r . "$TEMP_DIR/leexdoc-test"
cd "$TEMP_DIR/leexdoc-test"

# Remove unnecessary files (same as deploy script)
rm -rf node_modules
rm -rf .next/cache
rm -rf storage/*
rm -rf tmp/*
rm -rf tests
rm -rf test-files
rm -rf .git
rm -rf .github

# Check essential files in package
package_ok=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file in package"
    else
        print_status 1 "$file missing from package"
        package_ok=false
    fi
done

# Create tar.gz
if tar -czf ../leexdoc-test.tar.gz . 2>/dev/null; then
    print_status 0 "Package creation successful"
    
    # Check package size
    package_size=$(du -h ../leexdoc-test.tar.gz | cut -f1)
    print_info "Package size: $package_size"
    
    # Verify tar contents
    if tar -tzf ../leexdoc-test.tar.gz | grep -q "Dockerfile"; then
        print_status 0 "Dockerfile in tar package"
    else
        print_status 1 "Dockerfile missing from tar package"
        package_ok=false
    fi
    
    if tar -tzf ../leexdoc-test.tar.gz | grep -q "captain-definition"; then
        print_status 0 "captain-definition in tar package"
    else
        print_status 1 "captain-definition missing from tar package"
        package_ok=false
    fi
else
    print_status 1 "Package creation failed"
    package_ok=false
fi

# Cleanup
cd /Users/remzi/Desktop/leexcode
rm -rf "$TEMP_DIR"

# Final result
echo ""
echo "=================================="
if [ "$all_files_ok" = true ] && [ "$package_ok" = true ]; then
    print_status 0 "Deployment verification PASSED"
    echo ""
    print_info "Ready for CapRover deployment!"
    print_info "Run: ./deploy-caprover.sh"
else
    print_status 1 "Deployment verification FAILED"
    echo ""
    print_warning "Please fix the issues above before deploying"
fi
