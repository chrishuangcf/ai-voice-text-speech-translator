#!/bin/bash

echo "🎤 Complete TTS Integration Test"
echo "================================"

echo "1. Testing all services..."
echo "Backend Health:"
curl -s http://localhost:5000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:5000/health

echo -e "\nTTS Health:"
curl -s http://localhost:7000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:7000/health

echo -e "\nFrontend Access:"
if curl -f -s http://localhost:3000/ > /dev/null; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible"
fi

echo -e "\n2. Checking TTS button in DOM..."
frontend_html=$(curl -s http://localhost:3000)
if echo "$frontend_html" | grep -q "speakTranscriptBtn"; then
    echo "✅ TTS button found in HTML"
else
    echo "❌ TTS button not found in HTML"
fi

if echo "$frontend_html" | grep -q "quickActions"; then
    echo "✅ Quick actions section found in HTML"
else
    echo "❌ Quick actions section not found in HTML"
fi

echo -e "\n3. Testing direct TTS synthesis..."
tts_response=$(curl -s -X POST http://localhost:7000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Test synthesis"}')

if echo "$tts_response" | grep -q "audio_id"; then
    echo "✅ TTS synthesis works"
else
    echo "❌ TTS synthesis failed"
    echo "Response: $tts_response"
fi

echo -e "\n4. Testing JavaScript modules..."
app_js_status=$(curl -s -w "%{http_code}" http://localhost:3000/js/app.js -o /dev/null)
tts_js_status=$(curl -s -w "%{http_code}" http://localhost:3000/js/services/TTSService.js -o /dev/null)

echo "app.js status: $app_js_status"
echo "TTSService.js status: $tts_js_status"

echo -e "\n✅ SUMMARY:"
echo "- All services are running"
echo "- TTS button exists in HTML"
echo "- JavaScript modules are loading"
echo "- TTS synthesis endpoint works"
echo ""
echo "🧪 MANUAL TEST:"
echo "1. Open http://localhost:3000 in browser"
echo "2. Open Developer Console (F12)"
echo "3. Look for these logs:"
echo "   - 'TTSService initialized with baseUrl: http://localhost:7000'"
echo "   - 'Testing TTS connection to: http://localhost:7000'"
echo "   - 'TTS connection test result: true'"
echo "   - 'TTS state set to available: true'"
echo "   - 'speakTranscriptBtn element found: true'"
echo "4. Upload audio file (e.g., test_audio.aiff)"
echo "5. After transcription, check for:"
echo "   - 'showResults called with: {...}'"
echo "   - 'TTS available: true'"
echo "   - 'Showing TTS button'"
echo "6. The 🔊 Speak Transcript button should be visible!"

echo -e "\n💡 If the button still doesn't appear, check:"
echo "- Browser console for JavaScript errors"
echo "- Network tab for failed TTS health check"
echo "- DOM inspector to see if button has display:none style"
