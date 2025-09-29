#!/bin/bash

# Generate self-signed certificates for development
echo "Generating development SSL certificates..."

# Generate private key for server
openssl genrsa -out server.key 2048

# Generate self-signed certificate (using .crt extension to match Dockerfile)
openssl req -new -x509 -key server.key -out server.crt -days 365 -subj "/C=US/ST=WA/L=Bellevue/O=ASDF/CN=localhost"

# Set proper permissions
chmod 600 server.key
chmod 644 server.crt

echo "Development SSL certificates generated:"
echo "- server.key (private key)"
echo "- server.crt (certificate)"
echo "- ca.pem (your existing root CA for trust chain)"

# Verify certificate using server.crt
echo ""
echo "Testing x509 certificate details:"
openssl x509 -in server.crt -subject -issuer -dates -noout