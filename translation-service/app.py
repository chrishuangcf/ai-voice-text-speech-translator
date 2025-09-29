"""
Standalone Translation Service API
"""
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from translation_service import TranslationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create Flask application"""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, origins=['*'], allow_headers=['Content-Type'], methods=['GET', 'POST', 'OPTIONS'])
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'translation-secret-key')
    
    # Initialize translation service
    translation_service = TranslationService()
    app.translation_service = translation_service
    
    @app.after_request
    def after_request(response):
        """Add CORS headers"""
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    @app.route('/health', methods=['GET', 'OPTIONS'])
    def health_check():
        """Health check endpoint"""
        if request.method == 'OPTIONS':
            return '', 200
            
        service_status = "loaded" if translation_service.is_translator_loaded() else "not_loaded"
        
        return jsonify({
            'status': 'healthy',
            'service': 'translation-service',
            'version': '1.0.0',
            'translator_status': service_status,
            'pid': os.getpid()
        })
    
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint"""
        return jsonify({
            'service': 'Google Translation API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'health': '/health',
                'translate': '/translate',
                'languages': '/languages',
                'detect': '/detect'
            }
        })
    
    @app.route('/translate', methods=['POST', 'OPTIONS'])
    def translate_text():
        """Translate text endpoint"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
            
            logger.info("Translation request received")
            
            # Get request data
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            text = data.get('text')
            target_language = data.get('target_language')
            source_language = data.get('source_language')
            
            if not text:
                return jsonify({'error': 'No text provided for translation'}), 400
            
            if not target_language:
                return jsonify({'error': 'Target language not specified'}), 400
            
            logger.info(f"Translating to '{target_language}' from '{source_language or 'auto-detect'}'")
            
            # Perform translation
            if translation_service.is_translator_loaded():
                result = translation_service.translate_text(
                    text=text,
                    target_language=target_language,
                    source_language=source_language
                )
                
                return jsonify({
                    'success': True,
                    'result': result
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Translation service not available'
                }), 503
                
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/languages', methods=['GET', 'OPTIONS'])
    def get_supported_languages():
        """Get supported languages endpoint"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
                
            languages = translation_service.get_supported_languages()
            
            return jsonify({
                'success': True,
                'languages': languages
            })
        except Exception as e:
            logger.error(f"Error getting languages: {str(e)}")
            return jsonify({
                'success': True,
                'languages': ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'],
                'error': str(e)
            })
    
    @app.route('/detect', methods=['POST', 'OPTIONS'])
    def detect_language():
        """Detect language endpoint"""
        try:
            if request.method == 'OPTIONS':
                return '', 200
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            text = data.get('text')
            if not text:
                return jsonify({'error': 'No text provided for language detection'}), 400
            
            result = translation_service.detect_language(text)
            
            return jsonify({
                'success': True,
                'result': result
            })
            
        except Exception as e:
            logger.error(f"Language detection error: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    return app

if __name__ == '__main__':
    try:
        app = create_app()
        
        port = int(os.getenv('PORT', 6000))
        debug = os.getenv('DEBUG', 'false').lower() == 'true'
        
        logger.info(f"Starting Translation Service on port {port}")
        logger.info(f"Debug mode: {debug}")
        logger.info(f"Process ID: {os.getpid()}")
        
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug,
            threaded=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start translation service: {str(e)}")
        exit(1)
