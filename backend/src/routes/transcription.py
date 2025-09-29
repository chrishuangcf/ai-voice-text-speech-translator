"""
Transcription API routes
"""
import os
import tempfile
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import logging

logger = logging.getLogger(__name__)

transcription_bp = Blueprint('transcription', __name__)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mp4', 'm4a', 'ogg', 'flac', 'webm'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@transcription_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """Transcribe uploaded audio file"""
    try:
        # Check if Whisper service is available
        if not hasattr(current_app, 'whisper_service') or current_app.whisper_service is None:
            return jsonify({
                'error': 'Whisper service not available',
                'message': 'The Whisper model is still loading or failed to initialize'
            }), 503
        
        # Check if file is present
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'File type not supported',
                'supported_formats': list(ALLOWED_EXTENSIONS)
            }), 400
        
        # Get optional parameters
        language = request.form.get('language')
        task = request.form.get('task', 'transcribe')
        
        if task not in ['transcribe', 'translate']:
            return jsonify({'error': 'Task must be either "transcribe" or "translate"'}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        
        with tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=os.path.splitext(filename)[1]
        ) as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Perform transcription
            result = current_app.whisper_service.transcribe_audio(
                temp_file_path,
                language=language,
                task=task
            )
            
            return jsonify({
                'success': True,
                'result': result,
                'filename': filename
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@transcription_bp.route('/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages"""
    try:
        if not hasattr(current_app, 'whisper_service') or current_app.whisper_service is None:
            # Return a basic set of languages if Whisper is not loaded
            return jsonify({
                'success': True,
                'languages': ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'],
                'note': 'Whisper service not loaded, showing limited language list'
            })
        
        languages = current_app.whisper_service.get_supported_languages()
        return jsonify({
            'success': True,
            'languages': languages
        })
    except Exception as e:
        logger.error(f"Error getting languages: {str(e)}")
        return jsonify({'error': str(e)}), 500

@transcription_bp.route('/model-info', methods=['GET'])
def get_model_info():
    """Get model information"""
    try:
        if not hasattr(current_app, 'whisper_service') or current_app.whisper_service is None:
            return jsonify({
                'success': True,
                'model_info': {
                    'status': 'not_loaded',
                    'message': 'Whisper service is not available'
                }
            })
        
        info = current_app.whisper_service.get_model_info()
        return jsonify({
            'success': True,
            'model_info': info
        })
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@transcription_bp.route('/translate', methods=['POST'])
def translate_text():
    """Translate text to target language"""
    try:
        # Check if translation service is available
        if not hasattr(current_app, 'translation_service') or current_app.translation_service is None:
            return jsonify({
                'error': 'Translation service not available',
                'message': 'The translation service is not initialized'
            }), 503
        
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
        
        # Perform translation
        result = current_app.translation_service.translate_text(
            text=text,
            target_language=target_language,
            source_language=source_language
        )
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@transcription_bp.route('/translation-languages', methods=['GET'])
def get_translation_languages():
    """Get list of supported languages for translation"""
    try:
        if not hasattr(current_app, 'translation_service') or current_app.translation_service is None:
            # Return a basic set of languages if translation service is not loaded
            return jsonify({
                'success': True,
                'languages': ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ar', 'hi'],
                'note': 'Translation service not loaded, showing limited language list'
            })
        
        languages = current_app.translation_service.get_supported_languages()
        return jsonify({
            'success': True,
            'languages': languages
        })
    except Exception as e:
        logger.error(f"Error getting translation languages: {str(e)}")
        return jsonify({'error': str(e)}), 500

@transcription_bp.route('/detect-language', methods=['POST'])
def detect_language():
    """Detect language of provided text"""
    try:
        # Check if translation service is available
        if not hasattr(current_app, 'translation_service') or current_app.translation_service is None:
            return jsonify({
                'error': 'Translation service not available',
                'message': 'The translation service is not initialized'
            }), 503
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        text = data.get('text')
        
        if not text:
            return jsonify({'error': 'No text provided for language detection'}), 400
        
        # Perform language detection
        result = current_app.translation_service.detect_language(text)
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        return jsonify({'error': str(e)}), 500