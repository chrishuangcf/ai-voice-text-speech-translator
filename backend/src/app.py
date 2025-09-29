"""
Stable Whisper Voice-to-Text Service - Main Application
"""
import os
import sys
import tempfile
import traceback
import logging
import requests
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from services.whisper_service import SimpleWhisperService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global Whisper service instance to prevent reloading
_whisper_service = None

def get_whisper_service():
    """Get or create the global Whisper service instance"""
    global _whisper_service
    if _whisper_service is None:
        logger.info("Creating new Whisper service instance...")
        _whisper_service = SimpleWhisperService()
    return _whisper_service

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configure CORS for HTTP frontend
    CORS(app, 
         origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'OPTIONS'])
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
    
    # CORS headers for HTTP-only service
    @app.after_request
    def after_request(response):
        """Add CORS headers"""
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # Create upload directory
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize Whisper service globally (only once)
    logger.info("Initializing application...")
    
    @app.route('/health', methods=['GET', 'OPTIONS'])
    def health_check():
        """Health check"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
            
            whisper_service = get_whisper_service()
            whisper_status = "loaded" if whisper_service.is_model_loaded() else ("loading" if whisper_service.is_loading else "not_loaded")
            
            logger.info(f"Health check requested - Whisper status: {whisper_status}")
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'whisper-voice-to-text',
                'whisper_model': whisper_status,
                'version': '1.0.0',
                'pid': os.getpid()  # Add process ID to detect restarts
            })
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            return jsonify({'error': 'Health check failed', 'pid': os.getpid()}), 500
    
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint"""
        try:
            return jsonify({
                'service': 'Whisper Voice-to-Text API',
                'version': '1.0.0',
                'status': 'running',
                'pid': os.getpid(),
                'endpoints': {
                    'health': '/health',
                    'transcribe': '/api/v1/transcribe',
                    'translate': '/api/v1/translate',
                    'languages': '/api/v1/languages',
                    'translation_languages': '/api/v1/translation-languages',
                    'model_info': '/api/v1/model-info'
                }
            })
        except Exception as e:
            logger.error(f"Root endpoint error: {str(e)}")
            return jsonify({'error': 'Service error', 'pid': os.getpid()}), 500
    
    @app.route('/api/v1/languages', methods=['GET', 'OPTIONS'])
    def get_languages():
        """Get supported languages"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
            
            whisper_service = get_whisper_service()
            if whisper_service.is_model_loaded():
                languages = whisper_service.get_supported_languages()
            else:
                languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi']
            
            logger.info(f"Languages requested - returning {len(languages)} languages")
            
            return jsonify({
                'success': True,
                'languages': languages,
                'pid': os.getpid()
            })
        except Exception as e:
            logger.error(f"Error getting languages: {str(e)}")
            return jsonify({
                'success': True,
                'languages': ['en', 'es', 'fr', 'de'],
                'pid': os.getpid()
            })
    
    @app.route('/api/v1/model-info', methods=['GET', 'OPTIONS'])
    def get_model_info():
        """Get model info"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
            
            whisper_service = get_whisper_service()
            if whisper_service.is_model_loaded():
                model_info = whisper_service.get_model_info()
            else:
                model_info = {
                    'status': 'loading' if whisper_service.is_loading else 'not_loaded',
                    'message': 'Whisper model loading...' if whisper_service.is_loading else 'Whisper model not available - using mock mode',
                    'model_size': whisper_service.model_size
                }
            
            logger.info(f"Model info requested - status: {model_info.get('status', 'unknown')}")
            
            return jsonify({
                'success': True,
                'model_info': model_info,
                'pid': os.getpid()
            })
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}")
            return jsonify({
                'success': True,
                'model_info': {'status': 'error', 'message': 'Service error'},
                'pid': os.getpid()
            })
    
    @app.route('/api/v1/transcribe', methods=['POST', 'OPTIONS'])
    def transcribe():
        """Transcribe audio"""
        try:
            logger.info(f"=== TRANSCRIBE REQUEST START (PID: {os.getpid()}) ===")
            
            if request.method == 'OPTIONS':
                logger.info("OPTIONS request - returning CORS headers")
                return '', 200
            
            logger.info(f"Request from: {request.remote_addr}")
            
            # Validate request
            if not request.files or 'audio' not in request.files:
                logger.error("No audio file in request")
                return jsonify({'success': False, 'error': 'No audio file provided', 'pid': os.getpid()}), 400
            
            file = request.files['audio']
            if file.filename == '':
                logger.error("Empty filename")
                return jsonify({'success': False, 'error': 'No file selected', 'pid': os.getpid()}), 400
            
            # Get parameters
            language = request.form.get('language', '')
            task = request.form.get('task', 'transcribe')
            
            logger.info(f"Processing: {file.filename}, language={language}, task={task}")
            
            # Get Whisper service
            whisper_service = get_whisper_service()
            
            # Check if Whisper is available
            if whisper_service.is_model_loaded():
                # Use real Whisper
                filename = secure_filename(file.filename)
                temp_dir = tempfile.mkdtemp()
                temp_path = os.path.join(temp_dir, filename)
                
                try:
                    logger.info(f"Saving file to: {temp_path}")
                    file.save(temp_path)
                    
                    logger.info("Starting Whisper transcription...")
                    result = whisper_service.transcribe_audio(
                        temp_path, 
                        language if language else None, 
                        task
                    )
                    
                    logger.info("Transcription completed successfully")
                    return jsonify({
                        'success': True,
                        'result': result,
                        'filename': filename,
                        'pid': os.getpid()
                    })
                    
                finally:
                    # Cleanup
                    try:
                        if os.path.exists(temp_path):
                            os.remove(temp_path)
                        os.rmdir(temp_dir)
                        logger.info("Temporary files cleaned up")
                    except Exception as cleanup_error:
                        logger.warning(f"Cleanup error: {cleanup_error}")
            else:
                # Mock response
                logger.info(f"Using mock response (Whisper status: {'loading' if whisper_service.is_loading else 'not loaded'})")
                return jsonify({
                    'success': True,
                    'result': {
                        'text': f'🎤 Mock transcription for "{file.filename}"\n\nFile received successfully! The backend is working properly.\n\nWhisper model status: {"Loading..." if whisper_service.is_loading else "Not loaded"}\n\nThis is a test response to verify the upload pipeline. Once the Whisper model is fully loaded, you\'ll get real transcriptions.',
                        'language': language or 'en',
                        'model_size': 'mock',
                        'segments': [
                            {
                                'start': 0.0,
                                'end': 3.0,
                                'text': f'Mock transcription for "{file.filename}"'
                            }
                        ]
                    },
                    'filename': file.filename,
                    'note': f'Mock response - Whisper model {"loading" if whisper_service.is_loading else "not loaded"}',
                    'pid': os.getpid()
                })
                
        except Exception as e:
            logger.error(f"=== TRANSCRIBE ERROR (PID: {os.getpid()}) ===")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            return jsonify({
                'success': False,
                'error': f'Server error: {str(e)}',
                'pid': os.getpid()
            }), 500
    @app.route('/api/v1/translate', methods=['POST', 'OPTIONS'])
    def translate_text():
        """Proxy translate text to translation service"""
        try:
            logger.info(f"=== TRANSLATE PROXY REQUEST START (PID: {os.getpid()}) ===")
            
            if request.method == 'OPTIONS':
                logger.info("OPTIONS request - returning CORS headers")
                return '', 200
            
            logger.info(f"Request from: {request.remote_addr}")
            
            # Get request data
            data = request.get_json()
            if not data:
                logger.error("No JSON data provided")
                return jsonify({'success': False, 'error': 'No JSON data provided', 'pid': os.getpid()}), 400
            
            # Forward to translation service
            translation_service_url = os.getenv('TRANSLATION_SERVICE_URL', 'http://translation-service:6000')
            
            try:
                response = requests.post(
                    f"{translation_service_url}/translate",
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info("Translation completed successfully via proxy")
                    return jsonify(result)
                else:
                    logger.error(f"Translation service error: {response.status_code}")
                    return jsonify({
                        'success': False,
                        'error': f'Translation service error: {response.status_code}',
                        'pid': os.getpid()
                    }), response.status_code
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to connect to translation service: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': f'Translation service unavailable: {str(e)}',
                    'pid': os.getpid()
                }), 503
                
        except Exception as e:
            logger.error(f"=== TRANSLATE PROXY ERROR (PID: {os.getpid()}) ===")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            return jsonify({
                'success': False,
                'error': f'Server error: {str(e)}',
                'pid': os.getpid()
            }), 500

    @app.route('/api/v1/translation-languages', methods=['GET', 'OPTIONS'])
    def get_translation_languages():
        """Proxy get translation languages to translation service"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
                
            # Forward to translation service
            translation_service_url = os.getenv('TRANSLATION_SERVICE_URL', 'http://translation-service:6000')
            
            try:
                response = requests.get(
                    f"{translation_service_url}/languages",
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Translation languages requested via proxy - returning data")
                    return jsonify(result)
                else:
                    logger.error(f"Translation service error: {response.status_code}")
                    # Return fallback languages if service is down
                    return jsonify({
                        'success': True,
                        'languages': ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ar', 'hi'],
                        'note': 'Fallback language list - translation service unavailable',
                        'pid': os.getpid()
                    })
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to connect to translation service: {str(e)}")
                # Return fallback languages if service is down
                return jsonify({
                    'success': True,
                    'languages': ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ar', 'hi'],
                    'note': 'Fallback language list - translation service unavailable',
                    'pid': os.getpid()
                })
                
        except Exception as e:
            logger.error(f"Error getting translation languages: {str(e)}")
            return jsonify({
                'success': True,
                'languages': ['en', 'es', 'fr', 'de', 'it'],
                'note': 'Minimal fallback language list due to error',
                'pid': os.getpid()
            })

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({'error': 'File too large (max 50MB)', 'pid': os.getpid()}), 413

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request', 'pid': os.getpid()}), 400

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'pid': os.getpid()}), 500

    return app

if __name__ == '__main__':
    try:
        app = create_app()
        
        port = int(os.getenv('PORT', 5000))
        debug = False
        
        logger.info(f"Starting HTTP backend server on port {port}")
        logger.info(f"Debug mode: {debug}")
        logger.info(f"Process ID: {os.getpid()}")
        logger.info("SSL certificates configured for package installation only")
        
        app.run(
            host='0.0.0.0', 
            port=port, 
            debug=debug, 
            threaded=True, 
            use_reloader=False
        )
        
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)