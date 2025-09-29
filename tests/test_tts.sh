#!/bin/bash

echo "🎤 Testing TTS Service Integration"
echo "=================================="

echo "1. Checking TTS service health..."
curl -s http://localhost:7000/health | jq .

echo -e "\n2. Testing TTS synthesis..."
curl -s -X POST http://localhost:7000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test of the text-to-speech service."}' | jq .

echo -e "\n3. Testing frontend access..."
if curl -f -s http://localhost:3000/ > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo -e "\n4. Checking if TTS button should be visible..."
echo "   - TTS service: $(curl -s http://localhost:7000/health | jq -r .status)"
echo "   - After a successful transcription, the '🔊 Speak Transcript' button should appear"

echo -e "\n🎯 To test TTS functionality:"
echo "   1. Upload an audio file"
echo "   2. Wait for transcription to complete"
echo "   3. Look for the '🔊 Speak Transcript' button in the results"
echo "   4. Click the button to generate speech"
echo "   5. An audio player should appear with the synthesized speech"
