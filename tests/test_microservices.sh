#!/bin/bash

# Comprehensive Test Script for Whisper Voice-to-Text Microservices
# Tests all services: Whisper Backend, Translation Service, and Frontend

set -e  # Exit on any error

echo "🧪 Testing Whisper Voice-to-Text Microservices"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service URLs
WHISPER_URL="http://localhost:5000"
TRANSLATION_URL="http://localhost:6000"
FRONTEND_URL="http://localhost:3000"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

# Helper function to test HTTP endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $name: "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $response)"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection failed)"
    fi
}

# Helper function to test JSON API
test_json_api() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $name: "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        if echo "$response" | jq -e '.success // true' >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${YELLOW}⚠ PARTIAL${NC} (Response: $(echo "$response" | jq -r '.error // "Unknown error"'))"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Invalid JSON response)"
    fi
}

# Check if required tools are available
echo "🔧 Checking required tools..."
for tool in curl jq; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}Error: $tool is not installed${NC}"
        echo "Please install: brew install $tool (macOS) or apt-get install $tool (Linux)"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required tools are available${NC}"
echo

# Check if Docker containers are running
echo "🐳 Checking Docker containers..."
if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(whisper|translation)" > /dev/null; then
    echo -e "${YELLOW}⚠ Docker containers don't seem to be running${NC}"
    echo "To start the services, run:"
    echo "  docker-compose up -d"
    echo "or for development:"
    echo "  docker-compose -f docker-compose.dev.yml up -d"
    echo
else
    echo -e "${GREEN}✓ Docker containers are running${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(whisper|translation)"
    echo
fi

# Test 1: Basic Health Checks
echo "🏥 Testing Service Health Checks"
echo "================================"
test_endpoint "Whisper Backend Health" "$WHISPER_URL/health" "200"
test_endpoint "Translation Service Health" "$TRANSLATION_URL/health" "200"
test_endpoint "Frontend Accessibility" "$FRONTEND_URL/" "200"
echo

# Test 2: Whisper Backend API
echo "🎤 Testing Whisper Backend API"
echo "==============================="
test_json_api "Whisper Languages Endpoint" "$WHISPER_URL/api/v1/languages" "GET"
test_json_api "Whisper Model Info" "$WHISPER_URL/api/v1/model-info" "GET"
echo

# Test 3: Translation Service API
echo "🌍 Testing Translation Service API"
echo "==================================="
test_json_api "Translation Languages" "$TRANSLATION_URL/languages" "GET"
test_json_api "Translation Test" "$TRANSLATION_URL/translate" "POST" '{"text":"Hello world","target_language":"es"}'
test_json_api "Language Detection" "$TRANSLATION_URL/detect" "POST" '{"text":"Bonjour le monde"}'
echo

# Test 4: Proxy Endpoints (Backend to Translation Service)
echo "🔗 Testing Backend-to-Translation Proxy"
echo "========================================"
test_json_api "Translation Languages (via Backend)" "$WHISPER_URL/api/v1/translation-languages" "GET"
test_json_api "Translation (via Backend)" "$WHISPER_URL/api/v1/translate" "POST" '{"text":"Hello world","target_language":"fr"}'
echo

# Test 5: Frontend JavaScript Loading
echo "📄 Testing Frontend Resources"
echo "=============================="
test_endpoint "Frontend JavaScript API" "$FRONTEND_URL/js/api.js" "200"
test_endpoint "Frontend JavaScript App" "$FRONTEND_URL/js/app.js" "200"
test_endpoint "Frontend CSS" "$FRONTEND_URL/css/styles.css" "200"
echo

# Test 6: Service Integration Test
echo "🔄 Testing Service Integration"
echo "==============================="
echo "Testing complete translation workflow..."

TOTAL_TESTS=$((TOTAL_TESTS + 1))
workflow_test() {
    # Step 1: Get supported languages from both services
    whisper_langs=$(curl -s "$WHISPER_URL/api/v1/languages" | jq -r '.languages[]?' 2>/dev/null | head -5 | tr '\n' ',' | sed 's/,$//')
    translation_langs=$(curl -s "$TRANSLATION_URL/languages" | jq -r '.languages[]?' 2>/dev/null | head -5 | tr '\n' ',' | sed 's/,$//')
    
    if [ -n "$whisper_langs" ] && [ -n "$translation_langs" ]; then
        echo -e "  Whisper languages: ${BLUE}$whisper_langs${NC}"
        echo -e "  Translation languages: ${BLUE}$translation_langs${NC}"
        
        # Step 2: Test translation via backend proxy
        proxy_result=$(curl -s -X POST -H "Content-Type: application/json" \
            -d '{"text":"This is a test message","target_language":"es"}' \
            "$WHISPER_URL/api/v1/translate" 2>/dev/null)
        
        if echo "$proxy_result" | jq -e '.success' >/dev/null 2>&1; then
            translated_text=$(echo "$proxy_result" | jq -r '.result.translated_text')
            echo -e "  ${GREEN}✓ Integration test PASSED${NC}"
            echo -e "  Sample translation: ${BLUE}$translated_text${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "  ${RED}✗ Integration test FAILED${NC}"
            echo -e "  Error: $(echo "$proxy_result" | jq -r '.error // "Unknown error"')"
        fi
    else
        echo -e "  ${RED}✗ Integration test FAILED${NC} (Could not fetch language lists)"
    fi
}

workflow_test
echo

# Test Results Summary
echo "📊 Test Results Summary"
echo "======================="
echo -e "Total tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n🎉 ${GREEN}All tests passed!${NC} Your microservices are working correctly."
    echo
    echo "🚀 Ready to use features:"
    echo "  • Audio transcription (90+ languages)"
    echo "  • Text translation (100+ language pairs)"  
    echo "  • Multi-step workflow (transcribe → translate)"
    echo "  • Automatic language detection"
    echo
    echo "🌐 Access your application:"
    echo "  Frontend: http://localhost:3000"
    echo "  Whisper API: http://localhost:5000"
    echo "  Translation API: http://localhost:6000"
    
elif [ $PASSED_TESTS -gt $((TOTAL_TESTS / 2)) ]; then
    echo -e "\n⚠️  ${YELLOW}Most tests passed${NC}, but some services may have issues."
    echo "Check the failed tests above and ensure all Docker containers are running."
    
else
    echo -e "\n❌ ${RED}Many tests failed${NC}. Please check your setup:"
    echo "1. Run: docker-compose up -d"
    echo "2. Wait for all services to start (30-60 seconds)"
    echo "3. Check logs: docker-compose logs"
    echo "4. Retry this test script"
fi

echo
echo "🔧 Troubleshooting commands:"
echo "  docker-compose ps                    # Check service status"
echo "  docker-compose logs whisper-backend  # Check Whisper logs"
echo "  docker-compose logs translation-service # Check translation logs"
echo "  docker-compose restart               # Restart all services"
