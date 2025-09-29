from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import logging
import ssl

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleTTSService:
    def __init__(self):
        self.output_path = '/app/output'
        self.tts_available = False
        
        # Create directories
        os.makedirs(self.output_path, exist_ok=True)
        
        # Test TTS availability
        self._test_tts()
    
    def _test_tts(self):
        """Test if TTS is available"""
        try:
            from gtts import gTTS
            self.tts_available = True
            logger.info("gTTS is available")
        except ImportError:
            try:
                from TTS.api import TTS
                self.tts_available = True
                logger.info("Coqui TTS is available")
            except ImportError:
                logger.error("No TTS library available")
                self.tts_available = False
    
    def synthesize(self, text):
        """Synthesize text to speech"""
        if not self.tts_available:
            raise ValueError("TTS not available")
        
        audio_id = str(uuid.uuid4())
        output_file = os.path.join(self.output_path, f"{audio_id}.mp3")
        
        logger.info(f"Synthesizing: {text[:50]}...")
        
        try:
            # Try gTTS first (simpler)
            from gtts import gTTS
            tts = gTTS(text=text, lang='en', slow=False)
            tts.save(output_file)
            logger.info("Used gTTS for synthesis")
        except ImportError:
            # Fallback to Coqui TTS
            from TTS.api import TTS
            if not hasattr(self, 'coqui_tts'):
                self.coqui_tts = TTS(model_name='tts_models/en/ljspeech/tacotron2-DDC', progress_bar=False)
            
            # Convert to wav for Coqui TTS
            output_file = os.path.join(self.output_path, f"{audio_id}.wav")
            self.coqui_tts.tts_to_file(text=text, file_path=output_file)
            logger.info("Used Coqui TTS for synthesis")
        
        return output_file, audio_id

tts_service = SimpleTTSService()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy' if tts_service.tts_available else 'unhealthy',
        'service': 'tts-service-simple',
        'tts_available': tts_service.tts_available
    }), 200 if tts_service.tts_available else 503

@app.route('/synthesize', methods=['POST'])
def synthesize_text():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        if not tts_service.tts_available:
            return jsonify({'error': 'TTS service not available'}), 503
        
        audio_file, audio_id = tts_service.synthesize(text)
        
        return jsonify({
            'audio_id': audio_id,
            'message': 'Speech synthesized successfully',
            'download_url': f'/download/{audio_id}'
        }), 200
        
    except Exception as e:
        logger.error(f"Synthesis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/<audio_id>', methods=['GET'])
def download_audio(audio_id):
    try:
        # Try both mp3 and wav extensions
        audio_file_mp3 = os.path.join(tts_service.output_path, f"{audio_id}.mp3")
        audio_file_wav = os.path.join(tts_service.output_path, f"{audio_id}.wav")
        
        if os.path.exists(audio_file_mp3):
            return send_file(audio_file_mp3, mimetype='audio/mpeg', as_attachment=True)
        elif os.path.exists(audio_file_wav):
            return send_file(audio_file_wav, mimetype='audio/wav', as_attachment=True)
        else:
            return jsonify({'error': 'Audio file not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/voices', methods=['GET'])
def get_voices():
    return jsonify({
        'voices': ['en-US-google'],
        'default': 'en-US-google'
    })

@app.route('/cleanup/<audio_id>', methods=['DELETE'])
def cleanup_audio(audio_id):
    try:
        audio_file_mp3 = os.path.join(tts_service.output_path, f"{audio_id}.mp3")
        audio_file_wav = os.path.join(tts_service.output_path, f"{audio_id}.wav")
        
        cleaned = False
        if os.path.exists(audio_file_mp3):
            os.remove(audio_file_mp3)
            cleaned = True
        if os.path.exists(audio_file_wav):
            os.remove(audio_file_wav)
            cleaned = True
            
        if cleaned:
            return jsonify({'message': 'Cleaned up'}), 200
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 7000))
    app.run(host='0.0.0.0', port=port, debug=False)