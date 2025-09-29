#!/bin/bash

echo "🔧 Testing Dual Service Health Check UI"
echo "======================================="

echo "1. Checking if frontend is accessible..."
if curl -f -s http://localhost:3000/ > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

echo -e "\n2. Checking health check elements in HTML..."
html_content=$(curl -s http://localhost:3000)

# Check for backend service status elements
if echo "$html_content" | grep -q "statusIndicator" && echo "$html_content" | grep -q "statusText"; then
    echo "✅ Backend status elements found"
else
    echo "❌ Backend status elements missing"
fi

# Check for TTS service status elements
if echo "$html_content" | grep -q "ttsStatusIndicator" && echo "$html_content" | grep -q "ttsStatusText"; then
    echo "✅ TTS status elements found"
else
    echo "❌ TTS status elements missing"
fi

# Check for service-status class structure
if echo "$html_content" | grep -q "service-status"; then
    echo "✅ Service status layout structure found"
else
    echo "❌ Service status layout structure missing"
fi

echo -e "\n3. Testing backend service health..."
backend_health=$(curl -s http://localhost:5000/health)
if echo "$backend_health" | grep -q "healthy"; then
    echo "✅ Backend service is healthy"
    echo "   Response: $(echo $backend_health | head -c 100)..."
else
    echo "❌ Backend service not healthy"
    echo "   Response: $backend_health"
fi

echo -e "\n4. Testing TTS service health..."
tts_health=$(curl -s http://localhost:7000/health)
if echo "$tts_health" | grep -q "healthy"; then
    echo "✅ TTS service is healthy"
    echo "   Response: $(echo $tts_health | head -c 100)..."
else
    echo "❌ TTS service not healthy"
    echo "   Response: $tts_health"
fi

echo -e "\n5. Checking updated CSS styles..."
css_content=$(curl -s http://localhost:3000/css/styles.css)
if echo "$css_content" | grep -q "service-status" && echo "$css_content" | grep -q "status-indicator"; then
    echo "✅ Updated CSS styles found"
else
    echo "❌ Updated CSS styles missing"
fi

echo -e "\n6. Testing JavaScript app integration..."
app_js_content=$(curl -s http://localhost:3000/js/app.js)
if echo "$app_js_content" | grep -q "updateBackendStatus" && echo "$app_js_content" | grep -q "updateTTSStatus"; then
    echo "✅ Health check methods found in app.js"
else
    echo "❌ Health check methods missing from app.js"
fi

echo -e "\n✅ SUMMARY:"
echo "- Dual service health check UI implemented"
echo "- Backend status: Shows Whisper API connection"
echo "- TTS status: Shows TTS service connection"
echo "- Visual indicators: ✅ (healthy), ❌ (error), 🔄 (checking)"
echo "- Real-time status updates during initialization"
echo ""
echo "🧪 MANUAL TESTING:"
echo "1. Open http://localhost:3000"
echo "2. Check status bar at bottom shows:"
echo "   - Backend Service: [icon] [status text]"
echo "   - TTS Service: [icon] [status text]"
echo "3. Watch indicators during page load:"
echo "   - Should show 🔄 while checking"
echo "   - Should show ✅ when services are healthy"
echo "   - Should show ❌ if services are down"
echo "4. Try stopping a service and refreshing to see error states"

echo -e "\n🔧 TESTING SERVICE FAILURES:"
echo "To test error states:"
echo "1. Stop TTS service: docker compose stop tts-service"
echo "2. Refresh page - TTS status should show ❌"
echo "3. Stop backend: docker compose stop whisper-backend"
echo "4. Refresh page - Backend status should show ❌"
echo "5. Restart services: docker compose up -d"
