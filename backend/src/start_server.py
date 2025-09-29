#!/usr/bin/env python3
"""
SSL-aware server startup script for Whisper backend
"""
import os
import sys
import ssl
from pathlib import Path
import logging

# Add src directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_ssl_certificates():
    """Check if SSL certificates are available and valid"""
    cert_path = os.getenv('SSL_CERT_PATH', '/app/certs/server.crt')
    key_path = os.getenv('SSL_KEY_PATH', '/app/certs/server.key')
    
    if not (Path(cert_path).exists() and Path(key_path).exists()):
        logger.warning(f"SSL certificates not found at {cert_path} or {key_path}")
        return None, None
    
    try:
        # Validate certificate and key
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(cert_path, key_path)
        logger.info("✅ SSL certificates validated successfully")
        return cert_path, key_path
    except Exception as e:
        logger.error(f"❌ SSL certificate validation failed: {e}")
        return None, None

def create_ssl_context(cert_path, key_path):
    """Create SSL context for Flask"""
    try:
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(cert_path, key_path)
        
        # Configure SSL settings
        ssl_context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS')
        ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
        
        return ssl_context
    except Exception as e:
        logger.error(f"Failed to create SSL context: {e}")
        return None

def start_development_server():
    """Start Flask development server"""
    app = create_app()
    
    cert_path, key_path = check_ssl_certificates()
    enable_ssl = os.getenv('ENABLE_SSL', 'true').lower() == 'true'
    
    if enable_ssl and cert_path and key_path:
        ssl_context = create_ssl_context(cert_path, key_path)
        if ssl_context:
            logger.info("🔒 Starting HTTPS server on port 5443")
            app.run(
                host='0.0.0.0',
                port=5443,
                ssl_context=ssl_context,
                debug=False
            )
        else:
            logger.warning("⚠️  SSL context creation failed, falling back to HTTP")
            logger.info("🌐 Starting HTTP server on port 5000")
            app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        logger.info("🌐 Starting HTTP server on port 5000")
        app.run(host='0.0.0.0', port=5000, debug=False)

def start_gunicorn_server():
    """Start Gunicorn production server"""
    import subprocess
    
    cert_path, key_path = check_ssl_certificates()
    enable_ssl = os.getenv('ENABLE_SSL', 'true').lower() == 'true'
    
    cmd = [
        'gunicorn',
        '--bind', '0.0.0.0:5000',
        '--workers', '4',
        '--worker-class', 'sync',
        '--timeout', '300',
        '--keep-alive', '10',
        '--max-requests', '1000',
        '--max-requests-jitter', '100',
        '--access-logfile', '-',
        '--error-logfile', '-',
        '--log-level', 'info',
        'app:create_app()'
    ]
    
    if enable_ssl and cert_path and key_path:
        logger.info("🔒 Starting Gunicorn with SSL on port 5443")
        cmd.extend([
            '--bind', '0.0.0.0:5443',
            '--certfile', cert_path,
            '--keyfile', key_path,
            '--ssl-version', 'TLSv1_2',
            '--ciphers', 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
        ])
    else:
        logger.info("🌐 Starting Gunicorn with HTTP on port 5000")
    
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"Gunicorn failed to start: {e}")
        sys.exit(1)

if __name__ == '__main__':
    use_gunicorn = os.getenv('USE_GUNICORN', 'false').lower() == 'true'
    
    if use_gunicorn:
        start_gunicorn_server()
    else:
        start_development_server()
