#!/bin/bash

echo "=== Testing Frontend TTS Button Logic ==="

# Check if containers are running
echo "Checking container status..."
docker-compose ps

echo -e "\n=== Testing TTS Service Health ==="
curl -s http://localhost:7000/health

echo -e "\n\n=== Testing Frontend Load ==="
response=$(curl -s -w "%{http_code}" http://localhost:3000 -o /dev/null)
if [ "$response" -eq 200 ]; then
    echo "✓ Frontend is accessible"
else
    echo "✗ Frontend returned HTTP $response"
fi

echo -e "\n=== Checking if TTS button exists in HTML ==="
curl -s http://localhost:3000 | grep -o "speakTranscriptBtn" && echo "✓ TTS button found in HTML" || echo "✗ TTS button not found"

echo -e "\n=== Testing TTS API directly ==="
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice": "en-US-AriaNeural", "output_format": "audio-24khz-48kbitrate-mono-mp3"}' \
  http://localhost:7000/synthesize | head -c 100

echo -e "\n\nDone."
