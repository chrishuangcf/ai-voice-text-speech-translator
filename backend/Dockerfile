# Production Dockerfile for Whisper Backend Service
FROM voice-to-text-base:latest

# Copy server certificates
COPY certs/server.crt /app/certs/server.crt
COPY certs/server.key /app/certs/server.key

# Set backend-specific environment variables
ENV SSL_CERT_PATH=/app/certs/server.crt
ENV SSL_KEY_PATH=/app/certs/server.key
ENV SSL_CA_PATH=/app/certs/ca.pem

# Copy and install backend-specific requirements
COPY backend/requirements.txt .
RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    --cert /app/certs/ca.pem \
    --no-cache-dir \
    -r requirements.txt

# Create necessary directories
RUN mkdir -p uploads models/whisper

# Copy cached Whisper models from local repo
COPY models/whisper/ /app/models/whisper/

# Set environment variable for Whisper model cache
ENV WHISPER_CACHE_DIR=/app/models/whisper
ENV WHISPER_MODEL_SIZE=small

# Copy the entire backend directory structure
COPY backend/ .

# Verify the app.py file exists in src subdirectory
RUN ls -la /app/ && ls -la /app/src/ && test -f /app/src/app.py && echo "app.py found in src!" || echo "ERROR: app.py not found!"

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the app from the src directory
CMD ["python", "src/app.py"]