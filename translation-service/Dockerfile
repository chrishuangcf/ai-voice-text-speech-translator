FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create certs directory first
RUN mkdir -p /app/certs

# Copy corporate CA certificate
COPY certs/ca.pem /app/certs/ca.pem

# Debug: Check certificate validity
RUN openssl x509 -in /app/certs/ca.pem -text -noout | head -10 && \
    echo "Certificate file exists and is readable"

# Install corporate certificate into system trust store
COPY certs/ca.pem /usr/local/share/ca-certificates/ca.cert
RUN update-ca-certificates && \
    echo "System certificate store updated"

# Copy requirements and install Python dependencies
COPY translation-service/requirements.txt .


# Configure pip to use corporate certificate globally
RUN pip config set global.cert /app/certs/ca.pem && \
    pip config set global.trusted-host "pypi.org files.pythonhosted.org pypi.python.org" && \
    pip config list

# Set pip-specific SSL environment variables
ENV PIP_CERT=/app/certs/ca.pem
ENV PIP_TRUSTED_HOST="pypi.org files.pythonhosted.org pypi.python.org"

# Corporate network approach: Use trusted hosts with certificate fallback
RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    --cert /app/certs/ca.pem \
    --no-cache-dir \
    --upgrade pip

RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    --cert /app/certs/ca.pem \
    --no-cache-dir \
    -r requirements.txt

# Set SSL environment variables to use the corporate certificate
ENV REQUESTS_CA_BUNDLE=/app/certs/ca.pem
ENV CURL_CA_BUNDLE=/app/certs/ca.pem
ENV SSL_CERT_FILE=/app/certs/ca.pem
ENV SSL_CERT_DIR=/app/certs
ENV PYTHONHTTPSVERIFY=1

# Set SSL certificate environment variables
ENV SSL_CERT_PATH=/app/certs/server.crt
ENV SSL_KEY_PATH=/app/certs/server.key
ENV SSL_CA_PATH=/app/certs/ca.pem

# Copy the server certificate if needed for application
COPY certs/server.crt /app/certs/server.crt
COPY certs/server.key /app/certs/server.key

# Debug: Verify both certificates
RUN echo "=== CERTIFICATE DEBUG ===" && \
    ls -la /app/certs/ && \
    echo "Root CA certificate:" && \
    openssl x509 -in /app/certs/ca.pem -subject -issuer -dates -noout && \
    echo "Server certificate:" && \
    openssl x509 -in /app/certs/server.crt -subject -issuer -dates -noout && \
    echo "Server key permissions:" && \
    ls -la /app/certs/server.key

# Copy application code
COPY translation-service/ .

# Expose port
EXPOSE 6000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:6000/health || exit 1

# Run the application
CMD ["python", "app.py"]
