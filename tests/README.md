# Test Scripts

This folder contains various test scripts for the voice-to-text application.

## Test Scripts Overview

### Core Integration Tests
- **`test_simple.sh`** - Basic functionality test
- **`test_microservices.sh`** - Tests all microservices integration
- **`test_docker_builds.sh`** - Tests Docker container builds

### Frontend & TTS Tests
- **`test_tts.sh`** - Tests TTS service integration
- **`final_tts_test.sh`** - Comprehensive TTS integration test
- **`test_frontend_debug.sh`** - Frontend debugging and health checks
- **`test_mime_fix.sh`** - Tests MIME type fixes for frontend assets
- **`test_language_consolidation.sh`** - Tests consolidated language selection with flags

### Debugging Scripts
- **`debug_tts_button.sh`** - Debug TTS button visibility issues
- **`test_tts_debug.sh`** - TTS service debugging with detailed logging

## Usage

Make sure all containers are running first:
```bash
docker compose up -d
```

Then run any test script:
```bash
cd tests
./test_name.sh
```

## Test Categories

### Health Checks
Most scripts include health checks for:
- Backend service (port 5000)
- TTS service (port 7000) 
- Translation service (port 6000)
- Frontend (port 3000)

### Integration Tests
- File upload and transcription
- TTS synthesis and audio generation
- Frontend-backend communication
- Service-to-service communication

### Debug Scripts
- Console logging verification
- DOM element inspection
- Network request debugging
- MIME type validation

## Prerequisites

- Docker and Docker Compose
- curl (for API testing)
- jq (optional, for JSON formatting)
- Audio files for testing (some scripts create test files)

## Common Issues

If tests fail, check:
1. All containers are running: `docker compose ps`
2. Services are healthy: `docker compose logs [service-name]`
3. Ports are not blocked by firewall
4. Audio files exist and are in supported formats
