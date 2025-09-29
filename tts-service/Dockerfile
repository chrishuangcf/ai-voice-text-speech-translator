FROM voice-to-text-base:latest

# Copy server certificates
COPY certs/server.crt /app/certs/server.crt
COPY certs/server.key /app/certs/server.key

# Set TTS-specific environment variables
ENV SSL_CERT_PATH=/app/certs/server.crt
ENV SSL_KEY_PATH=/app/certs/server.key
ENV SSL_CA_PATH=/app/certs/ca.pem

# Install gTTS (Google Text-to-Speech) - simple and reliable
RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    --cert /app/certs/ca.pem \
    --no-cache-dir \
    gtts==2.3.2

# Test gTTS installation
RUN python3 -c "from gtts import gTTS; print('gTTS installed successfully')"

# Create directories for models and output
RUN mkdir -p models output

# Copy application files
COPY tts-service/ .

EXPOSE 7000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:7000/health || exit 1

CMD ["python", "app.py"]