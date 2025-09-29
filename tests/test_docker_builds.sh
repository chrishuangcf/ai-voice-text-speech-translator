#!/bin/bash

# Test script to verify all Dockerfiles build successfully with correct certificate paths

echo "======================================"
echo "Testing all Dockerfile builds..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test docker build
test_build() {
    local dockerfile="$1"
    local tag="$2"
    local context="$3"
    
    echo -e "${YELLOW}Testing: $dockerfile${NC}"
    
    if docker build -f "$dockerfile" -t "$tag" "$context" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS: $dockerfile${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED: $dockerfile${NC}"
        return 1
    fi
}

# Change to project directory
cd "$(dirname "$0")"

# Test all Dockerfiles
echo "Testing Dockerfiles with certificate path validation..."
echo

failed_builds=0

# Test backend Dockerfile
test_build "backend/Dockerfile" "test-backend" "." || ((failed_builds++))

# Test backend dev Dockerfile  
test_build "backend/Dockerfile.dev" "test-backend-dev" "." || ((failed_builds++))

# Test backend no-ssl Dockerfile
test_build "backend/Dockerfile.no-ssl" "test-backend-no-ssl" "." || ((failed_builds++))

# Test frontend Dockerfile
test_build "frontend/Dockerfile" "test-frontend" "." || ((failed_builds++))

# Test translation service Dockerfile
test_build "translation-service/Dockerfile" "test-translation-service" "." || ((failed_builds++))

# Test nginx Dockerfile
test_build "nginx/Dockerfile" "test-nginx" "nginx" || ((failed_builds++))

echo
echo "======================================"
if [ $failed_builds -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL BUILDS SUCCESSFUL!${NC}"
    echo -e "${GREEN}All certificate paths are correctly configured.${NC}"
else
    echo -e "${RED}❌ $failed_builds build(s) failed.${NC}"
    echo -e "${RED}Please check the Dockerfile paths and certificate locations.${NC}"
fi
echo "======================================"

# Cleanup test images
echo
echo "Cleaning up test images..."
docker rmi test-backend test-backend-dev test-backend-no-ssl test-frontend test-translation-service test-nginx 2>/dev/null || true

exit $failed_builds
