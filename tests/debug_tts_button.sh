#!/bin/bash

echo "=== Checking Frontend TTS State ==="

# Check if the speakTranscriptBtn element exists in the DOM
echo "Checking if TTS button exists in DOM..."
response=$(curl -s http://localhost:3000)
if echo "$response" | grep -q "speakTranscriptBtn"; then
    echo "✓ TTS button found in HTML"
else
    echo "✗ TTS button NOT found in HTML"
fi

# Check if the quickActions div exists
if echo "$response" | grep -q "quickActions"; then
    echo "✓ Quick actions section found in HTML"
else
    echo "✗ Quick actions section NOT found in HTML"
fi

echo -e "\n=== TTS Service Test ==="
tts_health=$(curl -s http://localhost:7000/health)
echo "TTS Health: $tts_health"

echo -e "\n=== JavaScript Module Test ==="
# Check if the JavaScript files are being served with correct MIME type
echo "Checking JavaScript file MIME types..."

app_js_type=$(curl -s -I http://localhost:3000/js/app.js | grep -i content-type)
echo "app.js content-type: $app_js_type"

tts_service_type=$(curl -s -I http://localhost:3000/js/services/TTSService.js | grep -i content-type)
echo "TTSService.js content-type: $tts_service_type"

echo -e "\n=== Manual Test Instructions ==="
echo "1. Open http://localhost:3000 in your browser"
echo "2. Open Developer Console (F12 or Cmd+Opt+I)"
echo "3. Look for these initialization logs:"
echo "   - 'TTSService initialized with baseUrl: ...'"
echo "   - 'Testing TTS connection to: ...'"
echo "   - 'TTS connection test result: ...'"
echo "   - 'TTS state set to available: ...'"
echo "4. Upload an audio file and check for logs after transcription"

echo -e "\n=== Current TTS button visibility logic in app.js ==="
echo "The button should appear when:"
echo "  - state.ttsAvailable is true"
echo "  - result.text exists (transcription completed)"
echo "  - elements.speakTranscriptBtn exists in DOM"
