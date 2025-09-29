FROM python:3.9-slim

# Install common system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    ffmpeg \
    git \
    libssl-dev \
    openssl \
    libffi-dev \
    build-essential \
    espeak-ng \
    wget \
    tar \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app directory and certs directory
WORKDIR /app
RUN mkdir -p /app/certs

# Copy corporate CA certificate and install it system-wide
COPY certs/ca.pem /app/certs/ca.pem
COPY certs/ca.pem /usr/local/share/ca-certificates/ca.cert

# Install certificate into system trust store
RUN update-ca-certificates && \
    echo "System certificate store updated"

# Set SSL environment variables globally
ENV REQUESTS_CA_BUNDLE=/app/certs/ca.pem
ENV CURL_CA_BUNDLE=/app/certs/ca.pem
ENV SSL_CERT_FILE=/app/certs/ca.pem
ENV SSL_CERT_DIR=/app/certs
ENV PYTHONHTTPSVERIFY=1

# Upgrade pip with corporate certificates
RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    --cert /app/certs/ca.pem \
    --no-cache-dir \
    --upgrade pip

# Install only common packages without numpy (let TTS handle it)
RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    --cert /app/certs/ca.pem \
    --no-cache-dir \
    flask==2.3.2 \
    flask-cors==4.0.0 \
    requests==2.31.0

# Set common environment variables
ENV FLASK_ENV=production
ENV DEBUG=true