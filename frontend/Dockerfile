# Multi-stage build for frontend
FROM nginx:alpine

# Copy CA certificate
COPY certs/ca.pem /etc/ssl/certs/ca.pem

# Copy SSL certificates for HTTPS
COPY certs/server.crt /etc/ssl/certs/server.crt
COPY certs/server.key /etc/ssl/private/server.key

# Copy frontend files
COPY frontend/src/ /usr/share/nginx/html/

# Copy nginx configuration and custom MIME types
COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY frontend/mime.types /etc/nginx/mime.types

# Set proper permissions
RUN chmod 644 /etc/ssl/certs/server.crt && \
    chmod 600 /etc/ssl/private/server.key && \
    chmod 644 /etc/ssl/certs/ca.pem

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]