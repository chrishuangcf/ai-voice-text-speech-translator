#!/bin/bash

# Script to download Whisper models for caching in repo
# This ensures we have the models locally before building containers

set -e  # Exit on any error

MODELS_DIR="models/whisper"
mkdir -p "$MODELS_DIR"

echo "📦 Downloading Whisper models for local caching..."

# Function to download a specific model
download_model() {
    local model_name=$1
    local model_file="$MODELS_DIR/${model_name}.pt"
    
    if [ ! -f "$model_file" ]; then
        echo "⬇️ Downloading Whisper $model_name model..."
        python3 -c "
import whisper
import os
import sys

model_dir = '$MODELS_DIR'
model_name = '$model_name'
os.makedirs(model_dir, exist_ok=True)

try:
    # Download model and save to our models directory
    print(f'Downloading {model_name} model to {model_dir}...')
    model = whisper.load_model(model_name, download_root=model_dir)
    print(f'✅ {model_name} model cached at {model_dir}/{model_name}.pt')
except Exception as e:
    print(f'❌ Error downloading {model_name} model: {e}')
    sys.exit(1)
"
    else
        echo "✅ $model_name model already cached at $model_file"
    fi
}

# Check if Python and whisper are available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is required but not installed"
    exit 1
fi

# Install whisper if not available
if ! python3 -c "import whisper" 2>/dev/null; then
    echo "📦 Installing OpenAI Whisper..."
    pip3 install openai-whisper
fi

# Download base model (default)
download_model "base"

# Ask if user wants additional models
echo ""
echo "🤔 Do you want to cache additional models?"
echo "💡 Current model: base (~142MB)"
echo "📊 Available model sizes:"
echo "   1) tiny: ~39MB (fastest, least accurate)"
echo "   2) small: ~244MB"
echo "   3) medium: ~769MB"
echo "   4) large: ~1550MB (slowest, most accurate)"
echo "   5) Skip additional models"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        download_model "tiny"
        ;;
    2)
        download_model "small"
        ;;
    3)
        download_model "medium"
        ;;
    4)
        download_model "large"
        ;;
    5)
        echo "Skipping additional models"
        ;;
    *)
        echo "Invalid choice, skipping additional models"
        ;;
esac

echo ""
echo "📋 Cached models:"
ls -lh "$MODELS_DIR"/*.pt 2>/dev/null || echo "No models found"

echo ""
echo "✅ Whisper model caching complete!"
echo "🐳 You can now build your Docker containers with:"
echo "   docker-compose build"
echo "   docker-compose up"
echo ""
echo "💡 The cached models will be copied into the container during build"
echo "   and will not need to be downloaded again!"
