#!/bin/bash

echo "Building base image..."
docker compose -f docker-compose.prod.yml --profile build-base build base-image

echo "Building all services..."
docker compose -f docker-compose.prod.yml build

echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d