#!/bin/bash

echo "🔧 Testing Frontend MIME Type Fix"
echo "================================="

# Check if docker-compose is available
if ! command -v docker compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "📦 Rebuilding frontend container with MIME type fixes..."
docker compose build whisper-frontend

echo "🚀 Starting the application..."
docker compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Testing MIME types..."

# Test JavaScript MIME type
echo "Testing .js files:"
curl -I http://localhost:3000/js/app.js 2>/dev/null | grep -i content-type || echo "❌ Could not retrieve JS MIME type"

# Test CSS MIME type
echo "Testing .css files:"
curl -I http://localhost:3000/css/styles.css 2>/dev/null | grep -i content-type || echo "❌ Could not retrieve CSS MIME type"

# Test if main page loads
echo "Testing main page:"
if curl -f -s http://localhost:3000/ > /dev/null; then
    echo "✅ Main page loads successfully"
else
    echo "❌ Main page failed to load"
fi

echo ""
echo "🏥 Health check:"
curl -s http://localhost:3000/nginx-health || echo "❌ Health check failed"

echo ""
echo "📋 Container status:"
docker-compose ps

echo ""
echo "🎯 If the tests pass, your MIME type issue should be resolved!"
echo "   Open http://localhost in your browser to test the frontend."
echo ""
echo "🛠  To view logs if there are issues:"
echo "   docker compose logs whisper-frontend"
echo ""
echo "🧹 To stop the services:"
echo "   docker compose down"
