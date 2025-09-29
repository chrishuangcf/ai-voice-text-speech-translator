#!/bin/bash

echo "=== Testing Frontend TTS Button Visibility ==="

# Create a simple audio file for testing (if ffmpeg is available)
if command -v ffmpeg >/dev/null 2>&1; then
    echo "Creating test audio file..."
    ffmpeg -f lavfi -i "sine=frequency=1000:duration=2" -ar 16000 -ac 1 /tmp/test_audio.wav -y >/dev/null 2>&1
    echo "Test audio file created: /tmp/test_audio.wav"
else
    echo "ffmpeg not available, will use existing test methods"
fi

echo -e "\n=== Checking service health ==="
echo "Backend:" 
curl -s http://localhost:5000/health

echo -e "\nTTS Service:"
curl -s http://localhost:7000/health

echo -e "\n\n=== Frontend should show console logs for TTS initialization ==="
echo "1. Open http://localhost:3000 in your browser"
echo "2. Open Developer Console (F12)"
echo "3. Look for TTS initialization logs"
echo "4. Upload an audio file (use /tmp/test_audio.wav if created)"
echo "5. Check for TTS button visibility logs after transcription"

echo -e "\n=== Direct TTS test ==="
curl -s -X POST http://localhost:7000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Test speech synthesis"}' | jq .

echo -e "\nDone. Check the browser console for detailed logs."
